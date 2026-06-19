// Generates unique slugs from a name. Uses slugify + numeric suffix on collision.
// Example: "AMECHO 2026 !" -> "amecho-2026". If taken -> "amecho-2026-2", then "-3".
const slugify = require('slugify');
const prisma = require('../config/prisma');

const BASE_OPTS = { lower: true, strict: true, remove: /[*+~.()'":!@]/g };

function baseSlug(name) {
  return slugify(name, BASE_OPTS) || 'event';
}

async function generateUnique(name, ignoreId = null) {
  const base = baseSlug(name);
  let candidate = base;
  let suffix = 1;

  while (true) {
    const where = { slug: candidate };
    if (ignoreId !== null) {
      where.NOT = { id: ignoreId };
    }
    const existing = await prisma.event.findUnique({ where, select: { id: true } });
    if (!existing) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

module.exports = { generateUnique, baseSlug };
