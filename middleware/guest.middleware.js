const { guestOnly, requireAuth, requireSuperAdmin, exposeUser } = require('./auth.middleware');

// Re-export as guestOnly + requireAuth etc. for naming clarity.
module.exports = {
  requireAuth: requireAuth,
  guestOnly: guestOnly,
  requireSuperAdmin: requireSuperAdmin,
  exposeUser: exposeUser,
};
