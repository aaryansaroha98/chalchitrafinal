const express = require('express');
const axios = require('axios');
const db = require('../database');
const { calculateSubtotalFromDb, getCouponDiscount } = require('../utils/pricing');
// Cashfree integration: remove Razorpay settings

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

  // Cashfree API keys from environment variables
  const cashfreeAppId = process.env.CASHFREE_APP_ID;
  const cashfreeSecretKey = process.env.CASHFREE_SECRET_KEY;

  if (!cashfreeAppId || !cashfreeSecretKey) {
    return res.status(500).json({ error: 'Cashfree keys are not configured in environment variables.' });
  }

  db.get('SELECT * FROM movies WHERE id = ? AND is_upcoming = 1', [movie_id], async (err, movie) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!movie) return res.status(404).json({ error: 'Movie not found or not upcoming' });

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
        final_amount: 0,
        is_free: true
      });
    }

    // Cashfree order creation
    const amount = finalAmount;
    const orderId = `booking_${movie_id}_${Date.now()}`;
    try {
      const cfOrderRes = await axios.post(
        'https://sandbox.cashfree.com/pg/orders',
        {
          order_id: orderId,
          order_amount: amount,
          order_currency: 'INR',
          customer_details: {
            customer_id: String(req.body.customer_id || 'guest'),
            customer_email: req.body.customer_email || 'guest@iitjammu.ac.in',
            customer_phone: req.body.customer_phone || ''
          },
          order_note: `Movie booking for ${movie_id}`
        },
        {
          headers: {
            'x-api-version': '2022-01-01',
            'Content-Type': 'application/json',
            'x-client-id': cashfreeAppId,
            'x-client-secret': cashfreeSecretKey
          },
          timeout: 15000
        }
      );

      return res.json({
        order_id: cfOrderRes.data.order_id,
        payment_link: cfOrderRes.data.payment_link,
        amount: cfOrderRes.data.order_amount,
        currency: cfOrderRes.data.order_currency,
        final_amount: amount,
        is_free: false
      });
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
