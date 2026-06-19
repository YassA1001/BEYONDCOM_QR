// Event CRUD: list, create, show, edit, update, delete, toggle.
const path = require('path');
const fs = require('fs');
const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../config/prisma');
const slugService = require('../services/slugService');
const qrService = require('../services/qrService');
const cacheService = require('../services/cacheService');

const UPLOAD_URL_BASE = '/uploads';

exports.index = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  const where = q ? { name: { contains: q } } : {};
  const events = await prisma.event.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { scans: true, clicks: true, links: true } }, createdBy: true },
  });
  res.render('admin/events/index', {
    layout: 'layout/admin',
    title: 'Événements',
    activeMenu: 'events',
    events,
    q,
  });
});

exports.create = (req, res) => {
  res.render('admin/events/create', {
    layout: 'layout/admin',
    title: 'Nouvel événement',
    activeMenu: 'events',
    event: { primaryColor: '#0ea5e9' },
  });
};

exports.store = asyncHandler(async (req, res) => {
  const data = req.body;
  const slug = await slugService.generateUnique(data.name);

  const parseDate = (v) => (v ? new Date(v) : null);

  const event = await prisma.event.create({
    data: {
      name: data.name.trim(),
      slug,
      description: data.description || null,
      location: data.location || null,
      city: data.city.trim(),
      startDate: parseDate(data.startDate),
      endDate: parseDate(data.endDate),
      logo: req.logoFile ? `${UPLOAD_URL_BASE}/logos/${req.logoFile.filename}` : (data.existingLogo || null),
      banner: req.bannerFile ? `${UPLOAD_URL_BASE}/banners/${req.bannerFile.filename}` : (data.existingBanner || null),
      primaryColor: data.primaryColor || '#0ea5e9',
      isActive: data.isActive === 'on' || data.isActive === 'true' || true,
      createdById: req.session.userId,
    },
  });

  // Auto-generate QR code on creation.
  await qrService.generate(slug);

  req.flash('success', `Événement « ${event.name} » créé.`);
  res.redirect(`/admin/events/${event.id}`);
});

exports.show = asyncHandler(async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { id: parseInt(req.params.id, 10) },
    include: {
      links: { orderBy: { sortOrder: 'asc' } },
      createdBy: true,
      _count: { select: { scans: true, clicks: true } },
    },
  });
  if (!event) { const e = new Error('Not found'); e.status = 404; throw e; }
  res.render('admin/events/show', {
    layout: 'layout/admin',
    title: event.name,
    activeMenu: 'events',
    event,
  });
});

exports.edit = asyncHandler(async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: parseInt(req.params.id, 10) } });
  if (!event) { const e = new Error('Not found'); e.status = 404; throw e; }
  res.render('admin/events/edit', {
    layout: 'layout/admin',
    title: `Modifier ${event.name}`,
    activeMenu: 'events',
    event,
  });
});

exports.update = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) { const e = new Error('Not found'); e.status = 404; throw e; }
  const data = req.body;
  const parseDate = (v) => (v ? new Date(v) : null);

  const logo = req.logoFile ? `${UPLOAD_URL_BASE}/logos/${req.logoFile.filename}` : (data.existingLogo || null);
  const banner = req.bannerFile ? `${UPLOAD_URL_BASE}/banners/${req.bannerFile.filename}` : (data.existingBanner || null);

  const updated = await prisma.event.update({
    where: { id },
    data: {
      name: data.name.trim(),
      description: data.description || null,
      location: data.location || null,
      city: data.city.trim(),
      startDate: parseDate(data.startDate),
      endDate: parseDate(data.endDate),
      logo,
      banner,
      primaryColor: data.primaryColor || '#0ea5e9',
      isActive: data.isActive === 'on' || data.isActive === 'true',
    },
  });

  // Keep QR in sync with slug if name changed (slug stable - QR route doesn't change).
  cacheService.invalidate(updated.slug);
  cacheService.invalidate(event.slug);

  req.flash('success', 'Événement mis à jour.');
  res.redirect(`/admin/events/${id}`);
});

exports.destroy = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const event = await prisma.event.findUnique({ where: { id }, select: { slug: true } });
  if (event) {
    // Remove QR file.
    const qrPath = qrService.pathFor(event.slug);
    if (fs.existsSync(qrPath)) fs.unlinkSync(qrPath);
    cacheService.invalidate(event.slug);
  }
  await prisma.event.delete({ where: { id } }).catch(() => ({}));
  req.flash('success', 'Événement supprimé.');
  res.redirect('/admin/events');
});

exports.toggle = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const event = await prisma.event.findUnique({ where: { id }, select: { id: true, isActive: true, slug: true } });
  if (!event) { const e = new Error('Not found'); e.status = 404; throw e; }
  const updated = await prisma.event.update({ where: { id }, data: { isActive: !event.isActive } });
  cacheService.invalidate(event.slug);
  req.flash('success', updated.isActive ? 'Événement activé.' : 'Événement désactivé.');
  res.redirect(req.get('Referer') || '/admin/events');
});
