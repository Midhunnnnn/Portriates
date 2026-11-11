require('dotenv').config();
require('ejs');
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { connectDB } = require('./config/db');
const { MongoSessionStore } = require('./config/sessionStore');
const { isUiOnlyShowcaseWithoutDb } = require('./config/fallbackArtworks');
const { seedInitialData } = require('./utils/seedData');
const { setUserContext } = require('./middleware/authMiddleware');
const { isServerless, tmpUploadRoot } = require('./middleware/uploadMiddleware');

// Route imports
const apiRoutes = require('./routes/apiRoutes');
const homeRoutes = require('./routes/homeRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const billingRoutes = require('./routes/billingRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production' || isServerless;

app.set('trust proxy', 1);

// CORS configuration for React dev server and production frontend
const devOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];
const envOrigins = [
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : []),
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : [])
]
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const allowedOrigins = Array.from(
  new Set([...(isProduction ? [] : devOrigins), ...envOrigins])
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/+$/, '');
      if (allowedOrigins.includes(normalized)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true
  })
);

// Set View Engine to EJS (maintained for fallback / hybrid)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parsing middleware
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(express.json({ limit: '25mb' }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
if (isServerless) {
  app.use('/uploads', express.static(tmpUploadRoot));
}

// Ensure upload folders exist locally (Vercel deployment FS is read-only)
if (!isServerless) {
  const uploadsOrdersDir = path.join(__dirname, 'public', 'uploads', 'orders');
  const uploadsArtworksDir = path.join(__dirname, 'public', 'uploads', 'artworks');
  try {
    if (!fs.existsSync(uploadsOrdersDir)) fs.mkdirSync(uploadsOrdersDir, { recursive: true });
    if (!fs.existsSync(uploadsArtworksDir)) fs.mkdirSync(uploadsArtworksDir, { recursive: true });
  } catch (err) {
    console.warn('Upload directory creation warning:', err.message);
  }
}

let initPromise = null;
function ensureAppInitialized() {
  if (!initPromise) {
    initPromise = (async () => {
      await connectDB();
      await seedInitialData();
    })().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

// Ensure MongoDB connection & safe initial seed before session/route handling
app.use(async (req, res, next) => {
  if (isUiOnlyShowcaseWithoutDb()) {
    return next();
  }
  try {
    await ensureAppInitialized();
    next();
  } catch (err) {
    next(err);
  }
});

// Session configuration
const useSecureCookies = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === 'true'
  : isProduction;
const cookieSameSite = process.env.COOKIE_SAME_SITE || (useSecureCookies ? 'none' : 'lax');

const sessionOptions = {
  secret: process.env.SESSION_SECRET || 'midhun_pencil_art_secret_key_2026',
  resave: false,
  saveUninitialized: false,
  proxy: isProduction,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    secure: useSecureCookies,
    sameSite: cookieSameSite
  }
};
if (!isUiOnlyShowcaseWithoutDb()) {
  sessionOptions.store = new MongoSessionStore();
}

app.use(session(sessionOptions));

// Global user and flash context middleware
app.use(setUserContext);

// --- MOUNT MVC ROUTES (VERSION 1) ---
app.use('/api', apiRoutes);
app.use('/', homeRoutes);
app.use('/auth', authRoutes);
app.use('/orders', orderRoutes);
app.use('/payment', paymentRoutes);
app.use('/billing', billingRoutes);
app.use('/admin', adminRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  if (req.path.startsWith('/api')) {
    const statusCode = err.status || (err.name === 'MulterError' ? 400 : 500);
    const errorMsg = err.message || 'Server Error';
    return res.status(statusCode).json({ success: false, error: errorMsg, message: errorMsg });
  }
  res.status(500).send(`<h3>Server Error</h3><p>${err.message}</p>`);
});

// Initialize MongoDB and start server
async function startServer() {
  try {
    await ensureAppInitialized();

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🎨 MIDHUN PENCIL PORTRAITS STUDIO SYSTEM ONLINE`);
      console.log(`🍃 Database: MongoDB connected via Mongoose`);
      console.log(`🌐 Server running at: http://localhost:${PORT}`);
      console.log(`🛡️ Admin Login Email: ${process.env.ADMIN_EMAIL || 'midhunrs727@gmail.com'}`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Failed to start studio server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

app.ensureAppInitialized = ensureAppInitialized;
module.exports = app;
