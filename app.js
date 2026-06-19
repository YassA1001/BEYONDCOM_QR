const express = require('express');
const path = require('path');
const helmet = require('helmet');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const useragent = require('express-useragent');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const env = require('./config/env');
const sessionConfig = require('./config/session');
const authMiddleware = require('./middleware/auth.middleware');
const { loadFlashLocals } = require('./middleware/validate.middleware');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// -------- View engine --------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// -------- Security --------
app.use(helmet({
  contentSecurityPolicy: env.isProd ? undefined : false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// -------- Body parsing --------
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(express.json());

// -------- Static --------
app.use(express.static(path.join(__dirname, 'public')));

// -------- Session (before methodOverride so _method works on existing session) --------
app.use(session(sessionConfig));

// -------- Flash + locals --------
app.use(flash());
app.use(authMiddleware.exposeUser);
app.use(loadFlashLocals);

// -------- Method override (_method=DELETE/PUT in form body) --------
app.use(methodOverride('_method'));
app.use(methodOverride(function (req) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    const m = req.body._method;
    delete req.body._method;
    return m;
  }
  return undefined;
}));

// -------- User-agent detection --------
app.use(useragent.express());

// -------- Locals for views --------
app.use((req, res, next) => {
  res.locals.appName = 'BeyondCom';
  res.locals.appTitle = 'BeyondCom QR Event Platform';
  res.locals.appUrl = env.APP_URL;

  const successMsg = req.flash('success');
  const errorMsg = req.flash('error');
  res.locals.flash = {
    success: successMsg.length ? successMsg[0] : null,
    error: errorMsg.length ? errorMsg[0] : null,
  };

  res.locals.formatDate = require('./utils/formatDate');
  const icons = require('./utils/icons');
  res.locals.iconFor = icons.iconFor;
  res.locals.osIcon = icons.osIcon;
  res.locals.browserIcon = icons.browserIcon;
  res.locals.pct = (c, total) => (total > 0 ? Math.round((c / total) * 100) : 0);
  next();
});

// -------- Routes --------
app.use('/', require('./routes/auth.routes'));
app.use('/admin', require('./routes/admin.routes'));
app.use('/', require('./routes/public.routes'));

// Root
app.get('/', (req, res) => {
  if (req.session.userId) return res.redirect('/admin/dashboard');
  res.redirect('/login');
});

// -------- Error handling --------
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
