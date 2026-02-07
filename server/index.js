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
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath);

// Middleware
app.use((req, res, next) => {
  // Allow all origins for mobile testing
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
  secret: 'chalchitra-secret-key',
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Serve client build
app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

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
console.log('🎯 All API routes configured successfully');

// Catch all handler: send back React's index.html file for client-side routing
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} (accessible from all network interfaces)`);
  console.log(`Local access: http://localhost:${PORT}`);
  console.log(`Network access: http://172.18.8.146:${PORT}`);
  console.log(`ALSO TRY: http://YOUR_LOCAL_IP:${PORT} (find your IP with ifconfig/ipconfig)`);
});
