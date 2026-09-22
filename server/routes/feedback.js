const express = require('express');
const db = require('../database');

const router = express.Router();

// Submit feedback — one review per person per movie.
//
// This used to insert unconditionally with no check of any kind, so a
// double-click or reopening the form left another row behind and one account
// could hold several reviews of the same film. A repeat submission now
// replaces the previous one, and a unique index on (user_id, movie_id) makes
// that true even for two requests arriving together.
router.post('/', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });

  const { movie_id, rating, comment } = req.body;
  const movieId = Number(movie_id);

  if (!Number.isInteger(movieId) || movieId <= 0) {
    return res.status(400).json({ error: 'A valid movie is required' });
  }
  if (rating === undefined || rating === null || typeof rating !== 'number' || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be a number between 1 and 5' });
  }

  const userId = req.user.id;
  const note = typeof comment === 'string' ? comment.slice(0, 2000) : comment;

  db.get('SELECT id FROM feedback WHERE user_id = ? AND movie_id = ?', [userId, movieId], (findErr, existing) => {
    if (findErr) return res.status(500).json({ error: findErr.message });

    if (existing) {
      return db.run(
        'UPDATE feedback SET rating = ?, comment = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?',
        [rating, note, existing.id],
        (updErr) => {
          if (updErr) return res.status(500).json({ error: updErr.message });
          res.json({ id: existing.id, updated: true });
        }
      );
    }

    db.run('INSERT INTO feedback (user_id, movie_id, rating, comment) VALUES (?, ?, ?, ?)',
      [userId, movieId, rating, note], function (err) {
        if (!err) return res.json({ id: this.lastID, updated: false });

        // The unique index rejected it, meaning a second submission arrived
        // while this one was in flight. Treat it as the update it was.
        db.run(
          'UPDATE feedback SET rating = ?, comment = ?, created_at = CURRENT_TIMESTAMP WHERE user_id = ? AND movie_id = ?',
          [rating, note, userId, movieId],
          (raceErr) => {
            if (raceErr) return res.status(500).json({ error: err.message });
            res.json({ updated: true });
          }
        );
      });
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
