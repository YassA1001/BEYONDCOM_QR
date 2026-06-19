// QR code display / generate / download.
const path = require('path');
const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../config/prisma');
const qrService = require('../services/qrService');

const QR_DIR = qrService.QR_DIR;

exports.show = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) { const e = new Error('Not found'); e.status = 404; throw e; }
  const publicUrl = qrService.publicUrlFor(event.slug);
  res.render('admin/events/qr', {
    layout: 'layout/admin',
    title: `QR Code — ${event.name}`,
    activeMenu: 'events',
    event,
    publicUrl,
  });
});

exports.generate = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) { const e = new Error('Not found'); e.status = 404; throw e; }
  await qrService.generate(event.slug);
  req.flash('success', 'QR code (re)généré.');
  res.redirect(`/admin/events/${id}/qr`);
});

exports.download = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) { const e = new Error('Not found'); e.status = 404; throw e; }
  await qrService.generate(event.slug);
  const filePath = path.join(QR_DIR, qrService.fileNameFor(event.slug));
  res.download(filePath, `${event.slug}-qr.png`);
});
