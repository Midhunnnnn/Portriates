const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { connectDB } = require('../config/db');
const Artwork = require('../models/Artwork');
const {
  ARTWORKS_FOLDER,
  isCloudinaryConfigured,
  isCloudinaryUrl,
  uploadLocalFileToCloudinary,
  getExistingCloudinaryResource
} = require('../config/cloudinary');

async function migrateArtworks() {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Missing Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).'
    );
  }

  await connectDB();

  const publicRoot = path.resolve(__dirname, '..', 'public');
  const artworks = await Artwork.find().sort({ _id: -1 });

  console.log(`Found ${artworks.length} artwork record(s) in MongoDB.`);

  const summary = {
    total: artworks.length,
    migrated: 0,
    recovered: 0,
    skipped: 0,
    failed: 0
  };

  for (let i = 0; i < artworks.length; i++) {
    const art = artworks[i];
    const currentUrl = (art.image_url || '').trim();

    if (isCloudinaryUrl(currentUrl)) {
      summary.skipped += 1;
      console.log(`[${i + 1}/${artworks.length}] SKIP (already on Cloudinary): "${art.title}" (${art._id}) -> ${currentUrl}`);
      continue;
    }

    if (!currentUrl.startsWith('/')) {
      summary.failed += 1;
      console.error(`[${i + 1}/${artworks.length}] FAIL (unsupported non-local URL): "${art.title}" (${art._id}) -> ${currentUrl}`);
      continue;
    }

    const relativePath = currentUrl.replace(/^\/+/, '');
    const absoluteFilePath = path.resolve(publicRoot, relativePath);

    if (!absoluteFilePath.startsWith(publicRoot + path.sep)) {
      summary.failed += 1;
      console.error(`[${i + 1}/${artworks.length}] FAIL (invalid local path): "${art.title}" (${art._id}) -> ${currentUrl}`);
      continue;
    }

    if (!fs.existsSync(absoluteFilePath)) {
      summary.failed += 1;
      console.error(`[${i + 1}/${artworks.length}] FAIL (local file missing on disk): "${art.title}" (${art._id}) -> ${absoluteFilePath}`);
      continue;
    }

    const deterministicAssetId = `artwork-${art._id}`;
    const fullPublicId = `${ARTWORKS_FOLDER}/${deterministicAssetId}`;

    try {
      let existing = await getExistingCloudinaryResource(fullPublicId);
      let finalSecureUrl;

      if (existing && existing.secure_url) {
        finalSecureUrl = existing.secure_url;
        summary.recovered += 1;
        console.log(`[${i + 1}/${artworks.length}] RECOVERED (existing Cloudinary asset): "${art.title}" -> ${finalSecureUrl}`);
      } else {
        const uploadResult = await uploadLocalFileToCloudinary(absoluteFilePath, {
          folder: ARTWORKS_FOLDER,
          public_id: deterministicAssetId,
          overwrite: false,
          unique_filename: false,
          resource_type: 'image'
        });
        finalSecureUrl = uploadResult.secure_url;
        summary.migrated += 1;
        console.log(`[${i + 1}/${artworks.length}] MIGRATED: "${art.title}" (${currentUrl}) -> ${finalSecureUrl}`);
      }

      // Preserve every existing field and document _id; update only image_url
      await Artwork.updateOne({ _id: art._id }, { $set: { image_url: finalSecureUrl } });
    } catch (err) {
      summary.failed += 1;
      console.error(`[${i + 1}/${artworks.length}] ERROR migrating "${art.title}" (${art._id}):`, err.message);
    }
  }

  console.log('Migration Summary:', JSON.stringify(summary));
  return summary;
}

if (require.main === module) {
  migrateArtworks()
    .then(async (summary) => {
      await mongoose.disconnect().catch(() => {});
      process.exit(summary.failed > 0 ? 1 : 0);
    })
    .catch(async (err) => {
      console.error('Migration aborted:', err);
      await mongoose.disconnect().catch(() => {});
      process.exit(1);
    });
}

module.exports = { migrateArtworks };

