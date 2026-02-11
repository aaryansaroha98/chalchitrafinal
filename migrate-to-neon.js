// Migration script to copy data from local SQLite to Neon PostgreSQL
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const NEON_URL = 'postgresql://neondb_owner:npg_o0AKY6USqanI@ep-dawn-sea-a10vzeg8-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString: NEON_URL,
  ssl: { rejectUnauthorized: false }
});

const sqliteDb = new sqlite3.Database(path.join(__dirname, 'database.db'));

// Helper to promisify sqlite3
const sqliteAll = (query) => new Promise((resolve, reject) => {
  sqliteDb.all(query, (err, rows) => {
    if (err) reject(err);
    else resolve(rows || []);
  });
});

async function migrate() {
  try {
    console.log('Connecting to Neon PostgreSQL...');
    const client = await pool.connect();
    console.log('Connected!');

    // Migrate movies
    console.log('\n📽️ Migrating movies...');
    const movies = await sqliteAll('SELECT * FROM movies');
    for (const movie of movies) {
      try {
        await client.query(`
          INSERT INTO movies (id, title, description, poster_url, date, venue, price, available_foods, category, duration, imdb_rating, language, is_upcoming, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            poster_url = EXCLUDED.poster_url,
            date = EXCLUDED.date,
            venue = EXCLUDED.venue,
            price = EXCLUDED.price,
            available_foods = EXCLUDED.available_foods,
            category = EXCLUDED.category,
            duration = EXCLUDED.duration,
            imdb_rating = EXCLUDED.imdb_rating,
            language = EXCLUDED.language,
            is_upcoming = EXCLUDED.is_upcoming
        `, [
          movie.id, movie.title, movie.description, movie.poster_url,
          movie.date, movie.venue, movie.price, movie.available_foods,
          movie.category, movie.duration, movie.imdb_rating, movie.language,
          movie.is_upcoming, movie.created_at
        ]);
        console.log(`  ✅ Movie: ${movie.title}`);
      } catch (err) {
        console.log(`  ❌ Movie ${movie.title}: ${err.message}`);
      }
    }

    // Migrate users
    console.log('\n👥 Migrating users...');
    const users = await sqliteAll('SELECT * FROM users');
    for (const user of users) {
      try {
        await client.query(`
          INSERT INTO users (id, google_id, email, name, is_admin, code_scanner, admin_tag)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE SET
            google_id = EXCLUDED.google_id,
            email = EXCLUDED.email,
            name = EXCLUDED.name,
            is_admin = EXCLUDED.is_admin,
            code_scanner = EXCLUDED.code_scanner,
            admin_tag = EXCLUDED.admin_tag
        `, [
          user.id, user.google_id, user.email, user.name,
          user.is_admin || 0, user.code_scanner || 0, user.admin_tag
        ]);
        console.log(`  ✅ User: ${user.email}`);
      } catch (err) {
        console.log(`  ❌ User ${user.email}: ${err.message}`);
      }
    }

    // Migrate foods
    console.log('\n🍿 Migrating foods...');
    const foods = await sqliteAll('SELECT * FROM foods');
    for (const food of foods) {
      try {
        await client.query(`
          INSERT INTO foods (id, name, description, price, image_url, is_available, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            price = EXCLUDED.price,
            image_url = EXCLUDED.image_url,
            is_available = EXCLUDED.is_available
        `, [
          food.id, food.name, food.description, food.price, 
          food.image_url, food.is_available, food.created_at
        ]);
        console.log(`  ✅ Food: ${food.name}`);
      } catch (err) {
        console.log(`  ❌ Food ${food.name}: ${err.message}`);
      }
    }

    // Migrate bookings
    console.log('\n🎟️ Migrating bookings...');
    const bookings = await sqliteAll('SELECT * FROM bookings');
    for (const booking of bookings) {
      try {
        await client.query(`
          INSERT INTO bookings (id, user_id, movie_id, num_people, food_option, coupon_code, total_price, discount_amount, payment_method, payment_id, payment_amount, payment_order_id, payment_status, qr_code, selected_seats, food_order, admitted_people, remaining_people, ticket_html, booking_code, is_used, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
          ON CONFLICT (id) DO NOTHING
        `, [
          booking.id, booking.user_id, booking.movie_id, booking.num_people,
          booking.food_option, booking.coupon_code, booking.total_price, booking.discount_amount,
          booking.payment_method, booking.payment_id, booking.payment_amount, booking.payment_order_id,
          booking.payment_status, booking.qr_code, booking.selected_seats, booking.food_order,
          booking.admitted_people || 0, booking.remaining_people || 0, booking.ticket_html,
          booking.booking_code, booking.is_used || 0, booking.created_at
        ]);
        console.log(`  ✅ Booking: ${booking.id}`);
      } catch (err) {
        console.log(`  ❌ Booking ${booking.id}: ${err.message}`);
      }
    }

    // Migrate settings
    console.log('\n⚙️ Migrating settings...');
    const settings = await sqliteAll('SELECT * FROM settings');
    for (const setting of settings) {
      try {
        await client.query(`
          UPDATE settings SET
            tagline = $1,
            hero_background = $2,
            hero_background_image = $3,
            hero_background_video = $4,
            about_text = $5,
            about_image = $6,
            contact_head_name = $7,
            contact_head_email = $8
          WHERE id = $9
        `, [
          setting.tagline, setting.hero_background, setting.hero_background_image,
          setting.hero_background_video, setting.about_text, setting.about_image,
          setting.contact_head_name, setting.contact_head_email, setting.id
        ]);
        console.log(`  ✅ Settings updated`);
      } catch (err) {
        console.log(`  ❌ Settings: ${err.message}`);
      }
    }

    // Migrate team
    console.log('\n👨‍💼 Migrating team...');
    const team = await sqliteAll('SELECT * FROM team');
    for (const member of team) {
      try {
        await client.query(`
          INSERT INTO team (id, name, student_id, photo_url, role, section, scanner_access)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            student_id = EXCLUDED.student_id,
            photo_url = EXCLUDED.photo_url,
            role = EXCLUDED.role,
            section = EXCLUDED.section,
            scanner_access = EXCLUDED.scanner_access
        `, [
          member.id, member.name, member.student_id, member.photo_url,
          member.role, member.section, member.scanner_access || 0
        ]);
        console.log(`  ✅ Team: ${member.name}`);
      } catch (err) {
        console.log(`  ❌ Team ${member.name}: ${err.message}`);
      }
    }

    // Migrate gallery
    console.log('\n🖼️ Migrating gallery...');
    const gallery = await sqliteAll('SELECT * FROM gallery');
    for (const item of gallery) {
      try {
        await client.query(`
          INSERT INTO gallery (id, image_url, event_name, uploaded_at)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id) DO UPDATE SET
            image_url = EXCLUDED.image_url,
            event_name = EXCLUDED.event_name
        `, [
          item.id, item.image_url, item.event_name, item.uploaded_at
        ]);
        console.log(`  ✅ Gallery: ${item.id}`);
      } catch (err) {
        console.log(`  ❌ Gallery ${item.id}: ${err.message}`);
      }
    }

    // Reset sequences
    console.log('\n🔄 Resetting sequences...');
    const tables = ['movies', 'users', 'foods', 'bookings', 'team', 'gallery'];
    for (const table of tables) {
      try {
        await client.query(`SELECT setval('${table}_id_seq', COALESCE((SELECT MAX(id) FROM ${table}), 0) + 1, false)`);
        console.log(`  ✅ ${table}_id_seq reset`);
      } catch (err) {
        // Sequence might not exist, that's okay
      }
    }

    client.release();
    console.log('\n✅ Migration complete!');
    
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
    sqliteDb.close();
  }
}

migrate();
