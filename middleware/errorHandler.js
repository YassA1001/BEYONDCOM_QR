const { Prisma } = require('@prisma/client');
const env = require('../config/env');

// Convert known service errors + Prisma errors into HTTP responses / EJS error pages.
// Avoids leaking stack traces in production.

function isPrismaError(err) {
  return err instanceof Prisma.PrismaClientKnownRequestError ||
    err instanceof Prisma.PrismaClientUnknownRequestError ||
    err instanceof Prisma.PrismaClientValidationError;
}

function notFound(req, res, message) {
  res.status(404).render('errors/404', {
    layout: false,
    title: 'Page introuvable',
    message: message || 'La page que vous recherchez n\'existe pas ou a été désactivée.',
  });
}

function serverError(req, res, message) {
  res.status(500).render('errors/500', {
    layout: false,
    title: 'Erreur serveur',
    message: message || 'Une erreur inattendue est survenue. Veuillez réessayer ultérieurement.',
  });
}

// 404 for unmatched routes.
function notFoundHandler(req, res) {
  return notFound(req, res);
}

// Central error handler. Must be mounted last.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (env.isDev) {
    // Keep visible but bounded - never reach the end user in prod.
    // eslint-disable-next-line no-console
    console.error('[error]', err);
  }

  // Custom thrown errors with explicit status.
  if (err.status === 404) return notFound(req, res, err.message);
  if (err.status === 403) {
    res.status(403);
    return res.render('errors/404', {
      layout: false,
      title: 'Accès refusé',
      message: err.message || 'Vous n\'avez pas accès à cette ressource.',
    });
  }

  // Prisma P2025 (record not found) -> 404.
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
    return notFound(req, res);
  }

  // Our wrapped upload errors (string messages).
  if (typeof err.message === 'string' && (
    err.message.includes('upload') ||
    err.message.includes('Format') ||
    err.message.includes('volumineux')
  )) {
    req.flash('error', err.message);
    const back = req.get('Referer') || '/admin/events';
    return res.redirect(back);
  }

  if (env.isDev) {
    const stack = err.stack || String(err);
    return res.status(500).send(`<pre>${escapeHtml(stack)}</pre>`);
  }

  return serverError(req, res);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

module.exports = { errorHandler, notFoundHandler, notFound, serverError };
