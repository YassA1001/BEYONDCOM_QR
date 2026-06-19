const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const ALLOWED_MIMES = ['image/jpeg', 'image/png'];
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png'];
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

const LOGO_DIR = path.join(__dirname, '..', 'public', 'uploads', 'logos');
const BANNER_DIR = path.join(__dirname, '..', 'public', 'uploads', 'banners');

[LOGO_DIR, BANNER_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIMES.includes(file.mimetype) && ALLOWED_EXTS.includes(ext)) {
    return cb(null, true);
  }
  cb(new Error('Format non supporté. Seuls les fichiers JPG et PNG sont autorisés.'), false);
}

function storage(dest) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${ext}`);
    },
  });
}

const logoUpload = multer({
  storage: storage(LOGO_DIR),
  fileFilter,
  limits: { fileSize: MAX_SIZE },
}).single('logo');

const bannerUpload = multer({
  storage: storage(BANNER_DIR),
  fileFilter,
  limits: { fileSize: MAX_SIZE },
}).single('banner');

// Wraps multer to convert MulterErrors into flash + redirect, matching UI expectations.
function wrap(upload) {
  return (req, res, next) => {
    upload(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new Error('Le fichier est trop volumineux. Taille maximum : 2 Mo.'));
        }
        return next(new Error(`Erreur d'upload: ${err.message}`));
      }
      return next(err);
    });
  };
}

module.exports = {
  logoUpload: () => wrap(logoUpload),
  bannerUpload: () => wrap(bannerUpload),
  MAX_SIZE,
  ALLOWED_EXTS,
};
