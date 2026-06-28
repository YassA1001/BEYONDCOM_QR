const LINK_ICONS = {
  website: 'bi-globe2',
  pdf: 'bi-file-earmark-pdf-fill',
  android: 'bi-android2',
  ios: 'bi-apple',
  maps: 'bi-geo-alt-fill',
  whatsapp: 'bi-whatsapp',
  instagram: 'bi-instagram',
  feedback: 'bi-star-fill',
  quiz: 'bi-question-circle-fill',
  stream: 'bi-play-circle-fill',
  other: 'bi-link-45deg',
}

const OS_ICONS = {
  windows: 'bi-windows',
  mac: 'bi-apple',
  ios: 'bi-apple',
  android: 'bi-android2',
  linux: 'bi-ubuntu',
}

const BROWSER_ICONS = {
  chrome: 'bi-browser-chrome',
  firefox: 'bi-browser-firefox',
  safari: 'bi-browser-safari',
  edge: 'bi-browser-edge',
}

export function iconFor(type) {
  return LINK_ICONS[type] || 'bi-link-45deg'
}

export function osIcon(os) {
  if (!os) return 'bi-display'
  const key = os.toLowerCase()
  for (const [k, v] of Object.entries(OS_ICONS)) {
    if (key.includes(k)) return v
  }
  return 'bi-display'
}

export function browserIcon(browser) {
  if (!browser) return 'bi-globe'
  const key = browser.toLowerCase()
  for (const [k, v] of Object.entries(BROWSER_ICONS)) {
    if (key.includes(k)) return v
  }
  return 'bi-globe'
}

export const LINK_TYPES = [
  { value: 'website', label: 'Site web' },
  { value: 'pdf', label: 'PDF' },
  { value: 'android', label: 'Android (Play Store)' },
  { value: 'ios', label: 'iOS (App Store)' },
  { value: 'maps', label: 'Carte / Localisation' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'feedback', label: 'Avis / Feedback' },
  { value: 'quiz', label: 'Quiz / Sondage' },
  { value: 'stream', label: 'Live / Streaming' },
  { value: 'other', label: 'Autre' },
]
