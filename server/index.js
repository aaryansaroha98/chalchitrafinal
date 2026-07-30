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
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const appDb = require('./database');
const DatabaseSessionStore = require('./sessionStore');

const app = express();
const PORT = process.env.PORT || 3000;

// Disable ETag for dynamic responses so the API never returns 304 Not Modified.
// (Static assets served via express.static keep their own ETag/caching.)
app.disable('etag');
const SESSION_MAX_AGE_MS = Number(process.env.SESSION_MAX_AGE_MS) || (30 * 24 * 60 * 60 * 1000); // 30 days

// Trust proxy - required when behind Vercel/Render proxies for secure cookies
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// Prevent browsers (especially Safari, which caches heuristically when no
// Cache-Control is present) from serving stale API data. Movie lists are
// time-sensitive (filtered by "date >= now"), so they must never be cached.
// NOTE: rate limiting is defined further down, AFTER the session/passport
// middleware, so it can key on the logged-in student's identity instead of a
// shared campus IP. See the "Rate limiting" block below.
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

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

// CORS configuration
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://chalchitrafinal.vercel.app',
  FRONTEND_URL
].filter(Boolean);

console.log('Allowed CORS origins:', allowedOrigins);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
const sessionStore = new DatabaseSessionStore(appDb, {
  ttlMs: SESSION_MAX_AGE_MS,
  cleanupIntervalMs: 15 * 60 * 1000
});
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'chalchitra-secret-key',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  proxy: true,
  cookie: {
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_MS
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// ---------------------------------------------------------------------------
// Rate limiting (identity-aware) — MUST come after session + passport so we
// can see WHO is making the request.
//
// The problem this solves:
//   * Production path is Browser → Vercel → Render (two proxies).
//   * The whole college shares ONE public IP via NAT (campus WiFi + mobile
//     hotspots), so hundreds of students look like a single client.
//   * The old limiter keyed on IP → the entire campus drew from ONE bucket and
//     everyone got "Too many requests" / "failed to load movie".
//
// The fix:
//   * Logged-in students are keyed by their USER ID → every student gets their
//     own private budget no matter whose WiFi they're on. This is the case
//     that matters for the actual movie-booking traffic.
//   * Anonymous visitors (before login) can only be keyed by IP, so the whole
//     campus may share that bucket — we therefore give the anonymous/IP bucket
//     a very high ceiling so it acts purely as flood protection, never as a
//     per-person limit. Public pages (home / movie lists) load fine for all.
const { ipKeyGenerator } = rateLimit;

// Real client IP: leftmost X-Forwarded-For entry (edge proxies prepend it),
// normalized for IPv6 via ipKeyGenerator (required by express-rate-limit v7+).
const realClientIp = (req) => {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) {
    const first = xff.split(',')[0].trim();
    if (first) return ipKeyGenerator(first);
  }
  return ipKeyGenerator(req.ip || (req.socket && req.socket.remoteAddress) || 'unknown');
};

// Stable per-request identity: prefer the authenticated user, fall back to the
// temporary-login session user, else the shared IP. Admins are flagged so they
// get a much higher ceiling — they legitimately fire bursts (bulk coin grants,
// ticket scanning) that would otherwise look like abuse.
const identityOf = (req) => {
  const user = req.user || (req.session && req.session.adminUser) || null;
  const uid = user && user.id;
  const isAdmin = !!(user && user.is_admin);
  return uid ? { key: `user:${uid}`, authed: true, admin: isAdmin }
             : { key: `ip:${realClientIp(req)}`, authed: false, admin: false };
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // Admins: a very high ceiling so bulk actions (coin grants, ticket scanning)
  // never trip the limiter — they're trusted operators, not a flood risk.
  // Per logged-in student: a generous personal budget. Anonymous/shared-IP: a
  // very high ceiling that a whole campus browsing won't realistically hit, so
  // it only ever stops a genuine flood/DoS — never normal viewing.
  max: (req) => {
    const id = identityOf(req);
    if (id.admin) return 100000;
    return id.authed ? 1500 : 20000;
  },
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => identityOf(req).key,
  skip: (req) => req.method === 'OPTIONS', // never count CORS preflight
});
app.use('/api', apiLimiter);

// Stricter limiter for AUTHENTICATION ATTEMPTS only (Google OAuth start /
// temporary email login). Keyed by IP because the user isn't logged in yet —
// but the ceiling is high enough that an entire campus starting Google login
// from one shared IP won't trip it. This was the exact endpoint throwing 429
// in the wild (/api/auth/google). It must NOT cover /api/auth/current_user,
// which every page load calls — that stays on the generous apiLimiter above.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000, // login STARTS per 15 min from a shared campus IP — flood guard only
  message: { error: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `ip:${realClientIp(req)}`,
  skip: (req) => req.method === 'OPTIONS',
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/google', authLimiter);

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
app.use('/api/admin', require('./routes/admin'));
console.log('✅ Admin routes loaded');
app.use('/api/feedback', require('./routes/feedback'));
console.log('✅ Feedback routes loaded');
app.use('/api/foods', require('./routes/foods'));
console.log('✅ Foods routes loaded');
app.use('/api/team', require('./routes/team'));
console.log('✅ Team routes loaded');
app.use('/api/coins', require('./routes/coins'));
console.log('✅ Coins routes loaded');
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
  if (err.name === 'MulterError' || err.code?.startsWith('LIMIT_') || err.message?.includes('Invalid file type')) {
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
