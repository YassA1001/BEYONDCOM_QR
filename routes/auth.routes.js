const express = require('express');
const rateLimit = require('express-rate-limit');
const asyncHandler = require('../utils/asyncHandler');
const auth = require('../controllers/auth.controller');
const { guestOnly } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { loginSchema, registerSchema } = require('../validators/auth.validator');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    req.flash('error', 'Trop de tentatives. Réessayez dans 15 minutes.');
    res.redirect('/login');
  },
});

router.use((req, res, next) => { res.locals.activeMenu = 'auth'; next(); });

router.get('/login', guestOnly, auth.showLogin);
router.post('/login', guestOnly, loginLimiter, validate(loginSchema), asyncHandler(auth.login));

router.get('/register', guestOnly, auth.showRegister);
router.post('/register', guestOnly, validate(registerSchema), asyncHandler(auth.register));

router.post('/logout', (req, res) => auth.logout(req, res));

module.exports = router;
