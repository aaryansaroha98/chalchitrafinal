const express = require('express');
const db = require('../database');
const QRCode = require('qrcode');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const jsPDF = require('jspdf');
const nodemailer = require('nodemailer');

const router = express.Router();

const createEmailTransporter = () => new Promise((resolve, reject) => {
  db.get('SELECT * FROM mail_settings WHERE id = 1', (err, dbSettings) => {
    if (err) {
      console.error('Error fetching mail settings from database:', err);
      console.log('Falling back to environment variables for email config');
    }

    const emailUser = (dbSettings?.email_user) || process.env.EMAIL_USER;
    // Skip db password if it looks masked (admin panel sends '••••••••' placeholder)
    const dbPass = dbSettings?.email_pass;
    const emailPass = (dbPass && dbPass !== '••••••••' && dbPass.length > 0) ? dbPass : process.env.EMAIL_PASS;

    console.log(`[Email Config] user=${emailUser ? emailUser.substring(0,4) + '***' : 'NOT SET'}, pass=${emailPass ? '***SET***' : 'NOT SET'}, source=${dbSettings ? 'db+env' : 'env-only'}`);

    if (!emailUser || !emailPass) {
      return reject(new Error(`Email credentials not configured (user=${!!emailUser}, pass=${!!emailPass})`));
    }

    // Use service:'gmail' — works for @gmail.com AND Google Workspace domains
    // Uses port 465 SSL by default, which is more reliable on Render than 587 STARTTLS
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      },
      // Generous timeouts for Render free tier cold starts
      connectionTimeout: 120000,
      greetingTimeout: 60000,
      socketTimeout: 120000,
      pool: false,
      tls: {
        rejectUnauthorized: false
      }
    });

    resolve({ transporter, settings: dbSettings || {} });
  });
});

// Helper: send email with retry
async function sendMailWithRetry(transporter, mailOptions, maxRetries = 2) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Email] Attempt ${attempt}/${maxRetries}...`);
      const result = await transporter.sendMail(mailOptions);
      return result;
    } catch (err) {
      lastError = err;
      console.error(`[Email] Attempt ${attempt} failed: ${err.message} (code: ${err.code})`);
      if (attempt < maxRetries) {
        // Wait 2 seconds before retry
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
  throw lastError;
}

// Generate 8-character alphanumeric booking ID with flow
function generateBookingId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';

  // Pattern: 2 letters + 4 numbers + 2 letters (e.g., CHL123AB)
  // First 2: Letters
  for (let i = 0; i < 2; i++) {
    result += chars.charAt(Math.floor(Math.random() * 26)); // Only letters for first 2
  }

  // Next 4: Numbers
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(26 + Math.floor(Math.random() * 10)); // Only numbers
  }

  // Last 2: Letters
  for (let i = 0; i < 2; i++) {
    result += chars.charAt(Math.floor(Math.random() * 26)); // Only letters for last 2
  }

  return result;
}

// Ensure booking ID is unique
async function generateUniqueBookingId() {
  let bookingId;
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 100) {
    bookingId = generateBookingId();

    // Check if this ID already exists
    const existing = await new Promise((resolve) => {
      db.get('SELECT id FROM bookings WHERE booking_code = ?', [bookingId], (err, row) => {
        resolve(row);
      });
    });

    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    // Fallback to timestamp-based ID if we can't generate unique random
    bookingId = 'CHL' + Date.now().toString().slice(-5) + 'XX';
  }

  return bookingId;
}

// Get occupied seats for a movie
router.get('/occupied/:movieId', (req, res) => {
  const movieId = req.params.movieId;

  db.all('SELECT selected_seats FROM bookings WHERE movie_id = ? AND selected_seats IS NOT NULL', [movieId], (err, bookings) => {
    if (err) return res.status(500).json({ error: err.message });

    const occupiedSeats = [];
    bookings.forEach(booking => {
      try {
        const seats = JSON.parse(booking.selected_seats);
        occupiedSeats.push(...seats);
      } catch (e) {
        // Ignore invalid JSON
      }
    });

    res.json({ occupied_seats: occupiedSeats });
  });
});

// Create booking
router.post('/', async (req, res) => {
  // Temporarily allow booking without authentication for testing
  // if (!req.user) return res.status(401).json({ error: 'Authentication required' });

  const { movie_id, selectedSeats, food_option, coupon_code } = req.body;
  const num_people = selectedSeats ? selectedSeats.length : 0;

  // Validate selectedSeats - allow 1-6 seats for group bookings
  if (!selectedSeats || selectedSeats.length === 0) return res.status(400).json({ error: 'Please select at least one seat' });
  if (selectedSeats.length > 6) return res.status(400).json({ error: 'Maximum 6 seats allowed per booking' });

  // Check if any selected seats are already booked
  db.all('SELECT selected_seats FROM bookings WHERE movie_id = ? AND selected_seats IS NOT NULL', [movie_id], (err, bookings) => {
    if (err) return res.status(500).json({ error: err.message });

    const occupiedSeats = [];
    bookings.forEach(booking => {
      try {
        const seats = JSON.parse(booking.selected_seats);
        occupiedSeats.push(...seats);
      } catch (e) {
        // Ignore invalid JSON
      }
    });

    const conflictingSeats = selectedSeats.filter(seat => occupiedSeats.includes(seat));
    if (conflictingSeats.length > 0) {
      return res.status(400).json({ error: `Seats ${conflictingSeats.join(', ')} are already booked` });
    }

    // Validate num_people <= 6
    if (num_people > 6) return res.status(400).json({ error: 'Maximum 6 people allowed' });

    // Get movie details
    db.get('SELECT * FROM movies WHERE id = ? AND is_upcoming = 1', [movie_id], (err, movie) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!movie) return res.status(404).json({ error: 'Movie not found or not upcoming' });

      // Calculate food cost
      let food_cost = 0;
      if (req.body.food_orders && Object.keys(req.body.food_orders).length > 0) {
        const foodOrders = req.body.food_orders;
        // Calculate food cost based on food prices
        const foodPrices = {
          1: 50, // Popcorn
          2: 30, // Soda
          3: 80, // Combo Meal
          4: 60, // Nachos
          5: 20, // Candy
        };

        for (const [foodId, quantity] of Object.entries(foodOrders)) {
          const price = foodPrices[foodId] || 30; // default price
          food_cost += price * quantity;
        }
      }

      const total_price = (num_people * movie.price) + food_cost;

      // Get user details for QR code (use dummy data if not authenticated)
      const userId = req.user ? req.user.id : 1; // Default to user ID 1 for testing
      let studentName = 'Test Student';
      let studentEmail = 'test@iitjammu.ac.in';

      if (req.user) {
        // Get user details for QR code
        db.get('SELECT name, email FROM users WHERE id = ?', [req.user.id], (err, user) => {
          if (err) return res.status(500).json({ error: err.message });

          if (user) {
            studentName = user.name;
            if (!studentName || studentName.trim() === '') {
              const emailParts = user.email.split('@');
              studentName = emailParts[0] || 'Student';
              studentName = studentName.charAt(0).toUpperCase() + studentName.slice(1);
            }
            studentEmail = user.email;
          }

          createBooking();
        });
      } else {
        createBooking();
      }

      async function createBooking() {
        try {
          // Generate unique 8-character booking ID
          const customBookingId = await generateUniqueBookingId();
          console.log('Generated custom booking ID:', customBookingId);

          // Insert booking with custom booking code
          db.run('INSERT INTO bookings (user_id, movie_id, num_people, food_option, coupon_code, total_price, selected_seats, admitted_people, remaining_people, booking_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, movie_id, num_people, food_option, coupon_code, total_price, JSON.stringify(req.body.selectedSeats || []), 0, num_people, customBookingId], function(err) {
              if (err) return res.status(500).json({ error: err.message });

              const databaseId = this.lastID; // Get the auto-generated database ID

              // Create QR code data with minimal info to avoid size limits
              const qrData = {
                booking_id: customBookingId, // Use custom 8-character ID instead of database ID
                ticket_type: 'FREE_ENTRY_IITJAMMU',
                issued_by: 'Chalchitra IIT Jammu'
              };

              console.log('Generated QR data for booking', customBookingId, ':', qrData);
              console.log('QR JSON string:', JSON.stringify(qrData));

              // Generate QR code with JSON data
              QRCode.toDataURL(JSON.stringify(qrData), (qrErr, qrDataURL) => {
                if (qrErr) return res.status(500).json({ error: 'QR code generation failed' });

                // Update booking with QR code data URL
                db.run('UPDATE bookings SET qr_code = ? WHERE id = ?',
                  [qrDataURL, databaseId], function(updateErr) {
                    if (updateErr) return res.status(500).json({ error: updateErr.message });

                    console.log('Saved QR code for booking', customBookingId);

                    // Store food orders if any
                    if (req.body.food_orders && Object.keys(req.body.food_orders).length > 0) {
                      const foodOrders = req.body.food_orders;
                      console.log('Storing food orders for booking:', customBookingId, foodOrders);

                      // Insert each food item into booking_foods table
                      for (const [foodId, quantity] of Object.entries(foodOrders)) {
                        db.run('INSERT INTO booking_foods (booking_id, food_id, quantity) VALUES (?, ?, ?)',
                          [databaseId, parseInt(foodId), parseInt(quantity)], function(foodErr) {
                            if (foodErr) {
                              console.error('Error storing food order:', foodErr);
                            } else {
                              console.log(`Stored food ${foodId} x${quantity} for booking ${customBookingId}`);
                            }
                          });
                      }
                    }

                    // Increment coupon usage count if coupon was used
                    if (coupon_code) {
                      console.log('Incrementing usage count for coupon:', coupon_code);
                      db.run('UPDATE coupons SET used_count = used_count + 1 WHERE code = ?',
                        [coupon_code.toUpperCase()], function(couponErr) {
                          if (couponErr) {
                            console.error('Error updating coupon usage count:', couponErr);
                          } else {
                            console.log(`Updated usage count for coupon ${coupon_code}: ${this.changes} rows affected`);
                          }
                        });
                    }

                    // Coupon usage tracking removed - email system disabled

                    res.json({
                      booking_id: customBookingId, // Return custom booking ID
                      qr_code: qrDataURL,
                      qr_data: qrData,
                      total_price,
                      movie: movie.title,
                      date: movie.date,
                      venue: movie.venue,
                      selected_seats: req.body.selectedSeats || []
                    });
                  });
              });
            });
        } catch (error) {
          console.error('Error generating booking ID:', error);
          return res.status(500).json({ error: 'Failed to generate booking ID' });
        }
      }
    });
  });
});

// Get user bookings
router.get('/my', (req, res) => {
  // Temporarily allow fetching bookings without authentication for testing
  // if (!req.user) return res.status(401).json({ error: 'Authentication required' });

  // Use dummy user ID for testing (same as used in booking creation)
  const userId = req.user ? req.user.id : 1;

  db.all('SELECT b.*, b.qr_code, b.selected_seats, b.ticket_html, m.title, m.date, m.venue, m.poster_url, m.price FROM bookings b JOIN movies m ON b.movie_id = m.id WHERE b.user_id = ? ORDER BY b.created_at DESC',
    [userId], (err, bookings) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(bookings);
    });
});

// Scan QR code (scanner access required)
router.post('/scan', (req, res) => {
  // Temporarily allow scanning without full authentication for testing
  // if (!req.user) return res.status(401).json({ error: 'Authentication required' });

  // Check if user has scanner access (admin, code_scanner, or team_scanner)
  // Temporarily allow scanning for testing
  // const hasScannerAccess = req.user.is_admin || req.user.code_scanner ||
  //   (req.user.team_scanner !== undefined ? req.user.team_scanner : false);

  // if (!hasScannerAccess) return res.status(403).json({ error: 'Scanner access required' });

  const { qr_code, num_people } = req.body;
  console.log('Received scan request:', { qr_code, num_people });

  // Check if this is a partial admission request (num_people provided)
  if (num_people !== undefined) {
    console.log('Processing partial admission request');
    // For partial admission, qr_code should contain booking_id
    let bookingId;

    try {
      // Try to parse as JSON first
      const qrData = JSON.parse(qr_code);
      bookingId = qrData.booking_id;
    } catch (parseErr) {
      // If not JSON, assume it's the booking_id directly
      bookingId = qr_code;
    }

    // If it's a number, use it as database ID, otherwise try to find by booking_code
    const peopleToAdmit = parseInt(num_people);

    console.log('Partial admission for booking:', bookingId, 'admitting:', peopleToAdmit);

    // Find the booking by booking_id (could be numeric database ID or custom alphanumeric code)
    // First try to find by custom booking_code, then fallback to numeric ID if bookingId is numeric
    const query = 'SELECT b.*, u.name, u.email, m.title FROM bookings b LEFT JOIN users u ON b.user_id = u.id LEFT JOIN movies m ON b.movie_id = m.id WHERE b.booking_code = ?';
    const params = [bookingId];

    // If bookingId looks like a number, also try searching by numeric ID
    if (!isNaN(parseInt(bookingId))) {
      query += ' OR b.id = ?';
      params.push(parseInt(bookingId));
    }

    db.get(query, params, (err, booking) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!booking) return res.status(404).json({
          error: 'INVALID - Booking not found',
          message: 'Booking not found for partial admission',
          booking_id: bookingId,
          validity_status: 'INVALID - BOOKING NOT FOUND',
          allowed: false
        });

        console.log('Partial admission booking found:', booking);
        console.log('User name from join:', booking.name);
        console.log('Movie title from join:', booking.title);

        // Check if already fully used
        if (booking.is_used || booking.remaining_people <= 0) {
          return res.json({
            message: 'TICKET ALREADY FULLY USED - ENTRY DENIED',
            used: true,
            student_name: booking.name || 'Unknown',
            student_email: booking.email || 'unknown@email.com',
            movie_name: booking.title || 'Unknown Movie',
            total_people: booking.num_people,
            admitted_people: booking.admitted_people || 0,
            remaining_people: booking.remaining_people || 0,
            booking_id: booking.id,
            validity_status: 'INVALID - ALREADY USED',
            allowed: false
          });
        }

        // Validate people count
        if (peopleToAdmit <= 0 || peopleToAdmit > booking.remaining_people) {
          return res.status(400).json({
            error: `INVALID NUMBER - Only ${booking.remaining_people} people remaining`,
            student_name: booking.name,
            student_email: booking.email,
            movie_name: booking.title,
            total_people: booking.num_people,
            admitted_people: booking.admitted_people || 0,
            remaining_people: booking.remaining_people || 0,
            booking_id: booking.id,
            validity_status: 'INVALID - WRONG NUMBER',
            allowed: false
          });
        }

        // Process partial admission
        const newAdmitted = (booking.admitted_people || 0) + peopleToAdmit;
        const newRemaining = booking.num_people - newAdmitted;
        const isFullyUsed = newRemaining <= 0;

        console.log('Updating booking:', { newAdmitted, newRemaining, isFullyUsed });

        db.run('UPDATE bookings SET admitted_people = ?, remaining_people = ?, is_used = ? WHERE id = ?',
          [newAdmitted, newRemaining, isFullyUsed ? 1 : 0, booking.id], function(updateErr) {
            if (updateErr) {
              console.error('Error updating booking for partial admission:', updateErr);
              return res.status(500).json({ error: 'Failed to update booking status' });
            }

            console.log('Partial admission successful');
            res.json({
              message: `${peopleToAdmit} PEOPLE ADMITTED - ENTRY ALLOWED`,
              used: false,
              partial_admission: true,
              student_name: booking.name || 'Unknown',
              student_email: booking.email || 'unknown@email.com',
              movie_name: booking.title || 'Unknown Movie',
              ticket_type: 'GROUP_TICKET',
              total_people: booking.num_people,
              admitted_people: newAdmitted,
              remaining_people: newRemaining,
              people_admitted_now: peopleToAdmit,
              booking_id: booking.id,
              validity_status: isFullyUsed ? `VALID - ALL ${booking.num_people} ADMITTED` : `VALID - ${peopleToAdmit} ADMITTED, ${newRemaining} REMAINING`,
              allowed: true,
              fully_used: isFullyUsed
            });
          });
      });

    return; // Exit early for partial admission
  }

  // Try to parse as JSON QR data (new format)
  try {
    const qrData = JSON.parse(qr_code);
    console.log('Parsed QR data:', qrData);
    console.log('QR booking_id:', qrData.booking_id);

    // Validate QR data structure
    if (!qrData.booking_id) {
      console.log('Missing booking_id in QR data');
      return res.status(400).json({
        error: 'INVALID - Entry Denied (Invalid QR format)',
        allowed: false,
        validity_status: 'INVALID - MISSING BOOKING ID'
      });
    }

    // Keep booking_id as string (it could be alphanumeric custom code)
    const bookingId = qrData.booking_id;
    console.log('Looking for booking with ID:', bookingId);

    // Find booking by booking_id from QR data (could be numeric database ID or custom alphanumeric code)
    // First try to find by custom booking_code, then fallback to numeric ID if bookingId is numeric
    const query = 'SELECT b.*, u.name, u.email, m.title FROM bookings b LEFT JOIN users u ON b.user_id = u.id LEFT JOIN movies m ON b.movie_id = m.id WHERE b.booking_code = ?';
    const params = [bookingId];

    // If bookingId looks like a number, also try searching by numeric ID
    if (!isNaN(parseInt(bookingId))) {
      query += ' OR b.id = ?';
      params.push(parseInt(bookingId));
    }

    db.get(query, params, (err, booking) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!booking) return res.status(404).json({
        error: 'INVALID - Entry Denied',
        message: 'Booking not found',
        student_name: 'Unknown',
        student_email: 'unknown@email.com',
        movie_name: 'Unknown Movie',
        booking_id: qrData.booking_id,
        validity_status: 'INVALID - BOOKING NOT FOUND',
        allowed: false
      });

      // Check if booking is fully used (all people admitted)
      if (booking.is_used || booking.remaining_people <= 0) {
        console.log('Booking is fully used:', booking);

        // Get food orders for invalid tickets (so they can still serve food)
        const foodQuery = `
          SELECT bf.food_id, bf.quantity, f.name, f.price
          FROM booking_foods bf
          LEFT JOIN foods f ON bf.food_id = f.id
          WHERE bf.booking_id = ?
        `;

        db.all(foodQuery, [booking.id], (foodErr, foodItems) => {
          if (foodErr) {
            console.error('Error fetching food orders for invalid ticket:', foodErr);
            foodItems = [];
          }

          const foodOrders = {};
          if (foodItems && foodItems.length > 0) {
            foodItems.forEach(item => {
              foodOrders[item.food_id] = {
                name: item.name || `Food ${item.food_id}`,
                quantity: item.quantity,
                price: item.price || 0
              };
            });
          }

          console.log('🍽️ Invalid ticket food orders:', foodOrders);

          return res.json({
            message: 'TICKET ALREADY USED - ENTRY DENIED',
            used: true,
            student_name: booking.name || 'Unknown',
            student_email: booking.email || 'unknown@email.com',
            movie_name: booking.title || 'Unknown Movie',
            ticket_type: qrData.ticket_type,
            selected_seats: JSON.parse(booking.selected_seats || '[]'),
            total_people: booking.num_people,
            admitted_people: booking.admitted_people || 0,
            remaining_people: booking.remaining_people || 0,
            booking_id: qrData.booking_id,
            validity_status: 'INVALID - ALREADY USED',
            allowed: false,
            food_orders: Object.keys(foodOrders).length > 0 ? foodOrders : null
          });
        });

        return; // Exit early since we're handling this asynchronously
      }

      // Check if this is a multi-person ticket that needs partial admission
      if (booking.num_people > 1 && booking.remaining_people > 1) {
        // Multi-person ticket - return options for partial admission
        console.log('Multi-person ticket detected:', booking.num_people, 'people,', booking.remaining_people, 'remaining');

        // Get food orders for this booking even for group tickets
        const foodQuery = `
          SELECT bf.food_id, bf.quantity, f.name, f.price
          FROM booking_foods bf
          LEFT JOIN foods f ON bf.food_id = f.id
          WHERE bf.booking_id = ?
        `;

        db.all(foodQuery, [booking.id], (foodErr, foodItems) => {
          if (foodErr) {
            console.error('Error fetching food orders for group ticket:', foodErr);
            foodItems = [];
          }

          // Calculate take time based on food items (estimated times)
          let takeTime = 0; // base time for entry
          const foodOrders = {};

          if (foodItems && foodItems.length > 0) {
            foodItems.forEach(item => {
              // Map food IDs to preparation times (in minutes)
              const foodPrepTimes = {
                1: 3, // Popcorn
                2: 2, // Soda
                3: 4, // Combo Meal
                4: 5, // Nachos
                5: 2, // Candy
                // Add more food items as needed
              };

              const prepTime = foodPrepTimes[item.food_id] || 2; // default 2 minutes
              takeTime += prepTime * item.quantity;

              // Store food order with name
              foodOrders[item.food_id] = {
                name: item.name || `Food ${item.food_id}`,
                quantity: item.quantity,
                price: item.price || 0,
                prep_time: prepTime
              };
            });
          }

          // Minimum take time of 1 minute for entry process
          takeTime = Math.max(takeTime, 1);

          console.log('🍽️ Group ticket food orders:', foodOrders);

          const availableOptions = [];
          for (let i = 1; i <= booking.remaining_people; i++) {
            availableOptions.push(i);
          }

          return res.json({
            message: `GROUP TICKET - Choose how many people to admit`,
            partial_admission: true,
            needs_selection: true,
            student_name: booking.name || 'Unknown',
            student_email: booking.email || 'unknown@email.com',
            movie_name: booking.title || 'Unknown Movie',
            ticket_type: qrData.ticket_type,
            selected_seats: JSON.parse(booking.selected_seats || '[]'),
            total_people: booking.num_people,
            admitted_people: booking.admitted_people || 0,
            remaining_people: booking.remaining_people || booking.num_people,
            available_options: availableOptions,
            booking_id: qrData.booking_id,
            validity_status: 'WAITING - SELECT NUMBER',
            allowed: false,
            food_orders: Object.keys(foodOrders).length > 0 ? foodOrders : null,
            take_time: takeTime
          });
        });

        return; // Exit early since we're handling this asynchronously
      }

      // Single person or final person from group ticket - allow entry
      console.log('Single/final person ticket, allowing entry:', booking);

      // Get food orders for this booking with food names
      const foodQuery = `
        SELECT bf.food_id, bf.quantity, f.name, f.price
        FROM booking_foods bf
        LEFT JOIN foods f ON bf.food_id = f.id
        WHERE bf.booking_id = ?
      `;

      db.all(foodQuery, [booking.id], (foodErr, foodItems) => {
        if (foodErr) {
          console.error('Error fetching food orders:', foodErr);
          foodItems = [];
        }

        // Calculate take time based on food items (estimated times)
        let takeTime = 0; // base time for entry
        const foodOrders = {};

        if (foodItems && foodItems.length > 0) {
          foodItems.forEach(item => {
            // Map food IDs to preparation times (in minutes)
            const foodPrepTimes = {
              1: 3, // Popcorn
              2: 2, // Soda
              3: 4, // Combo Meal
              4: 5, // Nachos
              5: 2, // Candy
              // Add more food items as needed
            };

            const prepTime = foodPrepTimes[item.food_id] || 2; // default 2 minutes
            takeTime += prepTime * item.quantity;

            // Store food order with name
            foodOrders[item.food_id] = {
              name: item.name || `Food ${item.food_id}`,
              quantity: item.quantity,
              price: item.price || 0,
              prep_time: prepTime
            };
          });
        }

        // Minimum take time of 1 minute for entry process
        takeTime = Math.max(takeTime, 1);

        console.log('🍽️ Final food orders for response:', foodOrders);
        console.log('🍽️ Food orders keys:', Object.keys(foodOrders));
        console.log('🍽️ Food orders length:', Object.keys(foodOrders).length);

        // Update booking to mark as used
        const newAdmitted = (booking.admitted_people || 0) + 1;
        const newRemaining = booking.num_people - newAdmitted;
        const isFullyUsed = newRemaining <= 0;

        db.run('UPDATE bookings SET admitted_people = ?, remaining_people = ?, is_used = ? WHERE id = ?',
          [newAdmitted, newRemaining, isFullyUsed ? 1 : 0, booking.id], function(updateErr) {
            if (updateErr) {
              console.error('Error updating booking:', updateErr);
              return res.status(500).json({ error: 'Failed to update booking status' });
            }

            console.log('📤 Sending scan response with food_orders:', Object.keys(foodOrders).length > 0 ? foodOrders : null);

            res.json({
              message: 'VALID TICKET - ENTRY ALLOWED',
              used: false,
              partial_admission: false,
              student_name: booking.name || 'Unknown',
              student_email: booking.email || 'unknown@email.com',
              movie_name: booking.title || 'Unknown Movie',
              ticket_type: qrData.ticket_type,
              selected_seats: JSON.parse(booking.selected_seats || '[]'),
              total_people: booking.num_people,
              admitted_people: newAdmitted,
              remaining_people: newRemaining,
              people_admitted_now: 1,
              booking_id: qrData.booking_id,
              validity_status: isFullyUsed ? 'VALID - ALL ADMITTED' : `VALID - 1 ADMITTED, ${newRemaining} REMAINING`,
              allowed: true,
              fully_used: isFullyUsed,
              food_orders: Object.keys(foodOrders).length > 0 ? foodOrders : null,
              take_time: takeTime
            });
          });
      });
    });
  } catch (parseErr) {
    // Not JSON, try old format UUID lookup (fallback for legacy tickets)
    console.log('QR code is not JSON, trying as UUID:', qr_code);
    db.get('SELECT b.*, u.name, u.email, m.title FROM bookings b JOIN users u ON b.user_id = u.id JOIN movies m ON b.movie_id = m.id WHERE b.id = ?',
      [qr_code], (err, booking) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!booking) return res.status(404).json({ error: 'INVALID - Entry Denied' });

      if (booking.is_used) {
        res.json({
          message: 'TICKET ALREADY USED - ENTRY DENIED',
          used: true,
          student_name: booking.name,
          student_email: booking.email,
          movie_name: booking.title,
          booking_id: booking.id,
          validity_status: 'INVALID - ALREADY USED',
          allowed: false
        });
      } else {
        // For legacy single-person bookings, mark as fully used
        db.run('UPDATE bookings SET is_used = 1, admitted_people = ?, remaining_people = 0 WHERE id = ?',
          [booking.num_people, booking.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({
              message: 'VALID TICKET - ENTRY ALLOWED',
              used: false,
              student_name: booking.name,
              student_email: booking.email,
              movie_name: booking.title,
              booking_id: booking.id,
              validity_status: 'VALID - ENTRY GRANTED',
              allowed: true
            });
          });
      }
    });
  }
});

// Get all bookings (admin) - temporarily allow for debugging
router.get('/', (req, res) => {
  // Temporarily allow access for debugging
  // if (!req.user || !req.user.is_admin) return res.status(403).json({ error: 'Admin access required' });

  db.all('SELECT b.*, u.name, u.email, m.title FROM bookings b LEFT JOIN users u ON b.user_id = u.id LEFT JOIN movies m ON b.movie_id = m.id ORDER BY b.created_at DESC',
    [], (err, bookings) => {
      if (err) return res.status(500).json({ error: err.message });
      console.log('All bookings in database:', bookings);
      res.json(bookings);
    });
});

// Test QR scan with manual data
router.post('/test-scan', (req, res) => {
  const { qr_code } = req.body;
  console.log('Test scan received:', qr_code);

  try {
    const qrData = JSON.parse(qr_code);
    console.log('Test scan parsed data:', qrData);

    // Find booking
    db.get('SELECT b.*, u.name, u.email, m.title FROM bookings b LEFT JOIN users u ON b.user_id = u.id LEFT JOIN movies m ON b.movie_id = m.id WHERE b.id = ?',
      [qrData.booking_id], (err, booking) => {
        if (err) return res.status(500).json({ error: err.message });

        console.log('Test scan found booking:', booking);

        if (!booking) {
          return res.json({
            success: false,
            message: 'Booking not found',
            qr_data: qrData
          });
        }

        res.json({
          success: true,
          message: 'Booking found successfully',
          booking: booking,
          qr_data: qrData
        });
      });
  } catch (parseErr) {
    console.log('Test scan parse error:', parseErr);
    res.json({
      success: false,
      message: 'Invalid JSON format',
      error: parseErr.message
    });
  }
});


// Update ticket HTML for a booking
router.put('/:id/ticket-html', (req, res) => {
  const bookingId = req.params.id;
  const { ticket_html } = req.body;

  if (!ticket_html) {
    return res.status(400).json({ error: 'ticket_html is required' });
  }

  db.run('UPDATE bookings SET ticket_html = ? WHERE id = ?', [ticket_html, bookingId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Booking not found' });
    res.json({ message: 'Ticket HTML updated successfully' });
  });
});

// Delete booking (user can only delete their own bookings)
router.delete('/:id', (req, res) => {
  // Temporarily allow deletion without authentication for testing
  // if (!req.user) return res.status(401).json({ error: 'Authentication required' });

  const bookingId = req.params.id;

  // First check if the booking belongs to the authenticated user (skip for testing)
  db.get('SELECT user_id FROM bookings WHERE id = ?', [bookingId], (err, booking) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Temporarily skip ownership check for testing
    // if (booking.user_id !== req.user.id) return res.status(403).json({ error: 'You can only delete your own bookings' });

    // Delete the booking
    db.run('DELETE FROM bookings WHERE id = ?', [bookingId], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Booking deleted successfully' });
    });
  });
});

// Generate PDF ticket endpoint
router.post('/generate-pdf', (req, res) => {
  try {
    const { booking_id, movie_title, movie_date, venue, selected_seats, qr_code_url } = req.body;

    // Get movie name for filename
    let movieName = 'Movie';
    
    // Try to get movie name from booking
    const numericPdfId = parseInt(booking_id);
    db.get('SELECT m.title FROM bookings b JOIN movies m ON b.movie_id = m.id WHERE b.booking_code = ? OR b.id = ?',
      [String(booking_id), isNaN(numericPdfId) ? -1 : numericPdfId], (err, movieRow) => {
        if (err) {
          console.error('Error fetching movie name:', err);
          console.log('Error details:', err.message);
        } else if (movieRow && movieRow.title) {
          movieName = movieRow.title;
          console.log('Successfully fetched movie name:', movieName);
        } else {
          console.log('No movie name found for booking:', booking_id);
          console.log('Movie row result:', movieRow);
        }

        // Clean movie name for filename (remove special characters)
        const cleanMovieName = movieName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
        
        // Generate PDF ticket (Real Movie Ticket with Logos)
        const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a6', // A6 size: 105mm x 148mm - standard but compact
          margins: { top: 0, right: 0, bottom: 0, left: 0 } // No margins
        });

        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        // Clean white background
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        // Main ticket border
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(1);
        doc.rect(3, 3, pageWidth-6, pageHeight-6);

        // Top Header - CHALCHITRA SERIES centered
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text('CHALCHITRA SERIES', pageWidth/2, 12, { align: 'center' });

        // Load and add Chalchitra logo (top left)
        try {
          const chalchitraLogoPath = path.join(__dirname, '..', '..', 'public', 'newlogo.png');
          if (fs.existsSync(chalchitraLogoPath)) {
            const chalchitraLogoData = fs.readFileSync(chalchitraLogoPath);
            const chalchitraLogoBase64 = chalchitraLogoData.toString('base64');
            doc.addImage(`data:image/png;base64,${chalchitraLogoBase64}`, 'PNG', 2, 2, 10, 10);
          } else {
            // Fallback to placeholder
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.rect(2, 2, 10, 10);
            doc.setFontSize(4);
            doc.setFont('helvetica', 'normal');
            doc.text('LOGO', 7, 8, { align: 'center' });
          }
        } catch (logoError) {
          console.log('Error loading Chalchitra logo:', logoError.message);
          // Fallback to placeholder
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.5);
          doc.rect(2, 2, 10, 10);
          doc.setFontSize(4);
          doc.setFont('helvetica', 'normal');
          doc.text('LOGO', 7, 8, { align: 'center' });
        }

        // Load and add IIT Jammu logo (top right)
        try {
          const iitLogoPath = path.join(__dirname, '..', '..', 'public', 'iitjammu-logo.png');
          if (fs.existsSync(iitLogoPath)) {
            const iitLogoData = fs.readFileSync(iitLogoPath);
            const iitLogoBase64 = iitLogoData.toString('base64');
            doc.addImage(`data:image/png;base64,${iitLogoBase64}`, 'PNG', pageWidth-12, 2, 10, 10);
          } else {
            // Fallback to placeholder
            doc.rect(pageWidth-12, 2, 10, 10);
            doc.setFontSize(3);
            doc.text('IIT', pageWidth-7, 6, { align: 'center' });
            doc.text('JAMMU', pageWidth-7, 9, { align: 'center' });
          }
        } catch (logoError) {
          console.log('Error loading IIT Jammu logo:', logoError.message);
          // Fallback to placeholder
          doc.rect(pageWidth-12, 2, 10, 10);
          doc.setFontSize(3);
          doc.text('IIT', pageWidth-7, 6, { align: 'center' });
          doc.text('JAMMU', pageWidth-7, 9, { align: 'center' });
        }

        // Separator line below header
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(2, 18, pageWidth-2, 18);

        // Three column layout - positioned to fill entire page
        const leftCol = 3;
        const middleCol = 45;
        const rightCol = 95;
        const contentY = 22;

        // Left column - Movie poster (larger)
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.rect(leftCol, contentY, 35, 30);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'italic');
        doc.text('Movie Poster', leftCol + 17.5, contentY + 15, { align: 'center' });

        // Middle column - Movie details
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('ADMISSION TICKET', middleCol, contentY + 2);

        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('Movie:', middleCol, contentY + 8);
        doc.setFont('helvetica', 'normal');
        doc.text(movie_title, middleCol + 12, contentY + 8);

        doc.setFont('helvetica', 'bold');
        doc.text('Date:', middleCol, contentY + 14);
        doc.setFont('helvetica', 'normal');
        doc.text(new Date(movie_date).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }), middleCol + 10, contentY + 14);

        doc.setFont('helvetica', 'bold');
        doc.text('Time:', middleCol, contentY + 20);
        doc.setFont('helvetica', 'normal');
        doc.text(new Date(movie_date).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit'
        }), middleCol + 10, contentY + 20);

        doc.setFont('helvetica', 'bold');
        doc.text('Venue:', middleCol, contentY + 26);
        doc.setFont('helvetica', 'normal');
        doc.text(venue, middleCol + 12, contentY + 26);

        doc.setFont('helvetica', 'bold');
        doc.text('Seats:', middleCol, contentY + 32);
        doc.setFont('helvetica', 'normal');
        doc.text((selected_seats || []).join(', '), middleCol + 10, contentY + 32);

        // Right column - Big QR Code
        const qrSize = 32;
        const qrX = rightCol;
        const qrY = contentY;

        // Convert base64 QR to image for PDF
        const qrImage = qr_code_url.replace(/^data:image\/png;base64,/, '');
        doc.addImage(qrImage, 'PNG', qrX, qrY, qrSize, qrSize);

        // Instructions below QR
        doc.setFontSize(5);
        doc.setFont('helvetica', 'normal');
        doc.text('Scan QR Code', rightCol + qrSize/2, qrY + qrSize + 3, { align: 'center' });
        doc.text('at Entrance', rightCol + qrSize/2, qrY + qrSize + 7, { align: 'center' });

        // Bottom branding
        doc.setFontSize(6);
        doc.setFont('helvetica', 'italic');
        doc.text('Chalchitra - IIT Jammu Student Initiative', pageWidth/2, pageHeight - 3, { align: 'center' });

        // Convert PDF to buffer and send
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        res.setHeader('Content-Type', 'application/pdf');
        
        // Use movie name and booking ID in filename
        const filename = `${movieName}_${booking_id}.pdf`;
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(pdfBuffer);
      });

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF ticket' });
  }
});

// Send ticket email with PDF attachment
router.post('/send-ticket-email', async (req, res) => {
  const { booking_id, pdf_base64 } = req.body;

  if (!booking_id || !pdf_base64) {
    return res.status(400).json({ error: 'booking_id and pdf_base64 are required' });
  }

  try {
    // Parse booking_id safely - PostgreSQL requires integer for b.id column
    const numericBookingId = parseInt(booking_id);
    const safeNumericId = isNaN(numericBookingId) ? -1 : numericBookingId;

    db.get(
      `SELECT b.*, u.name as user_name, u.email as user_email,
              m.title as movie_title, m.date as movie_date, m.venue as movie_venue, m.poster_url as poster_url
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.id
       LEFT JOIN movies m ON b.movie_id = m.id
       WHERE b.id = ? OR b.booking_code = ?`,
      [safeNumericId, String(booking_id)],
      async (err, booking) => {
        if (err) {
          console.error('Error fetching booking for email:', err);
          return res.status(500).json({ error: 'Failed to fetch booking details' });
        }

        if (!booking) {
          return res.status(404).json({ error: 'Booking not found' });
        }

        const customerEmail = booking.user_email || req.body.customer_email;
        const customerName = booking.user_name || req.body.customer_name || 'Student';

        if (!customerEmail) {
          return res.status(400).json({ error: 'Customer email not found for booking' });
        }

        const selectedSeats = booking.selected_seats
          ? (() => {
              try { return JSON.parse(booking.selected_seats); } catch (e) { return []; }
            })()
          : (req.body.selected_seats || []);

        const paymentAmount = req.body.payment_amount;
        const paymentMethod = req.body.payment_method;
        const paymentId = req.body.payment_id;

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Movie Ticket - ${booking.movie_title}</title>
          </head>
          <body style="margin: 0; padding: 20px; background: #f5f5f5; font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
              <div style="background: white; padding: 20px; text-align: center; border-bottom: 1px solid #eee;">
                <h1 style="margin: 0; color: #000; font-size: 24px; font-weight: bold;">CHALCHITRA SERIES</h1>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">IIT Jammu Movie Screening</p>
              </div>

              <div style="padding: 20px;">
                <h2 style="color: #333; margin-top: 0;">Hello ${customerName}!</h2>
                <p style="color: #555; font-size: 16px; margin: 0 0 16px 0;">Your booking is confirmed. Your ticket PDF is attached.</p>

                <p style="color: #555; font-size: 16px; margin: 12px 0;"><strong>Movie:</strong> ${booking.movie_title}</p>
                <p style="color: #555; font-size: 16px; margin: 12px 0;"><strong>Date:</strong> ${booking.movie_date ? new Date(booking.movie_date).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }) : 'N/A'}</p>
                <p style="color: #555; font-size: 16px; margin: 12px 0;"><strong>Time:</strong> ${booking.movie_date ? new Date(booking.movie_date).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'N/A'}</p>
                <p style="color: #555; font-size: 16px; margin: 12px 0;"><strong>Venue:</strong> ${booking.movie_venue || 'N/A'}</p>
                <p style="color: #555; font-size: 16px; margin: 12px 0;"><strong>Seats:</strong> ${selectedSeats.join(', ') || 'N/A'}</p>
                <p style="color: #555; font-size: 16px; margin: 12px 0;"><strong>Booking ID:</strong> ${booking.booking_code || booking.id}</p>

                <p style="color: #555; font-size: 16px; margin: 20px 0 8px 0;"><strong>Payment Details</strong></p>
                <p style="color: #555; font-size: 16px; margin: 8px 0;"><strong>Amount:</strong> ${paymentAmount ? `Rs.${paymentAmount}` : 'N/A'}</p>
                <p style="color: #555; font-size: 16px; margin: 8px 0;"><strong>Payment Method:</strong> ${paymentMethod || 'N/A'}</p>
                <p style="color: #555; font-size: 16px; margin: 8px 0;"><strong>Transaction ID:</strong> ${paymentId || 'N/A'}</p>

                <p style="color: #555; font-size: 16px; margin: 24px 0; line-height: 1.6;">
                  Thank you for booking with Chalchitra Series. We look forward to hosting you!
                </p>
              </div>

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
        `;

        // Try to get a configured transporter; if not configured, skip gracefully
        let transporter, settings;
        try {
          ({ transporter, settings } = await createEmailTransporter());
        } catch (transporterErr) {
          console.warn('Email not configured or verification failed, skipping ticket email:', transporterErr?.message || transporterErr);
          // Log skipped email for traceability
          db.run(
            `INSERT INTO email_history (email_type, recipient_email, recipient_name, subject, message, sent_by, status, error_message)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              'ticket',
              customerEmail,
              customerName,
              `🎫 Your Movie Ticket - ${booking.movie_title}`,
              'Ticket email skipped (email not configured)',
              booking.user_id || 1,
              'skipped',
              transporterErr?.message || 'Email not configured'
            ],
            (logErr) => { if (logErr) console.error('Error logging skipped ticket email:', logErr); }
          );

          return res.json({ message: 'Email not configured', status: 'skipped', error: transporterErr?.message });
        }

        const senderName = settings?.sender_name || 'Chalchitra IIT Jammu';
        const emailUser = settings?.email_user || process.env.EMAIL_USER;

        const cleanMovieName = (booking.movie_title || 'Movie').replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `${cleanMovieName}_${booking.booking_code || booking.id}.pdf`;

        const mailOptions = {
          from: `"${senderName}" <${emailUser}>`,
          to: customerEmail,
          subject: `🎫 Your Movie Ticket - ${booking.movie_title}`,
          html: emailHtml,
          attachments: [
            {
              filename,
              content: Buffer.from(pdf_base64, 'base64'),
              contentType: 'application/pdf'
            }
          ]
        };

        // Respond immediately to avoid Render's 30s request timeout
        // Email sends in background — check email_history for actual status
        res.json({ message: 'Ticket email queued for delivery', status: 'sent' });

        // Send email in background with retry
        setImmediate(async () => {
          try {
            console.log(`[Email] Sending ticket to ${customerEmail} for movie "${booking.movie_title}"...`);
            const sendResult = await sendMailWithRetry(transporter, mailOptions, 3);
            console.log(`[Email] ✅ Ticket sent to ${customerEmail} — messageId: ${sendResult.messageId}`);
            
            db.run(
              `INSERT INTO email_history (email_type, recipient_email, recipient_name, subject, message, sent_by, status)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              ['ticket', customerEmail, customerName, mailOptions.subject, 'Ticket PDF sent', booking.user_id || 1, 'sent'],
              (logErr) => { if (logErr) console.error('Error logging ticket email history:', logErr); }
            );
          } catch (sendErr) {
            console.error(`[Email] ❌ Failed to send to ${customerEmail}:`, sendErr.message);
            console.error(`[Email] Error details — code: ${sendErr.code}, command: ${sendErr.command}, response: ${sendErr.response}`);
            
            db.run(
              `INSERT INTO email_history (email_type, recipient_email, recipient_name, subject, message, sent_by, status, error_message)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              ['ticket', customerEmail, customerName, mailOptions.subject, 'Ticket email failed', booking.user_id || 1, 'failed', sendErr?.message || String(sendErr)],
              (logErr) => { if (logErr) console.error('Error logging failed ticket email:', logErr); }
            );
          }
        });
      }
    );
  } catch (error) {
    console.error('Ticket email sending error:', error);
    res.status(500).json({ error: 'Failed to send ticket email. Please try again later.' });
  }
});

// Check if user has already booked a specific movie
router.get('/check/:movieId', (req, res) => {
  const movieId = req.params.movieId;
  
  // Use dummy user ID for testing if not authenticated
  const userId = req.user ? req.user.id : 1;

  // Check if user has any booking for this movie
  db.get(
    `SELECT b.*, m.title as movie_title, m.date as movie_date, m.venue as movie_venue, m.poster_url as poster_url
     FROM bookings b
     LEFT JOIN movies m ON b.movie_id = m.id
     WHERE b.user_id = ? AND b.movie_id = ?
     ORDER BY b.created_at DESC
     LIMIT 1`,
    [userId, movieId],
    (err, booking) => {
      if (err) {
        console.error('Error checking existing booking:', err);
        return res.status(500).json({ error: 'Failed to check booking status' });
      }

      if (!booking) {
        return res.json({ hasBooking: false, booking: null });
      }

      // Parse selected seats if it's a string
      let selectedSeats = [];
      try {
        selectedSeats = booking.selected_seats ? JSON.parse(booking.selected_seats) : [];
      } catch (e) {
        selectedSeats = [];
      }

      res.json({
        hasBooking: true,
        booking: {
          id: booking.id,
          booking_code: booking.booking_code,
          movie_id: booking.movie_id,
          movie_title: booking.movie_title,
          movie_date: booking.movie_date,
          venue: booking.movie_venue,
          poster_url: booking.poster_url,
          selected_seats: selectedSeats,
          num_people: booking.num_people,
          total_price: booking.total_price,
          created_at: booking.created_at,
          is_used: booking.is_used,
          remaining_people: booking.remaining_people
        }
      });
    }
  );
});


// Diagnostic: Check email configuration (no auth required - returns sanitized info only)
router.get('/email-config-check', async (req, res) => {
  try {
    const { transporter, settings } = await createEmailTransporter();
    const emailUser = settings?.email_user || process.env.EMAIL_USER;
    res.json({
      configured: true,
      service: 'gmail (port 465 SSL)',
      user: emailUser ? emailUser.substring(0, 4) + '***' : 'NOT SET',
      source: settings?.email_user ? 'database' : 'env-vars'
    });
  } catch (err) {
    res.json({ configured: false, error: err.message });
  }
});

module.exports = router;
