const path = require('path');
const fs = require('fs');

// Load server-specific .env if it exists, otherwise fall back to root .env
const serverEnvPath = path.join(__dirname, '.env');
const rootEnvPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(serverEnvPath)) {
  require('dotenv').config({ path: serverEnvPath });
} else {
  require('dotenv').config({ path: rootEnvPath });
}

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup - Use environment variable path or default
const isProduction = process.env.NODE_ENV === 'production';
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'database.db');

console.log(`📦 Database path: ${dbPath}`);
console.log(`📦 Environment: ${isProduction ? 'Production' : 'Development'}`);

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

// Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
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
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Check if client build exists before serving it
const clientBuildPath = path.join(__dirname, '..', 'client', 'build', 'index.html');
const clientBuildExists = fs.existsSync(clientBuildPath);

if (clientBuildExists) {
  console.log('✅ React build found - serving frontend from server');
  app.use(express.static(path.join(__dirname, '..', 'client', 'build')));
} else {
  console.log('⚠️  React build not found - server will only serve API endpoints');
  console.log('   Deploy frontend to Netlify separately for free hosting');
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
  if (clientBuildExists) {
    res.sendFile(clientBuildPath);
  } else {
    res.status(404).json({ 
      error: 'Not found',
      message: 'Frontend not served from this server. Deploy to Netlify!',
      apiBase: '/api/*',
      healthCheck: '/health'
    });
  }
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
