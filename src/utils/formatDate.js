const fr = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const frDT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export function formatDate(d) {
  if (!d) return '—'
  return fr.format(new Date(d))
}

export function formatDateTime(d) {
  if (!d) return '—'
  return frDT.format(new Date(d))
}

export function formatRange(start, end) {
  if (!start && !end) return '—'
  if (!end) return `Depuis le ${formatDate(start)}`
  if (!start) return `Jusqu'au ${formatDate(end)}`
  return `${formatDate(start)} – ${formatDate(end)}`
}

export function timeAgo(d) {
  if (!d) return '—'
  const diff = Date.now() - new Date(d).getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return "À l'instant"
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `Il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Il y a ${days}j`
  return formatDate(d)
}
