// Bootstrap Icons mapping for link types.
const ICONS = {
  website: 'globe',
  pdf: 'file-pdf',
  android: 'android2',
  ios: 'apple',
  maps: 'geo-alt',
  whatsapp: 'whatsapp',
  instagram: 'instagram',
  feedback: 'chat-left-text',
  quiz: 'patch-question',
  stream: 'play-circle',
  other: 'link-45deg',
};

const OS_ICONS = {
  Windows: 'windows',
  macOS: 'apple',
  Android: 'android2',
  iOS: 'apple',
  Linux: 'terminal',
  Other: 'question-circle',
};

const BROWSER_ICONS = {
  Chrome: 'google',
  Safari: 'compass',
  Firefox: 'fire',
  Edge: 'internet-explorer',
  Opera: 'opra',
  Other: 'globe',
};

function iconFor(type) {
  return ICONS[type] || 'link-45deg';
}

function osIcon(os) {
  return OS_ICONS[os] || 'question-circle';
}

function browserIcon(b) {
  return BROWSER_ICONS[b] || 'globe';
}

module.exports = { iconFor, osIcon, browserIcon, ICONS };
