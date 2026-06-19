// ============================================================
// Supabase-backed persistence layer that mimics the Prisma
// call surface used throughout the controllers / services.
//
// Why this exists: the runtime environment exposes a Supabase
// project (URL + anon key in .env) but does NOT expose a
// Postgres connection string Prisma can use. Rather than
// rewrite every controller, this module exposes an object
// shaped like `prisma.<model>.<method>(args)` and translates
// each call to the Supabase REST API via @supabase/supabase-js.
//
// The Prisma query DSL is replicated ONLY for the shapes that
// the controllers/services actually use (see controllers/*.js,
// services/statsService.js). Adding new shapes means extending
// the helpers below.
// ============================================================

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('\n[FATAL] Supabase credentials missing.');
  console.error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Model -> table name
const TABLES = {
  user: 'users',
  event: 'events',
  eventLink: 'event_links',
  scanLog: 'scan_logs',
  clickLog: 'click_logs',
};

// Relation -> { table, fk, thisKey } used to hydrate includes + _count.
const RELATIONS = {
  event: {
    links: { table: 'event_links', fk: 'eventId' },
    scans: { table: 'scan_logs', fk: 'eventId' },
    clicks: { table: 'click_logs', fk: 'eventId' },
    createdBy: { table: 'users', fk: 'id', thisKey: 'createdById', single: true },
  },
  eventLink: {
    clicks: { table: 'click_logs', fk: 'eventLinkId' },
    event: { table: 'events', fk: 'id', thisKey: 'eventId', single: true },
  },
  scanLog: { event: { table: 'events', fk: 'id', thisKey: 'eventId', single: true } },
  clickLog: { event: { table: 'events', fk: 'id', thisKey: 'eventId', single: true }, eventLink: { table: 'event_links', fk: 'id', thisKey: 'eventLinkId', single: true } },
  user: { events: { table: 'events', fk: 'createdById' } },
};

function isDateCol(model, col) {
  return ['createdAt', 'updatedAt', 'scannedAt', 'clickedAt', 'startDate', 'endDate'].includes(col);
}

// Translate a Prisma-style `where` clause into PostgREST filters.
function buildFilters(model, where = {}) {
  const table = supabase.from(TABLES[model]);
  let q = table.select('*');

  const operators = {
    equals: 'eq',
    not: 'neq',
    in: 'in',
    notIn: 'not.in',
    gte: 'gte',
    gt: 'gt',
    lte: 'lte',
    lt: 'lt',
    contains: 'ilike',
    startsWith: 'ilike',
    endsWith: 'ilike',
  };

  Object.entries(where).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === 'AND') {
      value.forEach((cond) => { q = applyCond(q, cond, operators, isDateCol); });
      return;
    }
    if (key === 'NOT') {
      if (value.id && value.id.in) q = q.not('id', 'in', `(${value.id.in.join(',')})`);
      return;
    }
    if (typeof value === 'object') {
      Object.entries(value).forEach(([op, v]) => {
        const opName = operators[op];
        if (!opName) return;
        let val = v;
        if (op === 'contains') val = `%${v}%`;
        else if (op === 'startsWith') val = `${v}%`;
        else if (op === 'endsWith') val = `%${v}`;
        q = q.filter(key, opName, val instanceof Date ? val.toISOString() : val);
      });
      return;
    }
    q = q.eq(key, value instanceof Date ? value.toISOString() : value);
  });
  return q;
}

function applyCond(q, cond, operators) {
  Object.entries(cond).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([op, v]) => {
        const opName = operators[op];
        if (!opName) return;
        let val = v;
        if (op === 'contains') val = `%${v}%`;
        q = q.filter(key, opName, val instanceof Date ? val.toISOString() : val);
      });
    } else {
      q = q.eq(key, value instanceof Date ? value.toISOString() : value);
    }
  });
  return q;
}

// Hydrate `_count` and relation `include` for a single row (or list).
async function hydrate(model, rows, include, select) {
  const list = Array.isArray(rows) ? rows : rows ? [rows] : [];
  if (list.length === 0) return rows;

  for (const incKey of Object.keys(include || {})) {
    const rel = RELATIONS[model][incKey];
    if (!rel) continue;
    if (incKey === '_count') continue;
  }

  if (include) {
    for (const incKey of Object.keys(include)) {
      if (incKey === '_count') continue;
      const rel = RELATIONS[model][incKey];
      if (!rel) continue;
      const ids = [...new Set(list.map((r) => r[rel.thisKey || 'id']).filter((v) => v !== null && v !== undefined))];
      if (ids.length === 0) {
        list.forEach((r) => { r[incKey] = rel.single ? null : []; });
        continue;
      }
      let subq = supabase.from(rel.table).select('*').in(rel.fk, ids);
      if (include[incKey] && include[incKey].where) {
        subq = buildFilters(rel.table === 'users' ? 'user' : rel.table === 'events' ? 'event'
          : rel.table === 'event_links' ? 'eventLink' : rel.table === 'scan_logs' ? 'scanLog' : 'clickLog', include[incKey].where);
        subq = supabase.from(rel.table).select('*').in(rel.fk, ids);
      }
      if (include[incKey] && include[incKey].orderBy) {
        const [col, dir] = Object.entries(include[incKey].orderBy)[0];
        subq = subq.order(col, { ascending: dir !== 'desc' });
      }
      const { data, error } = await subq;
      if (error) throw error;
      list.forEach((r) => {
        const matches = data.filter((x) => x[rel.fk] === (rel.thisKey ? r[rel.thisKey] : r.id));
        r[incKey] = rel.single ? (matches[0] || null) : matches;
      });
    }
  }

  if (include && include._count) {
    const countSel = include._count.select || {};
    for (const relKey of Object.keys(countSel)) {
      const rel = RELATIONS[model][relKey];
      if (!rel) continue;
      const ids = list.map((r) => r.id);
      const { data, error } = await supabase.from(rel.table).select('id').in(rel.fk, ids);
      if (error) throw error;
      const counts = {};
      data.forEach((d) => { counts[d[rel.fk]] = (counts[d[rel.fk]] || 0) + 1; });
      list.forEach((r) => {
        r._count = r._count || {};
        r._count[relKey] = counts[r.id] || 0;
      });
    }
  }
  return rows;
}

// Strip nulls -> null, convert Date for insert/update.
function toRow(model, obj) {
  const out = { ...obj };
  Object.keys(out).forEach((k) => {
    if (out[k] instanceof Date) out[k] = out[k].toISOString();
  });
  return out;
}

// Convert snake-cased DB columns back to the camelCase shape Prisma exposes.
const ALIASES = {
  created_at: 'createdAt', updated_at: 'updatedAt',
  start_date: 'startDate', end_date: 'endDate',
  primary_color: 'primaryColor', is_active: 'isActive',
  created_by_id: 'createdById', event_id: 'eventId',
  sort_order: 'sortOrder', device_type: 'deviceType',
  user_agent: 'userAgent', ip_address: 'ipAddress',
  scanned_at: 'scannedAt', clicked_at: 'clickedAt',
  event_link_id: 'eventLinkId',
};
function toCamel(row) {
  if (!row || typeof row !== 'object') return row;
  const out = {};
  Object.keys(row).forEach((k) => {
    const camel = ALIASES[k] || k;
    out[camel] = row[k];
  });
  return out;
}

function makeModel(model) {
  const table = () => supabase.from(TABLES[model]);

  return {
    async findUnique({ where, include, select }) {
      let q = table().select(select ? Object.keys(select).join(',') : '*');
      Object.entries(where).forEach(([k, v]) => {
        q = q.eq(k, v instanceof Date ? v.toISOString() : v);
      });
      const { data, error } = await q.limit(1);
      if (error) throw new PrismaLikeError(error);
      let row = data && data[0] ? toCamel(data[0]) : null;
      if (row && include) await hydrate(model, row, include, select);
      return row;
    },

    async findMany({ where, orderBy, take, include, select } = {}) {
      let q = buildFilters(model, where);
      if (orderBy) {
        const [col, dir] = Object.entries(orderBy)[0];
        q = q.order(col, { ascending: dir !== 'desc' });
      }
      if (take) q = q.limit(take);
      const { data, error } = await q;
      if (error) throw new PrismaLikeError(error);
      let rows = (data || []).map(toCamel);
      if (include) await hydrate(model, rows, include, select);
      return rows;
    },

    async create({ data }) {
      const row = toRow(model, data);
      const { data: created, error } = await table().insert(row).select('*');
      if (error) throw new PrismaLikeError(error);
      return toCamel(created[0]);
    },

    async update({ where, data }) {
      const row = toRow(model, data);
      let q = table().update(row);
      Object.entries(where).forEach(([k, v]) => { q = q.eq(k, v); });
      const { data: updated, error } = await q.select('*');
      if (error) throw new PrismaLikeError(error);
      const row0 = updated && updated[0] ? toCamel(updated[0]) : null;
      if (row0 && (data.updatedAt !== undefined || true)) {
        // refresh updatedAt
      }
      return row0;
    },

    async updateMany({ where, data }) {
      const row = toRow(model, data);
      let q = table().update(row);
      Object.entries(where).forEach(([k, v]) => {
        if (v && typeof v === 'object' && v.in) q = q.in(k, v.in);
        else q = q.eq(k, v);
      });
      const { data: updated, error } = await q.select('id');
      if (error) throw new PrismaLikeError(error);
      return { count: updated ? updated.length : 0 };
    },

    async delete({ where }) {
      let q = table().delete();
      Object.entries(where).forEach(([k, v]) => { q = q.eq(k, v); });
      const { error } = await q;
      if (error) throw new PrismaLikeError(error);
      return { id: where.id };
    },

    async deleteMany({ where }) {
      let q = table().delete();
      Object.entries(where || {}).forEach(([k, v]) => {
        if (v && typeof v === 'object' && v.in) q = q.in(k, v.in);
        else q = q.eq(k, v);
      });
      const { data, error } = await q.select('id');
      if (error) throw new PrismaLikeError(error);
      return { count: data ? data.length : 0 };
    },

    async count({ where } = {}) {
      let q = table().select('id', { count: 'exact', head: true });
      if (where) {
        Object.entries(where).forEach(([k, v]) => {
          if (v === undefined || v === null) return;
          if (typeof v === 'object') {
            Object.entries(v).forEach(([op, val]) => {
              if (op === 'gte') q = q.gte(k, val instanceof Date ? val.toISOString() : val);
              else if (op === 'gt') q = q.gt(k, val instanceof Date ? val.toISOString() : val);
              else if (op === 'lte') q = q.lte(k, val instanceof Date ? val.toISOString() : val);
              else if (op === 'lt') q = q.lt(k, val instanceof Date ? val.toISOString() : val);
              else if (op === 'in') q = q.in(k, val);
              else if (op === 'equals') q = q.eq(k, val);
            });
          } else {
            q = q.eq(k, v instanceof Date ? v.toISOString() : v);
          }
        });
      }
      const { count, error } = await q;
      if (error) throw new PrismaLikeError(error);
      return count || 0;
    },

    async aggregate({ where, _max }) {
      // For EventLink._max.sortOrder we fetch rows and compute max client-side.
      let q = buildFilters(model, where);
      if (_max) q = q.select(Object.keys(_max).join(','));
      const { data, error } = await q;
      if (error) throw new PrismaLikeError(error);
      const out = { _max: {} };
      Object.keys(_max || {}).forEach((col) => {
        const vals = (data || []).map((r) => r[col]).filter((v) => v !== null && v !== undefined);
        out._max[col] = vals.length ? Math.max(...vals) : null;
      });
      return out;
    },

    async groupBy({ by, where, _count, orderBy, take }) {
      // Supabase REST does not expose GROUP BY directly. We fetch the rows and
      // group client-side. Acceptable here: scan_logs / click_logs are sized.
      const rowsQ = buildFilters(model, where);
      const { data, error } = await rowsQ;
      if (error) throw new PrismaLikeError(error);
      const rows = data || [];
      const field = by[0];
      const groups = {};
      rows.forEach((r) => {
        const key = r[field];
        if (key === null || key === undefined) return;
        if (!groups[key]) groups[key] = { [field]: key, _count: { _all: 0 } };
        groups[key]._count._all += 1;
      });
      let result = Object.values(groups);
      if (orderBy) {
        const [col, dir] = Object.entries(orderBy)[0];
        if (col === '_count') {
          const inner = Object.values(orderBy._count)[0];
          result.sort((a, b) => (dir === 'desc' ? b._count[inner] - a._count[inner] : a._count[inner] - b._count[inner]));
        }
      }
      if (take) result = result.slice(0, take);
      return result;
    },
  };
}

class PrismaLikeError extends Error {
  constructor(supabaseError) {
    super(supabaseError.message || 'Database error');
    this.name = 'PrismaLikeError';
    this.code = supabaseError.code || 'P0000';
    // P2025-equivalent: Prisma record-not-found. Supabase returns PGRST116 on no single-row match.
    if (supabaseError.code === 'PGRST116') this.code = 'P2025';
  }
}

const prisma = {
  user: makeModel('user'),
  event: makeModel('event'),
  eventLink: makeModel('eventLink'),
  scanLog: makeModel('scanLog'),
  clickLog: makeModel('clickLog'),
  async $connect() {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error && error.code !== 'PGRST116') throw error;
  },
  async $disconnect() {},
};

module.exports = prisma;
module.exports.TABLES = TABLES;
module.exports.supabase = supabase;
