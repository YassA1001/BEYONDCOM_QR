// ============================================================
// BeyondCom QR Event Platform - Seed
// Creates a SUPER_ADMIN from .env and a demo event "AMECHO 2026".
// ============================================================

const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@beyondcom.local').toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`[seed] Admin already exists: ${email}`);
    return existing;
  }
  const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin123456!', 12);
  const user = await prisma.user.create({
    data: {
      name: process.env.ADMIN_NAME || 'BeyondCom Admin',
      email,
      password: hashed,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });
  console.log(`[seed] Created SUPER_ADMIN: ${user.email}`);
  return user;
}

async function seedDemoEvent(adminId) {
  const slug = 'amecho-2026';
  const existing = await prisma.event.findUnique({ where: { slug } });
  if (existing) {
    console.log(`[seed] Demo event already exists: ${slug}`);
    return existing;
  }

  const event = await prisma.event.create({
    data: {
      name: 'AMECHO 2026',
      slug,
      description:
        'Le plus grand rassemblement techno de l année. Conférences, ateliers, expositions et networking pendant 3 jours intenses.',
      location: 'Palais des Congrès, Salle Aurore',
      city: 'Paris',
      startDate: new Date('2026-03-15T09:00:00'),
      endDate: new Date('2026-03-17T18:00:00'),
      primaryColor: '#0ea5e9',
      isActive: true,
      createdById: adminId,
      links: {
        create: [
          { title: 'Site officiel', type: 'website', url: 'https://example.com', sortOrder: 0 },
          { title: 'Programme PDF', type: 'pdf', url: 'https://example.com/program.pdf', sortOrder: 1 },
          { title: 'Google Maps', type: 'maps', url: 'https://maps.google.com', sortOrder: 2 },
          { title: 'WhatsApp', type: 'whatsapp', url: 'https://wa.me/15551234567', sortOrder: 3 },
          { title: 'Instagram', type: 'instagram', url: 'https://instagram.com', sortOrder: 4 },
          { title: 'Feedback', type: 'feedback', url: 'mailto:feedback@example.com', sortOrder: 5 },
        ],
      },
    },
  });
  console.log(`[seed] Created demo event: ${event.slug}`);
  return event;
}

async function main() {
  console.log('[seed] Starting...');
  const admin = await seedAdmin();
  await seedDemoEvent(admin.id);
  console.log('[seed] Done.');
}

main()
  .catch((e) => {
    console.error('[seed] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
