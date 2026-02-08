
/**
 * Database Setup Script for PostgreSQL
 * Run this ONCE to create tables and seed initial data
 */

require('dotenv').config();

const { Sequelize, DataTypes } = require('sequelize');

// Connect to PostgreSQL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function setupDatabase() {
  console.log('🔄 Connecting to PostgreSQL...');
  
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL!');
  } catch (error) {
    console.error('❌ Unable to connect:', error);
    process.exit(1);
  }

  console.log('📦 Creating tables...');

  // Define Models (same as SQLite schema)
  
  const User = sequelize.define('User', {
    google_id: { type: DataTypes.STRING, unique: true },
    email: { type: DataTypes.STRING, unique: true },
    name: DataTypes.STRING,
    is_admin: { type: DataTypes.INTEGER, defaultValue: 0 },
    code_scanner: { type: DataTypes.INTEGER, defaultValue: 0 },
    admin_tag: DataTypes.TEXT
  }, { tableName: 'users', timestamps: false });

  const Movie = sequelize.define('Movie', {
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    poster_url: DataTypes.STRING,
    date: DataTypes.STRING,
    venue: DataTypes.STRING,
    price: DataTypes.FLOAT,
    available_foods: DataTypes.TEXT,
    category: DataTypes.STRING,
    duration: DataTypes.STRING,
    imdb_rating: DataTypes.STRING,
    language: DataTypes.STRING,
    is_upcoming: { type: DataTypes.INTEGER, defaultValue: 1 }
  }, { tableName: 'movies', timestamps: false });

  const Booking = sequelize.define('Booking', {
    user_id: DataTypes.INTEGER,
    movie_id: DataTypes.INTEGER,
    num_people: DataTypes.INTEGER,
    food_option: DataTypes.TEXT,
    coupon_code: DataTypes.TEXT,
    total_price: DataTypes.FLOAT,
    discount_amount: { type: DataTypes.FLOAT, defaultValue: 0 },
    payment_method: DataTypes.TEXT,
    payment_id: DataTypes.TEXT,
    payment_amount: DataTypes.FLOAT,
    payment_order_id: DataTypes.TEXT,
    payment_status: DataTypes.TEXT,
    qr_code: { type: DataTypes.STRING, unique: true },
    selected_seats: DataTypes.TEXT,
    food_order: DataTypes.TEXT,
    is_used: { type: DataTypes.INTEGER, defaultValue: 0 }
  }, { tableName: 'bookings', timestamps: false });

  const Team = sequelize.define('Team', {
    name: DataTypes.STRING,
    student_id: DataTypes.STRING,
    photo_url: DataTypes.STRING,
    role: DataTypes.STRING,
    section: { type: DataTypes.TEXT, defaultValue: 'current_team' },
    scanner_access: { type: DataTypes.INTEGER, defaultValue: 0 }
  }, { tableName: 'team', timestamps: false });

  const Gallery = sequelize.define('Gallery', {
    image_url: DataTypes.STRING,
    event_name: DataTypes.STRING
  }, { tableName: 'gallery', timestamps: false });

  const Settings = sequelize.define('Settings', {
    tagline: DataTypes.TEXT,
    hero_background: DataTypes.TEXT,
    hero_background_image: DataTypes.TEXT,
    hero_background_video: DataTypes.TEXT,
    about_text: DataTypes.TEXT,
    about_image: DataTypes.TEXT,
    contact_head_name: DataTypes.TEXT,
    contact_head_email: DataTypes.TEXT
  }, { tableName: 'settings', timestamps: false, id: { type: DataTypes.INTEGER, primaryKey: true, defaultValue: 1 } });

  const Feedback = sequelize.define('Feedback', {
    user_id: DataTypes.INTEGER,
    movie_id: DataTypes.INTEGER,
    rating: DataTypes.INTEGER,
    comment: DataTypes.TEXT
  }, { tableName: 'feedback', timestamps: false });

  const Coupon = sequelize.define('Coupon', {
    code: { type: DataTypes.STRING, unique: true },
    description: DataTypes.TEXT,
    discount_type: DataTypes.TEXT,
    discount_value: DataTypes.FLOAT,
    min_purchase: { type: DataTypes.FLOAT, defaultValue: 0 },
    max_discount: DataTypes.FLOAT,
    usage_limit: DataTypes.INTEGER,
    used_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    expiry_date: DataTypes.DATE,
    is_active: { type: DataTypes.INTEGER, defaultValue: 1 }
  }, { tableName: 'coupons', timestamps: false });

  const Food = sequelize.define('Food', {
    name: { type: DataTypes.STRING, allowNull: false },
    description: DataTypes.TEXT,
    price: { type: DataTypes.FLOAT, allowNull: false },
    category: DataTypes.TEXT,
    image_url: DataTypes.TEXT,
    is_available: { type: DataTypes.INTEGER, defaultValue: 1 }
  }, { tableName: 'foods', timestamps: false });

  console.log('🔨 Syncing tables...');

  // Sync all models (create tables)
  await sequelize.sync({ force: true }); // force: true will drop existing tables
  console.log('✅ All tables created!');

  // Seed Data
  console.log('🌱 Seeding initial data...');

  // Create Admin User
  await User.create({
    email: '2025uee0154@iitjammu.ac.in',
    name: 'Admin User',
    is_admin: 1,
    code_scanner: 1
  });
  console.log('✅ Admin user created');

  // Create Settings
  await Settings.create({
    id: 1,
    tagline: 'IIT Jammu\'s Official Cinema Club',
    about_text: 'Chalchitra is the official cinema club of IIT Jammu. We organize movie screenings, film festivals, and cinema-related events for the IIT Jammu community.',
    about_image: '/about-image.jpg',
    contact_head_name: 'Contact Head Name',
    contact_head_email: 'contact@chalchitra.com',
    hero_background: 'color',
    hero_background_image: '/hero-bg.jpg'
  });
  console.log('✅ Settings created');

  // Create Sample Movies
  const movies = [
    {
      title: 'Inception',
      description: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.',
      poster_url: '/placeholder-movie.jpg',
      date: '2025-01-20',
      venue: 'LT-1',
      price: 150,
      category: 'Sci-Fi',
      duration: '2h 28m',
      imdb_rating: '8.8',
      language: 'English',
      is_upcoming: 1
    },
    {
      title: 'The Dark Knight',
      description: 'When the menace known as the Joker wreaks havoc on Gotham, Batman must accept one of the greatest psychological tests of his ability to fight injustice.',
      poster_url: '/placeholder-movie.jpg',
      date: '2025-01-25',
      venue: 'LT-1',
      price: 150,
      category: 'Action',
      duration: '2h 32m',
      imdb_rating: '9.0',
      language: 'English',
      is_upcoming: 1
    },
    {
      title: 'Interstellar',
      description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
      poster_url: '/placeholder-movie.jpg',
      date: '2025-02-01',
      venue: 'LT-2',
      price: 150,
      category: 'Sci-Fi',
      duration: '2h 49m',
      imdb_rating: '8.6',
      language: 'English',
      is_upcoming: 1
    }
  ];

  for (const movie of movies) {
    await Movie.create(movie);
  }
  console.log(`✅ ${movies.length} sample movies created`);

  // Create Sample Team Members
  const teamMembers = [
    {
      name: 'Team Member 1',
      student_id: '2024uee0001',
      role: 'Coordinator',
      photo_url: '/team.jpg',
      section: 'current_team',
      scanner_access: 1
    },
    {
      name: 'Team Member 2',
      student_id: '2024uee0002',
      role: 'Co-Coordinator',
      photo_url: '/team.jpg',
      section: 'current_team',
      scanner_access: 0
    }
  ];

  for (const member of teamMembers) {
    await Team.create(member);
  }
  console.log(`✅ ${teamMembers.length} team members created`);

  // Create Sample Foods
  const foods = [
    { name: 'Popcorn', description: 'Classic butter popcorn', price: 50, category: 'snacks', is_available: 1 },
    { name: 'Coca Cola', description: 'Cold drink (250ml)', price: 30, category: 'drinks', is_available: 1 },
    { name: 'Nachos', description: 'Crispy nachos with cheese dip', price: 80, category: 'snacks', is_available: 1 }
  ];

  for (const food of foods) {
    await Food.create(food);
  }
  console.log(`✅ ${foods.length} food items created`);

  // Create Sample Coupon
  await Coupon.create({
    code: 'WELCOME50',
    description: '50% off on your first booking',
    discount_type: 'percentage',
    discount_value: 50,
    min_purchase: 100,
    max_discount: 75,
    usage_limit: 100,
    is_active: 1
  });
  console.log('✅ Sample coupon created');

  console.log('\n🎉 Database setup complete!\n');
  console.log('Your API should now work at: ' + (process.env.RENDER_SERVICE_NAME 
    ? `https://${process.env.RENDER_SERVICE_NAME}.onrender.com`
    : 'http://localhost:3000'));

  await sequelize.close();
}

setupDatabase();

