const NodeCache = require('node-cache');

// Cache for public event page data. TTL 60 seconds.
// The cache never blocks scan/click logging - those always go through.
const publicEventCache = new NodeCache({
  stdTTL: 60,
  checkperiod: 30,
  useClones: false,
});

function keyFor(slug) {
  return `event:${slug}`;
}

function getPublicEvent(slug) {
  return publicEventCache.get(keyFor(slug));
}

function setPublicEvent(slug, data) {
  publicEventCache.set(keyFor(slug), data);
}

function invalidate(slug) {
  if (slug) publicEventCache.del(keyFor(slug));
}

function invalidateAll() {
  publicEventCache.flushAll();
}

module.exports = {
  getPublicEvent,
  setPublicEvent,
  invalidate,
  invalidateAll,
};
