// Per-event stats page.
const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../config/prisma');
const statsService = require('../services/statsService');

const RANGES = ['today', '7d', '30d', 'all'];
const PALETTE = ['#0ea5e9', '#0f172a', '#64748b', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

exports.show = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const event = await prisma.event.findUnique({
    where: { id },
    include: { _count: { select: { scans: true, clicks: true } } },
  });
  if (!event) { const e = new Error('Not found'); e.status = 404; throw e; }

  let range = req.query.range || 'all';
  if (!RANGES.includes(range)) range = 'all';

  const stats = await statsService.eventSummary(id, range);

  res.render('admin/events/stats', {
    layout: 'layout/admin',
    title: `Statistiques — ${event.name}`,
    activeMenu: 'events',
    event,
    stats,
    range,
    palette: PALETTE,
  });
});
