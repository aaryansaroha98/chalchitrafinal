const path = require('path');
const fs = require('fs');

// Load .env file
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_MAX_AGE_MS = Number(process.env.SESSION_MAX_AGE_MS) || (30 * 24 * 60 * 60 * 1000); // 30 days

// Trust proxy - required when behind Vercel/Render proxies for secure cookies
app.set('trust proxy', 1);

// Database setup - SQLite only for localhost
const dbPath = path.join(__dirname, '..', 'database.db');

console.log(`📦 Database path: ${dbPath}`);
console.log(`📦 Environment: Development (localhost)`);

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`✅ Created database directory: ${dbDir}`);
}

// Initialize database
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
  } else {
    console.log('✅ Database connected successfully');
    console.log(`✅ Database file: ${dbPath}`);
  }
});

// Make db available globally
global.db = db;

// CORS configuration for production
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://chalchitrafinal.vercel.app',
  FRONTEND_URL
].filter(Boolean);

console.log('Allowed CORS origins:', allowedOrigins);

// Middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Allow if origin is in list, or if no origin (same-origin/server request)
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // For same-origin requests or server-to-server
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'chalchitra-secret-key',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  proxy: true,
  cookie: {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_MS
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Ensure uploads directory exists before serving and using it for multer
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`✅ Created uploads directory: ${uploadsDir}`);
}
app.use('/uploads', express.static(uploadsDir));

// Check if client build exists before serving it - check multiple possible locations
const possibleBuildPaths = [
  path.join(__dirname, '..', 'client', 'build', 'index.html'), // Original location
  path.join(__dirname, '..', 'Chalchitra Website', 'client', 'build', 'index.html'), // Nested location
  path.join(__dirname, '..', '..', 'Chalchitra Website', 'client', 'build', 'index.html') // Alternative nested location
];

let clientBuildPath = possibleBuildPaths.find(p => fs.existsSync(p));
const clientBuildExists = !!clientBuildPath;
// Local development client URL (CRA dev server)
const DEV_CLIENT_URL = process.env.DEV_CLIENT_URL || 'http://localhost:3001';

if (!clientBuildPath) {
  clientBuildPath = possibleBuildPaths[0]; // Default to first path
}

if (clientBuildExists) {
  console.log('✅ React build found - serving frontend from server');
  const staticPath = path.dirname(clientBuildPath);
  app.use(express.static(staticPath));
} else {
  console.log('ℹ️ React build not found - using CRA dev server for frontend at', DEV_CLIENT_URL);
}

// Clear any cached auth module
delete require.cache[require.resolve('./routes/auth')];

// Initialize Google OAuth strategy after dotenv is loaded
require('./routes/auth').initializeGoogleStrategy();

// Clear cache again to ensure fresh load
delete require.cache[require.resolve('./routes/auth')];

// Routes - Load auth routes after dotenv is configured
console.log('🔗 Setting up API routes...');
app.use('/api/auth', require('./routes/auth'));
console.log('✅ Auth routes loaded');
app.use('/api/movies', require('./routes/movies'));
console.log('✅ Movies routes loaded');
app.use('/api/bookings', require('./routes/bookings'));
console.log('✅ Bookings routes loaded');
app.use('/api/payments', require('./routes/payments'));
console.log('✅ Payments routes loaded');
app.use('/api/admin', require('./routes/admin'));
console.log('✅ Admin routes loaded');
app.use('/api/feedback', require('./routes/feedback'));
console.log('✅ Feedback routes loaded');
app.use('/api/foods', require('./routes/foods'));
console.log('✅ Foods routes loaded');
app.use('/api/team', require('./routes/team'));
console.log('✅ Team routes loaded');
console.log('🎯 All API routes configured successfully');

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Catch all handler: serve React app if it exists, otherwise API error
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  // For static file requests (images, videos, etc.), return 404 instead of redirecting
  // This prevents infinite redirect loops when Vercel proxies to Render
  const staticExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg', '.mp4', '.webm', '.ico', '.css', '.js', '.map', '.woff', '.woff2', '.ttf', '.eot'];
  if (staticExtensions.some(ext => req.path.toLowerCase().endsWith(ext))) {
    return res.status(404).json({ error: 'File not found' });
  }
  if (clientBuildExists) {
    return res.sendFile(clientBuildPath);
  }
  // In production, redirect to frontend URL; in development, use CRA dev server
  const redirectUrl = process.env.FRONTEND_URL || DEV_CLIENT_URL;
  return res.redirect(redirectUrl + req.path);
});

// Global error handler for multer/upload errors
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.message || err);
  if (err.name === 'MulterError' || err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File upload error: ' + err.message });
  }
  res.status(500).json({ error: 'Internal server error: ' + (err.message || 'Unknown error') });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🚀 Server running on port ${PORT}                        ║
║                                                        ║
║   Local access:     http://localhost:${PORT}              ║
║   API endpoint:    http://localhost:${PORT}/api/*        ║
║   Health check:    http://localhost:${PORT}/health       ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
});
