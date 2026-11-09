require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { connectDB } = require('./config/db');
const { seedInitialData } = require('./utils/seedData');
const { setUserContext } = require('./middleware/authMiddleware');

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

// CORS configuration for React dev server
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
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

// Ensure upload folders exist
const uploadsOrdersDir = path.join(__dirname, 'public', 'uploads', 'orders');
const uploadsArtworksDir = path.join(__dirname, 'public', 'uploads', 'artworks');
if (!fs.existsSync(uploadsOrdersDir)) fs.mkdirSync(uploadsOrdersDir, { recursive: true });
if (!fs.existsSync(uploadsArtworksDir)) fs.mkdirSync(uploadsArtworksDir, { recursive: true });

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'midhun_pencil_art_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: false,
      sameSite: 'lax'
    }
  })
);

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
    return res.status(500).json({ error: err.message || 'Server Error' });
  }
  res.status(500).send(`<h3>Server Error</h3><p>${err.message}</p>`);
});

// Initialize MongoDB and start server
async function startServer() {
  try {
    await connectDB();
    await seedInitialData();

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

startServer();
