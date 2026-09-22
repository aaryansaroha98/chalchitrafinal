const express = require('express');
const db = require('../database');
const router = express.Router();

// Get current user's coin balance
router.get('/balance', (req, res) => {
  const userId = getUserIdentifier(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  db.get('SELECT COALESCE(coins, 0) as coins FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ coins: user.coins });
  });
});

// Coin gifts this user has not been told about yet.
//
// An admin grant writes a credit row with announced_at null. This returns
// those rows so the site can tell the recipient once, the next time they open
// it, and /announcements/seen closes them out. Anything already announced, and
// anything the user did themselves, never appears here.
router.get('/announcements', (req, res) => {
  const userId = getUserIdentifier(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  db.all(
    `SELECT id, amount, actor_name, created_at
     FROM coin_transactions
     WHERE user_id = ?
       AND type = 'credit'
       AND announced_at IS NULL
       AND (reason LIKE 'admin_grant%' OR reason LIKE 'admin_adjust%')
     ORDER BY created_at ASC, id ASC
     LIMIT 20`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        announcements: (rows || []).map((row) => ({
          id: row.id,
          amount: Number(row.amount) || 0,
          from: row.actor_name || 'Chalchitra',
          at: row.created_at,
        })),
      });
    }
  );
});

// Mark gifts as told, so they are shown once and not on every visit.
router.post('/announcements/seen', (req, res) => {
  const userId = getUserIdentifier(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const ids = Array.isArray(req.body && req.body.ids)
    ? req.body.ids.map(Number).filter(Number.isInteger).slice(0, 50)
    : [];
  if (!ids.length) return res.json({ updated: 0 });

  // Scoped to this user's own rows so an id from elsewhere cannot be closed.
  const holes = ids.map(() => '?').join(', ');
  db.run(
    `UPDATE coin_transactions SET announced_at = CURRENT_TIMESTAMP
     WHERE user_id = ? AND announced_at IS NULL AND id IN (${holes})`,
    [userId, ...ids],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes || 0 });
    }
  );
});

// Get user's coin transaction history
router.get('/transactions', (req, res) => {
  const userId = getUserIdentifier(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  db.all(
    `SELECT ct.*, m.title as movie_title
     FROM coin_transactions ct
     LEFT JOIN bookings b ON ct.booking_id = b.booking_code
     LEFT JOIN movies m ON b.movie_id = m.id
     WHERE ct.user_id = ?
     ORDER BY ct.created_at DESC
     LIMIT 50`,
    [userId],
    (err, transactions) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(transactions || []);
    }
  );
});

// Grant signup bonus coins (called on first signup)
router.post('/grant-signup-bonus', (req, res) => {
  const userId = getUserIdentifier(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const BONUS_COINS = 50; // Default signup bonus

  // Check if user already received signup bonus
  db.get(
    `SELECT id FROM coin_transactions WHERE user_id = ? AND reason = 'signup_bonus'`,
    [userId],
    (err, existing) => {
      if (err) return res.status(500).json({ error: err.message });
      if (existing) {
        return res.json({ message: 'Signup bonus already granted', granted: false });
      }

      // Grant bonus coins
      db.run(
        'INSERT INTO coin_transactions (user_id, amount, type, reason) VALUES (?, ?, ?, ?)',
        [userId, BONUS_COINS, 'credit', 'signup_bonus'],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });

          db.run(
            'UPDATE users SET coins = COALESCE(coins, 0) + ? WHERE id = ?',
            [BONUS_COINS, userId],
            function (updateErr) {
              if (updateErr) return res.status(500).json({ error: updateErr.message });
              console.log(`✅ Signup bonus of ${BONUS_COINS} coins granted to user ${userId}`);
              res.json({ message: `Signup bonus of ${BONUS_COINS} coins granted`, granted: true, coins: BONUS_COINS });
            }
          );
        }
      );
    }
  );
});

// Helper to get user ID from request
function getUserIdentifier(req) {
  if (req.user && req.user.id) return req.user.id;
  if (req.session && req.session.adminUser && req.session.adminUser.id) return req.session.adminUser.id;
  return null;
}

module.exports = router;