// Require auth: redirects to /login if no session.
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    req.session.returnTo = req.originalUrl;
    req.flash('error', 'Veuillez vous connecter pour continuer.');
    return res.redirect('/login');
  }
  next();
}

// Guests only: keep logged-in admins away from login/register.
function guestOnly(req, res, next) {
  if (req.session.userId) {
    return res.redirect('/admin/dashboard');
  }
  next();
}

// Role gate: SUPER_ADMIN only.
function requireSuperAdmin(req, res, next) {
  if (req.session.userRole !== 'SUPER_ADMIN') {
    req.flash('error', 'Accès réservé au super administrateur.');
    return res.redirect('/admin/dashboard');
  }
  next();
}

// Expose the current session user to views.
function exposeUser(req, res, next) {
  res.locals.currentUser = req.session.userId
    ? { id: req.session.userId, name: req.session.userName, role: req.session.userRole }
    : null;
  res.locals.currentPath = req.path;
  next();
}

module.exports = { requireAuth, guestOnly, requireSuperAdmin, exposeUser };
