const express = require('express');
const router = express.Router();
const db = require('../database');
const multer = require('multer');
const path = require('path');

// Configure multer for food image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads');
    try {
      // Ensure uploads directory exists
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (e) {
      console.error('Failed ensuring uploads dir for foods:', e);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'food-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Middleware to check if user is admin (supports both passport user and session user)
const requireAdmin = (req, res, next) => {
  const isAdmin = (req.user && req.user.is_admin) ||
                  (req.session && req.session.adminUser && req.session.adminUser.is_admin) ||
                  (req.session && req.session.user && req.session.user.is_admin);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get all foods
router.get('/', (req, res) => {
  db.all('SELECT * FROM foods ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      console.error('Error fetching foods:', err);
      return res.status(500).json({ error: 'Failed to fetch foods' });
    }
    res.json(rows);
  });
});

// Get available foods (for booking page)
router.get('/available/:movieId', (req, res) => {
  const movieId = req.params.movieId;

  const query = `
    SELECT f.* FROM foods f
    JOIN movie_foods mf ON f.id = mf.food_id
    WHERE mf.movie_id = ? AND f.is_available = 1
    ORDER BY f.category, f.name
  `;

  db.all(query, [movieId], (err, rows) => {
    if (err) {
      console.error('Error fetching available foods:', err);
      return res.status(500).json({ error: 'Failed to fetch available foods' });
    }
    res.json(rows);
  });
});

// Get food by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM foods WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching food:', err);
      return res.status(500).json({ error: 'Failed to fetch food' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Food not found' });
    }
    res.json(row);
  });
});

// Create new food item (admin only)
router.post('/', requireAdmin, upload.single('image'), (req, res) => {
  const { name, description, price, category } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  if (!name || !price) {
    return res.status(400).json({ error: 'Name and price are required' });
  }

  // Set default category if not provided
  const finalCategory = category || 'other';

  const query = `
    INSERT INTO foods (name, description, price, category, image_url)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(query, [name, description, price, finalCategory, image_url], function(err) {
    if (err) {
      console.error('Error creating food:', err);
      return res.status(500).json({ error: 'Failed to create food item' });
    }
    res.json({ id: this.lastID, message: 'Food item created successfully' });
  });
});

// Update food item (admin only)
router.put('/:id', requireAdmin, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { name, description, price, category, is_available } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  let query, params;

  if (image_url) {
    query = `
      UPDATE foods
      SET name = ?, description = ?, price = ?, category = ?, image_url = ?, is_available = ?
      WHERE id = ?
    `;
    params = [name, description, price, category, image_url, is_available, id];
  } else {
    query = `
      UPDATE foods
      SET name = ?, description = ?, price = ?, category = ?, is_available = ?
      WHERE id = ?
    `;
    params = [name, description, price, category, is_available, id];
  }

  db.run(query, params, function(err) {
    if (err) {
      console.error('Error updating food:', err);
      return res.status(500).json({ error: 'Failed to update food item' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Food item not found' });
    }
    res.json({ message: 'Food item updated successfully' });
  });
});

// Delete food item (admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;

  // First check if food is linked to any movies
  db.get('SELECT COUNT(*) as count FROM movie_foods WHERE food_id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error checking movie links:', err);
      return res.status(500).json({ error: 'Failed to delete food item' });
    }

    if (row.count > 0) {
      return res.status(400).json({
        error: 'Cannot delete food item that is linked to movies. Remove from all movies first.'
      });
    }

    // Delete the food item
    db.run('DELETE FROM foods WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Error deleting food:', err);
        return res.status(500).json({ error: 'Failed to delete food item' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Food item not found' });
      }
      res.json({ message: 'Food item deleted successfully' });
    });
  });
});

// Link food to movie (admin only)
router.post('/link/:movieId/:foodId', requireAdmin, (req, res) => {
  const { movieId, foodId } = req.params;

  const query = `
    INSERT OR IGNORE INTO movie_foods (movie_id, food_id)
    VALUES (?, ?)
  `;

  db.run(query, [movieId, foodId], function(err) {
    if (err) {
      console.error('Error linking food to movie:', err);
      return res.status(500).json({ error: 'Failed to link food to movie' });
    }
    res.json({ message: 'Food linked to movie successfully' });
  });
});

// Unlink food from movie (admin only)
router.delete('/link/:movieId/:foodId', requireAdmin, (req, res) => {
  const { movieId, foodId } = req.params;

  db.run('DELETE FROM movie_foods WHERE movie_id = ? AND food_id = ?', [movieId, foodId], function(err) {
    if (err) {
      console.error('Error unlinking food from movie:', err);
      return res.status(500).json({ error: 'Failed to unlink food from movie' });
    }
    res.json({ message: 'Food unlinked from movie successfully' });
  });
});

// Get foods linked to a movie
router.get('/movie/:movieId', requireAdmin, (req, res) => {
  const { movieId } = req.params;

  const query = `
    SELECT f.*, mf.created_at as linked_at
    FROM foods f
    JOIN movie_foods mf ON f.id = mf.food_id
    WHERE mf.movie_id = ?
    ORDER BY f.category, f.name
  `;

  db.all(query, [movieId], (err, rows) => {
    if (err) {
      console.error('Error fetching movie foods:', err);
      return res.status(500).json({ error: 'Failed to fetch movie foods' });
    }
    res.json(rows);
  });
});

// Get movies linked to a food item
router.get('/:id/movies', requireAdmin, (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT m.id, m.title, m.date, mf.created_at as linked_at
    FROM movies m
    JOIN movie_foods mf ON m.id = mf.movie_id
    WHERE mf.food_id = ?
    ORDER BY m.date DESC
  `;

  db.all(query, [id], (err, rows) => {
    if (err) {
      console.error('Error fetching food movies:', err);
      return res.status(500).json({ error: 'Failed to fetch movies linked to this food' });
    }
    res.json(rows);
  });
});

// Force delete food item (removes from all movies first)
router.delete('/:id/force', requireAdmin, (req, res) => {
  const { id } = req.params;

  // First remove food from all movies
  db.run('DELETE FROM movie_foods WHERE food_id = ?', [id], function(err) {
    if (err) {
      console.error('Error removing food from movies:', err);
      return res.status(500).json({ error: 'Failed to remove food from movies' });
    }

    console.log(`Removed food ${id} from ${this.changes} movies`);

    // Now delete the food item
    db.run('DELETE FROM foods WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Error deleting food:', err);
        return res.status(500).json({ error: 'Failed to delete food item after removing from movies' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Food item not found' });
      }
      res.json({
        message: 'Food item deleted successfully',
        movies_removed_from: this.changes
      });
    });
  });
});

// Get food orders for a specific booking
router.get('/booking/:bookingId', (req, res) => {
  const { bookingId } = req.params;

  // Determine if bookingId is numeric (database ID) or alphanumeric (booking code)
  const isNumeric = !isNaN(parseInt(bookingId));

  let bookingQuery, bookingParams;

  if (isNumeric) {
    // It's a database ID
    bookingQuery = 'SELECT id FROM bookings WHERE id = ?';
    bookingParams = [parseInt(bookingId)];
  } else {
    // It's a booking code
    bookingQuery = 'SELECT id FROM bookings WHERE booking_code = ?';
    bookingParams = [bookingId];
  }

  // First get the actual database ID
  db.get(bookingQuery, bookingParams, (err, booking) => {
    if (err) {
      console.error('Error finding booking for food orders:', err);
      return res.status(500).json({ error: 'Failed to find booking' });
    }

    if (!booking) {
      return res.json([]); // Return empty array for not found bookings
    }

    const actualBookingId = booking.id;

    const query = `
      SELECT bf.food_id, bf.quantity, f.name, f.price, f.category
      FROM booking_foods bf
      LEFT JOIN foods f ON bf.food_id = f.id
      WHERE bf.booking_id = ?
      ORDER BY f.category, f.name
    `;

    db.all(query, [actualBookingId], (err, rows) => {
      if (err) {
        console.error('Error fetching booking food orders:', err);
        return res.status(500).json({ error: 'Failed to fetch booking food orders' });
      }
      res.json(rows);
    });
  });
});

// Get food status for a specific booking (which items have been given)
router.get('/status/:bookingId', (req, res) => {
  const { bookingId } = req.params;

  // Determine if bookingId is numeric (database ID) or alphanumeric (booking code)
  const isNumeric = !isNaN(parseInt(bookingId));

  let bookingQuery, bookingParams;

  if (isNumeric) {
    // It's a database ID
    bookingQuery = 'SELECT id FROM bookings WHERE id = ?';
    bookingParams = [parseInt(bookingId)];
  } else {
    // It's a booking code
    bookingQuery = 'SELECT id FROM bookings WHERE booking_code = ?';
    bookingParams = [bookingId];
  }

  // First get the actual database ID
  db.get(bookingQuery, bookingParams, (err, booking) => {
    if (err) {
      console.error('Error finding booking:', err);
      return res.status(500).json({ error: 'Failed to find booking' });
    }

    if (!booking) {
      return res.json([]); // Return empty array instead of error for better UX
    }

    const actualBookingId = booking.id;

    const query = `
      SELECT
        bf.food_id,
        bf.quantity as ordered_quantity,
        f.name,
        f.price,
        f.category,
        COALESCE(bfs.quantity_given, 0) as quantity_given,
        bfs.given_at,
        CASE WHEN bfs.quantity_given >= bf.quantity THEN 1 ELSE 0 END as is_completed
      FROM booking_foods bf
      LEFT JOIN foods f ON bf.food_id = f.id
      LEFT JOIN booking_food_status bfs ON bf.booking_id = bfs.booking_id AND bf.food_id = bfs.food_id
      WHERE bf.booking_id = ?
      ORDER BY f.category, f.name
    `;

    db.all(query, [actualBookingId], (err, rows) => {
      if (err) {
        console.error('Error fetching booking food status:', err);
        return res.status(500).json({ error: 'Failed to fetch booking food status' });
      }
      res.json(rows);
    });
  });
});

// Mark food as given for a booking
router.post('/mark-given/:bookingId/:foodId', (req, res) => {
  const { bookingId, foodId } = req.params;
  const { quantity = 1, given_by } = req.body;

  // Determine if bookingId is numeric (database ID) or alphanumeric (booking code)
  const isNumeric = !isNaN(parseInt(bookingId));

  let bookingQuery, bookingParams;

  if (isNumeric) {
    // It's a database ID
    bookingQuery = 'SELECT id FROM bookings WHERE id = ?';
    bookingParams = [parseInt(bookingId)];
  } else {
    // It's a booking code
    bookingQuery = 'SELECT id FROM bookings WHERE booking_code = ?';
    bookingParams = [bookingId];
  }

  // First get the actual database ID
  db.get(bookingQuery, bookingParams, (err, booking) => {
    if (err) {
      console.error('Error finding booking for food marking:', err);
      return res.status(500).json({ error: 'Failed to find booking' });
    }

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const actualBookingId = booking.id;

    // First check if the food item exists in the booking
    const checkQuery = `
      SELECT bf.quantity as ordered_quantity, f.name
      FROM booking_foods bf
      LEFT JOIN foods f ON bf.food_id = f.id
      WHERE bf.booking_id = ? AND bf.food_id = ?
    `;

    db.get(checkQuery, [actualBookingId, foodId], (err, row) => {
      if (err) {
        console.error('Error checking food order:', err);
        return res.status(500).json({ error: 'Failed to check food order' });
      }

      if (!row) {
        return res.status(404).json({ error: 'Food item not found in this booking' });
      }

      if (quantity > row.ordered_quantity) {
        return res.status(400).json({
          error: `Cannot mark more than ordered quantity (${row.ordered_quantity})`
        });
      }

      // Check current status
      const statusQuery = `
        SELECT quantity_given FROM booking_food_status
        WHERE booking_id = ? AND food_id = ?
      `;

      db.get(statusQuery, [actualBookingId, foodId], (statusErr, statusRow) => {
        if (statusErr) {
          console.error('Error checking food status:', statusErr);
          return res.status(500).json({ error: 'Failed to check food status' });
        }

        const currentGiven = statusRow ? statusRow.quantity_given : 0;
        const newTotalGiven = currentGiven + quantity;

        if (newTotalGiven > row.ordered_quantity) {
          return res.status(400).json({
            error: `Total given quantity (${newTotalGiven}) cannot exceed ordered quantity (${row.ordered_quantity})`
          });
        }

        // Use INSERT with IGNORE to handle existing records, then UPDATE if needed
        // This avoids the ON CONFLICT issue that requires a UNIQUE constraint
        const upsertQuery = `
          INSERT OR IGNORE INTO booking_food_status (booking_id, food_id, quantity_given, given_by, given_at)
          VALUES (?, ?, 0, NULL, NULL)
        `;

        db.run(upsertQuery, [actualBookingId, foodId], function(err) {
          if (err) {
            console.error('Error inserting food status placeholder:', err);
            return res.status(500).json({ error: 'Failed to initialize food status' });
          }

          // Now update the record
          const updateQuery = `
            UPDATE booking_food_status
            SET quantity_given = quantity_given + ?,
                given_at = CURRENT_TIMESTAMP,
                given_by = ?
            WHERE booking_id = ? AND food_id = ?
          `;

          db.run(updateQuery, [quantity, given_by, actualBookingId, foodId], function(err) {
            if (err) {
              console.error('Error updating food status:', err);
              return res.status(500).json({ error: 'Failed to update food status' });
            }

            res.json({
              message: `Marked ${quantity} ${row.name} as given`,
              food_id: foodId,
              quantity_given: newTotalGiven,
              total_ordered: row.ordered_quantity,
              is_completed: newTotalGiven >= row.ordered_quantity
            });
          });
        });
      });
    });
  });
});

// Get pending food items for a booking (not yet fully given)
router.get('/pending/:bookingId', (req, res) => {
  const { bookingId } = req.params;

  // Determine if bookingId is numeric (database ID) or alphanumeric (booking code)
  const isNumeric = !isNaN(parseInt(bookingId));

  let bookingQuery, bookingParams;

  if (isNumeric) {
    // It's a database ID
    bookingQuery = 'SELECT id FROM bookings WHERE id = ?';
    bookingParams = [parseInt(bookingId)];
  } else {
    // It's a booking code
    bookingQuery = 'SELECT id FROM bookings WHERE booking_code = ?';
    bookingParams = [bookingId];
  }

  // First get the actual database ID
  db.get(bookingQuery, bookingParams, (err, booking) => {
    if (err) {
      console.error('Error finding booking for pending food:', err);
      return res.status(500).json({ error: 'Failed to find booking' });
    }

    if (!booking) {
      return res.json([]); // Return empty array for not found bookings
    }

    const actualBookingId = booking.id;

    const query = `
      SELECT
        bf.food_id,
        bf.quantity as ordered_quantity,
        f.name,
        f.price,
        f.category,
        COALESCE(bfs.quantity_given, 0) as quantity_given,
        (bf.quantity - COALESCE(bfs.quantity_given, 0)) as remaining_quantity
      FROM booking_foods bf
      LEFT JOIN foods f ON bf.food_id = f.id
      LEFT JOIN booking_food_status bfs ON bf.booking_id = bfs.booking_id AND bf.food_id = bfs.food_id
      WHERE bf.booking_id = ? AND (COALESCE(bfs.quantity_given, 0) < bf.quantity)
      ORDER BY f.category, f.name
    `;

    db.all(query, [actualBookingId], (err, rows) => {
      if (err) {
        console.error('Error fetching pending food items:', err);
        return res.status(500).json({ error: 'Failed to fetch pending food items' });
      }
      res.json(rows);
    });
  });
});

module.exports = router;
