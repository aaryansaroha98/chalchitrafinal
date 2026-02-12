const express = require('express');
const db = require('../database');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
const { isCloudinaryConfigured, getUpload, getUploadUrl, deleteImage } = require('../utils/cloudinary');

const router = express.Router();

// Multer for file uploads - uses Cloudinary in production, local disk in development
let uploadFields;
let uploadTeam;
let uploadGallery;

if (isCloudinaryConfigured) {
  // Cloudinary storage for all upload types
  const settingsUpload = getUpload('settings');
  uploadFields = settingsUpload.fields([
    { name: 'about_image', maxCount: 1 },
    { name: 'hero_background_image', maxCount: 1 },
    { name: 'hero_background_video', maxCount: 1 }
  ]);
  uploadTeam = getUpload('team');
  uploadGallery = getUpload('gallery');
} else {
  // Local disk storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'about_image') {
        cb(null, path.join(__dirname, '..', '..', 'public', 'about'));
      } else if (file.fieldname === 'hero_background_image' || file.fieldname === 'hero_background_video') {
        cb(null, path.join(__dirname, '..', '..', 'public', 'hero'));
      } else {
        cb(null, path.join(__dirname, '..', '..', 'public'));
      }
    },
    filename: (req, file, cb) => {
      let prefix = 'image';
      if (file.fieldname === 'about_image') {
        prefix = 'about-image';
      } else if (file.fieldname === 'hero_background_image') {
        prefix = 'hero-bg';
      } else if (file.fieldname === 'hero_background_video') {
        prefix = 'hero-video';
      }
      cb(null, prefix + '-' + Date.now() + path.extname(file.originalname));
    }
  });
  const upload = multer({ storage });
  uploadFields = upload.fields([
    { name: 'about_image', maxCount: 1 },
    { name: 'hero_background_image', maxCount: 1 },
    { name: 'hero_background_video', maxCount: 1 }
  ]);

  // Local team storage
  const teamStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '..', '..', 'public', 'team'));
    },
    filename: (req, file, cb) => {
      cb(null, 'team-' + Date.now() + path.extname(file.originalname));
    }
  });
  uploadTeam = multer({ storage: teamStorage });

  // Local gallery storage
  const galleryStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '..', '..', 'public', 'gallery'));
    },
    filename: (req, file, cb) => {
      cb(null, 'gallery-' + Date.now() + path.extname(file.originalname));
    }
  });
  uploadGallery = multer({ storage: galleryStorage });
}

// Middleware to check admin
const requireAdmin = (req, res, next) => {
  // Check for OAuth user first
  if (req.user && req.user.is_admin) {
    return next();
  }
  // Check for temporary admin session
  if (req.session && req.session.adminUser && req.session.adminUser.is_admin) {
    return next();
  }
  return res.status(403).json({ error: 'Admin access required' });
};

// Middleware to check user authentication
const requireAuth = (req, res, next) => {
  // Check for OAuth user first
  if (req.user) {
    return next();
  }
  // Check for temporary admin session
  if (req.session && req.session.adminUser) {
    return next();
  }
  return res.status(401).json({ error: 'Authentication required' });
};

// Get dashboard stats
router.get('/stats', requireAdmin, (req, res) => {
  const queries = {
    total_users: 'SELECT COUNT(*) as count FROM users',
    total_movies: 'SELECT COUNT(*) as count FROM movies',
    upcoming_movies: 'SELECT COUNT(*) as count FROM movies WHERE is_upcoming = 1',
    total_bookings: 'SELECT COUNT(*) as count FROM bookings',
    recent_bookings: 'SELECT COUNT(*) as count FROM bookings WHERE created_at >= datetime("now", "-7 days")'
  };

  const results = {};
  let completed = 0;
  let responded = false;

  Object.keys(queries).forEach(key => {
    db.get(queries[key], [], (err, row) => {
      if (responded) return;
      if (err) {
        responded = true;
        console.error('Stats query error for', key, ':', err.message);
        return res.status(500).json({ error: err.message });
      }
      results[key] = row ? row.count : 0;
      completed++;
      if (completed === Object.keys(queries).length) {
        responded = true;
        res.json(results);
      }
    });
  });
});

// Get revenue statistics for Database Management (sensitive data - Config tab only)
router.get('/revenue-stats', requireAdmin, (req, res) => {
  // First check if this is the super admin
  db.get('SELECT email FROM users WHERE id = ?', [req.user?.id || req.session?.adminUser?.id], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Only super admin can access revenue stats
    if (!user || user.email !== '2025uee0154@iitjammu.ac.in') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const results = {};
    let completed = 0;
    let responded = false;
    const totalQueries = 8;

    function handleResult(key, err, data) {
      if (responded) return;
      if (err) {
        responded = true;
        console.error('Revenue stats error for', key, ':', err.message);
        return res.status(500).json({ error: err.message });
      }
      results[key] = data;
      completed++;
      if (completed === totalQueries) {
        responded = true;
        res.json(results);
      }
    }

    // 1. Total Revenue from bookings
    db.get('SELECT COALESCE(SUM(total_price), 0) as total FROM bookings', [], (err, row) => {
      handleResult('total_revenue', err, row ? row.total : 0);
    });

    // 2. Total Food Revenue
    db.get(`
      SELECT COALESCE(SUM(fo.price * fo.quantity), 0) as total 
      FROM food_orders fo
      JOIN bookings b ON fo.booking_id = b.id
    `, [], (err, row) => {
      handleResult('food_revenue', err, row ? row.total : 0);
    });

    // 3. Total Discounts Given (from coupons used)
    db.get(`
      SELECT COALESCE(SUM(b.discount_amount), 0) as total 
      FROM bookings b 
      WHERE b.discount_amount > 0
    `, [], (err, row) => {
      handleResult('total_discounts', err, row ? row.total : 0);
    });

    // 4. Total Bookings Count
    db.get('SELECT COUNT(*) as count FROM bookings', [], (err, row) => {
      handleResult('total_bookings', err, row ? row.count : 0);
    });

    // 5. Revenue by Movie (top 10)
    db.all(`
      SELECT m.title, m.date, COUNT(b.id) as booking_count, COALESCE(SUM(b.total_price), 0) as revenue
      FROM movies m
      LEFT JOIN bookings b ON m.id = b.movie_id
      GROUP BY m.id
      ORDER BY revenue DESC
      LIMIT 10
    `, [], (err, rows) => {
      handleResult('revenue_by_movie', err, rows || []);
    });

    // 6. Recent Transactions (last 20)
    db.all(`
      SELECT b.*, u.name as user_name, u.email as user_email, m.title as movie_title
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN movies m ON b.movie_id = m.id
      ORDER BY b.created_at DESC
      LIMIT 20
    `, [], (err, rows) => {
      handleResult('recent_transactions', err, rows || []);
    });

    // 7. Monthly Revenue Breakdown (last 6 months)
    db.all(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as bookings,
        COALESCE(SUM(total_price), 0) as revenue
      FROM bookings
      WHERE created_at >= datetime('now', '-6 months')
      GROUP BY month
      ORDER BY month DESC
    `, [], (err, rows) => {
      handleResult('monthly_revenue', err, rows || []);
    });

    // 8. Payment Method Breakdown
    db.all(`
      SELECT payment_method, COUNT(*) as count, COALESCE(SUM(total_price), 0) as total
      FROM bookings
      GROUP BY payment_method
    `, [], (err, rows) => {
      handleResult('payment_methods', err, rows || []);
    });
  });
});

// Get top 10 users with most bookings
router.get('/top-users', requireAdmin, (req, res) => {
  const query = `
    SELECT u.id, u.name, u.email, COUNT(b.id) as total_bookings, SUM(b.total_price) as total_spent
    FROM users u
    LEFT JOIN bookings b ON u.id = b.user_id
    GROUP BY u.id
    ORDER BY total_bookings DESC
    LIMIT 10
  `;
  
  db.all(query, [], (err, users) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(users || []);
  });
});

// Website visitors tracking - Create table if not exists
router.get('/visitors/stats', requireAdmin, (req, res) => {
  // First check if visitor_stats table exists
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='visitor_stats'", (err, table) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (!table) {
      // Create the table
      db.run(`CREATE TABLE IF NOT EXISTS visitor_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        visit_date DATE DEFAULT CURRENT_DATE,
        page_name TEXT,
        visitor_count INTEGER DEFAULT 1,
        UNIQUE(visit_date, page_name)
      )`, (createErr) => {
        if (createErr) return res.status(500).json({ error: createErr.message });
        
        // Return empty stats since table was just created
        return res.json({
          total_visitors: 0,
          today_visitors: 0,
          page_views: [],
          recent_visits: []
        });
      });
    } else {
      // Table exists, get stats
      db.get('SELECT SUM(visitor_count) as total FROM visitor_stats', (err, totalRow) => {
        db.get('SELECT SUM(visitor_count) as today FROM visitor_stats WHERE visit_date = date("now")', (err, todayRow) => {
          db.all('SELECT page_name, SUM(visitor_count) as views FROM visitor_stats GROUP BY page_name ORDER BY views DESC LIMIT 10', (err, pageViews) => {
            db.all('SELECT * FROM visitor_stats ORDER BY visit_date DESC, visitor_count DESC LIMIT 20', (err, recentVisits) => {
              res.json({
                total_visitors: totalRow?.total || 0,
                today_visitors: todayRow?.today || 0,
                page_views: pageViews || [],
                recent_visits: recentVisits || []
              });
            });
          });
        });
      });
    }
  });
});

// Track a page visit (can be called from frontend)
router.post('/track-visit', (req, res) => {
  const { page_name } = req.body;
  
  if (!page_name) {
    return res.status(400).json({ error: 'Page name is required' });
  }
  
  // Create table if not exists
  db.run(`CREATE TABLE IF NOT EXISTS visitor_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visit_date DATE DEFAULT CURRENT_DATE,
    page_name TEXT,
    visitor_count INTEGER DEFAULT 1,
    UNIQUE(visit_date, page_name)
  )`, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Try to insert, or update if exists
    db.run(`INSERT INTO visitor_stats (visit_date, page_name, visitor_count) 
            VALUES (date("now"), ?, 1)
            ON CONFLICT(visit_date, page_name) DO UPDATE SET 
            visitor_count = visitor_count + 1`, [page_name], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

// Manage users (make admin)
router.put('/users/:id/make_admin', requireAdmin, (req, res) => {
  db.run('UPDATE users SET is_admin = 1 WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

// Remove admin privileges
router.put('/users/:id/remove_admin', requireAdmin, (req, res) => {
  db.run('UPDATE users SET is_admin = 0 WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

// Update admin tag/name
router.put('/users/:id/admin_tag', requireAdmin, (req, res) => {
  const { admin_tag } = req.body;
  db.run('UPDATE users SET admin_tag = ? WHERE id = ?', [admin_tag, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ changes: this.changes, admin_tag });
  });
});

// Make user code scanner
router.put('/users/:id/make_scanner', requireAdmin, (req, res) => {
  const admin_tag = req.body && req.body.admin_tag;
  
  // Check if this is specifically a scanner permission request
  // If admin_tag is explicitly provided, treat as admin tag update
  // If admin_tag is not provided or is null/undefined, treat as scanner permission update
  if (admin_tag !== undefined && admin_tag !== null && admin_tag !== '') {
    // This is an admin tag update request
    db.run('UPDATE users SET admin_tag = ? WHERE id = ?', [admin_tag, req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ changes: this.changes, admin_tag });
    });
  } else {
    // This is the original make scanner request (no admin_tag in body)
    db.run('UPDATE users SET code_scanner = 1 WHERE id = ?', [req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ changes: this.changes });
    });
  }
});

// Remove user code scanner access
router.put('/users/:id/remove_scanner', requireAdmin, (req, res) => {
  db.run('UPDATE users SET code_scanner = 0 WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

// Grant scanner access to team member
router.put('/team/:id/grant_scanner', requireAdmin, (req, res) => {
  db.run('UPDATE team SET scanner_access = 1 WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

// Remove scanner access from team member
router.put('/team/:id/remove_scanner', requireAdmin, (req, res) => {
  db.run('UPDATE team SET scanner_access = 0 WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

// Get all users
router.get('/users', requireAdmin, (req, res) => {
  db.all('SELECT id, name, email, is_admin, code_scanner FROM users ORDER BY name', [], (err, users) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(users);
  });
});

// Get bookings for admin
router.get('/bookings', requireAdmin, (req, res) => {
  db.all('SELECT b.*, u.name, u.email, m.title, m.date as movie_date, m.venue FROM bookings b JOIN users u ON b.user_id = u.id JOIN movies m ON b.movie_id = m.id ORDER BY b.created_at DESC',
    [], (err, bookings) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(bookings);
    });
});

// Update booking (admin)
router.put('/bookings/:id', requireAdmin, (req, res) => {
  const { is_used } = req.body;
  db.run('UPDATE bookings SET is_used = ? WHERE id = ?', [is_used, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

// Get feedback
router.get('/feedback', requireAdmin, (req, res) => {
  db.all('SELECT f.*, u.name as user_name, u.email as user_email, m.title as movie_title FROM feedback f LEFT JOIN users u ON f.user_id = u.id LEFT JOIN movies m ON f.movie_id = m.id ORDER BY f.created_at DESC',
    [], (err, feedback) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(feedback);
    });
});

// Get all coupons with usage tracking
router.get('/coupons', requireAdmin, (req, res) => {
  db.all('SELECT * FROM coupons ORDER BY created_at DESC', [], (err, coupons) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Add usage percentage and status to each coupon
    const couponsWithUsage = coupons.map(coupon => {
      let usagePercentage = 0;
      let status = 'Active';
      
      if (coupon.usage_limit > 0) {
        usagePercentage = Math.round((coupon.used_count / coupon.usage_limit) * 100);
        
        if (coupon.used_count >= coupon.usage_limit) {
          status = 'Expired';
        } else if (usagePercentage >= 80) {
          status = 'Low Usage';
        }
      } else {
        usagePercentage = 0;
        status = 'Unlimited';
      }
      
      return {
        ...coupon,
        usage_percentage: usagePercentage,
        status: status
      };
    });
    
    res.json(couponsWithUsage);
  });
});

// Create new coupon
router.post('/coupons', requireAdmin, (req, res) => {
  const { code, description, discount_type, discount_value, min_purchase, max_discount, usage_limit, expiry_date } = req.body;

  if (!code || !description || !discount_type || discount_value === undefined) {
    return res.status(400).json({ error: 'Code, description, discount_type, and discount_value are required' });
  }

  if (!['percentage', 'fixed'].includes(discount_type)) {
    return res.status(400).json({ error: 'discount_type must be either "percentage" or "fixed"' });
  }

  if (discount_type === 'percentage' && (discount_value < 0 || discount_value > 100)) {
    return res.status(400).json({ error: 'Percentage discount must be between 0 and 100' });
  }

  if (discount_value < 0) {
    return res.status(400).json({ error: 'Discount value must be positive' });
  }

  // Check if coupon code already exists
  db.get('SELECT id FROM coupons WHERE code = ?', [code.toUpperCase()], (err, existing) => {
    if (err) return res.status(500).json({ error: err.message });
    if (existing) return res.status(400).json({ error: 'Coupon code already exists' });

    const finalUsageLimit = usage_limit === '' || usage_limit === null ? -1 : parseInt(usage_limit);
    const finalMinPurchase = min_purchase || 0;
    const finalMaxDiscount = max_discount || null;

    db.run(`INSERT INTO coupons (code, description, discount_type, discount_value, min_purchase, max_discount, usage_limit, expiry_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [code.toUpperCase(), description, discount_type, discount_value, finalMinPurchase, finalMaxDiscount, finalUsageLimit, expiry_date],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'Coupon created successfully' });
      });
  });
});



// Delete coupon
router.delete('/coupons/:id', requireAdmin, (req, res) => {
  db.run('DELETE FROM coupons WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Coupon not found' });
    res.json({ message: 'Coupon deleted successfully' });
  });
});

// Update coupon
router.put('/coupons/:id', requireAdmin, (req, res) => {
  const { code, description, discount_type, discount_value, min_purchase, max_discount, usage_limit, expiry_date } = req.body;

  if (!code || !description || !discount_type || discount_value === undefined) {
    return res.status(400).json({ error: 'Code, description, discount_type, and discount_value are required' });
  }

  if (!['percentage', 'fixed'].includes(discount_type)) {
    return res.status(400).json({ error: 'discount_type must be either "percentage" or "fixed"' });
  }

  if (discount_type === 'percentage' && (discount_value < 0 || discount_value > 100)) {
    return res.status(400).json({ error: 'Percentage discount must be between 0 and 100' });
  }

  if (discount_value < 0) {
    return res.status(400).json({ error: 'Discount value must be positive' });
  }

  // Check if coupon code already exists (excluding current coupon)
  db.get('SELECT id FROM coupons WHERE code = ? AND id != ?', [code.toUpperCase(), req.params.id], (err, existing) => {
    if (err) return res.status(500).json({ error: err.message });
    if (existing) return res.status(400).json({ error: 'Coupon code already exists' });

    const finalUsageLimit = usage_limit === '' || usage_limit === null ? -1 : parseInt(usage_limit);
    const finalMinPurchase = min_purchase || 0;
    const finalMaxDiscount = max_discount || null;

    db.run(`UPDATE coupons SET code = ?, description = ?, discount_type = ?, discount_value = ?, min_purchase = ?, max_discount = ?, usage_limit = ?, expiry_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [code.toUpperCase(), description, discount_type, discount_value, finalMinPurchase, finalMaxDiscount, finalUsageLimit, expiry_date, req.params.id],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Coupon not found' });
        res.json({ message: 'Coupon updated successfully' });
      });
  });
});

// Bulk delete coupons
router.delete('/coupons', requireAdmin, (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Coupon IDs array is required' });
  }

  const placeholders = ids.map(() => '?').join(',');
  db.run(`DELETE FROM coupons WHERE id IN (${placeholders})`, ids, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: `${this.changes} coupon(s) deleted successfully` });
  });
});

// Validate coupon (public endpoint for frontend)
router.post('/coupons/validate', (req, res) => {
  const { code, total_amount } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Coupon code is required' });
  }

  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  db.get(`SELECT * FROM coupons WHERE code = ? AND is_active = 1 AND (expiry_date IS NULL OR expiry_date >= ?)`,
    [code.toUpperCase(), currentDate], (err, coupon) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!coupon) return res.status(400).json({ error: 'Invalid or expired coupon code' });

      // Check usage limit
      if (coupon.usage_limit !== -1 && coupon.used_count >= coupon.usage_limit) {
        return res.status(400).json({ error: 'Coupon usage limit exceeded' });
      }

      // Check minimum purchase
      if (total_amount < coupon.min_purchase) {
        return res.status(400).json({
          error: `Minimum purchase amount of ₹${coupon.min_purchase} required for this coupon`
        });
      }

      // Calculate discount
      let discount = 0;
      if (coupon.discount_type === 'percentage') {
        discount = (total_amount * coupon.discount_value) / 100;
      } else {
        discount = coupon.discount_value;
      }

      // Apply max discount limit for percentage coupons
      if (coupon.max_discount && discount > coupon.max_discount) {
        discount = coupon.max_discount;
      }

      // Ensure discount doesn't exceed total amount
      discount = Math.min(discount, total_amount);

      // Increment usage count when coupon is validated for use
      db.run('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [coupon.id], function(updateErr) {
        if (updateErr) {
          console.error('Error updating coupon usage count:', updateErr);
          return res.status(500).json({ error: 'Failed to update coupon usage' });
        }

        console.log(`Coupon ${coupon.code} usage count incremented: ${this.changes} rows affected`);

        res.json({
          valid: true,
          coupon: {
            id: coupon.id,
            code: coupon.code,
            description: coupon.description,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            discount_amount: discount,
            final_amount: total_amount - discount
          }
        });
      });
    });
});

// Get gallery images (public)
router.get('/gallery', (req, res) => {
  db.all('SELECT * FROM gallery ORDER BY uploaded_at DESC', [], (err, images) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(images);
  });
});

// Add gallery image
router.post('/gallery', requireAdmin, uploadGallery.single('image'), (req, res) => {
  console.log('Gallery upload request received');
  console.log('User:', req.user);
  console.log('File:', req.file);
  console.log('Body:', req.body);

  try {
    const { event_name } = req.body;
    const image_url = getUploadUrl(req.file, '/gallery') || req.body.image_url;

    console.log('Image URL:', image_url);
    console.log('Event name:', event_name);

    if (!image_url) {
      console.log('No image file provided');
      return res.status(400).json({ error: 'Image file is required' });
    }

    db.run('INSERT INTO gallery (image_url, event_name) VALUES (?, ?)', [image_url, event_name || 'General Event'], function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: err.message });
      }
      console.log('Gallery image inserted successfully, ID:', this.lastID);
      res.json({ id: this.lastID });
    });
  } catch (error) {
    console.error('Gallery upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete gallery image
router.delete('/gallery/:id', requireAdmin, (req, res) => {
  db.run('DELETE FROM gallery WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

// Get settings (public - for homepage)
router.get('/settings', (req, res) => {
  db.get('SELECT * FROM settings WHERE id = 1', [], (err, settings) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!settings) {
      // Create default settings
      const defaultAboutText = 'Chalchitra Series is a student-led initiative at IIT Jammu dedicated to bringing quality movie screenings to our campus community. We organize regular movie screenings featuring a diverse range of films, from classics to contemporary hits.\n\nOur mission is to create a vibrant cultural atmosphere on campus while providing students with affordable entertainment options.';
      db.run('INSERT INTO settings (id, tagline, hero_background, about_text, about_image) VALUES (1, ?, ?, ?, ?)',
        ['Student-led movie screening initiative at IIT Jammu', '#007bff', defaultAboutText, '/about-image.jpg'], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: 1, tagline: 'Student-led movie screening initiative at IIT Jammu', hero_background: '#007bff', about_text: defaultAboutText, about_image: '/about-image.jpg' });
      });
    } else {
      res.json(settings);
    }
  });
});

// Update settings
router.put('/settings', requireAdmin, uploadFields, (req, res) => {
  console.log('Settings update request received');
  console.log('Body:', req.body);
  console.log('Files:', req.files);

  const { tagline, hero_background, about_text } = req.body;
  const about_image = getUploadUrl(req.files?.about_image?.[0], '/about') || req.body.about_image;
  const hero_background_image = getUploadUrl(req.files?.hero_background_image?.[0], '/hero') || req.body.hero_background_image;
  const hero_background_video = getUploadUrl(req.files?.hero_background_video?.[0], '/hero') || (req.body.hero_background_video === '' ? null : req.body.hero_background_video);

  console.log('About to update settings with:', {
    tagline, hero_background, hero_background_image, hero_background_video, about_text, about_image
  });

  db.run('UPDATE settings SET tagline = ?, hero_background = ?, hero_background_image = ?, hero_background_video = ?, about_text = ?, about_image = ? WHERE id = 1',
    [tagline, hero_background, hero_background_image, hero_background_video, about_text, about_image], function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: err.message });
      }
      console.log('Settings updated successfully, changes:', this.changes);
      res.json({ changes: this.changes });
    });
});

// Get team members (public - for team page)
router.get('/team', (req, res) => {
  db.all('SELECT * FROM team ORDER BY name', [], (err, team) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(team);
  });
});

// Add team member
router.post('/team', requireAdmin, uploadTeam.single('photo'), (req, res) => {
  const { name, student_id, role, section } = req.body;
  const photo_url = getUploadUrl(req.file, '/team') || req.body.photo_url;
  db.run('INSERT INTO team (name, student_id, photo_url, role, section) VALUES (?, ?, ?, ?, ?)', [name, student_id, photo_url, role, section || 'foundation_team'], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

// Update team member
router.put('/team/:id', requireAdmin, uploadTeam.single('photo'), (req, res) => {
  const { name, student_id, role, section } = req.body;
  const photo_url = getUploadUrl(req.file, '/team') || req.body.photo_url;
  db.run('UPDATE team SET name = ?, student_id = ?, photo_url = ?, role = ?, section = ? WHERE id = ?',
    [name, student_id, photo_url, role, section, req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ changes: this.changes });
    });
});

// Delete team member
router.delete('/team/:id', requireAdmin, (req, res) => {
  db.run('DELETE FROM team WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

// Email functionality for admin - ENABLED
// Create transporter for email sending - uses database settings or environment variables
// Cached transporter to avoid re-creating on every request
let cachedTransporter = null;
let cachedTransporterTime = 0;
const TRANSPORTER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function createEmailTransporter() {
  const nodemailer = require('nodemailer');
  
  // Return cached transporter if still valid  
  if (cachedTransporter && (Date.now() - cachedTransporterTime) < TRANSPORTER_CACHE_TTL) {
    return Promise.resolve(cachedTransporter);
  }
  
  return new Promise((resolve, reject) => {
    // First try to get settings from database
    db.get('SELECT * FROM mail_settings WHERE id = 1', (err, dbSettings) => {
      if (err) {
        console.error('Error fetching mail settings from database (non-fatal):', err.message);
        // Continue with env vars - don't fail
      }
      
      const emailUser = dbSettings?.email_user || process.env.EMAIL_USER;
      // Skip db password if it looks masked
      const dbPass = dbSettings?.email_pass;
      const emailPass = (dbPass && dbPass !== '••••••••' && dbPass.length > 0) ? dbPass : process.env.EMAIL_PASS;
      
      if (!emailUser || !emailPass) {
        console.warn('Email credentials not configured.');
        return reject(new Error('Email credentials not configured. Set EMAIL_USER and EMAIL_PASS environment variables.'));
      }
      
      console.log('Creating email transporter — service: gmail, user:', emailUser.substring(0, 3) + '***');
      
      // Use service:'gmail' — works for @gmail.com AND Google Workspace domains
      // Uses port 465 SSL by default, which is more reliable on Render than 587 STARTTLS
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass
        },
        pool: false,
        connectionTimeout: 120000,
        greetingTimeout: 60000,
        socketTimeout: 120000,
        tls: {
          rejectUnauthorized: false
        }
      });
      
      // Cache the transporter (skip verify to avoid slow SMTP handshake on every request)
      cachedTransporter = transporter;
      cachedTransporterTime = Date.now();
      console.log('✅ Email transporter created successfully');
      resolve(transporter);
    });
  });
}

// Get all users for email sending
router.get('/email/users', requireAdmin, (req, res) => {
  db.all('SELECT id, name, email FROM users ORDER BY name', [], (err, users) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(users);
  });
});

// Get all movies with status classification
router.get('/movies-with-status', requireAdmin, (req, res) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  db.all('SELECT *, CASE WHEN date >= ? THEN "upcoming" ELSE "past" END as status FROM movies ORDER BY date DESC', [today.toISOString()], (err, movies) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(movies);
  });
});

// Send single email to user - ENABLED
router.post('/email/single', requireAdmin, async (req, res) => {
  const { user_id, subject, message, attachment_base64, attachment_name, attachment_type } = req.body;

  if (!user_id || subject === undefined || message === undefined || subject === null || message === null) {
    return res.status(400).json({ error: 'User ID, subject, and message are required' });
  }

  // Trim whitespace and check if empty
  const trimmedSubject = subject.trim();
  const trimmedMessage = message.trim();

  if (!trimmedSubject || !trimmedMessage) {
    return res.status(400).json({ error: 'Subject and message cannot be empty' });
  }

  try {
    // Create transporter first (before entering callback)
    const transporter = await createEmailTransporter();
    
    // Get user details
    db.get('SELECT name, email FROM users WHERE id = ?', [user_id], async (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ error: 'User not found' });

      try {
        let attachments = [];
        if (attachment_base64) {
          const buffer = Buffer.from(attachment_base64, 'base64');
          if (buffer.length > 5 * 1024 * 1024) {
            return res.status(400).json({ error: 'Attachment must be 5MB or smaller' });
          }
          attachments = [{
            filename: attachment_name || 'attachment',
            content: buffer,
            contentType: attachment_type || 'application/octet-stream'
          }];
        }

        const mailOptions = {
          from: `"Chalchitra IIT Jammu" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: subject,
          attachments,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: white; border: 1px solid #e9ecef; padding: 30px; text-align: center; border-radius: 15px 15px 0 0;">
                <h1 style="color: black; margin: 0; font-size: 24px;">Chalchitra Series</h1>
                <p style="color: #6c757d; margin: 10px 0 0 0;">Indian Institute of Technology Jammu</p>
              </div>
              <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-top: 0;">Hello ${user.name}!</h2>
                <div style="color: #555; line-height: 1.6; white-space: pre-line;">${message}</div>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #666; font-size: 14px; margin: 0;">
                  Best regards,<br>
                  <strong>Chalchitra Team</strong><br>
                  Indian Institute of Technology Jammu
                </p>
              </div>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);

        // Log email history
        db.run(`INSERT INTO email_history (email_type, recipient_email, recipient_name, subject, message, sent_by, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ['single', user.email, user.name, subject, message, req.user?.id || 1, 'sent']);

        res.json({ message: 'Email sent successfully!' });
      } catch (emailError) {
        console.error('Email sending error:', emailError);

        // Log failed email
        db.run(`INSERT INTO email_history (email_type, recipient_email, recipient_name, subject, message, sent_by, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ['single', user.email, user.name, subject, message, req.user?.id || 1, 'failed']);

        res.status(500).json({ error: 'Failed to send email: ' + (emailError.message || String(emailError)) });
      }
    });
  } catch (error) {
    console.error('Email setup error:', error);
    res.status(500).json({ error: 'Email service not available: ' + (error.message || String(error)) });
  }
});

// Send bulk email to multiple users - ENABLED
// Responds immediately, processes emails in background to avoid proxy timeouts
router.post('/email/bulk', requireAdmin, async (req, res) => {
  const { user_ids, subject, message } = req.body;

  if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0 || !subject || !message) {
    return res.status(400).json({ error: 'User IDs (array), subject, and message are required' });
  }

  try {
    // Validate transporter first before responding
    const transporter = await createEmailTransporter();
    
    // Get user details for all selected users
    const placeholders = user_ids.map(() => '?').join(',');
    db.all(`SELECT id, name, email FROM users WHERE id IN (${placeholders})`, user_ids, (err, users) => {
      if (err) return res.status(500).json({ error: 'Failed to get user details: ' + err.message });
      if (!users || users.length === 0) return res.status(404).json({ error: 'No valid users found' });

      const adminId = req.user?.id || 1;
      const senderName = process.env.SENDER_NAME || 'Chalchitra IIT Jammu';
      const fromEmail = process.env.EMAIL_USER;

      // Respond immediately - emails will be sent in background
      res.json({
        message: `Bulk email is being sent to ${users.length} users. Emails will be delivered shortly.`,
        total_users: users.length,
        sent: users.length,
        failed: 0,
        results: users.map(u => ({ user: u.name, email: u.email, status: 'queued' }))
      });

      // Process emails in background after response is sent
      setImmediate(async () => {
        console.log(`[Bulk Email] Starting background send to ${users.length} users`);
        
        for (let i = 0; i < users.length; i++) {
          const user = users[i];
          
          const mailOptions = {
            from: `"${senderName}" <${fromEmail}>`,
            to: user.email,
            subject: subject,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: white; border: 1px solid #e9ecef; padding: 30px; text-align: center; border-radius: 15px 15px 0 0;">
                  <h1 style="color: black; margin: 0; font-size: 24px;">Chalchitra Series</h1>
                  <p style="color: #6c757d; margin: 10px 0 0 0;">Indian Institute of Technology Jammu</p>
                </div>
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  <h2 style="color: #333; margin-top: 0;">Hello ${user.name}!</h2>
                  <div style="color: #555; line-height: 1.6; white-space: pre-line;">${message}</div>
                  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                  <p style="color: #666; font-size: 14px; margin: 0;">
                    Best regards,<br>
                    <strong>Chalchitra Team</strong><br>
                    Indian Institute of Technology Jammu
                  </p>
                </div>
              </div>
            `
          };

          try {
            console.log(`[Bulk Email] Sending to: ${user.email} (${i + 1}/${users.length})`);
            await transporter.sendMail(mailOptions);
            console.log(`[Bulk Email] ✅ Sent to: ${user.email}`);

            // Log successful email
            db.run(`INSERT INTO email_history (email_type, recipient_email, recipient_name, subject, message, sent_by, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
              ['bulk', user.email, user.name, subject, message, adminId, 'sent']);
          } catch (emailErr) {
            console.error(`[Bulk Email] ❌ Failed to send to ${user.email}:`, emailErr.message);

            // Log failed email
            db.run(`INSERT INTO email_history (email_type, recipient_email, recipient_name, subject, message, sent_by, status, error_message)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              ['bulk', user.email, user.name, subject, message, adminId, 'failed', emailErr.message]);
          }

          // Small delay between emails to avoid rate limiting
          if (i < users.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        console.log(`[Bulk Email] Background processing complete for ${users.length} users`);
      });
    });
  } catch (error) {
    console.error('Bulk email setup error:', error);
    res.status(500).json({ error: 'Email service not available: ' + (error.message || String(error)) });
  }
});

// Send email to custom email address - ENABLED
router.post('/email/custom', requireAdmin, async (req, res) => {
  const { email, recipient_name, subject, message, attachment_base64, attachment_name, attachment_type } = req.body;

  if (!email || !subject || !message) {
    return res.status(400).json({ error: 'Email, subject, and message are required' });
  }

  try {
    const transporter = await createEmailTransporter();

    let attachments = [];
    if (attachment_base64) {
      const buffer = Buffer.from(attachment_base64, 'base64');
      if (buffer.length > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'Attachment must be 5MB or smaller' });
      }
      attachments = [{
        filename: attachment_name || 'attachment',
        content: buffer,
        contentType: attachment_type || 'application/octet-stream'
      }];
    }

    const mailOptions = {
      from: `"Chalchitra IIT Jammu" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      attachments,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: white; border: 1px solid #e9ecef; padding: 30px; text-align: center; border-radius: 15px 15px 0 0;">
                <h1 style="color: black; margin: 0; font-size: 24px;">Chalchitra Series</h1>
                <p style="color: #6c757d; margin: 10px 0 0 0;">Indian Institute of Technology Jammu</p>
              </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Hello ${recipient_name || 'Valued Guest'}!</h2>
            <div style="color: #555; line-height: 1.6; white-space: pre-line;">${message}</div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              Best regards,<br>
              <strong>Chalchitra Team</strong><br>
              Indian Institute of Technology Jammu
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    // Log email history
    db.run(`INSERT INTO email_history (email_type, recipient_email, recipient_name, subject, message, sent_by, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['custom', email, recipient_name || 'Valued Guest', subject, message, req.user?.id || 1, 'sent'],
      function(err) {
        if (err) {
          console.error('Error logging custom email history:', err);
        } else {
          console.log('Custom email sent successfully to:', email);
        }
      });

    res.json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Custom email sending error:', error);

    // Log failed email
    db.run(`INSERT INTO email_history (email_type, recipient_email, recipient_name, subject, message, sent_by, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['custom', email, recipient_name || 'Valued Guest', subject, message, req.user?.id || 1, 'failed'],
      function(err) {
        if (err) console.error('Error logging failed custom email:', err);
      });

    res.status(500).json({ error: 'Failed to send email. Please try again later.' });
  }
});

// Send feedback request emails to users who scanned tickets
router.post('/email/feedback-request', requireAdmin, async (req, res) => {
  try {
    const { movie_id } = req.body || {};
    let selectedMovie = null;

    const movieId = parseInt(movie_id, 10);

    if (!Number.isFinite(movieId)) {
      return res.status(400).json({ error: 'Movie is required for feedback requests' });
    }

    selectedMovie = await new Promise((resolve, reject) => {
      db.get('SELECT id, title FROM movies WHERE id = ?', [movieId], (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });

    if (!selectedMovie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const query = `SELECT DISTINCT u.id, u.name, u.email
            FROM users u
            JOIN bookings b ON u.id = b.user_id
            WHERE b.movie_id = ?
            AND (b.is_used = 1 OR b.admitted_people > 0)
            ORDER BY u.name`;
    const queryParams = [movieId];

    // Get distinct users who have scanned tickets (bookings with is_used = 1)
    db.all(query, queryParams, async (err, users) => {
      if (err) return res.status(500).json({ error: 'Failed to get users who scanned tickets: ' + err.message });
      if (!users || users.length === 0) {
        const emptyMessage = `No users found who scanned tickets for "${selectedMovie.title}"`;
        return res.status(404).json({ error: emptyMessage });
      }

      const adminId = req.user?.id || 1;
      const subject = `How was your ${selectedMovie.title} experience?`;

      // Respond immediately - emails will be sent in background
      res.json({
        message: `Feedback request emails are being sent to ${users.length} users who scanned tickets.`,
        total_users: users.length,
        sent: users.length,
        failed: 0,
        movie_title: selectedMovie?.title || null
      });

      // Process emails in background
      setImmediate(async () => {
        let sentCount = 0;
        let failedCount = 0;

        try {
          const transporter = await createEmailTransporter();

          for (let i = 0; i < users.length; i++) {
            const user = users[i];
            
            try {
              const mailOptions = {
                from: `"Chalchitra IIT Jammu" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: subject,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: white; border: 1px solid #e9ecef; padding: 30px; text-align: center; border-radius: 15px 15px 0 0;">
                      <h1 style="color: black; margin: 0; font-size: 24px;">Chalchitra Series</h1>
                      <p style="color: #6c757d; margin: 10px 0 0 0;">Indian Institute of Technology Jammu</p>
                    </div>
                    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      <h2 style="color: #333; margin-top: 0;">Hello ${user.name}!</h2>

                      <p style="color: #555; font-size: 16px; margin: 20px 0; line-height: 1.6;">We'd love your feedback on <strong>${selectedMovie.title}</strong>.</p>
                      <p style="color: #555; font-size: 16px; margin: 20px 0; line-height: 1.6;">
                        Thank you for attending our movie screening! We hope you enjoyed the experience.
                      </p>

                      <p style="color: #555; line-height: 1.6;">
                        Your feedback is incredibly valuable to us as we strive to improve our events and services.
                        Please take a moment to share your thoughts about the movie, venue, food, and overall experience.
                      </p>

                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-bookings?user_id=${user.id}&feedback=true"
                           style="background: linear-gradient(145deg, #007bff, #0056b3); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 8px rgba(0,123,255,0.3);">
                          Give Feedback
                        </a>
                      </div>

                      <p style="color: #666; font-size: 14px; line-height: 1.6;">
                        Clicking the button above will take you to your bookings page where you can rate the movie and leave detailed feedback.
                        Your honest feedback helps us create better experiences for everyone!
                      </p>

                      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                      <p style="color: #666; font-size: 14px; margin: 0;">
                        Best regards,<br>
                        <strong>Chalchitra Team</strong><br>
                        Indian Institute of Technology Jammu
                      </p>
                    </div>
                  </div>
                `
              };

              console.log(`[Feedback Email] Sending to: ${user.email} (${i + 1}/${users.length})`);
              await transporter.sendMail(mailOptions);
              console.log(`[Feedback Email] ✅ Sent to: ${user.email}`);
              sentCount++;

              // Log successful email
              db.run(`INSERT INTO email_history (email_type, recipient_email, recipient_name, subject, message, sent_by, status)
                      VALUES (?, ?, ?, ?, ?, ?, ?)`,
                ['feedback', user.email, user.name, subject, 'Feedback request sent', adminId, 'sent']);
            } catch (emailError) {
              console.error(`[Feedback Email] ❌ Failed to send to ${user.email}:`, emailError.message);
              failedCount++;

              // Log failed email
              db.run(`INSERT INTO email_history (email_type, recipient_email, recipient_name, subject, message, sent_by, status, error_message)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                ['feedback', user.email, user.name, subject, 'Feedback request sent', adminId, 'failed', emailError.message]);
            }

            // Small delay between emails
            if (i < users.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        } catch (transportError) {
          console.error('[Feedback Email] Transporter creation failed:', transportError.message);
        }

        console.log(`[Feedback Email] Background processing complete: ${sentCount} sent, ${failedCount} failed`);
      });
    });
  } catch (error) {
    console.error('Feedback email setup error:', error);
    res.status(500).json({ error: 'Email service not available: ' + error.message });
  }
});

// Send bulk email to all users - DISABLED
router.post('/email/all', requireAdmin, async (req, res) => {
  console.log('Bulk email to all users system is disabled - returning success without sending');
  res.json({ message: 'Bulk email to all users system is currently disabled for maintenance. Messages are logged but not sent.' });
});

// Get email history
router.get('/email/history', requireAdmin, (req, res) => {
  const { limit = 50, offset = 0 } = req.query;

  db.all(`SELECT eh.*, u.name as sent_by_name
          FROM email_history eh
          LEFT JOIN users u ON eh.sent_by = u.id
          ORDER BY eh.created_at DESC
          LIMIT ? OFFSET ?`,
    [parseInt(limit), parseInt(offset)], (err, history) => {
      if (err) return res.status(500).json({ error: err.message });

      // Get total count for pagination
      db.get('SELECT COUNT(*) as total FROM email_history', [], (countErr, countResult) => {
        if (countErr) return res.status(500).json({ error: countErr.message });

        res.json({
          history: history,
          total: countResult.total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        });
      });
    });
});

// Get email statistics
router.get('/email/stats', requireAdmin, (req, res) => {
  const queries = {
    total_emails: 'SELECT COUNT(*) as count FROM email_history',
    sent_emails: 'SELECT COUNT(*) as count FROM email_history WHERE status = "sent"',
    logged_emails: 'SELECT COUNT(*) as count FROM email_history WHERE status = "logged"',
    failed_emails: 'SELECT COUNT(*) as count FROM email_history WHERE status = "failed"',
    recent_emails: 'SELECT COUNT(*) as count FROM email_history WHERE created_at >= datetime("now", "-7 days")'
  };

  const results = {};
  let completed = 0;
  let responded = false;

  Object.keys(queries).forEach(key => {
    db.get(queries[key], [], (err, row) => {
      if (responded) return;
      if (err) {
        responded = true;
        console.error('Email stats error for', key, ':', err.message);
        return res.status(500).json({ error: err.message });
      }
      results[key] = row ? row.count : 0;
      completed++;
      if (completed === Object.keys(queries).length) {
        responded = true;
        res.json(results);
      }
    });
  });
});

// Coupon Winners System

// Generate unique coupon code
function generateCouponCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';

  // Generate 8-character code (e.g., SAVE2025)
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

// Ensure coupon code is unique
async function generateUniqueCouponCode() {
  let couponCode;
  let attempts = 0;

  do {
    couponCode = generateCouponCode();
    attempts++;

    if (attempts > 100) {
      // Add timestamp to ensure uniqueness
      couponCode = 'CHL' + Date.now().toString().slice(-4) + couponCode.slice(0, 4);
    }

    // Check if code exists in coupon_winners table
    const existing = await new Promise((resolve) => {
      db.get('SELECT id FROM coupon_winners WHERE coupon_code = ?', [couponCode], (err, row) => {
        resolve(row);
      });
    });

    if (!existing) {
      // Also check coupons table
      const existingCoupon = await new Promise((resolve) => {
        db.get('SELECT id FROM coupons WHERE code = ?', [couponCode], (err, row) => {
          resolve(row);
        });
      });

      if (!existingCoupon) {
        return couponCode;
      }
    }
  } while (attempts < 200);

  // Final fallback
  return 'CHL' + Date.now().toString().slice(-6);
}

// Get coupon winners
router.get('/coupon-winners', requireAdmin, (req, res) => {
  const { limit = 50, offset = 0 } = req.query;

  console.log('Fetching coupon winners, limit:', limit, 'offset:', offset);

  db.all(`SELECT cw.*, u.name as user_name, u.email as user_email, s.name as sent_by_name
          FROM coupon_winners cw
          LEFT JOIN users u ON cw.user_id = u.id
          LEFT JOIN users s ON cw.sent_by = s.id
          ORDER BY cw.created_at DESC
          LIMIT ? OFFSET ?`,
    [parseInt(limit), parseInt(offset)], (err, winners) => {
      if (err) {
        console.error('Error fetching coupon winners:', err);
        return res.status(500).json({ error: err.message });
      }

      console.log('Found', winners.length, 'coupon winners');

      // Get total count
      db.get('SELECT COUNT(*) as total FROM coupon_winners', [], (countErr, countResult) => {
        if (countErr) {
          console.error('Error getting coupon winners count:', countErr);
          return res.status(500).json({ error: countErr.message });
        }

        console.log('Total coupon winners count:', countResult.total);

        res.json({
          winners: winners,
          total: countResult.total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        });
      });
    });
});

// Send coupon codes to winners - MEMORY OPTIMIZED VERSION
router.post('/coupon-winners/send', requireAdmin, (req, res) => {
  const { user_ids, discount_amount, discount_type = 'fixed', max_discount, expiry_days = 30, winner_message = 'You have been selected as a coupon winner!' } = req.body;

  console.log('🎯 Received winner_message:', winner_message);
  console.log('🎯 Full request body:', req.body);

  console.log('Coupon winners request received:', { user_ids: user_ids?.length, discount_amount, discount_type });

  // Validate input
  if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
    return res.status(400).json({ error: 'User IDs array is required' });
  }

  if (!discount_amount || discount_amount <= 0) {
    return res.status(400).json({ error: 'Valid discount amount is required' });
  }

  if (!['fixed', 'percentage'].includes(discount_type)) {
    return res.status(400).json({ error: 'Discount type must be "fixed" or "percentage"' });
  }

  if (discount_type === 'percentage' && (discount_amount < 0 || discount_amount > 100)) {
    return res.status(400).json({ error: 'Percentage discount must be between 0 and 100' });
  }

  // Limit to prevent memory issues - reduce to 5 max
  if (user_ids.length > 5) {
    return res.status(400).json({ error: 'Cannot process more than 5 users at once. Please select fewer users.' });
  }

  console.log('🚀 Starting coupon winner creation for', user_ids.length, 'users:', user_ids);

  // Validate that user_ids array contains unique IDs only
  const uniqueUserIds = [...new Set(user_ids)];
  if (uniqueUserIds.length !== user_ids.length) {
    console.warn('⚠️ Duplicate user IDs detected, removing duplicates');
    user_ids = uniqueUserIds;
  }

  // Double check the limit
  if (user_ids.length > 5) {
    console.error('❌ Too many users selected:', user_ids.length);
    return res.status(400).json({ error: 'Cannot process more than 5 users at once. Please select fewer users.' });
  }

  console.log('✅ Final user list for processing:', user_ids.length, 'users');

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + parseInt(expiry_days));
  const adminId = req.user?.id || 1;

  // Get user details
  const placeholders = user_ids.map(() => '?').join(',');
  db.all(`SELECT id, name, email FROM users WHERE id IN (${placeholders})`, user_ids, (err, users) => {
    if (err) {
      console.error('Error getting users:', err);
      return res.status(500).json({ error: 'Failed to get user details: ' + err.message });
    }

    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'No valid users found' });
    }

    const results = [];
    const generatedCodes = [];
    let processed = 0;

    // Process each user synchronously to avoid memory issues
    const processUser = (userIndex) => {
      if (userIndex >= users.length) {
        // All done
        console.log('All coupon winners processed successfully');
        return res.json({
          message: `Individual coupon codes created for ${users.length} selected user${users.length > 1 ? 's' : ''}.`,
          total_users: users.length,
          results: results,
          discount_amount: discount_amount,
          discount_type: discount_type,
          expiry_date: expiryDate.toISOString(),
          generated_codes: generatedCodes,
          note: 'Codes are stored in database and can be viewed in history.'
        });
      }

      const user = users[userIndex];

      // Generate unique coupon code synchronously
      const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };

      let attempts = 0;
      const checkAndCreate = () => {
        attempts++;
        const couponCode = attempts > 50 ? 'CHL' + Date.now().toString().slice(-6) : generateCode();

        // Check if code exists
        db.get('SELECT id FROM coupons WHERE code = ? UNION SELECT id FROM coupon_winners WHERE coupon_code = ?',
          [couponCode, couponCode], (checkErr, existing) => {
            if (checkErr) {
              console.error('Error checking coupon code:', checkErr);
              results.push({ user: user.name, email: user.email, status: 'failed', error: 'Database error' });
              processUser(userIndex + 1);
              return;
            }

            if (existing && attempts < 100) {
              // Code exists, try again
              checkAndCreate();
              return;
            }

            // Code is unique, create coupon
            const couponDescription = `Individual discount for ${user.name} - ${discount_type === 'percentage' ? discount_amount + '% off' : '₹' + discount_amount + ' off'}`;

            db.run(`INSERT INTO coupons (code, description, discount_type, discount_value, min_purchase, max_discount, usage_limit, expiry_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [couponCode, couponDescription, discount_type, discount_amount, 0, max_discount, 1, expiryDate.toISOString()],
              function(couponErr) {
                if (couponErr) {
                  console.error('Error creating coupon:', couponErr);
                  results.push({ user: user.name, email: user.email, status: 'failed', error: 'Database error' });
                  processUser(userIndex + 1);
                  return;
                }

                const couponId = this.lastID;
                generatedCodes.push(couponCode);

                // Create winner record
                console.log('📝 Creating winner record for user:', user.email, 'coupon code:', couponCode);
                db.run(`INSERT INTO coupon_winners (user_id, coupon_code, discount_amount, discount_type, max_discount, expiry_date, sent_by, shared_coupon_id)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                  [user.id, couponCode, discount_amount, discount_type, max_discount, expiryDate.toISOString(), adminId, couponId],
                  function(winnerErr) {
                    console.log('🏆 Winner record callback executed for:', user.email);
                    if (winnerErr) {
                      console.error('❌ Error creating winner record:', winnerErr);
                      results.push({ user: user.name, email: user.email, coupon_code: couponCode, status: 'failed', error: 'Database error' });
                      processUser(userIndex + 1);
                    } else {
                      console.log('✅ Created coupon winner for:', user.email, 'Code:', couponCode);
                      results.push({ user: user.name, email: user.email, coupon_code: couponCode, status: 'recorded' });

                      // Send email to user
                      console.log('📧 About to create email transporter...');
                      createEmailTransporter().then(transporter => {
                        // Create the email HTML content
                        const emailHtml = `
                          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <div style="background: white; border: 1px solid #e9ecef; padding: 30px; text-align: center; border-radius: 15px 15px 0 0;">
                              <h1 style="color: black; margin: 0; font-size: 24px;">Chalchitra Series</h1>
                              <p style="color: #6c757d; margin: 10px 0 0 0;">Indian Institute of Technology Jammu</p>
                            </div>
                            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                              <h2 style="color: #333; margin-top: 0;">Congratulations ${user.name}!</h2>
                              <p style="color: #555; font-size: 16px; margin: 20px 0;">${winner_message}</p>

                              <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
                                <h3 style="color: #28a745; margin: 0; font-size: 18px;">Your Exclusive Coupon Code</h3>
                                <div style="font-size: 24px; font-weight: bold; color: #007bff; margin: 10px 0; letter-spacing: 2px;">${couponCode}</div>
                                <p style="color: #666; margin: 10px 0 0 0;">
                                  <strong>Discount:</strong> ${discount_type === 'percentage' ? discount_amount + '% off' : '₹' + discount_amount + ' off'}<br>
                                  <strong>Valid until:</strong> ${expiryDate.toLocaleDateString('en-IN')}
                                </p>
                              </div>

                              <p style="color: #555; line-height: 1.6;">
                                Use this coupon code during movie ticket booking on our website to avail your discount.
                                This code is unique to you and cannot be shared.
                              </p>

                              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                              <p style="color: #666; font-size: 14px; margin: 0;">
                                Best regards,<br>
                                <strong>Chalchitra Team</strong><br>
                                Indian Institute of Technology Jammu
                              </p>
                            </div>
                          </div>
                        `;

                        const mailOptions = {
                          from: `"Chalchitra IIT Jammu" <${process.env.EMAIL_USER}>`,
                          to: user.email,
                          subject: 'Your Exclusive Chalchitra Coupon Code!',
                          html: emailHtml
                        };

                        console.log('🔄 Attempting to send email to:', user.email, 'with coupon code:', couponCode);
                        console.log('📧 Email configuration - User:', process.env.EMAIL_USER, 'Pass length:', process.env.EMAIL_PASS?.length);

                        transporter.sendMail(mailOptions, (emailErr, info) => {
                          if (emailErr) {
                            console.error('❌ FAILED to send coupon email to', user.email, ':', emailErr.message);
                            console.error('📧 Email error code:', emailErr.code);
                            console.error('📧 Email error response:', emailErr.response);
                            results.push({ user: user.name, email: user.email, coupon_code: couponCode, status: 'email_failed', email_error: emailErr.message });

                            // Delete the coupon and winner record since email failed
                            db.run('DELETE FROM coupons WHERE id = ?', [couponId], (deleteCouponErr) => {
                              if (deleteCouponErr) console.error('Error deleting failed coupon:', deleteCouponErr);
                            });
                            db.run('DELETE FROM coupon_winners WHERE user_id = ? AND coupon_code = ?', [user.id, couponCode], (deleteWinnerErr) => {
                              if (deleteWinnerErr) console.error('Error deleting failed winner:', deleteWinnerErr);
                            });
                          } else {
                            console.log('✅ Email sent successfully to:', user.email, 'Message ID:', info.messageId);
                            console.log('📧 Email accepted by server:', info.accepted);
                            results.push({ user: user.name, email: user.email, coupon_code: couponCode, status: 'sent' });
                          }
                          processUser(userIndex + 1);
                        });
                      }).catch(emailSetupErr => {
                        console.error('❌ Error setting up email transporter:', emailSetupErr);
                        results.push({ user: user.name, email: user.email, coupon_code: couponCode, status: 'email_failed', email_error: emailSetupErr.message });
                        processUser(userIndex + 1);
                      });
                    }
                  });
              });
          });
      };

      checkAndCreate();
    };

    // Start processing
    processUser(0);
  });
});

// Validate coupon winner code during booking
router.post('/validate-coupon-winner', (req, res) => {
  const { code, user_id } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Coupon code is required' });
  }

  db.get(`SELECT * FROM coupon_winners
          WHERE coupon_code = ? AND user_id = ? AND is_used = 0
          AND (expiry_date IS NULL OR expiry_date > datetime('now'))`,
    [code.toUpperCase(), user_id], (err, coupon) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!coupon) return res.status(400).json({ error: 'Invalid, expired, or already used coupon code' });

      // Calculate discount
      let discount = 0;
      if (coupon.discount_type === 'percentage') {
        // This will be calculated on frontend with total amount
        discount = coupon.discount_amount; // percentage
      } else {
        discount = coupon.discount_amount; // fixed amount
      }

      res.json({
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.coupon_code,
          discount_type: coupon.discount_type,
          discount_amount: coupon.discount_amount,
          max_discount: coupon.max_discount,
          discount: discount,
          expiry_date: coupon.expiry_date
        }
      });
    });
});

// Send ticket email to customer (DISABLED - no longer used)
/*
router.post('/email/ticket', async (req, res) => {
  const { booking_id, customer_email, customer_name, movie_title, movie_date, movie_venue, selected_seats, total_amount, payment_id } = req.body;

  if (!booking_id || !customer_email || !customer_name || !movie_title) {
    return res.status(400).json({ error: 'Booking ID, customer email, customer name, and movie title are required' });
  }

  try {
    // Get movie poster and QR code from database
    const movieData = await new Promise((resolve) => {
      db.get('SELECT poster_url FROM movies WHERE title = ?', [movie_title], (err, row) => {
        if (err) resolve({ poster_url: '/placeholder-movie.jpg' });
        else resolve({ poster_url: row?.poster_url || '/placeholder-movie.jpg' });
      });
    });

    // Get booking QR code
    const bookingData = await new Promise((resolve) => {
      db.get('SELECT qr_code FROM bookings WHERE booking_code = ?', [booking_id], (err, row) => {
        if (err) resolve({ qr_code: null });
        else resolve({ qr_code: row?.qr_code || null });
      });
    });

    const transporter = createEmailTransporter();

    const mailOptions = {
      from: `"Chalchitra IIT Jammu" <${process.env.EMAIL_USER}>`,
      to: customer_email,
      subject: `🎫 Your Movie Ticket - ${movie_title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Movie Ticket - ${movie_title}</title>
        </head>
        <body style="margin: 0; padding: 20px; background: #f5f5f5; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">

            <!-- Header -->
            <div style="background: white; padding: 20px; text-align: center; border-bottom: 1px solid #eee;">
              <h1 style="margin: 0; color: #000; font-size: 24px; font-weight: bold;">CHALCHITRA SERIES</h1>
              <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">IIT Jammu Movie Screening</p>
            </div>

            <!-- Ticket Content -->
            <div style="padding: 20px;">
              <!-- Logos -->
              <div style="position: relative; margin-bottom: 20px;">
                <div style="position: absolute; top: 0; left: 0;">
                  <img src="http://localhost:3000/newlogo.png" style="width: 70px; height: 70px; object-fit: contain;" alt="Chalchitra Logo" />
                </div>
                <div style="position: absolute; top: 0; right: 0;">
                  <img src="http://localhost:3000/iitjammu-logo.png" style="width: 120px; height: 50px; object-fit: contain;" alt="IIT Jammu Logo" />
                </div>
                <div style="text-align: center; padding: 20px 120px 10px;">
                  <h2 style="color: #000; font-size: 20px; font-weight: bold; margin: 0;">${movie_title}</h2>
                </div>
              </div>

              <!-- Content Layout -->
              <div style="display: flex; align-items: flex-start; margin-bottom: 20px; gap: 20px;">

                <!-- Movie Poster -->
                <div style="flex: 0 0 auto; margin-left: 30px;">
                  <img src="http://localhost:3000${movieData.poster_url.startsWith('http') ? movieData.poster_url : movieData.poster_url}"
                       style="width: 160px; height: 160px; object-fit: contain; border: 2px solid #000; box-shadow: 0 4px 8px rgba(0,0,0,0.2);"
                       alt="${movie_title}" />
                </div>

                <!-- Details -->
                <div style="flex: 1; text-align: left;">
                  <div style="font-size: 13px; color: #333; line-height: 1.5;">
                    <p style="margin: 6px 0;"><strong>Date:</strong> ${new Date(movie_date).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}</p>
                    <p style="margin: 6px 0;"><strong>Time:</strong> ${new Date(movie_date).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                    <p style="margin: 6px 0;"><strong>Venue:</strong> ${movie_venue}</p>
                    <p style="margin: 6px 0;"><strong>Seats:</strong> ${selected_seats.join(', ')}</p>
                    <p style="margin: 6px 0;"><strong>Tickets:</strong> ${selected_seats.length}</p>
                    <p style="margin: 6px 0;"><strong>Booking ID:</strong> ${booking_id}</p>
                  </div>
                </div>

                <!-- QR Code -->
                <div style="flex: 0 0 auto; text-align: center; margin-right: 30px;">
                  <div style="display: inline-block; padding: 8px; background: white;">
                    ${bookingData.qr_code && bookingData.qr_code.trim() !== '' ?
                      '<img src="' + bookingData.qr_code + '" style="width: 140px; height: 140px; object-fit: contain; display: block;" alt="QR Code" />' :
                      '<div style="width: 140px; height: 140px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666; font-weight: bold;">QR CODE<br/>NOT FOUND</div>'
                    }
                  </div>
                  <p style="margin: 5px 0 0 0; font-size: 9px; color: #666; font-weight: bold;">Scan for Entry</p>
                </div>
              </div>

              <!-- Terms -->
              <div style="font-size: 9px; color: #666; text-align: center; border-top: 1px solid #ccc; padding-top: 10px;">
                <p style="margin: 0;">
                  <strong>Terms:</strong> Valid only for specified date/time/seat. Student ID required.
                  No refunds. Chalchitra IIT Jammu reserves all rights.
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                Best regards,<br>
                <strong>Chalchitra Team</strong><br>
                Indian Institute of Technology Jammu
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);

    // Log email history
    db.run(`INSERT INTO email_history (email_type, recipient_email, recipient_name, subject, message, sent_by, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['ticket', customer_email, customer_name, mailOptions.subject, 'Ticket details sent', req.user?.id || 1, 'sent'],
      function(err) {
        if (err) console.error('Error logging ticket email history:', err);
      });

    console.log('Ticket email sent successfully to:', customer_email);
    res.json({ message: 'Ticket email sent successfully!' });

  } catch (error) {
    console.error('Ticket email sending error:', error);

    // Log failed email
    db.run(`INSERT INTO email_history (email_type, recipient_email, recipient_name, subject, message, sent_by, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['ticket', customer_email, customer_name, `🎫 Your Movie Ticket - ${movie_title}`, 'Ticket details failed to send', req.user?.id || 1, 'failed'],
      function(err) {
        if (err) console.error('Error logging failed ticket email:', err);
      });

    res.status(500).json({ error: 'Failed to send ticket email. Please try again later.' });
  }
});*/

// Generate ticket PDF on server side (more reliable)
router.get('/ticket-pdf/:bookingId', requireAuth, (req, res) => {
  const bookingId = req.params.bookingId;

  console.log('Generating ticket PDF for booking:', bookingId);

  // Get booking details with movie info
  db.get(`
    SELECT b.*, m.title, m.date as movie_date, m.venue, m.poster_url
    FROM bookings b
    JOIN movies m ON b.movie_id = m.id
    WHERE b.id = ? AND b.user_id = ?
  `, [bookingId, req.user.id], (err, booking) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Create a very basic text file as PDF fallback
    console.log('Creating basic ticket text file...');

    const ticketContent = `
CHALCHITRA SERIES
IIT Jammu Movie Screening

MOVIE TICKET

${'='.repeat(50)}

Movie: ${booking.title}

Date: ${booking.movie_date ? new Date(booking.movie_date).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) : 'N/A'}

Time: ${booking.movie_date ? new Date(booking.movie_date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    }) : 'N/A'}

Venue: ${booking.venue}

Seats: ${booking.selected_seats ? JSON.parse(booking.selected_seats).join(', ') : 'N/A'}

Tickets: ${booking.num_people || 1}

Booking ID: ${booking.booking_code || booking.id}

Amount Paid: ₹${booking.total_price || 0}

${'='.repeat(50)}

ENTRY QR CODE
[QR CODE PLACEHOLDER - Please check email for actual QR code]

Scan this code at the entrance for entry.

${'='.repeat(50)}

TERMS & CONDITIONS:
• Valid only for specified date, time and seats
• Student ID card required for entry
• Tickets are non-transferable and non-refundable
• Chalchitra IIT Jammu reserves all rights

${'='.repeat(50)}

Best regards,
Chalchitra Team
Indian Institute of Technology Jammu

Generated on: ${new Date().toLocaleString('en-IN')}
    `;

    console.log('Ticket content created successfully');

    // Generate filename
    const movieName = (booking.title || 'MOVIE').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    const bookingCode = booking.booking_code || booking.id;
    const filename = movieName + '_' + bookingCode + '.txt';

    console.log('Sending text file response...');
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(ticketContent.trim());

  });
});

// ==================== PERMISSION MANAGEMENT ENDPOINTS ====================

// Get all admin users (for permission management)
router.get('/permission-admins', requireAdmin, (req, res) => {
  console.log('🔍 Fetching admin users for permission management...');
  
  // Get all admin users with their permissions
  db.all(`
    SELECT u.id, u.name, u.email, u.is_admin, u.code_scanner, u.admin_tag,
           ap.allowed_tabs, ap.created_at, ap.updated_at,
           creator.name as created_by_name
    FROM users u
    LEFT JOIN admin_permissions ap ON u.id = ap.admin_user_id
    LEFT JOIN users creator ON ap.created_by = creator.id
    WHERE u.is_admin = 1
    ORDER BY u.name
  `, [], (err, admins) => {
    if (err) {
      console.error('❌ Error fetching admin users:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log('✅ Found', admins?.length || 0, 'admin users');
    console.log('📋 Raw admin data:', JSON.stringify(admins, null, 2));
    
    // Parse allowed_tabs JSON for each admin
    const result = admins.map(admin => ({
      ...admin,
      allowed_tabs: admin.allowed_tabs ? JSON.parse(admin.allowed_tabs) : []
    }));
    
    console.log('📋 Admin users with parsed tabs:', result.map(a => ({ id: a.id, name: a.name, email: a.email, admin_tag: a.admin_tag })));
    
    res.json(result);
  });
});

// Get permissions for a specific admin
router.get('/permissions/:adminId', requireAdmin, (req, res) => {
  const adminId = req.params.adminId;
  
  db.get(`
    SELECT ap.*, u.name, u.email,
           creator.name as created_by_name
    FROM admin_permissions ap
    JOIN users u ON ap.admin_user_id = u.id
    LEFT JOIN users creator ON ap.created_by = creator.id
    WHERE ap.admin_user_id = ?
  `, [adminId], (err, permissions) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (!permissions) {
      // Return default permissions (all tabs except config)
      const defaultTabs = [
        'dashboard', 'movies', 'foods', 'bookings', 'users', 
        'team', 'gallery', 'coupons', 'coupon-winners', 'feedback', 'mail', 'settings'
      ];
      return res.json({
        admin_user_id: adminId,
        allowed_tabs: defaultTabs,
        is_default: true
      });
    }
    
    res.json({
      ...permissions,
      allowed_tabs: permissions.allowed_tabs ? JSON.parse(permissions.allowed_tabs) : []
    });
  });
});

// Update permissions for an admin
router.put('/permissions/:adminId', requireAdmin, (req, res) => {
  const adminId = req.params.adminId;
  const { allowed_tabs } = req.body;
  
  if (!Array.isArray(allowed_tabs)) {
    return res.status(400).json({ error: 'allowed_tabs must be an array' });
  }
  
  // Validate all tabs are valid
  const validTabs = ['dashboard', 'movies', 'foods', 'bookings', 'users', 'team', 'gallery', 'coupons', 'coupon-winners', 'feedback', 'mail', 'settings', 'config'];
  const invalidTabs = allowed_tabs.filter(tab => !validTabs.includes(tab));
  
  if (invalidTabs.length > 0) {
    return res.status(400).json({ error: `Invalid tabs: ${invalidTabs.join(', ')}` });
  }
  
  const currentUserId = req.user?.id || req.session?.adminUser?.id;
  
  // Check if permissions record exists
  db.get('SELECT id FROM admin_permissions WHERE admin_user_id = ?', [adminId], (err, existing) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const tabsJson = JSON.stringify(allowed_tabs);
    
    if (existing) {
      // Update existing permissions
      db.run(`
        UPDATE admin_permissions 
        SET allowed_tabs = ?, updated_at = CURRENT_TIMESTAMP, created_by = ?
        WHERE admin_user_id = ?
      `, [tabsJson, currentUserId, adminId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Update scanner permission based on config tab access
        const hasConfigAccess = allowed_tabs.includes('config');
        db.run('UPDATE users SET code_scanner = ? WHERE id = ?', [hasConfigAccess ? 1 : 0, adminId], (scannerErr) => {
          if (scannerErr) {
            console.error('Error updating scanner permission:', scannerErr);
            // Don't fail the entire request, just log the error
          }
        });
        
        res.json({ 
          message: 'Permissions updated successfully',
          changes: this.changes 
        });
      });
    } else {
      // Create new permissions record
      db.run(`
        INSERT INTO admin_permissions (admin_user_id, allowed_tabs, created_by)
        VALUES (?, ?, ?)
      `, [adminId, tabsJson, currentUserId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Update scanner permission based on config tab access
        const hasConfigAccess = allowed_tabs.includes('config');
        db.run('UPDATE users SET code_scanner = ? WHERE id = ?', [hasConfigAccess ? 1 : 0, adminId], (scannerErr) => {
          if (scannerErr) {
            console.error('Error updating scanner permission:', scannerErr);
            // Don't fail the entire request, just log the error
          }
        });
        
        res.json({ 
          message: 'Permissions created successfully',
          id: this.lastID 
        });
      });
    }
  });
});

// Get current user's permissions (for frontend access control)
router.get('/my-permissions', requireAdmin, (req, res) => {
  const userId = req.user?.id || req.session?.adminUser?.id;
  
  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  
  // First check if this is the super admin (config access)
  db.get('SELECT email, code_scanner FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Super admin always has full access
    if (user.email === '2025uee0154@iitjammu.ac.in') {
      const allTabs = [
        'dashboard', 'movies', 'foods', 'bookings', 'users', 
        'team', 'gallery', 'coupons', 'coupon-winners', 'feedback', 'mail', 'settings', 'config'
      ];
      return res.json({
        is_super_admin: true,
        allowed_tabs: allTabs,
        can_manage_permissions: true
      });
    }
    
    // Check custom permissions
    db.get('SELECT allowed_tabs FROM admin_permissions WHERE admin_user_id = ?', [userId], (permErr, permissions) => {
      if (permErr) return res.status(500).json({ error: permErr.message });
      
      if (!permissions) {
        // No custom permissions, give default access (all tabs except config)
        const defaultTabs = [
          'dashboard', 'movies', 'foods', 'bookings', 'users', 
          'team', 'gallery', 'coupons', 'coupon-winners', 'feedback', 'mail', 'settings'
        ];
        return res.json({
          is_super_admin: false,
          allowed_tabs: defaultTabs,
          can_manage_permissions: false
        });
      }
      
      res.json({
        is_super_admin: false,
        allowed_tabs: JSON.parse(permissions.allowed_tabs),
        can_manage_permissions: permissions.allowed_tabs.includes('config')
      });
    });
  });
});

// Get all available tabs (for UI reference)
router.get('/available-tabs', requireAdmin, (req, res) => {
  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊', description: 'View statistics and overview' },
    { id: 'movies', name: 'Movies', icon: '🎬', description: 'Manage movie listings' },
    { id: 'foods', name: 'Foods', icon: '🍿', description: 'Manage food items' },
    { id: 'bookings', name: 'Bookings', icon: '🎫', description: 'View and manage bookings' },
    { id: 'users', name: 'Users', icon: '👥', description: 'Manage user accounts' },
    { id: 'team', name: 'Team', icon: '👨‍💼', description: 'Manage team members' },
    { id: 'gallery', name: 'Gallery', icon: '🖼️', description: 'Manage gallery images' },
    { id: 'coupons', name: 'Coupons', icon: '🎟️', description: 'Manage discount coupons' },
    { id: 'coupon-winners', name: 'Winners', icon: '🏆', description: 'Manage coupon winners' },
    { id: 'feedback', name: 'Feedback', icon: '💬', description: 'View user feedback' },
    { id: 'mail', name: 'Mail', icon: '📧', description: 'Send emails to users' },
    { id: 'settings', name: 'Settings', icon: '⚙️', description: 'Website settings' },
    { id: 'config', name: 'Config', icon: '🔧', description: 'System configuration (Super Admin only)' }
  ];
  
  res.json(tabs);
});

// Delete coupon winners
router.delete('/coupon-winners', requireAdmin, (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Winner IDs array is required' });
  }

  // Don't allow deleting super admin's winners
  const placeholders = ids.map(() => '?').join(',');
  db.run(`DELETE FROM coupon_winners WHERE id IN (${placeholders})`, ids, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: `${this.changes} winner(s) deleted successfully` });
  });
});

// Reset permissions to default for an admin
router.delete('/permissions/:adminId', requireAdmin, (req, res) => {
  const adminId = req.params.adminId;
  
  // Don't allow removing super admin's permissions
  db.get('SELECT email FROM users WHERE id = ?', [adminId], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (user.email === '2025uee0154@iitjammu.ac.in') {
      return res.status(400).json({ error: 'Cannot reset permissions for super admin' });
    }
    
    db.run('DELETE FROM admin_permissions WHERE admin_user_id = ?', [adminId], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      res.json({ 
        message: 'Permissions reset to default',
        changes: this.changes 
      });
    });
  });
});

// ==================== MAIL SETTINGS ENDPOINTS ====================

// Get mail settings
router.get('/mail-settings', requireAdmin, (req, res) => {
  // First check if this is the super admin
  db.get('SELECT email FROM users WHERE id = ?', [req.user?.id || req.session?.adminUser?.id], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Only super admin can access mail settings
    if (!user || user.email !== '2025uee0154@iitjammu.ac.in') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    // Create table if not exists
    db.run(`CREATE TABLE IF NOT EXISTS mail_settings (
      id INTEGER PRIMARY KEY,
      email_host TEXT NOT NULL DEFAULT 'smtp.gmail.com',
      email_port INTEGER DEFAULT 587,
      email_user TEXT,
      email_pass TEXT,
      sender_name TEXT DEFAULT 'Chalchitra IIT Jammu',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (tableErr) => {
      if (tableErr) return res.status(500).json({ error: tableErr.message });

      db.get('SELECT * FROM mail_settings WHERE id = 1', (getErr, settings) => {
        if (getErr) return res.status(500).json({ error: getErr.message });
        
        if (!settings) {
          // Return environment variables as default or fallback values
          return res.json({
            id: 1,
            email_host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            email_port: parseInt(process.env.EMAIL_PORT) || 587,
            email_user: process.env.EMAIL_USER || '',
            email_pass: '',
            sender_name: process.env.SENDER_NAME || 'Chalchitra IIT Jammu'
          });
        }
        
        // Don't return the actual password for security
        res.json({
          ...settings,
          email_pass: settings.email_pass ? '••••••••' : ''
        });
      });
    });
  });
});

// Update mail settings
router.put('/mail-settings', requireAdmin, (req, res) => {
  const { email_host, email_port, email_user, email_pass, sender_name } = req.body;
  
  // First check if this is the super admin
  db.get('SELECT email FROM users WHERE id = ?', [req.user?.id || req.session?.adminUser?.id], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Only super admin can update mail settings
    if (!user || user.email !== '2025uee0154@iitjammu.ac.in') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    if (!email_host || !email_port || !email_user || !sender_name) {
      return res.status(400).json({ error: 'Email host, port, user, and sender name are required' });
    }

    // Create table if not exists
    db.run(`CREATE TABLE IF NOT EXISTS mail_settings (
      id INTEGER PRIMARY KEY,
      email_host TEXT NOT NULL DEFAULT 'smtp.gmail.com',
      email_port INTEGER DEFAULT 587,
      email_user TEXT,
      email_pass TEXT,
      sender_name TEXT DEFAULT 'Chalchitra IIT Jammu',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (tableErr) => {
      if (tableErr) return res.status(500).json({ error: tableErr.message });

      // Check if settings exist
      db.get('SELECT id FROM mail_settings WHERE id = 1', (checkErr, existing) => {
        if (checkErr) return res.status(500).json({ error: checkErr.message });

        // Only update password if it's not masked (i.e., user actually entered a new password)
        const passwordValue = email_pass === '••••••••' ? null : email_pass;

        if (existing) {
          // Update existing settings
          let query = 'UPDATE mail_settings SET email_host = ?, email_port = ?, email_user = ?, sender_name = ?, updated_at = CURRENT_TIMESTAMP';
          let params = [email_host, email_port, email_user, sender_name];
          
          if (passwordValue !== null) {
            query += ', email_pass = ?';
            params.push(passwordValue);
          }
          
          query += ' WHERE id = 1';
          
          db.run(query, params, function(updateErr) {
            if (updateErr) return res.status(500).json({ error: updateErr.message });
            res.json({ message: 'Mail settings updated successfully', changes: this.changes });
          });
        } else {
          // Insert new settings
          db.run(`INSERT INTO mail_settings (id, email_host, email_port, email_user, email_pass, sender_name)
                  VALUES (1, ?, ?, ?, ?, ?)`,
            [email_host, email_port, email_user, passwordValue || '', sender_name],
            function(insertErr) {
              if (insertErr) return res.status(500).json({ error: insertErr.message });
              res.json({ message: 'Mail settings created successfully', id: this.lastID });
            });
        }
      });
    });
  });
});

// Test email configuration
router.post('/mail-settings/test', requireAdmin, async (req, res) => {
  const { email_host, email_port, email_user, email_pass, sender_name } = req.body;
  
  // First check if this is the super admin
  db.get('SELECT email FROM users WHERE id = ?', [req.user?.id || req.session?.adminUser?.id], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Only super admin can test mail settings
    if (!user || user.email !== '2025uee0154@iitjammu.ac.in') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    if (!email_host || !email_port || !email_user || !email_pass || !sender_name) {
      return res.status(400).json({ error: 'All fields are required for testing' });
    }

    try {
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransport({
        host: email_host,
        port: 587,//parseInt(email_port),
        secure: false,//email_port === 465, // true for 465, false for other ports
        auth: {
          user: email_user,
          pass: email_pass
        }
      });

      // Test connection
      await transporter.verify();
      
      // Send test email
      const info = await transporter.sendMail({
        from: `"${sender_name}" <${email_user}>`,
        to: email_user, // Send to self for testing
        subject: 'Chalchitra - Mail Configuration Test',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; padding: 20px;">
              <h1 style="color: #28a745;">✓ Mail Configuration Successful!</h1>
              <p>This is a test email to confirm your mail settings are working correctly.</p>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>SMTP Host:</strong> ${email_host}</p>
                <p style="margin: 5px 0;"><strong>Port:</strong> ${email_port}</p>
                <p style="margin: 5px 0;"><strong>Sender:</strong> ${sender_name}</p>
              </div>
              <p style="color: #666;">If you received this email, your mail configuration is working correctly!</p>
            </div>
          </div>
        `
      });

      console.log('Test email sent successfully:', info.messageId);
      res.json({ 
        message: 'Test email sent successfully!',
        message_id: info.messageId
      });
    } catch (error) {
      console.error('Mail test failed:', error);
      res.status(500).json({ 
        error: 'Failed to send test email',
        details: error.message,
        hint: 'Make sure your App Password is correct. For Gmail, you need to use an App Password, not your regular password.'
      });
    }
  });
});

// ===== RAZORPAY SETTINGS =====

// Get Razorpay settings
router.get('/razorpay-settings', requireAdmin, (req, res) => {
  // First check if this is the super admin
  db.get('SELECT email FROM users WHERE id = ?', [req.user?.id || req.session?.adminUser?.id], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Only super admin can access razorpay settings
    if (!user || user.email !== '2025uee0154@iitjammu.ac.in') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    // Create table if not exists
    db.run(`CREATE TABLE IF NOT EXISTS razorpay_settings (
      id INTEGER PRIMARY KEY,
      key_id TEXT,
      key_secret TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (tableErr) => {
      if (tableErr) return res.status(500).json({ error: tableErr.message });

      db.get('SELECT * FROM razorpay_settings WHERE id = 1', (getErr, settings) => {
        if (getErr) return res.status(500).json({ error: getErr.message });
        
        if (!settings) {
          // Return environment variables as default or fallback values
          return res.json({
            id: 1,
            key_id: process.env.RAZORPAY_KEY_ID || '',
            key_secret: process.env.RAZORPAY_KEY_SECRET ? '••••••••' : '',
            has_secret: !!process.env.RAZORPAY_KEY_SECRET
          });
        }
        
        // Don't return the actual secret for security - mask it
        res.json({
          id: settings.id,
          key_id: settings.key_id || '',
          key_secret: settings.key_secret ? '••••••••' : '',
          has_secret: !!settings.key_secret
        });
      });
    });
  });
});

// Update Razorpay settings
router.put('/razorpay-settings', requireAdmin, (req, res) => {
  // First check if this is the super admin
  db.get('SELECT email FROM users WHERE id = ?', [req.user?.id || req.session?.adminUser?.id], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Only super admin can update razorpay settings
    if (!user || user.email !== '2025uee0154@iitjammu.ac.in') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const { key_id, key_secret } = req.body;

    // Create table if not exists
    db.run(`CREATE TABLE IF NOT EXISTS razorpay_settings (
      id INTEGER PRIMARY KEY,
      key_id TEXT,
      key_secret TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (tableErr) => {
      if (tableErr) return res.status(500).json({ error: tableErr.message });

      db.get('SELECT id, key_secret FROM razorpay_settings WHERE id = 1', (checkErr, existing) => {
        if (checkErr) return res.status(500).json({ error: checkErr.message });

        if (existing) {
          // Update existing settings
          // Only update secret if it's not the masked value
          let query = 'UPDATE razorpay_settings SET key_id = ?, updated_at = CURRENT_TIMESTAMP';
          let params = [key_id];
          
          if (key_secret && key_secret !== '••••••••') {
            query = 'UPDATE razorpay_settings SET key_id = ?, key_secret = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1';
            params = [key_id, key_secret];
          } else {
            query += ' WHERE id = 1';
          }
          
          db.run(query, params, function(updateErr) {
            if (updateErr) return res.status(500).json({ error: updateErr.message });
            res.json({ message: 'Razorpay settings updated successfully', changes: this.changes });
          });
        } else {
          db.run(`INSERT INTO razorpay_settings (id, key_id, key_secret)
                  VALUES (1, ?, ?)`,
            [key_id, key_secret !== '••••••••' ? key_secret : ''],
            function(insertErr) {
              if (insertErr) return res.status(500).json({ error: insertErr.message });
              res.json({ message: 'Razorpay settings created successfully', id: this.lastID });
            }
          );
        }
      });
    });
  });
});

module.exports = router;
