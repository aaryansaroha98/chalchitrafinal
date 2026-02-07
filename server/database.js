const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath);

  // Initialize database
  db.serialize(() => {
  // Check and add missing columns if they don't exist
    db.all(`PRAGMA table_info(users)`, (err, rows) => {
      if (!err) {
        const hasCodeScanner = rows.some(row => row.name === 'code_scanner');
        if (!hasCodeScanner) {
          db.run(`ALTER TABLE users ADD COLUMN code_scanner INTEGER DEFAULT 0`, (err) => {
            if (err) {
              console.error('Error adding code_scanner column:', err);
            } else {
              console.log('Successfully added code_scanner column to users table');
            }
          });
        }
        
        const hasAdminTag = rows.some(row => row.name === 'admin_tag');
        if (!hasAdminTag) {
          db.run(`ALTER TABLE users ADD COLUMN admin_tag TEXT`, (err) => {
            if (err) {
              console.error('Error adding admin_tag column:', err);
            } else {
              console.log('Successfully added admin_tag column to users table');
            }
          });
        }
      }
    });

    db.all(`PRAGMA table_info(team)`, (err, rows) => {
      if (!err) {
        const hasScannerAccess = rows.some(row => row.name === 'scanner_access');
        if (!hasScannerAccess) {
          db.run(`ALTER TABLE team ADD COLUMN scanner_access INTEGER DEFAULT 0`, (err) => {
            if (err) {
              console.error('Error adding scanner_access column:', err);
            } else {
              console.log('Successfully added scanner_access column to team table');
            }
          });
        }

        const hasSection = rows.some(row => row.name === 'section');
        if (!hasSection) {
          db.run(`ALTER TABLE team ADD COLUMN section TEXT DEFAULT 'current_team'`, (err) => {
            if (err) {
              console.error('Error adding section column:', err);
            } else {
              console.log('Successfully added section column to team table');
            }
          });
        }
      }
    });

    // Check and add hero_background_video column to settings table
    db.all(`PRAGMA table_info(settings)`, (err, rows) => {
      if (!err) {
        const hasHeroVideo = rows.some(row => row.name === 'hero_background_video');
        if (!hasHeroVideo) {
          db.run(`ALTER TABLE settings ADD COLUMN hero_background_video TEXT`, (err) => {
            if (err) {
              console.error('Error adding hero_background_video column:', err);
            } else {
              console.log('Successfully added hero_background_video column to settings table');
            }
          });
        }
      }
    });

    // Check and add missing columns to movies table
    db.all(`PRAGMA table_info(movies)`, (err, rows) => {
      if (!err) {
        const hasAvailableFoods = rows.some(row => row.name === 'available_foods');
        if (!hasAvailableFoods) {
          db.run(`ALTER TABLE movies ADD COLUMN available_foods TEXT`, (err) => {
            if (err) {
              console.error('Error adding available_foods column:', err);
            } else {
              console.log('Successfully added available_foods column to movies table');
            }
          });
        }

        const hasCategory = rows.some(row => row.name === 'category');
        if (!hasCategory) {
          db.run(`ALTER TABLE movies ADD COLUMN category TEXT`, (err) => {
            if (err) {
              console.error('Error adding category column:', err);
            } else {
              console.log('Successfully added category column to movies table');
            }
          });
        }

        const hasDuration = rows.some(row => row.name === 'duration');
        if (!hasDuration) {
          db.run(`ALTER TABLE movies ADD COLUMN duration TEXT`, (err) => {
            if (err) {
              console.error('Error adding duration column:', err);
            } else {
              console.log('Successfully added duration column to movies table');
            }
          });
        }

        const hasImdbRating = rows.some(row => row.name === 'imdb_rating');
        if (!hasImdbRating) {
          db.run(`ALTER TABLE movies ADD COLUMN imdb_rating TEXT`, (err) => {
            if (err) {
              console.error('Error adding imdb_rating column:', err);
            } else {
              console.log('Successfully added imdb_rating column to movies table');
            }
          });
        }

        const hasLanguage = rows.some(row => row.name === 'language');
        if (!hasLanguage) {
          db.run(`ALTER TABLE movies ADD COLUMN language TEXT`, (err) => {
            if (err) {
              console.error('Error adding language column:', err);
            } else {
              console.log('Successfully added language column to movies table');
            }
          });
        }
      }
    });

    // Check and add selected_seats column to bookings table
    db.all(`PRAGMA table_info(bookings)`, (err, rows) => {
      if (!err) {
        const hasSelectedSeats = rows.some(row => row.name === 'selected_seats');
        if (!hasSelectedSeats) {
          db.run(`ALTER TABLE bookings ADD COLUMN selected_seats TEXT`, (err) => {
            if (err) {
              console.error('Error adding selected_seats column:', err);
            } else {
              console.log('Successfully added selected_seats column to bookings table');
            }
          });
        }

        // Add partial scanning columns
        const hasAdmittedPeople = rows.some(row => row.name === 'admitted_people');
        if (!hasAdmittedPeople) {
          db.run(`ALTER TABLE bookings ADD COLUMN admitted_people INTEGER DEFAULT 0`, (err) => {
            if (err) {
              console.error('Error adding admitted_people column:', err);
            } else {
              console.log('Successfully added admitted_people column to bookings table');
            }
          });
        }

        const hasRemainingPeople = rows.some(row => row.name === 'remaining_people');
        if (!hasRemainingPeople) {
          db.run(`ALTER TABLE bookings ADD COLUMN remaining_people INTEGER DEFAULT 0`, (err) => {
            if (err) {
              console.error('Error adding remaining_people column:', err);
            } else {
              console.log('Successfully added remaining_people column to bookings table');
            }
          });
        }

        const hasTicketHtml = rows.some(row => row.name === 'ticket_html');
        if (!hasTicketHtml) {
          db.run(`ALTER TABLE bookings ADD COLUMN ticket_html TEXT`, (err) => {
            if (err) {
              console.error('Error adding ticket_html column:', err);
            } else {
              console.log('Successfully added ticket_html column to bookings table');
            }
          });
        }

        // Add booking_code column for custom 8-character IDs
        const hasBookingCode = rows.some(row => row.name === 'booking_code');
        if (!hasBookingCode) {
          db.run(`ALTER TABLE bookings ADD COLUMN booking_code TEXT`, (err) => {
            if (err) {
              console.error('Error adding booking_code column:', err);
            } else {
              console.log('Successfully added booking_code column to bookings table');
              // Now create an index for uniqueness (SQLite workaround)
              db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_code ON bookings(booking_code)`, (indexErr) => {
                if (indexErr) {
                  console.error('Error creating unique index for booking_code:', indexErr);
                } else {
                  console.log('Successfully created unique index for booking_code');
                }
              });
            }
          });
        }
      }
    });
  // Users table (for sessions, etc.)
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_id TEXT UNIQUE,
    email TEXT UNIQUE,
    name TEXT,
    is_admin INTEGER DEFAULT 0,
    code_scanner INTEGER DEFAULT 0
  )`);

  // Movies table
  db.run(`CREATE TABLE IF NOT EXISTS movies (
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
  )`);

  // Bookings table
  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    movie_id INTEGER,
    num_people INTEGER,
    food_option TEXT,
    coupon_code TEXT,
    total_price REAL,
    qr_code TEXT UNIQUE,
    selected_seats TEXT,
    is_used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (movie_id) REFERENCES movies(id)
  )`);

  // Feedback table
  db.run(`CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    movie_id INTEGER,
    rating INTEGER,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (movie_id) REFERENCES movies(id)
  )`);

  // Team table
  db.run(`CREATE TABLE IF NOT EXISTS team (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    student_id TEXT,
    photo_url TEXT,
    role TEXT,
    section TEXT DEFAULT 'current_team',
    scanner_access INTEGER DEFAULT 0
  )`);

  // Gallery table
  db.run(`CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_url TEXT,
    event_name TEXT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Settings table
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY,
    tagline TEXT,
    hero_background TEXT,
    hero_background_image TEXT,
    hero_background_video TEXT,
    about_text TEXT,
    about_image TEXT
  )`);

  // Coupons table
  db.run(`CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    description TEXT,
    discount_type TEXT CHECK(discount_type IN ('percentage', 'fixed')),
    discount_value REAL,
    min_purchase REAL DEFAULT 0,
    max_discount REAL,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    expiry_date DATETIME,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Email history table
  db.run(`CREATE TABLE IF NOT EXISTS email_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email_type TEXT NOT NULL, -- 'single', 'bulk', 'custom', 'booking'
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    sent_by INTEGER, -- admin user ID who sent the email
    status TEXT DEFAULT 'sent', -- 'sent', 'failed', 'pending'
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sent_by) REFERENCES users(id)
  )`);

  // Coupon winners table
  db.run(`CREATE TABLE IF NOT EXISTS coupon_winners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    coupon_code TEXT NOT NULL,
    discount_amount REAL NOT NULL,
    discount_type TEXT DEFAULT 'fixed', -- 'fixed' or 'percentage'
    max_discount REAL, -- for percentage discounts
    expiry_date DATETIME,
    is_used INTEGER DEFAULT 0,
    used_at DATETIME,
    sent_by INTEGER, -- admin who sent the coupon
    shared_coupon_id INTEGER, -- links to coupons table for shared coupons
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (sent_by) REFERENCES users(id),
    FOREIGN KEY (shared_coupon_id) REFERENCES coupons(id)
  )`);

  // Foods table
  db.run(`CREATE TABLE IF NOT EXISTS foods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    category TEXT, -- 'coffee', 'popcorn', 'chips', 'cold_drink', 'other'
    image_url TEXT,
    is_available INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Movie foods table (linking movies to available foods)
  db.run(`CREATE TABLE IF NOT EXISTS movie_foods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id INTEGER NOT NULL,
    food_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (movie_id) REFERENCES movies(id),
    FOREIGN KEY (food_id) REFERENCES foods(id),
    UNIQUE(movie_id, food_id)
  )`);

  // Booking foods table (storing food orders for each booking)
  db.run(`CREATE TABLE IF NOT EXISTS booking_foods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    food_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (food_id) REFERENCES foods(id)
  )`);

  // Booking food status table (tracking which food items have been given)
  db.run(`CREATE TABLE IF NOT EXISTS booking_food_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    food_id INTEGER NOT NULL,
    quantity_given INTEGER NOT NULL DEFAULT 0,
    given_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    given_by INTEGER, -- user ID who marked it as given
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (food_id) REFERENCES foods(id),
    UNIQUE(booking_id, food_id)
  )`);

  // Admin permissions table - stores which tabs each admin can access
  db.run(`CREATE TABLE IF NOT EXISTS admin_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_user_id INTEGER NOT NULL UNIQUE,
    allowed_tabs TEXT NOT NULL DEFAULT '["dashboard", "movies", "bookings", "foods", "team", "gallery", "coupons", "coupon-winners", "feedback", "mail", "settings", "config"]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER, -- user who granted these permissions
    FOREIGN KEY (admin_user_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  )`);

  // Mail settings table - stores SMTP configuration
  db.run(`CREATE TABLE IF NOT EXISTS mail_settings (
    id INTEGER PRIMARY KEY,
    email_host TEXT NOT NULL DEFAULT 'smtp.gmail.com',
    email_port INTEGER DEFAULT 587,
    email_user TEXT,
    email_pass TEXT,
    sender_name TEXT DEFAULT 'Chalchitra IIT Jammu',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // All available admin tabs
  const ADMIN_TABS = [
    'dashboard',
    'movies',
    'foods',
    'bookings',
    'users',
    'team',
    'gallery',
    'coupons',
    'coupon-winners',
    'feedback',
    'mail',
    'settings',
    'config'
  ];
  
  // Make ADMIN_TABS available globally
  global.ADMIN_TABS = ADMIN_TABS;

  // Add food_order column to bookings table for storing ordered food items
  db.all(`PRAGMA table_info(bookings)`, (err, rows) => {
    if (!err) {
      const hasFoodOrder = rows.some(row => row.name === 'food_order');
      if (!hasFoodOrder) {
        db.run(`ALTER TABLE bookings ADD COLUMN food_order TEXT`, (err) => {
          if (err) {
            console.error('Error adding food_order column:', err);
          } else {
            console.log('Successfully added food_order column to bookings table');
          }
        });
      }
    }
  });

  // Check and add shared_coupon_id column if it doesn't exist
  db.all(`PRAGMA table_info(coupon_winners)`, (err, rows) => {
    if (!err) {
      const hasSharedCouponId = rows.some(row => row.name === 'shared_coupon_id');
      if (!hasSharedCouponId) {
        db.run(`ALTER TABLE coupon_winners ADD COLUMN shared_coupon_id INTEGER REFERENCES coupons(id)`, (err) => {
          if (err) {
            console.error('Error adding shared_coupon_id column to coupon_winners table:', err);
          } else {
            console.log('Successfully added shared_coupon_id column to coupon_winners table');
          }
        });
      }
    }
  });

  // Add admin user 2025uee0154@iitjammu.ac.in
  db.get('SELECT * FROM users WHERE email = ?', ['2025uee0154@iitjammu.ac.in'], (err, user) => {
    if (err) {
      console.error('Error checking for admin user:', err);
    } else if (!user) {
      // Insert admin user
      db.run('INSERT INTO users (email, name, is_admin, code_scanner) VALUES (?, ?, ?, ?)',
        ['2025uee0154@iitjammu.ac.in', 'Admin User', 1, 1], function(err) {
          if (err) {
            console.error('Error creating admin user:', err);
          } else {
            console.log('✅ Admin user created: 2025uee0154@iitjammu.ac.in');
          }
        });
    } else {
      console.log('Admin user already exists: 2025uee0154@iitjammu.ac.in');
    }
  });
});

module.exports = db;
