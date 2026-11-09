require('dotenv').config();
const mongoose = require('mongoose');

async function syncImages() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pencil_portraits_studio');
  const Artwork = require('../models/Artwork');

  // 1. catpencil.jpg
  const catExists = await Artwork.findOne({ image_url: /catpencil/i });
  if (!catExists) {
    await Artwork.create({
      title: 'Staedtler Lumograph Cat - 65 Hrs Detail',
      category: 'Pet Portraits',
      medium: 'Staedtler Mars Lumograph (65 Hrs Detail)',
      size: 'A4 (8.3 x 11.7 in)',
      price: 3499,
      description: 'Meticulous pencil sketch of a feline companion with micro-fine fur texture, delicate whiskers, and luminous gaze.',
      image_url: '/images/samples/catpencil.jpg',
      featured: 1
    });
    console.log('Added catpencil.jpg to database!');
  }

  // 2. artwork-1793110997088-186258819.jpg
  const art1Exists = await Artwork.findOne({ image_url: /1793110997088/i });
  if (!art1Exists) {
    await Artwork.create({
      title: 'Serenade in Graphite - Master Portrait',
      category: 'Hyper-Realistic',
      medium: 'German Graphite & Willow Charcoal Blend',
      size: 'A3 (11.7 x 16.5 in)',
      price: 4800,
      description: 'Handcrafted realism capturing emotive human expression, tonal graduation, and deep contrast on 300 GSM Fabriano paper.',
      image_url: '/uploads/artworks/artwork-1793110997088-186258819.jpg',
      featured: 1
    });
    console.log('Added artwork-1793110997088-186258819.jpg to database!');
  }

  // 3. WhatsApp Image
  const waExists = await Artwork.findOne({ image_url: /WhatsApp/i });
  if (!waExists) {
    await Artwork.create({
      title: 'Elegance in Charcoal - Commission Piece',
      category: 'Couple & Wedding',
      medium: 'Soft Charcoal & Graphite Blend',
      size: 'A3 (11.7 x 16.5 in)',
      price: 5200,
      description: 'Custom commissioned pencil portrait celebrating warmth, affection, and heirloom craftsmanship.',
      image_url: '/images/samples/WhatsApp Image 2026-10-27 at 10.20.58 PM.jpeg',
      featured: 1
    });
    console.log('Added WhatsApp Image to database!');
  }

  const all = await Artwork.find({});
  console.log('Total artworks in DB now:', all.length);
  all.forEach(a => console.log(' - ' + a.title + ' (' + a.category + '): ' + a.image_url));
  process.exit(0);
}

syncImages().catch(err => {
  console.error(err);
  process.exit(1);
});

