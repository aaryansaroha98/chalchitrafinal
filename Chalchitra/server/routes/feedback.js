const express = require('express');
const db = require('../database');

const router = express.Router();

// Submit feedback
router.post('/', (req, res) => {
  // Temporarily allow feedback without authentication for testing
  // if (!req.user) return res.status(401).json({ error: 'Authentication required' });

  const { movie_id, rating, comment } = req.body;

  if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5' });

  // Use dummy user ID if not authenticated
  const userId = req.user ? req.user.id : 1;

  db.run('INSERT INTO feedback (user_id, movie_id, rating, comment) VALUES (?, ?, ?, ?)',
    [userId, movie_id, rating, comment], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    });
});

// Get feedback for a movie
router.get('/movie/:movie_id', (req, res) => {
  db.all('SELECT f.*, u.name FROM feedback f JOIN users u ON f.user_id = u.id WHERE f.movie_id = ? ORDER BY f.created_at DESC',
    [req.params.movie_id], (err, feedback) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(feedback);
    });
});

// Get average rating for a movie
router.get('/movie/:movie_id/rating', (req, res) => {
  db.get('SELECT AVG(rating) as average_rating, COUNT(*) as total_reviews FROM feedback WHERE movie_id = ?',
    [req.params.movie_id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        average_rating: result.average_rating || 0,
        total_reviews: result.total_reviews
      });
    });
});

// Get user's feedback
router.get('/my', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });

  db.all('SELECT f.*, m.title FROM feedback f JOIN movies m ON f.movie_id = m.id WHERE f.user_id = ? ORDER BY f.created_at DESC',
    [req.user.id], (err, feedback) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(feedback);
    });
});

module.exports = router;
