const express = require('express');
const axios = require('axios');
const db = require('../database');
const { calculateSubtotalFromDb, getCouponDiscount } = require('../utils/pricing');
const { getRazorpayKeys } = require('../utils/razorpaySettings');

const router = express.Router();

router.post('/order', async (req, res) => {
  const { movie_id, selectedSeats, food_orders, coupon_code } = req.body;

  if (!movie_id) {
    return res.status(400).json({ error: 'movie_id is required' });
  }

  if (!Array.isArray(selectedSeats) || selectedSeats.length === 0) {
    return res.status(400).json({ error: 'Please select at least one seat' });
  }

  if (selectedSeats.length > 6) {
    return res.status(400).json({ error: 'Maximum 6 seats allowed per booking' });
  }

  let keyId = '';
  let keySecret = '';
  try {
    const keys = await getRazorpayKeys(db);
    keyId = keys.keyId;
    keySecret = keys.keySecret;
  } catch (keyErr) {
    console.error('Error loading Razorpay keys:', keyErr);
    return res.status(500).json({ error: 'Failed to load Razorpay configuration' });
  }

  if (!keyId || !keySecret) {
    return res.status(500).json({ error: 'Razorpay keys are not configured' });
  }

  db.get('SELECT * FROM movies WHERE id = ? AND is_upcoming = 1', [movie_id], async (err, movie) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!movie) return res.status(404).json({ error: 'Movie not found or not upcoming' });
    if (Number(movie.booking_stopped) === 1) {
      return res.status(403).json({ error: 'Movie booking time is complete' });
    }

    let subtotal = 0;
    try {
      subtotal = await calculateSubtotalFromDb(db, movie_id, movie.price, selectedSeats, food_orders);
    } catch (subtotalErr) {
      return res.status(subtotalErr.status || 400).json({ error: subtotalErr.message || 'Invalid order details' });
    }

    let finalAmount = subtotal;
    try {
      const couponResult = await getCouponDiscount(db, coupon_code, subtotal);
      finalAmount = couponResult.finalAmount;
    } catch (couponErr) {
      return res.status(couponErr.status || 400).json({ error: couponErr.message || 'Invalid coupon' });
    }

    if (finalAmount < 0) {
      return res.status(400).json({ error: 'Final amount cannot be negative' });
    }

    // Handle free bookings (₹0) - skip Razorpay payment
    if (finalAmount === 0) {
      return res.json({
        order_id: null,
        amount: 0,
        currency: 'INR',
        key_id: keyId,
        final_amount: 0,
        is_free: true
      });
    }

    const amountPaise = Math.round(finalAmount * 100);
    const receipt = `booking_${movie_id}_${Date.now()}`;
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    try {
      const orderResponse = await axios.post(
        'https://api.razorpay.com/v1/orders',
        {
          amount: amountPaise,
          currency: 'INR',
          receipt,
          notes: {
            movie_id: String(movie_id),
            seats: selectedSeats.join(',')
          }
        },
        {
          headers: {
            Authorization: `Basic ${auth}`
          },
          timeout: 15000
        }
      );

      return res.json({
        order_id: orderResponse.data.id,
        amount: orderResponse.data.amount,
        currency: orderResponse.data.currency,
        key_id: keyId,
        final_amount: finalAmount,
        is_free: false
      });
    } catch (orderErr) {
      const status = orderErr.response?.status || 500;
      const message = orderErr.response?.data?.error?.description || 'Failed to create Razorpay order';
      return res.status(status).json({ error: message });
    }
  });
});

module.exports = router;
