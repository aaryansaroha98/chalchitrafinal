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

  const BONUS_COINS = 20; // Default signup bonus

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