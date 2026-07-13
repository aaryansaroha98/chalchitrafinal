
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../components/Loader';

// Derive API base URL to build absolute URLs for poster/image assets
const apiBaseUrl = process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  'http://localhost:3000';

const Payment = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const bookingDetails = location.state || {};
  const {
    selectedSeats = [],
    quantity = 1,
    movieId: movieIdFromState,
    customerDetails: initialCustomerDetails = {},
    selectedFoods = {}
  } = bookingDetails;

  // Get customer details from auth context if available, otherwise use passed data
  // Always ensure we have customer details even if session is expired
  const customerDetails = {
    name: user?.name || initialCustomerDetails.name || 'Guest',
    email: user?.email || initialCustomerDetails.email || 'guest@iitjammu.ac.in',
    phone: user?.phone || initialCustomerDetails.phone || ''
  };

  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [foodData, setFoodData] = useState({});
  const [coinBalance, setCoinBalance] = useState(20); // Default 20 coins

  // Use coin_price from movie instead of rupee price
  const TICKET_COIN_PRICE = parseInt(movie?.coin_price) || 20;

  useEffect(() => {
    if (!bookingDetails.selectedSeats || bookingDetails.selectedSeats.length === 0) {
      navigate(`/booking/${movieId}`);
      return;
    }

    fetchMovie();
    fetchFoodData();
    fetchCoinBalance();
  }, [movieId, bookingDetails, navigate]);

  const fetchCoinBalance = async () => {
    try {
      const res = await api.get('/api/coins/balance', { withCredentials: true });
      setCoinBalance(res.data.coins || 20); // Default to 20 if not set
    } catch (err) {
      setCoinBalance(20); // Default to 20 on error
    }
  };

  const fetchMovie = async () => {
    try {
      const movieIdToUse = movieIdFromState || movieId;
      const res = await api.get(`/api/movies/${movieIdToUse}`);
      console.log('Fetched movie data:', res.data);
      console.log('Movie price:', res.data.price, 'Type:', typeof res.data.price);
      setMovie(res.data);
    } catch (err) {
      setError('Movie not found');
    }
  };

  const fetchFoodData = async () => {
    try {
      const movieIdToUse = movieIdFromState || movieId;
      const res = await api.get(`/api/foods/available/${movieIdToUse}`);

      const foodDataObj = {};
      res.data.forEach(food => {
        foodDataObj[food.id] = food;
      });

      setFoodData(foodDataObj);
    } catch (err) {
      console.error('Failed to fetch food data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFoodTotal = () => {
    return Object.entries(selectedFoods).reduce((total, [foodId, qty]) => {
      const foodItem = foodData[foodId];
      // Food prices are now in coins (convert from rupees by dividing by 10)
      const priceInCoins = foodItem && foodItem.is_free ? 0 : (foodItem ? Math.ceil(foodItem.price / 10) : 0);
      return total + (priceInCoins * qty);
    }, 0);
  };

  const getSubtotal = () => {
    const ticketTotal = selectedSeats.length * TICKET_COIN_PRICE;
    const foodTotal = getFoodTotal();
    return ticketTotal + foodTotal;
  };

  const getTotalCoins = () => {
    return getSubtotal(); // No more discounts, just total coins needed
  };

  if (loading) {
    return <Loader message="Processing Payment" subtitle="Setting up your secure transaction..." />;
  }

  if (error && !movie) {
    return (
      <div className="payment-page">
        <div className="particles">
          {Array.from({ length: 15 }, (_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 10 + 's',
                animationDuration: (10 + Math.random() * 20) + 's'
              }}
            />
          ))}
        </div>
        <div className="error-container">
          <div className="error-card">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      {/* Background Particles */}
      <div className="particles">
        {Array.from({ length: 15 }, (_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 10 + 's',
              animationDuration: (10 + Math.random() * 20) + 's'
            }}
          />
        ))}
      </div>

      <div className="payment-container">
        <div className="payment-card">
          {/* Header */}
          <div className="payment-header">
            <span className="header-title">Order Summary</span>
          </div>

          <div className="payment-body">
            {/* Movie Info Row */}
            <div className="movie-section">
              <div className="movie-poster-wrapper">
                <img
                  src={movie?.poster_url ? (movie.poster_url.startsWith('http') ? movie.poster_url : `${apiBaseUrl}${movie.poster_url}`) : '/placeholder-movie.jpg'}
                  alt={movie?.title}
                  className="movie-poster"
                />
              </div>

              <div className="movie-info">
                <h2 className="movie-title">{movie?.title}</h2>

                <div className="info-item">
                  <span className="info-label">Date:</span>
                  <span className="info-value">
                    {new Date(movie?.date).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className="info-item">
                  <span className="info-label">Time:</span>
                  <span className="info-value">
                    {new Date(movie?.date).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <div className="info-item">
                  <span className="info-label">Venue:</span>
                  <span className="info-value">{movie?.venue}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">Seats:</span>
                  <span className="info-value">{selectedSeats.join(', ')}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">Tickets:</span>
                  <span className="info-value">{quantity} x Rs.{TICKET_PRICE}</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="divider"></div>

            {/* Order Details */}
            <div className="order-section">
              <h3 className="section-heading">Order Details</h3>

              <div className="detail-item">
                <span className="detail-label">Tickets x {quantity}</span>
                <span className="detail-value">Rs.{(quantity * TICKET_PRICE).toFixed(2)}</span>
              </div>

              {Object.entries(selectedFoods).map(([foodId, qty]) => {
                const foodItem = foodData[foodId];
                const isFree = foodItem && foodItem.is_free;
                const price = isFree ? 0 : (foodItem ? foodItem.price : 0);
                const itemTotal = price * qty;

                return (
                  <div key={foodId} className="detail-item">
                    <span className="detail-label">{foodItem ? foodItem.name : `Food ${foodId}`} x {qty}</span>
                    <span className="detail-value">{isFree ? 'FREE' : `Rs.${itemTotal.toFixed(2)}`}</span>
                  </div>
                );
              })}
            </div>

            {/* Divider */}
            <div className="divider"></div>

            {/* Totals */}
            <div className="totals-section">
              <div className="total-row">
                <span className="total-label">Subtotal</span>
                <span className="total-value">Rs.{getSubtotal()}</span>
              </div>

              {couponData && (
                <div className="total-row discount">
                  <span className="total-label">Discount ({couponCode})</span>
                  <span className="total-value">-Rs.{getDiscount()}</span>
                </div>
              )}

              <div className="total-row grand-total">
                <span className="total-label">Total</span>
                <span className="total-value">Rs.{getTotalPrice()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coupon Section - NOW GIVES COINS */}
        <div className="coupon-card">
          <h3 className="coupon-heading">Have a coupon?</h3>
          <div className="coupon-form">
            <input
              type="text"
              placeholder="Enter code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              className="coupon-input"
              disabled={couponData !== null}
            />
            <button
              className="coupon-btn"
              onClick={async () => {
                if (!couponCode.trim()) {
                  setCouponError('Please enter a coupon code');
                  return;
                }

                if (!user || !user.id) {
                  setCouponError('Please log in to use coupons');
                  return;
                }

                setApplyingCoupon(true);
                setCouponError('');
                setCouponSuccess('');

                try {
                  const res = await api.post('/api/admin/coupons/validate', {
                    code: couponCode,
                    user_id: user.id
                  });

                  setCouponData(res.data);
                  setCouponSuccess(res.data.message || `🪙 ${res.data.coins_granted} coins added!`);
                  setCouponError('');
                  // Refresh coin balance
                  await fetchCoinBalance();
                } catch (err) {
                  setCouponError(err.response?.data?.error || 'Invalid coupon');
                } finally {
                  setApplyingCoupon(false);
                }
              }}
              disabled={applyingCoupon || couponData !== null}
            >
              {applyingCoupon ? '...' : couponData ? '✓' : 'Apply'}
            </button>
          </div>

          {couponError && (
            <p className="error-msg">{couponError}</p>
          )}

          {couponSuccess && (
            <div className="coupon-success">
              <span className="success-check">✓</span>
              <span className="success-text">{couponSuccess}</span>
              <span className="remove-link" onClick={() => {
                setCouponCode('');
                setCouponData(null);
                setCouponError('');
                setCouponSuccess('');
              }}>OK</span>
            </div>
          )}
        </div>
        

        {/* Coin Balance Display */}
        {user && (
          <div className="coupon-card" style={{marginTop: '16px'}}>
            <h3 className="coupon-heading">🪙 Your Coin Balance</h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'rgba(255, 215, 0, 0.05)',
              borderRadius: '12px',
              border: coinBalance >= getTotalCoins() ? '2px solid #ffd700' : '1px solid rgba(255,255,255,0.1)',
              cursor: coinBalance >= getTotalPrice() ? 'pointer' : 'not-allowed',
              opacity: coinBalance >= getTotalPrice() ? 1 : 0.5
            }}
            onClick={() => {
              if (coinBalance >= getTotalPrice()) {
                setUseCoins(!useCoins);
              }
            }}
            >
              <div>
                <div style={{color: '#ffd700', fontWeight: '600', fontSize: '14px'}}>
                  Your Balance: 🪙 {coinBalance}
                </div>
                <div style={{color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '4px'}}>
                  {coinBalance >= getTotalPrice() 
                    ? `Enough coins to cover this booking` 
                    : `Need ${getTotalPrice() - coinBalance} more coins`}
                </div>
              </div>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                border: '2px solid #ffd700',
                background: useCoins ? '#ffd700' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {useCoins && <span style={{color: '#000', fontSize: '14px', fontWeight: 'bold'}}>✓</span>}
              </div>
            </div>
            {useCoins && (
              <div style={{
                marginTop: '8px',
                padding: '8px 12px',
                background: 'rgba(255, 215, 0, 0.1)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#ffd700',
                textAlign: 'center'
              }}>
                🪙 You will pay {getTotalPrice()} coins now. Coins will be refunded after you attend the movie!
              </div>
            )}
          </div>
        )}

        {/* Pay Button */}
        <div className="pay-section">
          <button
            className="pay-btn"
            disabled={processing}
            onClick={async () => {
              setProcessing(true);

              try {
                const totalAmount = getTotalPrice();

                // Handle free bookings (total = 0) directly without Razorpay
                if (totalAmount === 0) {
                  try {
                    const movieIdToUse = movieIdFromState || movieId;
                    const bookingRes = await api.post('/api/bookings', {
                      movie_id: movieIdToUse,
                      selectedSeats: selectedSeats,
                      quantity: quantity,
                      payment_id: 'FREE_BOOKING',
                      customer_details: customerDetails,
                      food_orders: selectedFoods
                    });

                    const successPayload = {
                      ticket: bookingRes.data,
                      movie: movie,
                      payment: {
                        transaction_id: 'FREE_BOOKING',
                        amount: 0,
                        method: 'free'
                      },
                      selectedSeats: selectedSeats,
                      customerDetails: customerDetails
                    };

                    try {
                      sessionStorage.setItem('payment_success', JSON.stringify(successPayload));
                    } catch (storageErr) {
                      console.warn('Failed to store payment success payload:', storageErr);
                    }

                    navigate('/payment-success', { state: successPayload, replace: true });

                    // Fallback: if navigation fails, force redirect
                    setTimeout(() => {
                      if (window.location.pathname === '/payment') {
                        window.location.href = '/payment-success';
                      }
                    }, 300);
                  } catch (err) {
                    setError('Booking failed. Please try again.');
                  } finally {
                    setProcessing(false);
                  }
                  return;
                }

                // Handle coin payments directly
                if (useCoins) {
                  try {
                    const movieIdToUse = movieIdFromState || movieId;
                    const bookingRes = await api.post('/api/bookings', {
                      movie_id: movieIdToUse,
                      selectedSeats: selectedSeats,
                      quantity: quantity,
                      food_orders: selectedFoods,
                      coupon_code: couponCode,
                      use_coins: true,
                      customer_details: customerDetails
                    });

                    const successPayload = {
                      ticket: bookingRes.data,
                      movie: movie,
                      payment: {
                        transaction_id: 'COINS_PAYMENT',
                        amount: getTotalPrice(),
                        method: 'coins'
                      },
                      selectedSeats: selectedSeats,
                      customerDetails: customerDetails
                    };

                    try {
                      sessionStorage.setItem('payment_success', JSON.stringify(successPayload));
                    } catch (storageErr) {
                      console.warn('Failed to store payment success payload:', storageErr);
                    }

                    navigate('/payment-success', { state: successPayload, replace: true });

                    setTimeout(() => {
                      if (window.location.pathname === '/payment') {
                        window.location.href = '/payment-success';
                      }
                    }, 300);
                  } catch (err) {
                    setError(err.response?.data?.error || 'Coin payment failed. Please try again.');
                  } finally {
                    setProcessing(false);
                  }
                  return;
                }

                // For paid bookings, use Cashfree
                try {
                  const movieIdToUse = movieIdFromState || movieId;
                  const orderRes = await api.post('/api/payments/order', {
                    movie_id: movieIdToUse,
                    selectedSeats: selectedSeats,
                    food_orders: selectedFoods,
                    coupon_code: couponCode,
                    customer_id: user?.id || 'guest',
                    customer_email: customerDetails.email,
                    customer_phone: customerDetails.phone
                  });

                  if (orderRes.data && orderRes.data.payment_link) {
                    window.location.href = orderRes.data.payment_link;
                  } else {
                    setProcessing(false);
                    setError('Failed to create Cashfree payment order.');
                  }
                } catch (err) {
                  setProcessing(false);
                  setError('Payment gateway failed. Please try again.');
                }
              } catch (err) {
                setProcessing(false);
                setError('Payment gateway failed. Please try again.');
              }
            }}
          >
            {processing ? (
              <span className="btn-content">
                <span className="btn-spinner"></span>
                Processing...
              </span>
            ) : (
              <span className="btn-content">
                {getTotalPrice() === 0 ? 'CONFIRM TICKET' : `Pay Rs.${getTotalPrice()}`}
              </span>
            )}
          </button>
        </div>

        {/* Special Movie Message */}
        {movie && movie.is_special === 1 && movie.special_message && (
          <div style={{
            marginTop: '28px',
            display: 'flex',
            justifyContent: 'center',
            width: '100%'
          }}>
            <div style={{
              padding: '12px 28px',
              background: 'transparent',
              border: '2px dotted #ffd700',
              borderRadius: '12px',
              color: '#ffd700',
              fontSize: '14px',
              fontWeight: '600',
              letterSpacing: '1px',
              textAlign: 'center',
              fontFamily: 'Arial, sans-serif',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
            }}>
              {movie.special_message}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Payment;
