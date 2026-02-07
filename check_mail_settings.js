const db = require('./server/database');

db.get('SELECT * FROM mail_settings WHERE id = 1', (err, settings) => {
  if (err) {
    console.log('Error fetching mail settings:', err.message);
    process.exit(1);
  }
  if (!settings) {
    console.log('No mail settings found in database');
  } else {
    console.log('Current mail settings in database:');
    console.log('- email_host:', settings.email_host);
    console.log('- email_port:', settings.email_port);
    console.log('- email_user:', settings.email_user);
    console.log('- sender_name:', settings.sender_name);
    console.log('- email_pass:', settings.email_pass ? 'SET' : 'NOT SET');
  }
  process.exit(0);
});