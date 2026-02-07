const express = require('express');
const db = require('../database');
const multer = require('multer');
const path = require('path');

const router = express.Router();

console.log('🎬 Movies routes file loaded');

// Multer for file uploads (posters)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Get upcoming movies - filter by current date & time (JS to respect local datetime strings)
router.get('/upcoming', (req, res) => {
  db.all('SELECT * FROM movies', [], (err, movies) => {
    if (err) return res.status(500).json({ error: err.message });
    const now = new Date();
    const upcoming = (movies || [])
      .filter((movie) => {
        const movieDate = new Date(movie.date);
        if (Number.isNaN(movieDate.getTime())) return false;
        return movieDate >= now;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json(upcoming);
  });
});

// Get past movies - filter by current date & time (JS to respect local datetime strings)
router.get('/past', (req, res) => {
  db.all('SELECT * FROM movies', [], (err, movies) => {
    if (err) return res.status(500).json({ error: err.message });
    const now = new Date();
    const past = (movies || [])
      .filter((movie) => {
        const movieDate = new Date(movie.date);
        if (Number.isNaN(movieDate.getTime())) return false;
        return movieDate < now;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(past);
  });
});

// Get all movies (fallback for admin panel)
router.get('/all', (req, res) => {
  console.log('GET /api/movies/all - Fetching all movies');
  db.all('SELECT * FROM movies ORDER BY date DESC', [], (err, movies) => {
    if (err) {
      console.log('Database error in /all:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Returning', movies.length, 'movies from /all endpoint');
    res.json(movies);
  });
});

// Get movie by ID
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM movies WHERE id = ?', [req.params.id], (err, movie) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!movie) return res.status(404).json({ error: 'Movie not found' });
    res.json(movie);
  });
});

// Add movie (admin only)
router.post('/', upload.single('poster'), (req, res) => {
  // Check for OAuth user first
  if (req.user && req.user.is_admin) {
    // Continue
  } else if (req.session && req.session.adminUser && req.session.adminUser.is_admin) {
    // Continue for temporary admin
  } else {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { title, description, date, venue, price, availableFoods, category, duration, imdb_rating, language } = req.body;
  const poster_url = req.file ? `/uploads/${req.file.filename}` : null;

  // Determine is_upcoming based on date
  const movieDate = new Date(date);
  const now = new Date();
  const isUpcoming = !isNaN(movieDate.getTime()) && movieDate > now ? 1 : 0;

  // Handle availableFoods - convert array to comma-separated string
  let availableFoodsString = '';
  if (availableFoods) {
    try {
      const foodsArray = JSON.parse(availableFoods);
      availableFoodsString = foodsArray.join(',');
    } catch (e) {
      console.log('Error parsing availableFoods:', e);
    }
  }

  db.run('INSERT INTO movies (title, description, poster_url, date, venue, price, is_upcoming, available_foods, category, duration, imdb_rating, language) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [title, description, poster_url, date, venue, price, isUpcoming, availableFoodsString, category, duration, imdb_rating, language], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    });
});

// Update movie (admin)
router.put('/:id', upload.single('poster'), (req, res) => {
  // Check for OAuth user first
  if (req.user && req.user.is_admin) {
    // Continue
  } else if (req.session && req.session.adminUser && req.session.adminUser.is_admin) {
    // Continue for temporary admin
  } else {
    return res.status(403).json({ error: 'Admin access required' });
  }



  const { title, description, date, venue, price, is_upcoming, availableFoods, category, duration, imdb_rating, language } = req.body;
  let poster_url = req.body.poster_url; // Keep existing poster if no new file uploaded

  if (req.file) {
    poster_url = `/uploads/${req.file.filename}`;
  }

  // Handle availableFoods - convert array to comma-separated string
  let availableFoodsString = '';
  if (availableFoods) {
    try {
      const foodsArray = JSON.parse(availableFoods);
      availableFoodsString = foodsArray.join(',');
    } catch (e) {
      console.log('Error parsing availableFoods:', e);
      // Try to use as-is if it's already a string
      availableFoodsString = availableFoods;
    }
  }

  // Always determine is_upcoming based on date for consistency
  let finalIsUpcoming = 1; // Default to upcoming
  if (date && date.trim() !== '') {
    const movieDate = new Date(date);
    const now = new Date();
    if (!isNaN(movieDate.getTime())) {
      finalIsUpcoming = movieDate > now ? 1 : 0;
      console.log('Calculated is_upcoming =', finalIsUpcoming, 'based on date:', movieDate);
    } else {
      console.log('Invalid date format, defaulting to upcoming (1)');
    }
  } else {
    console.log('No date provided, defaulting to upcoming (1)');
  }

  console.log('Final UPDATE query - title:', title, 'date:', date, 'is_upcoming:', finalIsUpcoming, 'movie_id:', req.params.id);

  // Ensure finalIsUpcoming is always 0 or 1
  finalIsUpcoming = finalIsUpcoming === 1 ? 1 : 0;
  console.log('Final is_upcoming after validation:', finalIsUpcoming);

  db.run('UPDATE movies SET title = ?, description = ?, poster_url = ?, date = ?, venue = ?, price = ?, is_upcoming = ?, available_foods = ?, category = ?, duration = ?, imdb_rating = ?, language = ? WHERE id = ?',
    [title, description, poster_url, date, venue, price, finalIsUpcoming, availableFoodsString, category, duration, imdb_rating, language, req.params.id], function(err) {
      if (err) {
        console.log('Database error:', err);
        return res.status(500).json({ error: err.message });
      }
      console.log('Database update successful, changes:', this.changes, 'for movie ID:', req.params.id);
      res.json({ changes: this.changes });
    });
});

// Delete movie (admin)
router.delete('/:id', (req, res) => {
  // Check for OAuth user first
  if (req.user && req.user.is_admin) {
    // Continue
  } else if (req.session && req.session.adminUser && req.session.adminUser.is_admin) {
    // Continue for temporary admin
  } else {
    return res.status(403).json({ error: 'Admin access required' });
  }

  db.run('DELETE FROM movies WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

// Move to past (admin)
router.put('/:id/move_to_past', (req, res) => {
  // Check for OAuth user first
  if (req.user && req.user.is_admin) {
    // Continue
  } else if (req.session && req.session.adminUser && req.session.adminUser.is_admin) {
    // Continue for temporary admin
  } else {
    return res.status(403).json({ error: 'Admin access required' });
  }

  db.run('UPDATE movies SET is_upcoming = 0 WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

module.exports = router;
