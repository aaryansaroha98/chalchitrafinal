
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

  const [foodData, setFoodData] = useState({});
  const [coinBalance, setCoinBalance] = useState(50); // Default 50 coins (signup bonus)

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
      setCoinBalance(res.data.coins || 50); // Default to 50 if not set
    } catch (err) {
      setCoinBalance(50); // Default to 50 on error
    }
  };

  const fetchMovie = async () => {
    try {
      const movieIdToUse = movieIdFromState || movieId;
      const res = await api.get(`/api/movies/${movieIdToUse}`);
      console.log('Fetched movie data:', res.data);
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
      // Food prices stored in DB as rupees, convert to coins by dividing by 10
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
                  <span className="info-value">{quantity} x 🪙 {TICKET_COIN_PRICE}</span>
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
                <span className="detail-value">🪙 {(quantity * TICKET_COIN_PRICE).toFixed(2)}</span>
              </div>

              {Object.entries(selectedFoods).map(([foodId, qty]) => {
                const foodItem = foodData[foodId];
                const isFree = foodItem && foodItem.is_free;
                const priceInCoins = isFree ? 0 : (foodItem ? Math.ceil(foodItem.price / 10) : 0);
                const itemTotal = priceInCoins * qty;

                return (
                  <div key={foodId} className="detail-item">
                    <span className="detail-label">{foodItem ? foodItem.name : `Food ${foodId}`} x {qty}</span>
                    <span className="detail-value">{isFree ? 'FREE' : `🪙 ${itemTotal} Coins`}</span>
                  </div>
                );
              })}
            </div>

            {/* Divider */}
            <div className="divider"></div>

            {/* Totals */}
            <div className="totals-section">
              <div className="total-row grand-total">
                <span className="total-label">Total</span>
                <span className="total-value">🪙 {getTotalCoins()} Coins</span>
              </div>
            </div>
          </div>
        </div>

        

        {/* Coin Balance Display */}
        {user && (
          <div className="coin-card" style={{marginTop: '16px'}}>
            <h3 className="coin-heading">🪙 Your Coin Balance</h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: coinBalance >= getTotalCoins() ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 100, 100, 0.1)',
              borderRadius: '12px',
              border: coinBalance >= getTotalCoins() ? '2px solid #ffd700' : '2px solid rgba(255,100,100,0.5)'
            }}>
              <div>
                <div style={{color: '#ffd700', fontWeight: '600', fontSize: '18px'}}>
                  Balance: 🪙 {coinBalance}
                </div>
                <div style={{color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginTop: '4px'}}>
                  {coinBalance >= getTotalCoins() 
                    ? `✓ Enough coins to complete booking` 
                    : `⚠️ Need ${getTotalCoins() - coinBalance} more coins`}
                </div>
              </div>
            </div>
            <div style={{
              marginTop: '8px',
              padding: '8px 12px',
              background: 'rgba(255, 215, 0, 0.05)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'rgba(255, 215, 0, 0.8)',
              textAlign: 'center'
            }}>
              💡 Coins will be refunded after you attend the movie!
            </div>
          </div>
        )}

        {/* Pay Button - COIN ONLY */}
        <div className="pay-section">
          <button
            className="pay-btn"
            disabled={processing || coinBalance < getTotalCoins()}
            onClick={async () => {
              // Check if user has enough coins
              if (coinBalance < getTotalCoins()) {
                setError(`Insufficient coins! You need ${getTotalCoins() - coinBalance} more coins.`);
                return;
              }

              setProcessing(true);
              setError('');

              try {
                const totalCoins = getTotalCoins();
                const movieIdToUse = movieIdFromState || movieId;

                // ALL payments are now coin-based
                const bookingRes = await api.post('/api/bookings', {
                  movie_id: movieIdToUse,
                  selectedSeats: selectedSeats,
                  quantity: quantity,
                  food_orders: selectedFoods,
                  use_coins: true,
                  customer_details: customerDetails
                });

                const successPayload = {
                  ticket: bookingRes.data,
                  movie: movie,
                  payment: {
                    transaction_id: totalCoins === 0 ? 'FREE_BOOKING' : 'COINS_PAYMENT',
                    amount: totalCoins,
                    method: totalCoins === 0 ? 'free' : 'coins'
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
                setError(err.response?.data?.error || 'Booking failed. Please try again.');
                setProcessing(false);
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
                {coinBalance < getTotalCoins() 
                  ? `Need ${getTotalCoins() - coinBalance} More Coins` 
                  : getTotalCoins() === 0 
                    ? 'CONFIRM FREE TICKET' 
                    : `Confirm & Pay 🪙 ${getTotalCoins()} Coins`}
              </span>
            )}
          </button>

          {error && (
            <div style={{
              marginTop: '12px',
              padding: '12px',
              background: 'rgba(255, 100, 100, 0.1)',
              border: '1px solid rgba(255, 100, 100, 0.3)',
              borderRadius: '8px',
              color: '#ff6b6b',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}
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
