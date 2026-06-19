// Centralized date formatting helpers used across views.
// Keeps EJS templates free of logic.

function formatDate(value, opts = {}) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...opts,
  });
}

function formatDateTime(value) {
  if (!value) return '—';
  return formatDate(value, { hour: '2-digit', minute: '2-digit' });
}

function formatRange(start, end) {
  const s = formatDate(start);
  const e = formatDate(end);
  if (s === '—' && e === '—') return '—';
  if (s === '—') return e;
  if (e === '—') return s;
  return `${s} → ${e}`;
}

function timeAgo(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'à l\'instant';
  const min = Math.floor(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `il y a ${hr} h`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `il y a ${day} j`;
  return formatDate(date);
}

module.exports = { formatDate, formatDateTime, formatRange, timeAgo };
