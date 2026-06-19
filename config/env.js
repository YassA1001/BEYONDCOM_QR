require('dotenv').config();

const REQUIRED = [
  'SESSION_SECRET',
  'APP_URL',
  'NODE_ENV',
  'PORT',
  'ADMIN_NAME',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
];

// Either explicit Supabase vars or the VITE_ prefixed ones the host injects.
const hasSupabase =
  (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) &&
  (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);

if (!hasSupabase) REQUIRED.push('VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY');

const missing = REQUIRED.filter((key) => !process.env[key] || String(process.env[key]).trim() === '');

if (missing.length > 0) {
  console.error('\n[FATAL] Missing required environment variables:');
  missing.forEach((key) => console.error(`  - ${key}`));
  console.error('\nPlease copy .env.example to .env and fill in the values.\n');
  process.exit(1);
}

const env = {
  DATABASE_URL: process.env.DATABASE_URL || null,
  SESSION_SECRET: process.env.SESSION_SECRET,
  APP_URL: process.env.APP_URL,
  NODE_ENV: process.env.NODE_ENV,
  PORT: parseInt(process.env.PORT, 10) || 3000,
  ADMIN_NAME: process.env.ADMIN_NAME,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  isProd: process.env.NODE_ENV === 'production',
  isDev: process.env.NODE_ENV !== 'production',
};

module.exports = env;
