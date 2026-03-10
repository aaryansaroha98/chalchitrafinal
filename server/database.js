// Database Configuration - SQLite for local, PostgreSQL for production
const path = require('path');
const fs = require('fs');

// Determine if we're using PostgreSQL (production) or SQLite (local)
const usePostgres = process.env.DATABASE_URL ? true : false;

let db;

if (usePostgres) {
  // PostgreSQL for production (Render)
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  console.log('📦 Connecting to PostgreSQL database...');

  // Create a wrapper that mimics SQLite's callback API
  db = {
    run: function (sql, params, callback) {
      // Convert SQLite syntax to PostgreSQL
      const pgSql = convertToPostgres(sql);
      const pgParams = Array.isArray(params) ? params : [];
      const cb = typeof params === 'function' ? params : callback;

      pool.query(pgSql, pgParams)
        .then(result => {
          if (cb) cb.call({ lastID: result.rows[0]?.id, changes: result.rowCount }, null);
        })
        .catch(err => {
          console.error('PostgreSQL error:', err.message, '\nSQL:', pgSql);
          if (cb) cb(err);
        });
    },
    get: function (sql, params, callback) {
      const pgSql = convertToPostgres(sql);
      const pgParams = Array.isArray(params) ? params : [];
      const cb = typeof params === 'function' ? params : callback;

      pool.query(pgSql, pgParams)
        .then(result => {
          if (cb) cb(null, result.rows[0]);
        })
        .catch(err => {
          console.error('PostgreSQL error:', err.message);
          if (cb) cb(err);
        });
    },
    all: function (sql, params, callback) {
      const pgSql = convertToPostgres(sql);
      const pgParams = Array.isArray(params) ? params : [];
      const cb = typeof params === 'function' ? params : callback;

      pool.query(pgSql, pgParams)
        .then(result => {
          if (cb) cb(null, result.rows);
        })
        .catch(err => {
          console.error('PostgreSQL error:', err.message);
          if (cb) cb(err);
        });
    },
    serialize: function (callback) {
      if (callback) callback();
    },
    close: function (callback) {
      pool.end().then(() => {
        if (callback) callback();
      });
    }
  };

  // Function to convert SQLite syntax to PostgreSQL
  function convertToPostgres(sql) {
    let pgSql = sql;

    // Convert SQLite date functions BEFORE replacing ? placeholders
    // datetime("now", "-7 days") or datetime('now', '-7 days') → NOW() - INTERVAL '7 days'
    pgSql = pgSql.replace(/datetime\s*\(\s*["']now["']\s*,\s*["']-(\d+)\s+(days?|months?|hours?|minutes?|years?)["']\s*\)/gi,
      (_, num, unit) => `(NOW() - INTERVAL '${num} ${unit}')`);
    // datetime("now") or datetime('now') → NOW()
    pgSql = pgSql.replace(/datetime\s*\(\s*["']now["']\s*\)/gi, 'NOW()');
    // strftime('%Y-%m', column) → TO_CHAR(column, 'YYYY-MM')
    pgSql = pgSql.replace(/strftime\s*\(\s*['"]%Y-%m['"]\s*,\s*(\w+)\s*\)/gi,
      (_, col) => `TO_CHAR(${col}, 'YYYY-MM')`);
    // strftime('%Y-%m-%d', column) → TO_CHAR(column, 'YYYY-MM-DD')
    pgSql = pgSql.replace(/strftime\s*\(\s*['"]%Y-%m-%d['"]\s*,\s*(\w+)\s*\)/gi,
      (_, col) => `TO_CHAR(${col}, 'YYYY-MM-DD')`);

    // Replace ? placeholders with $1, $2, etc.
    let paramIndex = 0;
    pgSql = pgSql.replace(/\?/g, () => `$${++paramIndex}`);
    // Replace AUTOINCREMENT with SERIAL (handled in CREATE TABLE)
    pgSql = pgSql.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY');
    pgSql = pgSql.replace(/INTEGER PRIMARY KEY/gi, 'SERIAL PRIMARY KEY');
    // Replace DATETIME with TIMESTAMP (but not in function calls already converted)
    pgSql = pgSql.replace(/\bDATETIME\b(?!\s*\()/gi, 'TIMESTAMP');
    // Replace REAL with DOUBLE PRECISION
    pgSql = pgSql.replace(/\bREAL\b/gi, 'DOUBLE PRECISION');

    // Convert INSERT OR IGNORE to INSERT ... ON CONFLICT DO NOTHING
    if (/INSERT\s+OR\s+IGNORE/i.test(pgSql)) {
      pgSql = pgSql.replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, 'INSERT INTO');
      // Remove any trailing semicolons/whitespace, then append ON CONFLICT DO NOTHING
      pgSql = pgSql.replace(/\s*;?\s*$/, ' ON CONFLICT DO NOTHING');
    }

    // Add RETURNING id to INSERT statements so this.lastID works
    if (/^\s*INSERT\s+INTO/i.test(pgSql) && !/RETURNING/i.test(pgSql) && !/ON CONFLICT DO NOTHING/i.test(pgSql)) {
      pgSql = pgSql.replace(/\s*;?\s*$/, ' RETURNING id');
    }

    return pgSql;
  }

  // Initialize PostgreSQL tables
  const initPostgres = async () => {
    console.log('🗄️  Initializing PostgreSQL schema...');

    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        google_id TEXT UNIQUE,
        email TEXT UNIQUE,
        name TEXT,
        is_admin INTEGER DEFAULT 0,
        code_scanner INTEGER DEFAULT 0,
        admin_tag TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS movies (
        id SERIAL PRIMARY KEY,
        title TEXT,
        description TEXT,
        poster_url TEXT,
        date TEXT,
        venue TEXT,
        price DOUBLE PRECISION,
        available_foods TEXT,
        category TEXT,
        duration TEXT,
        imdb_rating TEXT,
        language TEXT,
        is_upcoming INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        movie_id INTEGER,
        num_people INTEGER,
        food_option TEXT,
        coupon_code TEXT,
        total_price DOUBLE PRECISION,
        discount_amount DOUBLE PRECISION,
        payment_method TEXT,
        payment_id TEXT,
        payment_amount DOUBLE PRECISION,
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        movie_id INTEGER,
        rating INTEGER,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS team (
        id SERIAL PRIMARY KEY,
        name TEXT,
        student_id TEXT,
        photo_url TEXT,
        role TEXT,
        section TEXT DEFAULT 'current_team',
        scanner_access INTEGER DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS gallery (
        id SERIAL PRIMARY KEY,
        image_url TEXT,
        event_name TEXT,
        event_date DATE,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE,
        description TEXT,
        discount_type TEXT,
        discount_value DOUBLE PRECISION,
        min_purchase DOUBLE PRECISION DEFAULT 0,
        max_discount DOUBLE PRECISION,
        usage_limit INTEGER,
        used_count INTEGER DEFAULT 0,
        expiry_date TIMESTAMP,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS foods (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price DOUBLE PRECISION NOT NULL,
        category TEXT,
        image_url TEXT,
        is_available INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS email_history (
        id SERIAL PRIMARY KEY,
        email_type TEXT NOT NULL,
        recipient_email TEXT NOT NULL,
        recipient_name TEXT,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        sent_by INTEGER,
        status TEXT DEFAULT 'sent',
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS coupon_winners (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        coupon_code TEXT NOT NULL,
        discount_amount DOUBLE PRECISION NOT NULL,
        discount_type TEXT DEFAULT 'fixed',
        max_discount DOUBLE PRECISION,
        expiry_date TIMESTAMP,
        is_used INTEGER DEFAULT 0,
        used_at TIMESTAMP,
        sent_by INTEGER,
        shared_coupon_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS movie_foods (
        id SERIAL PRIMARY KEY,
        movie_id INTEGER NOT NULL,
        food_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(movie_id, food_id)
      )`,
      // Ensure unique constraint exists on movie_foods for ON CONFLICT DO NOTHING
      `CREATE UNIQUE INDEX IF NOT EXISTS movie_foods_movie_id_food_id_key ON movie_foods (movie_id, food_id)`,
      `CREATE TABLE IF NOT EXISTS booking_foods (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER NOT NULL,
        food_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS booking_food_status (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER NOT NULL,
        food_id INTEGER NOT NULL,
        quantity_given INTEGER NOT NULL DEFAULT 0,
        given_at TIMESTAMP,
        given_by INTEGER,
        UNIQUE(booking_id, food_id)
      )`,
      // Ensure unique constraint exists on booking_food_status for ON CONFLICT DO NOTHING
      `CREATE UNIQUE INDEX IF NOT EXISTS booking_food_status_booking_id_food_id_key ON booking_food_status (booking_id, food_id)`,
      `CREATE TABLE IF NOT EXISTS admin_permissions (
        id SERIAL PRIMARY KEY,
        admin_user_id INTEGER NOT NULL UNIQUE,
        allowed_tabs TEXT NOT NULL DEFAULT '{"dashboard": true, "movies": true, "bookings": true, "foods": true, "team": true, "gallery": true, "coupons": true, "coupon-winners": true, "feedback": true, "mail": true, "settings": true, "config": true}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS mail_settings (
        id INTEGER PRIMARY KEY,
        email_host TEXT NOT NULL DEFAULT 'smtp.gmail.com',
        email_port INTEGER DEFAULT 587,
        email_user TEXT,
        email_pass TEXT,
        sender_name TEXT DEFAULT 'Chalchitra IIT Jammu',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS razorpay_settings (
        id INTEGER PRIMARY KEY,
        key_id TEXT,
        key_secret TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const sql of tables) {
      try {
        await pool.query(sql);
        const tableMatch = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
        const indexMatch = sql.match(/CREATE UNIQUE INDEX IF NOT EXISTS (\w+)/);
        if (tableMatch) {
          console.log(`✅ ${tableMatch[1]} table ready`);
        } else if (indexMatch) {
          console.log(`✅ ${indexMatch[1]} index ready`);
        }
      } catch (err) {
        console.error('Schema creation error:', err.message);
      }
    }

    // Create indices
    try {
      await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_food_status_unique ON booking_food_status (booking_id, food_id)`);
      console.log('✅ Indices created');
    } catch (err) {
      // Index might already exist
    }

    // Ensure gallery.event_date column exists for older databases
    try {
      await pool.query('ALTER TABLE gallery ADD COLUMN IF NOT EXISTS event_date DATE');
      console.log('✅ gallery.event_date column ensured');
    } catch (err) {
      console.log('gallery.event_date ensure warning:', err.message);
    }

    // Ensure users.created_at column exists for older databases
    try {
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      console.log('✅ users.created_at column ensured');
    } catch (err) {
      console.log('users.created_at ensure warning:', err.message);
    }

    // Set AARYAN's join date and clean up other non-admin users
    try {
      await pool.query(`UPDATE users SET created_at = '2026-01-08T00:00:00.000Z' WHERE email = $1`, ['2025uee0154@iitjammu.ac.in']);
      console.log('✅ AARYAN join date set to 8 Jan 2026');
      // Delete non-essential users (keep only AARYAN and other admins)
      const deleteResult = await pool.query(`DELETE FROM users WHERE email != $1 AND email != 'chalchitra@iitjammu.ac.in' AND is_admin = 0`, ['2025uee0154@iitjammu.ac.in']);
      console.log(`✅ Cleaned up ${deleteResult.rowCount} non-admin users`);
    } catch (err) {
      console.log('User cleanup warning:', err.message);
    }

    // Create default admin user
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', ['2025uee0154@iitjammu.ac.in']);
      if (result.rows.length === 0) {
        await pool.query('INSERT INTO users (email, name, is_admin, code_scanner) VALUES ($1, $2, $3, $4)',
          ['2025uee0154@iitjammu.ac.in', 'Admin User', 1, 1]);
        console.log('✅ Admin user created');
      }
    } catch (err) {
      console.log('Admin user check error:', err.message);
    }

    console.log('🗄️  PostgreSQL initialization complete!');

    // Regenerate QR codes for bookings that are missing them (fixes previous lastID bug)
    try {
      const QRCode = require('qrcode');
      const missingQR = await pool.query('SELECT id, booking_code FROM bookings WHERE qr_code IS NULL');
      if (missingQR.rows.length > 0) {
        console.log(`🔧 Found ${missingQR.rows.length} bookings without QR codes, regenerating...`);
        for (const booking of missingQR.rows) {
          const qrData = {
            booking_id: booking.booking_code || String(booking.id),
            ticket_type: 'FREE_ENTRY_IITJAMMU',
            issued_by: 'Chalchitra IIT Jammu'
          };
          try {
            const qrDataURL = await QRCode.toDataURL(JSON.stringify(qrData));
            await pool.query('UPDATE bookings SET qr_code = $1 WHERE id = $2', [qrDataURL, booking.id]);
            console.log(`  ✅ Regenerated QR for booking ${booking.booking_code || booking.id}`);
          } catch (qrErr) {
            console.error(`  ❌ Failed to regenerate QR for booking ${booking.id}:`, qrErr.message);
          }
        }
      }
    } catch (err) {
      console.log('QR regeneration check skipped:', err.message);
    }
  };

  initPostgres().catch(console.error);

} else {
  // SQLite for local development
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

  // Auto-initialize database tables on startup
  db.serialize(() => {
    console.log('🗄️  Initializing SQLite schema...');

    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        google_id TEXT UNIQUE,
        email TEXT UNIQUE,
        name TEXT,
        is_admin INTEGER DEFAULT 0,
        code_scanner INTEGER DEFAULT 0,
        admin_tag TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
        event_date DATE,
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
      db.run(sql, function (err) {
        if (err) {
          console.log(`⚠️  ${tableName} table error:`, err.message);
        } else {
          console.log(`✅ ${tableName} table ready`);
        }
        completed++;
        if (completed === tables.length) {
          console.log('🗄️  SQLite initialization complete!');
          createIndices();
          createDefaultData();
        }
      });
    });
  });

  function createIndices() {
    console.log('🔧 Ensuring database indices...');
    const indices = [
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_food_status_unique ON booking_food_status (booking_id, food_id)`
    ];
    indices.forEach((sql) => {
      db.run(sql, function (err) {
        if (err) {
          console.log('⚠️  Index creation error:', err.message);
        } else {
          console.log('✅ Index ensured');
        }
      });
    });
  }

  function createDefaultData() {
    db.get('SELECT * FROM users WHERE email = ?', ['2025uee0154@iitjammu.ac.in'], (err, user) => {
      if (err) {
        console.log(`⚠️  Error checking admin user:`, err.message);
      } else if (!user) {
        db.run('INSERT INTO users (email, name, is_admin, code_scanner) VALUES (?, ?, ?, ?)',
          ['2025uee0154@iitjammu.ac.in', 'Admin User', 1, 1], function (err) {
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
}

// Export database object
module.exports = db;

