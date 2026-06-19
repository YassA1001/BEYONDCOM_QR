const env = require('./env');

const sessionConfig = {
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'beyondcom.sid',
  cookie: {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 12, // 12 hours
  },
};

module.exports = sessionConfig;
