const cloudinary = require('cloudinary').v2;

const ARTWORKS_FOLDER = process.env.CLOUDINARY_ARTWORKS_FOLDER || 'midhun-portraits/artworks';

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

function configureCloudinary() {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary environment variables are not configured.');
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
    api_key: process.env.CLOUDINARY_API_KEY.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
    secure: true
  });

  return cloudinary;
}

function isCloudinaryUrl(url) {
  return typeof url === 'string' && /^https?:\/\/res\.cloudinary\.com\//i.test(url.trim());
}

function extractCloudinaryPublicId(imageUrl) {
  if (!isCloudinaryUrl(imageUrl)) return null;

  const cleanUrl = imageUrl.trim().split('?')[0].split('#')[0];
  const uploadMarker = '/upload/';
  const idx = cleanUrl.indexOf(uploadMarker);
  if (idx === -1) return null;

  let rest = cleanUrl.slice(idx + uploadMarker.length);

  // Strip optional transformation/version segments so we recover folder + asset id cleanly
  const versionMatch = rest.match(/(?:^|\/)v\d+\/(.+)$/);
  if (versionMatch) {
    rest = versionMatch[1];
  } else {
    const segments = rest.split('/');
    while (segments.length > 1 && segments[0].includes(',')) {
      segments.shift();
    }
    rest = segments.join('/');
  }

  const withoutExt = rest.replace(/\.[^/.]+$/, '');
  try {
    return decodeURIComponent(withoutExt);
  } catch (_) {
    return withoutExt;
  }
}

function uploadBufferToCloudinary(buffer, options = {}) {
  const client = configureCloudinary();
  const uploadOptions = {
    folder: options.folder || ARTWORKS_FOLDER,
    resource_type: 'image',
    ...options
  };

  return new Promise((resolve, reject) => {
    const stream = client.uploader.upload_stream(uploadOptions, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });
}

async function uploadLocalFileToCloudinary(filePath, options = {}) {
  const client = configureCloudinary();
  const uploadOptions = {
    folder: options.folder || ARTWORKS_FOLDER,
    resource_type: 'image',
    ...options
  };

  return client.uploader.upload(filePath, uploadOptions);
}

async function getExistingCloudinaryResource(publicId) {
  const client = configureCloudinary();
  try {
    const result = await client.api.resource(publicId, { resource_type: 'image' });
    return result;
  } catch (err) {
    const status = err?.http_code || err?.error?.http_code;
    if (status === 404) return null;
    throw err;
  }
}

async function deleteCloudinaryAsset(imageUrl) {
  if (!isCloudinaryConfigured() || !isCloudinaryUrl(imageUrl)) {
    return { skipped: true };
  }

  const publicId = extractCloudinaryPublicId(imageUrl);
  if (!publicId) {
    return { skipped: true };
  }

  const client = configureCloudinary();
  try {
    const result = await client.uploader.destroy(publicId, {
      resource_type: 'image',
      invalidate: true
    });
    return result;
  } catch (err) {
    console.warn(`Cloudinary asset cleanup warning (${publicId}):`, err.message);
    return { error: err.message };
  }
}

async function safeDeleteUnusedArtworkAsset(ArtworkModel, imageUrl, excludeArtworkId = null) {
  if (!isCloudinaryUrl(imageUrl)) {
    return { skipped: true };
  }

  const query = { image_url: imageUrl };
  if (excludeArtworkId) {
    query._id = { $ne: excludeArtworkId };
  }

  const remainingRefs = await ArtworkModel.countDocuments(query);
  if (remainingRefs > 0) {
    return { skipped: true, reason: 'referenced_by_other_artwork' };
  }

  return deleteCloudinaryAsset(imageUrl);
}

module.exports = {
  ARTWORKS_FOLDER,
  isCloudinaryConfigured,
  configureCloudinary,
  isCloudinaryUrl,
  extractCloudinaryPublicId,
  uploadBufferToCloudinary,
  uploadLocalFileToCloudinary,
  getExistingCloudinaryResource,
  deleteCloudinaryAsset,
  safeDeleteUnusedArtworkAsset
};
