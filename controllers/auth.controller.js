// Auth: login, register, logout. Session-only. Passwords hashed with bcrypt.
const bcrypt = require('bcrypt');
const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../config/prisma');

exports.showLogin = (req, res) => {
  res.render('auth/login', { layout: false, title: 'Connexion' });
};

exports.showRegister = (req, res) => {
  res.render('auth/register', { layout: false, title: 'Créer un compte' });
};

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email: (email || '').toLowerCase().trim() } });

  // Same generic message - never reveal whether email exists.
  const fail = 'Identifiants incorrects.';

  if (!user || !user.isActive) {
    req.flash('error', fail);
    req.flash('old', JSON.stringify({ email }));
    return res.redirect('/login');
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    req.flash('error', fail);
    req.flash('old', JSON.stringify({ email }));
    return res.redirect('/login');
  }

  req.session.userId = user.id;
  req.session.userName = user.name;
  req.session.userRole = user.role;

  const returnTo = req.session.returnTo || '/admin/dashboard';
  delete req.session.returnTo;

  req.flash('success', `Bienvenue, ${user.name}`);
  res.redirect(returnTo);
});

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    req.flash('error', 'Un compte existe déjà avec cet email.');
    req.flash('old', JSON.stringify({ name, email }));
    return res.redirect('/register');
  }

  // First user becomes SUPER_ADMIN, others become ADMIN.
  const count = await prisma.user.count();
  const role = count === 0 ? 'SUPER_ADMIN' : 'ADMIN';

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name: name.trim(), email: normalizedEmail, password: hashed, role },
  });

  req.session.userId = user.id;
  req.session.userName = user.name;
  req.session.userRole = user.role;

  req.flash('success', 'Compte créé avec succès.');
  res.redirect('/admin/dashboard');
});

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('beyondcom.sid');
    res.redirect('/login');
  });
};
