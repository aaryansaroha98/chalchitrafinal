// Database Configuration - SQLite only for local development
const path = require('path');
const fs = require('fs');

const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, '..', 'database.db');

console.log(`📦 Connecting to SQLite database at: ${dbPath}`);

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`✅ Created database directory: ${dbDir}`);
}

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('✅ SQLite database connected!');
});

// Export database object
module.exports = db;

// Auto-initialize database tables on startup
db.serialize(() => {
  console.log('🗄️  Initializing database schema...');

  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      google_id TEXT UNIQUE,
      email TEXT UNIQUE,
      name TEXT,
      is_admin INTEGER DEFAULT 0,
      code_scanner INTEGER DEFAULT 0,
      admin_tag TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      poster_url TEXT,
      date TEXT,
      venue TEXT,
      price REAL,
      available_foods TEXT,
      category TEXT,
      duration TEXT,
      imdb_rating TEXT,
      language TEXT,
      is_upcoming INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      movie_id INTEGER,
      num_people INTEGER,
      food_option TEXT,
      coupon_code TEXT,
      total_price REAL,
      discount_amount REAL,
      payment_method TEXT,
      payment_id TEXT,
      payment_amount REAL,
      payment_order_id TEXT,
      payment_status TEXT,
      qr_code TEXT UNIQUE,
      selected_seats TEXT,
      food_order TEXT,
      admitted_people INTEGER DEFAULT 0,
      remaining_people INTEGER DEFAULT 0,
      ticket_html TEXT,
      booking_code TEXT UNIQUE,
      is_used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      movie_id INTEGER,
      rating INTEGER,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS team (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      student_id TEXT,
      photo_url TEXT,
      role TEXT,
      section TEXT DEFAULT 'current_team',
      scanner_access INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_url TEXT,
      event_name TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      tagline TEXT,
      hero_background TEXT,
      hero_background_image TEXT,
      hero_background_video TEXT,
      about_text TEXT,
      about_image TEXT,
      contact_head_name TEXT,
      contact_head_email TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      description TEXT,
      discount_type TEXT,
      discount_value REAL,
      min_purchase REAL DEFAULT 0,
      max_discount REAL,
      usage_limit INTEGER,
      used_count INTEGER DEFAULT 0,
      expiry_date DATETIME,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS foods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      category TEXT,
      image_url TEXT,
      is_available INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS email_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email_type TEXT NOT NULL,
      recipient_email TEXT NOT NULL,
      recipient_name TEXT,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      sent_by INTEGER,
      status TEXT DEFAULT 'sent',
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS coupon_winners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      coupon_code TEXT NOT NULL,
      discount_amount REAL NOT NULL,
      discount_type TEXT DEFAULT 'fixed',
      max_discount REAL,
      expiry_date DATETIME,
      is_used INTEGER DEFAULT 0,
      used_at DATETIME,
      sent_by INTEGER,
      shared_coupon_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS movie_foods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movie_id INTEGER NOT NULL,
      food_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS booking_foods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      food_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS booking_food_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      food_id INTEGER NOT NULL,
      quantity_given INTEGER NOT NULL DEFAULT 0,
      given_at DATETIME,
      given_by INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS admin_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_user_id INTEGER NOT NULL UNIQUE,
      allowed_tabs TEXT NOT NULL DEFAULT '{"dashboard": true, "movies": true, "bookings": true, "foods": true, "team": true, "gallery": true, "coupons": true, "coupon-winners": true, "feedback": true, "mail": true, "settings": true, "config": true}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS mail_settings (
      id INTEGER PRIMARY KEY,
      email_host TEXT NOT NULL DEFAULT 'smtp.gmail.com',
      email_port INTEGER DEFAULT 587,
      email_user TEXT,
      email_pass TEXT,
      sender_name TEXT DEFAULT 'Chalchitra IIT Jammu',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS razorpay_settings (
      id INTEGER PRIMARY KEY,
      key_id TEXT,
      key_secret TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  let completed = 0;
  tables.forEach(sql => {
    const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)[1];
    db.run(sql, function(err) {
      if (err) {
        console.log(`⚠️  ${tableName} table error:`, err.message);
      } else {
        console.log(`✅ ${tableName} table ready`);
      }
      completed++;
      if (completed === tables.length) {
        console.log('🗄️  Database initialization complete!');
        createIndices();
        createDefaultData();
      }
    });
  });
});

function createIndices() {
  console.log('🔧 Ensuring database indices...');
  const indices = [
    // Ensure UPSERT works for booking_food_status on (booking_id, food_id)
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_food_status_unique ON booking_food_status (booking_id, food_id)`
  ];
  indices.forEach((sql) => {
    db.run(sql, function(err) {
      if (err) {
        console.log('⚠️  Index creation error:', err.message);
      } else {
        console.log('✅ Index ensured:', sql.split(' ON ')[0].replace('CREATE ', ''));
      }
    });
  });
}

function createDefaultData() {
  // Add admin user if not exists
  db.get('SELECT * FROM users WHERE email = ?', ['2025uee0154@iitjammu.ac.in'], (err, user) => {
    if (err) {
      console.log(`⚠️  Error checking admin user:`, err.message);
    } else if (!user) {
      db.run('INSERT INTO users (email, name, is_admin, code_scanner) VALUES (?, ?, ?, ?)',
        ['2025uee0154@iitjammu.ac.in', 'Admin User', 1, 1], function(err) {
          if (err) {
            console.log(`⚠️  Admin user creation:`, err.message);
          } else {
            console.log(`✅ Admin user created: 2025uee0154@iitjammu.ac.in`);
          }
        });
    } else {
      console.log(`✅ Admin user exists: 2025uee0154@iitjammu.ac.in`);
    }
  });
}

