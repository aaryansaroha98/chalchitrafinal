// Database Configuration - Supports both SQLite (local) and PostgreSQL (production)
// Uses pg-sqlite adapter to maintain same API for all route files

const path = require('path');
const fs = require('fs');

// Check if we have PostgreSQL connection string
const usePostgres = process.env.DATABASE_URL && process.env.NODE_ENV === 'production';

let db;

if (usePostgres) {
  // PostgreSQL Setup with pg library directly
  console.log('🔄 Connecting to PostgreSQL database...');
  const { Pool } = require('pg');
  
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  db.on('connect', () => console.log('✅ PostgreSQL connected!'));
  db.on('error', (err) => console.error('❌ PostgreSQL error:', err));
  
  // Wrap pg to mimic sqlite3 API
  const sqlite3 = require('sqlite3').verbose();
  
  // Create wrapper that makes pg work like sqlite3
  db.run = function(sql, params, callback) {
    const cb = typeof params === 'function' ? params : callback;
    const values = Array.isArray(params) ? params : [];
    this.query(sql, values)
      .then(() => cb && cb(null))
      .catch(err => cb && cb(err));
  };
  
  db.get = function(sql, params, callback) {
    const cb = typeof params === 'function' ? params : callback;
    const values = Array.isArray(params) ? params : [];
    this.query(sql, values)
      .then(res => cb && cb(null, res.rows[0] || null))
      .catch(err => cb && cb(err, null));
  };
  
  db.all = function(sql, params, callback) {
    const cb = typeof params === 'function' ? params : callback;
    const values = Array.isArray(params) ? params : [];
    this.query(sql, values)
      .then(res => cb && cb(null, res.rows))
      .catch(err => cb && cb(err, []));
  };
  
  db.serialize = function(callback) {
    callback();
  };
  
} else {
  // SQLite Setup (for local development and production with persistent disk)
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'database.db');
  
  console.log(`📦 Connecting to SQLite database at: ${dbPath}`);
  
  // Ensure database directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`✅ Created database directory: ${dbDir}`);
  }
  
  db = new sqlite3.Database(dbPath);
  
  db.serialize(() => {
    console.log('✅ SQLite database connected!');
  });
}

// Export database object
module.exports = db;

// Auto-initialize database tables on startup
db.serialize(() => {
  console.log('🗄️  Initializing database schema...');
  
  // Use PostgreSQL syntax if connected to PostgreSQL, otherwise SQLite
  const idField = usePostgres ? 'id SERIAL PRIMARY KEY' : 'id INTEGER PRIMARY KEY AUTOINCREMENT';
  const integerType = usePostgres ? 'INTEGER' : 'INTEGER';
  const textType = usePostgres ? 'TEXT' : 'TEXT';
  const realType = usePostgres ? 'REAL' : 'REAL';
  const timestampDefault = usePostgres ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP';
  
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      ${idField},
      google_id ${textType} UNIQUE,
      email ${textType} UNIQUE,
      name ${textType},
      is_admin ${integerType} DEFAULT 0,
      code_scanner ${integerType} DEFAULT 0,
      admin_tag ${textType}
    )`,
    `CREATE TABLE IF NOT EXISTS movies (
      ${idField},
      title ${textType},
      description ${textType},
      poster_url ${textType},
      date ${textType},
      venue ${textType},
      price ${realType},
      available_foods ${textType},
      category ${textType},
      duration ${textType},
      imdb_rating ${textType},
      language ${textType},
      is_upcoming ${integerType} DEFAULT 1,
      created_at ${timestampDefault}
    )`,
    `CREATE TABLE IF NOT EXISTS bookings (
      ${idField},
      user_id ${integerType},
      movie_id ${integerType},
      num_people ${integerType},
      food_option ${textType},
      coupon_code ${textType},
      total_price ${realType},
      discount_amount ${realType},
      payment_method ${textType},
      payment_id ${textType},
      payment_amount ${realType},
      payment_order_id ${textType},
      payment_status ${textType},
      qr_code ${textType} UNIQUE,
      selected_seats ${textType},
      food_order ${textType},
      admitted_people ${integerType} DEFAULT 0,
      remaining_people ${integerType} DEFAULT 0,
      ticket_html ${textType},
      booking_code ${textType} UNIQUE,
      is_used ${integerType} DEFAULT 0,
      created_at ${timestampDefault}
    )`,
    `CREATE TABLE IF NOT EXISTS feedback (
      ${idField},
      user_id ${integerType},
      movie_id ${integerType},
      rating ${integerType},
      comment ${textType},
      created_at ${timestampDefault}
    )`,
    `CREATE TABLE IF NOT EXISTS team (
      ${idField},
      name ${textType},
      student_id ${textType},
      photo_url ${textType},
      role ${textType},
      section ${textType} DEFAULT 'current_team',
      scanner_access ${integerType} DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS gallery (
      ${idField},
      image_url ${textType},
      event_name ${textType},
      uploaded_at ${timestampDefault}
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      id ${integerType} PRIMARY KEY,
      tagline ${textType},
      hero_background ${textType},
      hero_background_image ${textType},
      hero_background_video ${textType},
      about_text ${textType},
      about_image ${textType},
      contact_head_name ${textType},
      contact_head_email ${textType}
    )`,
    `CREATE TABLE IF NOT EXISTS coupons (
      ${idField},
      code ${textType} UNIQUE,
      description ${textType},
      discount_type ${textType},
      discount_value ${realType},
      min_purchase ${realType} DEFAULT 0,
      max_discount ${realType},
      usage_limit ${integerType},
      used_count ${integerType} DEFAULT 0,
      expiry_date ${timestampDefault.replace('DEFAULT CURRENT_TIMESTAMP', '')},
      is_active ${integerType} DEFAULT 1,
      created_at ${timestampDefault},
      updated_at ${timestampDefault}
    )`,
    `CREATE TABLE IF NOT EXISTS foods (
      ${idField},
      name ${textType} NOT NULL,
      description ${textType},
      price ${realType} NOT NULL,
      category ${textType},
      image_url ${textType},
      is_available ${integerType} DEFAULT 1,
      created_at ${timestampDefault}
    )`,
    `CREATE TABLE IF NOT EXISTS email_history (
      ${idField},
      email_type ${textType} NOT NULL,
      recipient_email ${textType} NOT NULL,
      recipient_name ${textType},
      subject ${textType} NOT NULL,
      message ${textType} NOT NULL,
      sent_by ${integerType},
      status ${textType} DEFAULT 'sent',
      error_message ${textType},
      created_at ${timestampDefault}
    )`,
    `CREATE TABLE IF NOT EXISTS coupon_winners (
      ${idField},
      user_id ${integerType} NOT NULL,
      coupon_code ${textType} NOT NULL,
      discount_amount ${realType} NOT NULL,
      discount_type ${textType} DEFAULT 'fixed',
      max_discount ${realType},
      expiry_date ${timestampDefault.replace('DEFAULT CURRENT_TIMESTAMP', '')},
      is_used ${integerType} DEFAULT 0,
      used_at ${timestampDefault.replace('DEFAULT CURRENT_TIMESTAMP', '')},
      sent_by ${integerType},
      shared_coupon_id ${integerType},
      created_at ${timestampDefault}
    )`,
    `CREATE TABLE IF NOT EXISTS movie_foods (
      ${idField},
      movie_id ${integerType} NOT NULL,
      food_id ${integerType} NOT NULL,
      created_at ${timestampDefault}
    )`,
    `CREATE TABLE IF NOT EXISTS booking_foods (
      ${idField},
      booking_id ${integerType} NOT NULL,
      food_id ${integerType} NOT NULL,
      quantity ${integerType} NOT NULL DEFAULT 1,
      created_at ${timestampDefault}
    )`,
    `CREATE TABLE IF NOT EXISTS booking_food_status (
      ${idField},
      booking_id ${integerType} NOT NULL,
      food_id ${integerType} NOT NULL,
      quantity_given ${integerType} NOT NULL DEFAULT 0,
      given_at ${timestampDefault},
      given_by ${integerType}
    )`,
    `CREATE TABLE IF NOT EXISTS admin_permissions (
      ${idField},
      admin_user_id ${integerType} NOT NULL UNIQUE,
      allowed_tabs ${textType} NOT NULL DEFAULT '{"dashboard": true, "movies": true, "bookings": true, "foods": true, "team": true, "gallery": true, "coupons": true, "coupon-winners": true, "feedback": true, "mail": true, "settings": true, "config": true}',
      created_at ${timestampDefault},
      updated_at ${timestampDefault},
      created_by ${integerType}
    )`,
    `CREATE TABLE IF NOT EXISTS mail_settings (
      id ${integerType} PRIMARY KEY,
      email_host ${textType} NOT NULL DEFAULT 'smtp.gmail.com',
      email_port ${integerType} DEFAULT 587,
      email_user ${textType},
      email_pass ${textType},
      sender_name ${textType} DEFAULT 'Chalchitra IIT Jammu',
      created_at ${timestampDefault},
      updated_at ${timestampDefault}
    )`,
    `CREATE TABLE IF NOT EXISTS razorpay_settings (
      id ${integerType} PRIMARY KEY,
      key_id ${textType},
      key_secret ${textType},
      created_at ${timestampDefault},
      updated_at ${timestampDefault}
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
        createDefaultData();
      }
    });
  });
});

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

