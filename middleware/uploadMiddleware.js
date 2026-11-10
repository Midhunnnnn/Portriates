const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

const isServerless = Boolean(process.env.VERCEL);
const tmpUploadRoot = path.join(os.tmpdir(), 'midhun-portraits-uploads');

// Locally write to public/uploads; on Vercel's read-only deployment FS, use /tmp
// Note: /tmp on Vercel is ephemeral across cold starts — integrate Cloudinary for permanent storage.
const orderUploadDir = isServerless
  ? path.join(tmpUploadRoot, 'orders')
  : path.join(__dirname, '..', 'public', 'uploads', 'orders');
const artworkUploadDir = isServerless
  ? path.join(tmpUploadRoot, 'artworks')
  : path.join(__dirname, '..', 'public', 'uploads', 'artworks');

function ensureUploadDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

try {
  ensureUploadDir(orderUploadDir);
  ensureUploadDir(artworkUploadDir);
} catch (err) {
  console.warn('Upload directory initialization warning:', err.message);
}

// Order reference photos storage
const orderStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      ensureUploadDir(orderUploadDir);
      cb(null, orderUploadDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'portrait-ref-' + uniqueSuffix + ext);
  }
});

// Artwork showcase storage
const artworkStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      ensureUploadDir(artworkUploadDir);
      cb(null, artworkUploadDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'artwork-' + uniqueSuffix + ext);
  }
});

// File validation
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|avif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only valid image files (JPG, PNG, WEBP) are allowed!'));
  }
};

const uploadOrderPhoto = multer({
  storage: orderStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit for high-res reference photos
  fileFilter: imageFileFilter
});

const uploadArtworkImage = multer({
  storage: artworkStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: imageFileFilter
});

// Helper hook for future Cloudinary integration (when CLOUDINARY_* env vars are configured)
function getUploadedFileUrl(file, folder) {
  if (!file) return null;
  if (file.path && /^https?:\/\//i.test(file.path)) {
    return file.path;
  }
  return `/uploads/${folder}/${file.filename}`;
}

module.exports = {
  uploadOrderPhoto,
  uploadArtworkImage,
  isServerless,
  tmpUploadRoot,
  orderUploadDir,
  artworkUploadDir,
  getUploadedFileUrl
};
