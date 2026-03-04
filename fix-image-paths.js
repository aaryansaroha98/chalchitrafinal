const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_o0AKY6USqanI@ep-dawn-sea-a10vzeg8-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function fix() {
  // Fix hero video path
  await pool.query("UPDATE settings SET hero_background_video = '/hero/hero-video-1770835410993.mp4' WHERE hero_background_video = '/hero-video-1770835410993.mp4'");
  console.log('Fixed hero video path');
  
  // Fix team photo path
  await pool.query("UPDATE team SET photo_url = '/team/team-1770835534912.png' WHERE photo_url = '/team-1770835534912.png'");
  console.log('Fixed team photo path');
  
  // Fix gallery image path
  await pool.query("UPDATE gallery SET image_url = '/gallery/gallery-1770835484459.png' WHERE image_url = '/gallery-1770835484459.png'");
  console.log('Fixed gallery image path');

  // Verify
  const settings = await pool.query('SELECT hero_background_video, about_image FROM settings');
  console.log('Settings:', settings.rows[0]);
  const team = await pool.query('SELECT id, name, photo_url FROM team');
  console.log('Team:', team.rows);
  const gallery = await pool.query('SELECT id, image_url FROM gallery');
  console.log('Gallery:', gallery.rows);
  
  await pool.end();
  console.log('Done!');
}

fix().catch(console.error);
