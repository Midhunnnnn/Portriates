const fs = require('fs');
const path = require('path');
const Artwork = require('../models/Artwork');
const User = require('../models/User');

const sampleDir = path.join(__dirname, '..', 'public', 'images', 'samples');

function ensureSampleDir() {
  try {
    if (!fs.existsSync(sampleDir)) {
      fs.mkdirSync(sampleDir, { recursive: true });
    }
    return true;
  } catch (err) {
    return false;
  }
}

function createSampleSvg(filename, title, subtitle, styleColor = '#2b2b2b', accent = '#d4af37') {
  const filePath = path.join(sampleDir, filename);
  if (fs.existsSync(filePath)) return `/images/samples/${filename}`;

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
    <defs>
      <radialGradient id="vignette" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="60%" stop-color="#232323" stop-opacity="0" />
        <stop offset="100%" stop-color="#050505" stop-opacity="0.85" />
      </radialGradient>
      <linearGradient id="paperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#181818" />
        <stop offset="50%" stop-color="#202020" />
        <stop offset="100%" stop-color="#141414" />
      </linearGradient>
      <filter id="pencilNoise" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
        <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0.12 0" />
        <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
      </filter>
    </defs>
    
    <rect width="800" height="1000" fill="url(#paperGrad)" />
    <rect width="800" height="1000" filter="url(#pencilNoise)" opacity="0.6" />
    <rect x="40" y="40" width="720" height="920" fill="none" stroke="#333333" stroke-width="1.5" />
    <rect x="50" y="50" width="700" height="900" fill="none" stroke="#222222" stroke-width="0.8" />
    
    <g stroke="#ffffff" stroke-opacity="0.06" stroke-width="1.2">
      <path d="M 120 180 L 680 740 M 140 160 L 700 720 M 160 140 L 720 700" />
      <path d="M 680 180 L 120 740 M 660 160 L 100 720 M 700 200 L 140 760" />
      <path d="M 200 100 L 600 900 M 250 100 L 650 900" />
    </g>

    <path d="M 400 220 C 310 220, 260 300, 260 410 C 260 520, 290 620, 400 660 C 510 620, 540 520, 540 410 C 540 300, 490 220, 400 220 Z" 
          fill="#1c1c1c" stroke="#444444" stroke-width="2" />
    
    <path d="M 320 280 Q 400 250 480 280 Q 520 360 490 470 Q 400 580 310 470 Z" 
          fill="#252525" stroke="#555555" stroke-dasharray="2,3" stroke-width="1.5" />

    <path d="M 330 380 Q 360 365 390 380 Q 360 395 330 380 Z" fill="#111" stroke="#d4af37" stroke-width="1.8" />
    <circle cx="360" cy="380" r="8" fill="#ffffff" opacity="0.8" />
    <circle cx="361" cy="379" r="3" fill="#111111" />
    <path d="M 320 360 Q 360 345 400 365" fill="none" stroke="#777" stroke-width="2.5" />

    <path d="M 410 380 Q 440 365 470 380 Q 440 395 410 380 Z" fill="#111" stroke="#d4af37" stroke-width="1.8" />
    <circle cx="440" cy="380" r="8" fill="#ffffff" opacity="0.8" />
    <circle cx="441" cy="379" r="3" fill="#111111" />
    <path d="M 400 365 Q 440 345 480 360" fill="none" stroke="#777" stroke-width="2.5" />

    <path d="M 400 380 L 395 445 Q 400 455 415 450" fill="none" stroke="#666" stroke-width="2" />

    <path d="M 365 490 Q 400 480 435 490 Q 400 515 365 490 Z" fill="#222" stroke="#888" stroke-width="1.5" />
    <path d="M 370 490 Q 400 496 430 490" fill="none" stroke="#aaa" stroke-width="1" />

    <path d="M 280 660 C 220 700, 150 780, 130 900 L 670 900 C 650 780, 580 700, 520 660 Z" 
          fill="#171717" stroke="#3a3a3a" stroke-width="2" />

    <g transform="translate(540, 850)">
      <text font-family="'Brush Script MT', 'Dancing Script', cursive, serif" font-size="28" fill="${accent}" font-style="italic">Midhun R.S.</text>
      <text y="22" font-family="'Helvetica Neue', Arial, sans-serif" font-size="10" fill="#777" letter-spacing="2">STUDIO ARCHIVE</text>
    </g>

    <rect width="800" height="1000" fill="url(#vignette)" pointer-events="none" />

    <rect x="70" y="70" width="300" height="60" rx="4" fill="#0d0d0d" fill-opacity="0.85" stroke="#333" stroke-width="1" />
    <text x="85" y="94" font-family="'Helvetica Neue', Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff" letter-spacing="1">${title.toUpperCase()}</text>
    <text x="85" y="114" font-family="'Helvetica Neue', Arial, sans-serif" font-size="11" fill="${accent}">${subtitle}</text>
  </svg>`;

  if (ensureSampleDir()) {
    try {
      fs.writeFileSync(filePath, svgContent, 'utf8');
    } catch (err) {
      console.warn(`Could not write sample SVG (${filename}) on read-only filesystem:`, err.message);
    }
  }
  return `/images/samples/${filename}`;
}

async function seedInitialData() {
  if (global.__studioSeeded) return;
  if (global.__studioSeedPromise) {
    return global.__studioSeedPromise;
  }

  global.__studioSeedPromise = (async () => {
    const adminEmail = process.env.ADMIN_EMAIL || 'midhunrs727@gmail.com';
    const adminPass = process.env.ADMIN_DEFAULT_PASS || 'admin123';
    await User.seedAdmin(adminEmail, adminPass);

    const count = await Artwork.countDocuments();
    if (count === 0) {
      console.log('Seeding initial pencil portrait showcase gallery in MongoDB...');

    const sampleArtworks = [
      {
        title: 'The Gaze of Eternity',
        category: 'Hyper-Realistic',
        medium: 'Staedtler Mars Lumograph & Carbon Black',
        size: 'A2 (16.5 x 23.4 in)',
        price: 6500,
        description: 'Over 65 hours of meticulous pencil shading, capturing every micro-texture of skin, hair strands, and expressive emotive gaze.',
        filename: 'portrait_1_hyperrealistic.svg',
        featured: 1
      },
      {
        title: 'Eternal Vows - Wedding Duo',
        category: 'Couple & Wedding',
        medium: 'Charcoal & Graphite on Brustro 250 GSM',
        size: 'A3 (11.7 x 16.5 in)',
        price: 4800,
        description: 'Commemorative couple portrait created from wedding ceremony photograph with romantic soft charcoal gradients.',
        filename: 'portrait_2_wedding_couple.svg',
        featured: 1
      },
      {
        title: 'The Godfather - Vito Corleone',
        category: 'Celebrity & Icons',
        medium: 'Pure Charcoal Powder & Tombow Mono Zero',
        size: 'A3 (11.7 x 16.5 in)',
        price: 4200,
        description: 'Cinematic tribute sketch with dramatic chiaroscuro contrast, deep velvety blacks, and sharp highlight sculpting.',
        filename: 'portrait_3_godfather_icon.svg',
        featured: 1
      },
      {
        title: 'Golden Retriever Companion',
        category: 'Pet Portraits',
        medium: 'Graphite 2B-8B & Eraser Sculpting',
        size: 'A4 (8.3 x 11.7 in)',
        price: 2800,
        description: 'Detailed fur rendering technique bringing warmth, loyalty, and soul into an authentic hand-drawn pet tribute.',
        filename: 'portrait_4_pet_retriever.svg',
        featured: 1
      },
      {
        title: 'Nostalgic Grandmother',
        category: 'Hyper-Realistic',
        medium: 'Graphite Pencil on Heavyweight Archival Bristol',
        size: 'A3 (11.7 x 16.5 in)',
        price: 4500,
        description: 'A study of time, wisdom, and life etched into fine pencil strokes with hyper-realistic skin fold rendering.',
        filename: 'portrait_5_grandmother_realism.svg',
        featured: 1
      },
      {
        title: 'The Visionary - Steve Jobs',
        category: 'Celebrity & Icons',
        medium: 'Carbon Pencil & Blending Stumps',
        size: 'A4 (8.3 x 11.7 in)',
        price: 3200,
        description: 'Iconic intellectual gaze rendered with minimalist charcoal shading and high focal sharpness.',
        filename: 'portrait_6_steve_jobs.svg',
        featured: 1
      },
      {
        title: 'Parental Warmth - Father & Child',
        category: 'Couple & Wedding',
        medium: 'Graphite & Warm Charcoal Tint',
        size: 'A2 (16.5 x 23.4 in)',
        price: 5800,
        description: 'A timeless family heirloom portrait capturing emotional tenderness, hand details, and soft ambient lighting.',
        filename: 'portrait_7_father_daughter.svg',
        featured: 0
      },
      {
        title: 'Majestic Royal Bengal Tiger',
        category: 'Wildlife & Nature',
        medium: 'Charcoal Powder & White Gouache Highlights',
        size: 'A2 (16.5 x 23.4 in)',
        price: 6200,
        description: 'Striking wildlife illustration emphasizing fierce intense eyes, whisker accents, and rich striped shadows.',
        filename: 'portrait_8_tiger_charcoal.svg',
        featured: 0
      }
    ];

    for (const art of sampleArtworks) {
      const imgUrl = createSampleSvg(art.filename, art.title, `${art.medium} • ${art.size}`);
      await Artwork.create({
        title: art.title,
        category: art.category,
        medium: art.medium,
        size: art.size,
        price: art.price,
        description: art.description,
        image_url: imgUrl,
        featured: art.featured
      });
    }

      console.log(`Successfully seeded ${sampleArtworks.length} artworks into MongoDB.`);
    }

    global.__studioSeeded = true;
  })().catch((err) => {
    global.__studioSeedPromise = null;
    throw err;
  });

  return global.__studioSeedPromise;
}

module.exports = { seedInitialData };
