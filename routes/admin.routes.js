const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const dashboard = require('../controllers/dashboard.controller');
const event = require('../controllers/event.controller');
const link = require('../controllers/link.controller');
const qr = require('../controllers/qr.controller');
const stats = require('../controllers/stats.controller');
const user = require('../controllers/user.controller');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { eventSchema } = require('../validators/event.validator');
const { linkSchema, reorderSchema } = require('../validators/link.validator');
const { createUserSchema } = require('../validators/auth.validator');

const router = express.Router();

router.use(requireAuth);

// Dashboard
router.get('/dashboard', asyncHandler(dashboard.index));

// Events
router.get('/events', asyncHandler(event.index));
router.get('/events/create', asyncHandler(event.create));
router.post('/events', asyncHandler(event.store));
router.get('/events/:id', asyncHandler(event.show));
router.get('/events/:id/edit', asyncHandler(event.edit));
router.post('/events/:id', asyncHandler(event.update));
router.post('/events/:id/delete', asyncHandler(event.destroy));
router.post('/events/:id/toggle', asyncHandler(event.toggle));

// QR
router.get('/events/:id/qr', asyncHandler(qr.show));
router.post('/events/:id/qr/generate', asyncHandler(qr.generate));
router.get('/events/:id/qr/download', asyncHandler(qr.download));

// Stats
router.get('/events/:id/stats', asyncHandler(stats.show));

// Links
router.get('/events/:eventId/links', asyncHandler(link.index));
router.get('/events/:eventId/links/create', asyncHandler(link.create));
router.post('/events/:eventId/links', validate(linkSchema), asyncHandler(link.store));
router.get('/events/:eventId/links/:linkId/edit', asyncHandler(link.edit));
router.post('/events/:eventId/links/:linkId', validate(linkSchema), asyncHandler(link.update));
router.post('/events/:eventId/links/:linkId/delete', asyncHandler(link.destroy));
router.post('/events/:eventId/links/:linkId/toggle', asyncHandler(link.toggle));
router.post('/events/:eventId/links/reorder', validate(reorderSchema), asyncHandler(link.reorder));

// Users - SUPER_ADMIN
router.get('/users', requireSuperAdmin, asyncHandler(user.index));
router.get('/users/create', requireSuperAdmin, asyncHandler(user.create));
router.post('/users', requireSuperAdmin, validate(createUserSchema), asyncHandler(user.store));
router.post('/users/:id/toggle', requireSuperAdmin, asyncHandler(user.toggle));
router.post('/users/:id/delete', requireSuperAdmin, asyncHandler(user.destroy));

module.exports = router;
