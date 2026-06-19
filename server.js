const app = require('./app');
const env = require('./config/env');
const prisma = require('./config/prisma');

// Try to connect to the database in the background. We do NOT block the server
// listen: the app needs to boot even if the DB is briefly unreachable. Prisma
// will retry on demand per-query. Fatal errors will surface as 500 to admins
// and the user can inspect the dev server logs.
prisma
  .$connect()
  .then(() => console.log('[db] Connected to database'))
  .catch((err) => {
    console.error('[db] Failed to connect on boot (continuing anyway):', err.message);
    console.error('[db] The app will retry per-query. Check DATABASE_URL and network.');
  });

const server = app.listen(env.PORT, () => {
  console.log(`[${env.NODE_ENV}] BeyondCom QR Event Platform running on ${env.APP_URL}`);
});

process.on('SIGINT', graceful);
process.on('SIGTERM', graceful);

function graceful() {
  console.log('\n[shutdown] Closing...');
  server.close(() => prisma.$disconnect().then(() => process.exit(0)));
}
