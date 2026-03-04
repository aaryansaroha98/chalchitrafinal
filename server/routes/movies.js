const express = require('express');
const db = require('../database');
const { getUpload, getUploadUrl, cleanupStoredFile } = require('../utils/cloudinary');

const router = express.Router();

console.log('🎬 Movies routes file loaded');

// Use Cloudinary in production, local disk in development
const upload = getUpload('posters', 'uploads');

// Helper function to validate movie data
const validateMovieData = (data) => {
  const errors = [];
  
  if (!data.title || data.title.trim() === '') {
    errors.push('Movie title is required');
  }
  
  if (!data.date || data.date.trim() === '') {
    errors.push('Movie date is required');
  } else {
    const date = new Date(data.date);
    if (isNaN(date.getTime())) {
      errors.push('Invalid date format');
    }
  }
  
  if (!data.venue || data.venue.trim() === '') {
    errors.push('Venue is required');
  }
  
  if (data.price === undefined || data.price === '' || data.price === null) {
    errors.push('Price is required');
  } else if (isNaN(parseFloat(data.price)) || parseFloat(data.price) < 0) {
    errors.push('Price must be a valid number');
  }
  
  return errors;
};

// Get upcoming movies - filter by current date & time (JS to respect local datetime strings)
router.get('/upcoming', (req, res) => {
  db.all('SELECT * FROM movies', [], (err, movies) => {
    if (err) {
      console.error('❌ Database error in /upcoming:', err);
      return res.status(500).json({ error: 'Failed to fetch movies' });
    }
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
    if (err) {
      console.error('❌ Database error in /past:', err);
      return res.status(500).json({ error: 'Failed to fetch movies' });
    }
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
  console.log('🔍 GET /api/movies/all - Fetching all movies');
  db.all('SELECT * FROM movies ORDER BY date DESC', [], (err, movies) => {
    if (err) {
      console.error('❌ Database error in /all:', err);
      return res.status(500).json({ error: 'Failed to fetch movies: ' + err.message });
    }
    console.log('✅ Returning', movies?.length || 0, 'movies from /all endpoint');
    res.json(movies || []);
  });
});

// Get all movies (root endpoint)
router.get('/', (req, res) => {
  db.all('SELECT * FROM movies ORDER BY date DESC', [], (err, movies) => {
    if (err) {
      console.error('❌ Database error in GET /:', err);
      return res.status(500).json({ error: 'Failed to fetch movies' });
    }
    res.json(movies || []);
  });
});

// Get movie by ID
router.get('/:id', (req, res) => {
  const movieId = parseInt(req.params.id);
  if (isNaN(movieId)) {
    return res.status(400).json({ error: 'Invalid movie ID' });
  }
  
  db.get('SELECT * FROM movies WHERE id = ?', [movieId], (err, movie) => {
    if (err) {
      console.error('❌ Database error in GET /:id:', err);
      return res.status(500).json({ error: 'Failed to fetch movie' });
    }
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    res.json(movie);
  });
});

// Add movie (admin only)
router.post('/', (req, res) => {
  // Handle multer upload with error catching
  upload.single('poster')(req, res, (multerErr) => {
    if (multerErr) {
      console.error('❌ Multer/Cloudinary upload error:', multerErr);
      // Don't fail the whole request - just log and continue without poster
      console.log('⚠️ Continuing movie creation without poster due to upload error');
    }

  console.log('📝 POST /api/movies - Creating new movie');
  
  // Check for OAuth user first
  const isAdmin = (req.user && req.user.is_admin) || 
                 (req.session && req.session.adminUser && req.session.adminUser.is_admin) ||
                 (req.session && req.session.user && req.session.user.is_admin);
  
  if (!isAdmin) {
    console.log('❌ Unauthorized attempt to create movie');
    return res.status(403).json({ error: 'Admin access required' });
  }

  // Parse the request body
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      console.error('❌ Error parsing request body:', e);
      return res.status(400).json({ error: 'Invalid request body format' });
    }
  }

  console.log('📋 Movie data received:', {
    title: body.title,
    date: body.date,
    venue: body.venue,
    price: body.price,
    hasPoster: !!req.file
  });

  // Validate required fields
  const validationErrors = validateMovieData(body);
  if (validationErrors.length > 0) {
    console.log('❌ Validation errors:', validationErrors);
    return res.status(400).json({ error: 'Validation failed', details: validationErrors });
  }

  const { title, description, date, venue, price, availableFoods, category, duration, imdb_rating, language } = body;
  const poster_url = getUploadUrl(req.file, '/uploads');

  // Determine is_upcoming based on date
  const movieDate = new Date(date);
  const now = new Date();
  const isUpcoming = !isNaN(movieDate.getTime()) && movieDate > now ? 1 : 0;

  // Handle availableFoods - convert array to comma-separated string
  let availableFoodsString = '';
  if (availableFoods) {
    try {
      const foodsArray = typeof availableFoods === 'string' ? JSON.parse(availableFoods) : availableFoods;
      availableFoodsString = Array.isArray(foodsArray) ? foodsArray.join(',') : foodsArray;
    } catch (e) {
      console.log('⚠️ Error parsing availableFoods:', e);
      availableFoodsString = String(availableFoods);
    }
  }

  const sql = `INSERT INTO movies (title, description, poster_url, date, venue, price, is_upcoming, available_foods, category, duration, imdb_rating, language) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [title || '', description || '', poster_url || '', date || '', venue || '', 
    price !== undefined && price !== '' ? parseFloat(price) : 0, 
    isUpcoming, availableFoodsString, category || '', duration || '', imdb_rating || '', language || ''];

  console.log('💾 Executing INSERT query...');
  
  db.run(sql, params, function(err) {
    if (err) {
      console.error('❌ Database INSERT error:', err);
      return res.status(500).json({ error: 'Failed to create movie: ' + err.message });
    }
    
    console.log('✅ Movie created successfully with ID:', this.lastID);
    res.status(201).json({ 
      id: this.lastID,
      message: 'Movie created successfully'
    });
  });
  }); // end multer wrapper
});

// Update movie (admin)
router.put('/:id', (req, res) => {
  // Handle multer upload with error catching
  upload.single('poster')(req, res, (multerErr) => {
    if (multerErr) {
      console.error('❌ Multer/Cloudinary upload error:', multerErr);
      console.log('⚠️ Continuing movie update without new poster due to upload error');
      // Don't fail - continue with existing poster
    }

  const movieId = parseInt(req.params.id);
  
  console.log(`📝 PUT /api/movies/${movieId} - Updating movie`);
  
  if (isNaN(movieId)) {
    console.log('❌ Invalid movie ID:', req.params.id);
    return res.status(400).json({ error: 'Invalid movie ID' });
  }

  // Check for OAuth user first
  const isAdmin = (req.user && req.user.is_admin) || 
                 (req.session && req.session.adminUser && req.session.adminUser.is_admin) ||
                 (req.session && req.session.user && req.session.user.is_admin);
  
  if (!isAdmin) {
    console.log('❌ Unauthorized attempt to update movie');
    return res.status(403).json({ error: 'Admin access required' });
  }

  // Parse the request body
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      console.error('❌ Error parsing request body:', e);
      return res.status(400).json({ error: 'Invalid request body format' });
    }
  }

  console.log('📋 Movie update data received:', {
    title: body.title,
    date: body.date,
    venue: body.venue,
    price: body.price,
    hasPoster: !!req.file
  });

  const { title, description, date, venue, price, availableFoods, category, duration, imdb_rating, language } = body;
  
  // Validate required fields
  const validationErrors = validateMovieData(body);
  if (validationErrors.length > 0) {
    console.log('❌ Validation errors:', validationErrors);
    return res.status(400).json({ error: 'Validation failed', details: validationErrors });
  }

  db.get('SELECT poster_url FROM movies WHERE id = ?', [movieId], (getErr, existingMovie) => {
    if (getErr) {
      console.error('❌ Database SELECT error:', getErr);
      return res.status(500).json({ error: 'Failed to fetch existing movie: ' + getErr.message });
    }

    if (!existingMovie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    let poster_url = existingMovie.poster_url || req.body.poster_url;
    if (req.file) {
      poster_url = getUploadUrl(req.file, '/uploads');
    } else if (Object.prototype.hasOwnProperty.call(req.body, 'poster_url')) {
      poster_url = req.body.poster_url;
    }

    // Handle availableFoods - convert array to comma-separated string
    let availableFoodsString = '';
    if (availableFoods) {
      try {
        const foodsArray = typeof availableFoods === 'string' ? JSON.parse(availableFoods) : availableFoods;
        availableFoodsString = Array.isArray(foodsArray) ? foodsArray.join(',') : foodsArray;
      } catch (e) {
        console.log('⚠️ Error parsing availableFoods:', e);
        availableFoodsString = String(availableFoods);
      }
    }

    // Always determine is_upcoming based on date for consistency
    let finalIsUpcoming = 1; // Default to upcoming
    if (date && date.trim() !== '') {
      const movieDate = new Date(date);
      const now = new Date();
      if (!isNaN(movieDate.getTime())) {
        finalIsUpcoming = movieDate > now ? 1 : 0;
        console.log('📅 Calculated is_upcoming =', finalIsUpcoming, 'based on date:', movieDate);
      } else {
        console.log('⚠️ Invalid date format, defaulting to upcoming (1)');
      }
    } else {
      console.log('⚠️ No date provided, defaulting to upcoming (1)');
    }

    // Ensure finalIsUpcoming is always 0 or 1
    finalIsUpcoming = finalIsUpcoming === 1 ? 1 : 0;

    const sql = `UPDATE movies SET 
                 title = ?, description = ?, poster_url = ?, date = ?, venue = ?, price = ?, 
                 is_upcoming = ?, available_foods = ?, category = ?, duration = ?, 
                 imdb_rating = ?, language = ? 
                 WHERE id = ?`;
    const params = [
      title || '', description || '', poster_url || '', date || '', venue || '',
      price !== undefined && price !== '' ? parseFloat(price) : 0,
      finalIsUpcoming, availableFoodsString, category || '', duration || '',
      imdb_rating || '', language || '', movieId
    ];

    console.log('💾 Executing UPDATE query for movie ID:', movieId);

    db.run(sql, params, function(err) {
      if (err) {
        console.error('❌ Database UPDATE error:', err);
        return res.status(500).json({ error: 'Failed to update movie: ' + err.message });
      }

      if (this.changes === 0) {
        console.log('⚠️ No movie found with ID:', movieId);
        return res.status(404).json({ error: 'Movie not found' });
      }

      if (existingMovie.poster_url && existingMovie.poster_url !== poster_url) {
        cleanupStoredFile(existingMovie.poster_url);
      }

      console.log('✅ Movie updated successfully. Changes:', this.changes, 'for movie ID:', movieId);
      res.json({
        changes: this.changes,
        message: 'Movie updated successfully'
      });
    });
  });
  }); // end multer wrapper
});

// Delete movie (admin)
router.delete('/:id', (req, res) => {
  const movieId = parseInt(req.params.id);
  
  console.log(`🗑️ DELETE /api/movies/${movieId}`);
  
  if (isNaN(movieId)) {
    console.log('❌ Invalid movie ID:', req.params.id);
    return res.status(400).json({ error: 'Invalid movie ID' });
  }

  // Check for OAuth user first
  const isAdmin = (req.user && req.user.is_admin) || 
                 (req.session && req.session.adminUser && req.session.adminUser.is_admin) ||
                 (req.session && req.session.user && req.session.user.is_admin);
  
  if (!isAdmin) {
    console.log('❌ Unauthorized attempt to delete movie');
    return res.status(403).json({ error: 'Admin access required' });
  }

  db.get('SELECT poster_url FROM movies WHERE id = ?', [movieId], (getErr, existingMovie) => {
    if (getErr) {
      console.error('❌ Database SELECT error:', getErr);
      return res.status(500).json({ error: 'Failed to fetch movie before delete: ' + getErr.message });
    }

    db.run('DELETE FROM movies WHERE id = ?', [movieId], function(err) {
      if (err) {
        console.error('❌ Database DELETE error:', err);
        return res.status(500).json({ error: 'Failed to delete movie: ' + err.message });
      }

      if (this.changes === 0) {
        console.log('⚠️ No movie found with ID:', movieId);
        return res.status(404).json({ error: 'Movie not found' });
      }

      if (existingMovie?.poster_url) {
        cleanupStoredFile(existingMovie.poster_url);
      }

      console.log('✅ Movie deleted successfully. Changes:', this.changes, 'for movie ID:', movieId);
      res.json({
        changes: this.changes,
        message: 'Movie deleted successfully'
      });
    });
  });
});

// Move to past (admin)
router.put('/:id/move_to_past', (req, res) => {
  const movieId = parseInt(req.params.id);
  
  console.log(`📝 PUT /api/movies/${movieId}/move_to_past`);
  
  if (isNaN(movieId)) {
    console.log('❌ Invalid movie ID:', req.params.id);
    return res.status(400).json({ error: 'Invalid movie ID' });
  }

  // Check for OAuth user first
  const isAdmin = (req.user && req.user.is_admin) || 
                 (req.session && req.session.adminUser && req.session.adminUser.is_admin) ||
                 (req.session && req.session.user && req.session.user.is_admin);
  
  if (!isAdmin) {
    console.log('❌ Unauthorized attempt to move movie to past');
    return res.status(403).json({ error: 'Admin access required' });
  }

  db.run('UPDATE movies SET is_upcoming = 0 WHERE id = ?', [movieId], function(err) {
    if (err) {
      console.error('❌ Database error in move_to_past:', err);
      return res.status(500).json({ error: 'Failed to move movie to past: ' + err.message });
    }
    
    if (this.changes === 0) {
      console.log('⚠️ No movie found with ID:', movieId);
      return res.status(404).json({ error: 'Movie not found' });
    }
    
    console.log('✅ Movie moved to past successfully. Changes:', this.changes);
    res.json({ 
      changes: this.changes,
      message: 'Movie moved to past successfully'
    });
  });
});

module.exports = router;
