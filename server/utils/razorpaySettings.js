const MASKED_SECRET = '••••••••';

const ensureRazorpaySettingsTable = (db) => new Promise((resolve, reject) => {
  if (!db) return reject(new Error('Database instance is required'));

  db.run(
    `CREATE TABLE IF NOT EXISTS razorpay_settings (
      id INTEGER PRIMARY KEY,
      key_id TEXT,
      key_secret TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => (err ? reject(err) : resolve())
  );
});

const getRazorpaySettingsRow = (db) => new Promise((resolve, reject) => {
  if (!db) return reject(new Error('Database instance is required'));

  db.get('SELECT * FROM razorpay_settings WHERE id = 1', (err, row) => {
    if (err) return reject(err);
    resolve(row || null);
  });
});

const getRazorpayKeys = async (db) => {
  await ensureRazorpaySettingsTable(db);

  const row = await getRazorpaySettingsRow(db);
  const keyId = (row?.key_id || process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = (row?.key_secret || process.env.RAZORPAY_KEY_SECRET || '').trim();

  return { keyId, keySecret };
};

const maskSecret = (secret) => (secret ? MASKED_SECRET : '');

module.exports = {
  MASKED_SECRET,
  ensureRazorpaySettingsTable,
  getRazorpayKeys,
  maskSecret
};

