// Event link CRUD + reorder.
const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../config/prisma');
const { LINK_TYPES } = require('../validators/link.validator');
const cacheService = require('../services/cacheService');

exports.index = asyncHandler(async (req, res) => {
  const eventId = parseInt(req.params.eventId, 10);
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { links: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!event) { const e = new Error('Not found'); e.status = 404; throw e; }
  res.render('admin/events/links', {
    layout: 'layout/admin',
    title: `Liens — ${event.name}`,
    activeMenu: 'events',
    event,
    linkTypes: LINK_TYPES,
  });
});

exports.create = (req, res) => {
  res.redirect(`/admin/events/${req.params.eventId}/links`);
};

// Show inline create form (within links page) - simple redirect there for now.
exports.store = asyncHandler(async (req, res) => {
  const eventId = parseInt(req.params.eventId, 10);
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true, slug: true } });
  if (!event) { const e = new Error('Not found'); e.status = 404; throw e; }
  const { title, type, url, icon, color, sortOrder, isActive } = req.body;

  const maxOrder = await prisma.eventLink.aggregate({ where: { eventId }, _max: { sortOrder: true } });
  const nextOrder = Number(sortOrder) || (maxOrder._max.sortOrder || 0) + 1;

  await prisma.eventLink.create({
    data: {
      eventId,
      title: title.trim(),
      type,
      url: url.trim(),
      icon: icon || null,
      color: color || null,
      sortOrder: nextOrder,
      isActive: isActive === 'on' || isActive === 'true' || true,
    },
  });
  cacheService.invalidate(event.slug);
  req.flash('success', 'Lien ajouté.');
  res.redirect(`/admin/events/${eventId}/links`);
});

exports.edit = asyncHandler(async (req, res) => {
  // Render the links page in edit mode - simplification: edit inline by passing linkId to view.
  const eventId = parseInt(req.params.eventId, 10);
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { links: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!event) { const e = new Error('Not found'); e.status = 404; throw e; }
  const editLinkId = parseInt(req.params.linkId, 10);
  res.render('admin/events/links', {
    layout: 'layout/admin',
    title: `Liens — ${event.name}`,
    activeMenu: 'events',
    event,
    linkTypes: LINK_TYPES,
    editLinkId,
  });
});

exports.update = asyncHandler(async (req, res) => {
  const eventId = parseInt(req.params.eventId, 10);
  const linkId = parseInt(req.params.linkId, 10);
  const { title, type, url, icon, color, sortOrder, isActive } = req.body;

  const link = await prisma.eventLink.findUnique({ where: { id: linkId }, include: { event: { select: { slug: true, id: true } } } });
  if (!link || link.event.id !== eventId) { const e = new Error('Not found'); e.status = 404; throw e; }

  await prisma.eventLink.update({
    where: { id: linkId },
    data: {
      title: title.trim(),
      type,
      url: url.trim(),
      icon: icon || null,
      color: color || null,
      sortOrder: Number(sortOrder) || 0,
      isActive: isActive === 'on' || isActive === 'true',
    },
  });
  cacheService.invalidate(link.event.slug);
  req.flash('success', 'Lien mis à jour.');
  res.redirect(`/admin/events/${eventId}/links`);
});

exports.destroy = asyncHandler(async (req, res) => {
  const eventId = parseInt(req.params.eventId, 10);
  const linkId = parseInt(req.params.linkId, 10);
  const link = await prisma.eventLink.findUnique({ where: { id: linkId }, include: { event: { select: { id: true, slug: true } } } });
  if (!link || link.event.id !== eventId) { const e = new Error('Not found'); e.status = 404; throw e; }
  await prisma.eventLink.delete({ where: { id: linkId } });
  cacheService.invalidate(link.event.slug);
  req.flash('success', 'Lien supprimé.');
  res.redirect(`/admin/events/${eventId}/links`);
});

exports.toggle = asyncHandler(async (req, res) => {
  const eventId = parseInt(req.params.eventId, 10);
  const linkId = parseInt(req.params.linkId, 10);
  const link = await prisma.eventLink.findUnique({ where: { id: linkId }, include: { event: { select: { id: true, slug: true } } } });
  if (!link || link.event.id !== eventId) { const e = new Error('Not found'); e.status = 404; throw e; }
  await prisma.eventLink.update({ where: { id: linkId }, data: { isActive: !link.isActive } });
  cacheService.invalidate(link.event.slug);
  req.flash('success', link.isActive ? 'Lien désactivé.' : 'Lien activé.');
  res.redirect(req.get('Referer') || `/admin/events/${eventId}/links`);
});

exports.reorder = asyncHandler(async (req, res) => {
  const eventId = parseInt(req.params.eventId, 10);
  const { order } = req.body;
  if (!Array.isArray(order)) return res.status(400).json({ error: 'bad request' });

  const updates = order.map((linkId, idx) => prisma.eventLink.updateMany({
    where: { id: Number(linkId), eventId },
    data: { sortOrder: idx },
  }));
  await Promise.all(updates);

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { slug: true } });
  if (event) cacheService.invalidate(event.slug);
  res.json({ ok: true });
});
