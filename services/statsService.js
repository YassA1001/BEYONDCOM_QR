// Aggregations for dashboard + per-event stats.
// All queries go through Prisma raw where grouping is simpler with date functions.
const prisma = require('../config/prisma');

const DAY_MS = 1000 * 60 * 60 * 24;

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n) {
  const d = startOfToday();
  return new Date(d.getTime() - n * DAY_MS);
}

// Detect device type / browser / os from express-useragent.
function classifyUa(ua) {
  const u = ua || {};
  const isMobile = u.isMobile || u.isiPhone || u.isAndroid || u.isAndroidTablet;
  const isTablet = u.isiPad || u.isTablet || (u.isAndroid && u.isAndroidTablet);
  let deviceType = 'desktop';
  if (isTablet) deviceType = 'tablet';
  else if (u.isMobile) deviceType = 'mobile';

  let browser = 'Other';
  if (u.isChrome) browser = 'Chrome';
  else if (u.isSafari) browser = 'Safari';
  else if (u.isFirefox) browser = 'Firefox';
  else if (u.isEdge) browser = 'Edge';
  else if (u.isOpera) browser = 'Opera';

  let os = 'Other';
  if (u.isWindows) os = 'Windows';
  else if (u.isMac) os = 'macOS';
  else if (u.isAndroid) os = 'Android';
  else if (u.isiPhone) os = 'iOS';
  else if (u.isLinux) os = 'Linux';

  return { deviceType, browser, os };
}

// ---- Dashboard aggregations ----

async function dashboardSummary() {
  const [totalEvents, activeEvents, totalScans, totalClicks, recentEvents] =
    await Promise.all([
      prisma.event.count(),
      prisma.event.count({ where: { isActive: true } }),
      prisma.scanLog.count(),
      prisma.clickLog.count(),
      prisma.event.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { scans: true, clicks: true } } },
      }),
    ]);

  const clickRate = totalScans > 0
    ? Math.round((totalClicks / totalScans) * 100)
    : 0;

  // Top scanned event.
  const topScanned = await topScannedEvents(1);
  // Top clicked link.
  const topLink = await topClickedLinks(1);

  return {
    totalEvents,
    activeEvents,
    totalScans,
    totalClicks,
    clickRate,
    recentEvents,
    topScannedEvent: topScanned[0] || null,
    topLink: topLink[0] || null,
  };
}

async function topScannedEvents(limit = 5) {
  const rows = await prisma.scanLog.groupBy({
    by: ['eventId'],
    _count: { _all: true },
    orderBy: { _count: { eventId: 'desc' } },
    take: limit,
  });
  if (rows.length === 0) return [];
  const events = await prisma.event.findMany({
    where: { id: { in: rows.map((r) => r.eventId) } },
    select: { id: true, name: true, slug: true },
  });
  return rows.map((r) => {
    const ev = events.find((e) => e.id === r.eventId);
    return { eventId: r.eventId, name: ev ? ev.name : '—', slug: ev ? ev.slug : null, scans: r._count._all };
  });
}

async function topClickedLinks(limit = 5) {
  const rows = await prisma.clickLog.groupBy({
    by: ['eventLinkId'],
    _count: { _all: true },
    orderBy: { _count: { eventLinkId: 'desc' } },
    take: limit,
  });
  if (rows.length === 0) return [];
  const links = await prisma.eventLink.findMany({
    where: { id: { in: rows.map((r) => r.eventLinkId) } },
    select: { id: true, title: true, type: true, eventId: true },
  });
  return rows.map((r) => {
    const l = links.find((x) => x.id === r.eventLinkId);
    return { linkId: r.eventLinkId, title: l ? l.title : '—', clicks: r._count._all };
  });
}

async function clicksByType() {
  const rows = await prisma.clickLog.findMany({
    select: { eventLinkId: true },
  });
  if (rows.length === 0) return [];
  const linkIds = [...new Set(rows.map((r) => r.eventLinkId))];
  const links = await prisma.eventLink.findMany({
    where: { id: { in: linkIds } },
    select: { id: true, type: true },
  });
  const map = {};
  rows.forEach((r) => {
    const type = (links.find((l) => l.id === r.eventLinkId) || {}).type || 'other';
    map[type] = (map[type] || 0) + 1;
  });
  return Object.entries(map).map(([type, count]) => ({ type, count }));
}

// Last N days of scans count by day (server-local date).
async function scansByDay(days = 7) {
  const start = daysAgo(days - 1);
  const rows = await prisma.scanLog.findMany({
    where: { scannedAt: { gte: start } },
    select: { scannedAt: true },
  });
  const buckets = {};
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start.getTime() + i * DAY_MS);
    buckets[formatDateKey(d)] = 0;
  }
  rows.forEach((r) => {
    const key = formatDateKey(r.scannedAt);
    if (buckets[key] !== undefined) buckets[key] += 1;
  });
  return {
    labels: Object.keys(buckets).map((k) => k.slice(5)),
    values: Object.values(buckets),
  };
}

// ---- Per-event stats ----

async function eventSummary(eventId, range = 'all') {
  let since = null;
  if (range === 'today') since = startOfToday();
  else if (range === '7d') since = daysAgo(6);
  else if (range === '30d') since = daysAgo(29);

  const scanWhere = { eventId };
  const clickWhere = { eventId };
  if (since) {
    scanWhere.scannedAt = { gte: since };
    clickWhere.clickedAt = { gte: since };
  }

  const [scans, clicks, scansToday, scans7, scans30, links, deviceRows, osRows, browserRows, scanDays] =
    await Promise.all([
      prisma.scanLog.count({ where: scanWhere }),
      prisma.clickLog.count({ where: clickWhere }),
      prisma.scanLog.count({ where: { eventId, scannedAt: { gte: startOfToday() } } }),
      prisma.scanLog.count({ where: { eventId, scannedAt: { gte: daysAgo(6) } } }),
      prisma.scanLog.count({ where: { eventId, scannedAt: { gte: daysAgo(29) } } }),
      prisma.eventLink.findMany({
        where: { eventId },
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { clicks: since ? { where: { clickedAt: { gte: since } } } : true } } },
      }),
      prisma.scanLog.groupBy({ by: ['deviceType'], where: scanWhere, _count: { _all: true } }),
      prisma.scanLog.groupBy({ by: ['os'], where: scanWhere, _count: { _all: true } }),
      prisma.scanLog.groupBy({ by: ['browser'], where: scanWhere, _count: { _all: true } }),
      scanDaysByEvent(eventId, since),
    ]);

  const clickRate = scans > 0 ? Math.round((clicks / scans) * 100) : 0;

  const linkStats = links.map((l) => ({
    id: l.id,
    title: l.title,
    type: l.type,
    isActive: l.isActive,
    clicks: l._count.clicks,
  }));

  const topLinkId = linkStats.slice().sort((a, b) => b.clicks - a.clicks)[0]?.id;
  const topLink = linkStats.find((l) => l.id === topLinkId && l.clicks > 0) || null;

  // 7-day scan series (always, regardless of range, for chart).
  const scanSeries = scanDays || { labels: [], values: [] };

  return {
    scans,
    clicks,
    clickRate,
    scansToday,
    scans7,
    scans30,
    linkStats,
    topLink,
    devices: groupRows(deviceRows, 'deviceType'),
    os: groupRows(osRows, 'os'),
    browsers: groupRows(browserRows, 'browser'),
    scanSeries,
  };
}

function groupRows(rows, field) {
  return rows.map((r) => ({ key: r[field] || 'Unknown', count: r._count._all }));
}

async function scanDaysByEvent(eventId, since = null) {
  const days = since ? Math.ceil((Date.now() - since.getTime()) / DAY_MS) : 7;
  const n = Math.min(Math.max(days, 7), 30);
  const start = daysAgo(n - 1);
  const rows = await prisma.scanLog.findMany({
    where: { eventId, scannedAt: { gte: start } },
    select: { scannedAt: true },
  });
  const buckets = {};
  for (let i = 0; i < n; i += 1) {
    const d = new Date(start.getTime() + i * DAY_MS);
    buckets[formatDateKey(d)] = 0;
  }
  rows.forEach((r) => {
    const key = formatDateKey(r.scannedAt);
    if (buckets[key] !== undefined) buckets[key] += 1;
  });
  return {
    labels: Object.keys(buckets).map((k) => k.slice(5)),
    values: Object.values(buckets),
  };
}

function formatDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

module.exports = {
  classifyUa,
  dashboardSummary,
  topScannedEvents,
  topClickedLinks,
  clicksByType,
  scansByDay,
  eventSummary,
};
