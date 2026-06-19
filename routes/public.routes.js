const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../config/prisma');
const statsService = require('../services/statsService');
const cacheService = require('../services/cacheService');

const router = express.Router();

// Public event page: GET /e/:slug
router.get('/e/:slug', asyncHandler(async (req, res) => {
  const slug = req.params.slug;
  let event = cacheService.getPublicEvent(slug);

  if (!event) {
    try {
      event = await prisma.event.findUnique({
        where: { slug },
        include: { links: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
      });
      if (event) cacheService.setPublicEvent(slug, event);
    } catch (err) {
      // Database unreachable: show 404 instead of leaking a 500.
      return res.status(404).render('errors/404', {
        layout: false,
        title: 'Événement indisponible',
        message: 'Cet événement est temporairement indisponible. Réessayez plus tard.',
      });
    }
  }

  if (!event || !event.isActive) {
    return res.status(404).render('errors/404', {
      layout: false,
      title: 'Événement introuvable',
      message: 'Cet événement n\'existe pas ou n\'est plus disponible.',
    });
  }

  // Record scan (always, cache must never block tracking).
  const ua = statsService.classifyUa(req.useragent);
  prisma.scanLog.create({
    data: {
      eventId: event.id,
      ipAddress: (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].slice(0, 45),
      userAgent: (req.headers['user-agent'] || '').slice(0, 1000),
      deviceType: ua.deviceType,
      browser: ua.browser,
      os: ua.os,
    },
  }).catch(() => ({})); // fire-and-forget, never break the page

  const color = event.primaryColor || '#0ea5e9';
  res.render('public/event-page', {
    layout: false,
    title: event.name,
    event,
    color,
  });
}));

// Click tracker + redirect: GET /go/:linkId
router.get('/go/:linkId', asyncHandler(async (req, res) => {
  const linkId = parseInt(req.params.linkId, 10);
  if (Number.isNaN(linkId)) return res.redirect('/');

  let link;
  try {
    link = await prisma.eventLink.findUnique({
      where: { id: linkId },
      include: { event: { select: { id: true, isActive: true } } },
    });
  } catch (err) {
    // Database unreachable / unknown error: never expose, silently go home.
    return res.redirect('/');
  }

  if (!link || !link.isActive || !link.event || !link.event.isActive) {
    return res.redirect('/');
  }

  // Record click. Fire-and-forget.
  prisma.clickLog.create({
    data: {
      eventId: link.event.id,
      eventLinkId: link.id,
      ipAddress: (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].slice(0, 45),
      userAgent: (req.headers['user-agent'] || '').slice(0, 1000),
    },
  }).catch(() => ({}));

  return res.redirect(link.url);
}));

module.exports = router;
