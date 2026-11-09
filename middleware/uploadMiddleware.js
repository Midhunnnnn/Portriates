const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload folders exist
const orderUploadDir = path.join(__dirname, '..', 'public', 'uploads', 'orders');
const artworkUploadDir = path.join(__dirname, '..', 'public', 'uploads', 'artworks');

if (!fs.existsSync(orderUploadDir)) fs.mkdirSync(orderUploadDir, { recursive: true });
if (!fs.existsSync(artworkUploadDir)) fs.mkdirSync(artworkUploadDir, { recursive: true });

// Order reference photos storage
const orderStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, orderUploadDir);
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
    cb(null, artworkUploadDir);
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

module.exports = {
  uploadOrderPhoto,
  uploadArtworkImage
};
