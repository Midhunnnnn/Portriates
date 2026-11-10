const mongoose = require('mongoose');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

const DEFAULT_LOCAL_URI = 'mongodb://127.0.0.1:27017/pencil_portraits_studio';

let cached = global.__mongooseConnCache;
if (!cached) {
  cached = global.__mongooseConnCache = { conn: null, promise: null };
}

function isLocalMongoUri(uri) {
  return /^mongodb:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/i.test(uri || '');
}

// Helper to check if port 27017 is listening
function isPortOpen(port = 27017, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

// Helper to ensure mongod process is running locally
async function ensureLocalMongo() {
  const isOpen = await isPortOpen(27017);
  if (isOpen) return true;

  console.log('MongoDB not detected on port 27017. Attempting to start local mongod...');
  const mongodPath = 'C:\\Program Files\\MongoDB\\Server\\9.0\\bin\\mongod.exe';
  const dataPath = path.join(__dirname, '..', 'data', 'db');

  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
  }

  if (fs.existsSync(mongodPath)) {
    try {
      const child = spawn(mongodPath, ['--dbpath', dataPath, '--port', '27017'], {
        detached: true,
        stdio: 'ignore'
      });
      child.unref();

      // Wait up to 5 seconds for mongod to accept connections
      for (let i = 0; i < 10; i++) {
        await new Promise((res) => setTimeout(res, 500));
        if (await isPortOpen(27017)) {
          console.log('Local MongoDB engine started successfully.');
          return true;
        }
      }
    } catch (err) {
      console.error('Failed to spawn mongod:', err.message);
    }
  }
  return false;
}

async function connectDB() {
  const isServerless = Boolean(process.env.VERCEL);
  const mongoUri = process.env.MONGODB_URI || (!isServerless ? DEFAULT_LOCAL_URI : '');

  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is required in Vercel production.');
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose.connection;
    return cached.conn;
  }

  try {
    if (!cached.promise) {
      cached.promise = (async () => {
        if (!isServerless && isLocalMongoUri(mongoUri)) {
          await ensureLocalMongo();
        }

        await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: isServerless ? 10000 : 5000
        });

        console.log(`Connected to MongoDB database`);
        return mongoose.connection;
      })();
    }

    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    cached.conn = null;
    console.error('MongoDB connection error:', err.message);
    console.error('Tip: Make sure MongoDB service is active or configure MONGODB_URI in environment variables');
    throw err;
  }
}

module.exports = { connectDB, mongoose };
