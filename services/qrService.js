// QR code generation + PNG file writing.
// The QR always points to /e/:slug (APP_URL + /e/:slug).
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');

const QR_DIR = path.join(__dirname, '..', 'public', 'qrcodes');
if (!fs.existsSync(QR_DIR)) fs.mkdirSync(QR_DIR, { recursive: true });

function publicUrlFor(slug) {
  return `${env.APP_URL.replace(/\/$/, '')}/e/${slug}`;
}

function fileNameFor(slug) {
  return `${slug}-qr.png`;
}

function pathFor(slug) {
  return path.join(QR_DIR, fileNameFor(slug));
}

async function generate(slug) {
  const url = publicUrlFor(slug);
  const dest = pathFor(slug);
  await QRCode.toFile(dest, url, {
    errorCorrectionLevel: 'H',
    type: 'png',
    margin: 2,
    width: 512,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });
  return { path: dest, fileName: fileNameFor(slug), url };
}

async function toDataUrl(slug) {
  const url = publicUrlFor(slug);
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 256,
    color: { dark: '#0f172a', light: '#ffffff' },
  });
}

module.exports = { generate, toDataUrl, publicUrlFor, pathFor, fileNameFor, QR_DIR };
