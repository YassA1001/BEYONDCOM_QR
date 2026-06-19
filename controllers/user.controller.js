// Multi-admin management. SUPER_ADMIN only (route-level gate).
const bcrypt = require('bcrypt');
const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../config/prisma');

exports.index = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { events: true } } },
  });
  res.render('admin/users/index', {
    layout: 'layout/admin',
    title: 'Administrateurs',
    activeMenu: 'users',
    users,
  });
});

exports.create = (req, res) => {
  res.render('admin/users/create', {
    layout: 'layout/admin',
    title: 'Nouvel administrateur',
    activeMenu: 'users',
  });
};

exports.store = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    req.flash('error', 'Un compte existe déjà avec cet email.');
    req.flash('old', JSON.stringify({ name, email, role }));
    return res.redirect('/admin/users/create');
  }
  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      password: hashed,
      role: role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN',
    },
  });
  req.flash('success', 'Administrateur créé.');
  res.redirect('/admin/users');
});

exports.toggle = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (id === req.session.userId) {
    req.flash('error', 'Vous ne pouvez pas désactiver votre propre compte.');
    return res.redirect(req.get('Referer') || '/admin/users');
  }
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) { const e = new Error('Not found'); e.status = 404; throw e; }
  if (user.role === 'SUPER_ADMIN') {
    const superCount = await prisma.user.count({ where: { role: 'SUPER_ADMIN', isActive: true } });
    if (superCount <= 1) {
      req.flash('error', 'Impossible : dernier super admin actif.');
      return res.redirect(req.get('Referer') || '/admin/users');
    }
  }
  await prisma.user.update({ where: { id }, data: { isActive: !user.isActive } });
  req.flash('success', user.isActive ? 'Administrateur désactivé.' : 'Administrateur activé.');
  res.redirect(req.get('Referer') || '/admin/users');
});

exports.destroy = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (id === req.session.userId) {
    req.flash('error', 'Vous ne pouvez pas supprimer votre propre compte.');
    return res.redirect(req.get('Referer') || '/admin/users');
  }
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) { const e = new Error('Not found'); e.status = 404; throw e; }
  if (user.role === 'SUPER_ADMIN') {
    const superCount = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
    if (superCount <= 1) {
      req.flash('error', 'Impossible : dernier super admin.');
      return res.redirect(req.get('Referer') || '/admin/users');
    }
  }
  await prisma.user.delete({ where: { id } });
  req.flash('success', 'Administrateur supprimé.');
  res.redirect(req.get('Referer') || '/admin/users');
});
