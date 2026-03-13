 import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../components/Loader';

const Booking = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [shakeSeat, setShakeSeat] = useState(null);
  const [availableFoods, setAvailableFoods] = useState([]);
  const [selectedFoods, setSelectedFoods] = useState({});
  const [hasExistingBooking, setHasExistingBooking] = useState(false);
  const [existingBooking, setExistingBooking] = useState(null);
  const [showAlreadyBookedModal, setShowAlreadyBookedModal] = useState(false);
  const seatScrollRef = useRef(null);
  const blockBRef = useRef(null);

  // API base URL for building absolute URLs to /uploads assets
  const apiBaseUrl = process.env.REACT_APP_API_URL ||
    process.env.REACT_APP_API_BASE_URL ||
    process.env.VITE_API_BASE_URL ||
    'http://localhost:3000';

  // Check if user has already booked this movie
  const fetchUserBookings = async () => {
    try {
      const res = await api.get(`/api/bookings/check/${movieId}`);
      if (res.data.hasBooking) {
        setHasExistingBooking(true);
        setExistingBooking(res.data.booking);
        setShowAlreadyBookedModal(true);
      }
    } catch (err) {
      console.error('Error checking existing bookings:', err);
      // Continue with normal flow if check fails
    }
  };

  useEffect(() => {
    fetchMovie();
    fetchOccupiedSeats();
    fetchAvailableFoods();
    fetchUserBookings();
  }, [movieId]);

  useEffect(() => {
    if (!seatScrollRef.current || !blockBRef.current) return;
    if (typeof window !== 'undefined' && window.innerWidth > 576) return;

    const container = seatScrollRef.current;
    const target = blockBRef.current;
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const offset = targetRect.left - containerRect.left - (containerRect.width - targetRect.width) / 2;

    container.scrollTo({
      left: container.scrollLeft + offset,
      behavior: 'auto'
    });
  }, [movie?.venue, loading]);

  const fetchOccupiedSeats = async () => {
    try {
      const res = await api.get(`/api/bookings/occupied/${movieId}`);
      setOccupiedSeats(res.data.occupied_seats || []);
    } catch (err) {
      console.error('Failed to fetch occupied seats:', err);
    }
  };

  const fetchMovie = async () => {
    try {
      const res = await api.get(`/api/movies/${movieId}`);
      setMovie(res.data);
      setLoading(false);
    } catch (err) {
      setError('Movie not found');
      setLoading(false);
    }
  };

  const fetchAvailableFoods = async () => {
    try {
      const res = await api.get(`/api/foods/available/${movieId}`);
      setAvailableFoods(res.data);
    } catch (err) {
      console.error('Failed to fetch available foods:', err);
    }
  };

  const TICKET_PRICE = parseFloat(movie?.price) || 0;

  const handleSeatClick = (seatId) => {
    if (occupiedSeats.includes(seatId)) return;

    setSelectedSeats(prev => {
      if (prev.includes(seatId)) {
        // Deselect
        return prev.filter(id => id !== seatId);
      } else {
        // Check 6-ticket limit
        if (prev.length >= 6) {
          setShakeSeat(seatId);
          setToastMessage('Maximum 6 tickets allowed per booking');
          setShowToast(true);
          setTimeout(() => {
            setShakeSeat(null);
            setShowToast(false);
          }, 2000);
          return prev;
        }
        // Select
        return [...prev, seatId];
      }
    });
  };

  const handleQuantityChange = (newQuantity) => {
    setQuantity(newQuantity);
    // Reset selected seats if current selection exceeds new quantity
    if (selectedSeats.length > newQuantity) {
      setSelectedSeats(selectedSeats.slice(0, newQuantity));
    }
  };

  const getTotalPrice = () => {
    const ticketPrice = selectedSeats.length * TICKET_PRICE;
    const foodPrice = Object.entries(selectedFoods).reduce((total, [foodId, quantity]) => {
      const food = availableFoods.find(f => f.id === parseInt(foodId));
      return total + (food ? food.price * quantity : 0);
    }, 0);
    return ticketPrice + foodPrice;
  };

  const handleFoodChange = (foodId, quantity) => {
    if (quantity <= 0) {
      const newSelectedFoods = { ...selectedFoods };
      delete newSelectedFoods[foodId];
      setSelectedFoods(newSelectedFoods);
    } else {
      setSelectedFoods({
        ...selectedFoods,
        [foodId]: quantity
      });
    }
  };

  const handleBook = () => {
    if (selectedSeats.length === 0) {
      setToastMessage('Please select at least one seat');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      return;
    }

    // Get customer details - always pass data even if session expired
    const customerData = {
      name: user?.name || user?.email?.split('@')[0] || 'Guest',
      email: user?.email || 'guest@iitjammu.ac.in',
      phone: user?.phone || ''
    };

    navigate('/payment', {
      state: {
        selectedSeats,
        quantity: selectedSeats.length,
        movieId,
        selectedFoods,
        customerDetails: customerData
      }
    });
  };

  const Seat = ({ seatId, seatNumber, isSelected, isOccupied, onClick, shake, size = 24, fontSize = 9 }) => {
    return (
      <motion.button
        key={seatId}
        onClick={() => !isOccupied && onClick(seatId)}
        disabled={isOccupied}
        animate={shake === seatId ? {
          x: [-5, 5, -5, 5, 0],
          transition: { duration: 0.5 }
        } : {}}
        whileHover={!isOccupied && !isSelected ? {
          scale: 1.1,
          y: -2,
          transition: { duration: 0.2 }
        } : {}}
        whileTap={!isOccupied ? { scale: 0.95 } : {}}
        className={`
          seat-button relative ${isOccupied
            ? 'occupied'
            : isSelected
              ? 'selected'
              : 'available'
          }
        `}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          fontSize: `${fontSize}px`
        }}
      >
        {isSelected && (
          <div style={{
            position: 'absolute',
            top: '-2px',
            left: '-2px',
            right: '-2px',
            bottom: '-2px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }} />
        )}
        <span className="relative z-10 drop-shadow-sm">
          {seatNumber}
        </span>
      </motion.button>
    );
  };

  if (loading) {
    return <Loader message="Loading Movie Details" subtitle="Fetching information for your selection..." />;
  }

  if (error || !movie) {
    return (
      <div className="bg-void" style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-glass border-glass"
          style={{
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '32px',
            textAlign: 'center'
          }}
        >
          <h2 className="font-cinzel" style={{fontSize: '24px', color: 'white', marginBottom: '16px'}}>Movie Not Found</h2>
          <p className="text-glass">The requested movie could not be loaded.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-void" style={{minHeight: '100vh', position: 'relative', overflow: 'hidden'}}>
      {/* Classic Simple Animated Background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'hidden'
      }}>
        {/* Pure black background */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#000000'
        }}></div>

        {/* White animated particles */}
        {Array.from({ length: 15 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              borderRadius: '50%',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animation: `randomFloat${i % 4} ${10 + Math.random() * 20}s linear infinite`,
              animationDelay: Math.random() * 10 + 's',
              boxShadow: '0 0 6px rgba(255, 255, 255, 0.3)',
              opacity: Math.random() * 0.4 + 0.2,
              zIndex: 2
            }}
          />
        ))}

        {/* Gentle moving waves */}
        <div style={{
          position: 'absolute',
          top: '30%',
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
          animation: 'gentleWave 20s ease-in-out infinite',
          opacity: 0.3
        }}></div>

        <div style={{
          position: 'absolute',
          top: '70%',
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.08) 50%, transparent 100%)',
          animation: 'gentleWave 25s ease-in-out infinite',
          animationDelay: '5s',
          opacity: 0.2
        }}></div>

        {/* Subtle geometric shapes */}
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: '100px',
          height: '100px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '50%',
          animation: 'slowRotate 60s linear infinite',
          opacity: 0.2
        }}></div>

        <div style={{
          position: 'absolute',
          bottom: '15%',
          left: '15%',
          width: '80px',
          height: '80px',
          border: '1px solid rgba(255, 255, 255, 0.03)',
          borderRadius: '50%',
          animation: 'slowRotateReverse 45s linear infinite',
          opacity: 0.15
        }}></div>
      </div>

      <div className="booking-page" style={{ position: 'relative' }}>
        {/* Page Title */}
        <div className="booking-title-wrap" style={{textAlign: 'center', marginBottom: '48px', marginTop: '-10px'}}>
          <h1 className="booking-title" style={{
            fontSize: '2.5rem',
            fontWeight: '550',
            color: '#ffffff',
            margin: '0',
            marginTop: '-6px',
            textShadow: '0 4px 20px rgba(0, 255, 255, 0.3), 0 2px 4px rgba(0, 0, 0, 0.5)',
            letterSpacing: '0.02em',
            fontFamily: 'Arial, Helvetica, sans-serif'
          }}>
            Book Your Ticket
          </h1>
        </div>

        {/* Movie Header */}
        <div style={{marginBottom: '48px'}}>

          <div className="booking-header-card">
            {/* Movie Poster - Left Side */}
            <div>
              <img
                src={movie.poster_url ? (movie.poster_url.startsWith('http') ? movie.poster_url : `${apiBaseUrl}${movie.poster_url}`) : '/placeholder-movie.jpg'}
                alt={movie.title}
                className="booking-poster"
              />
            </div>

            {/* Movie Details - Right Side */}
            <div className="booking-details">
              {(() => {
                const normalizeValue = (value) => {
                  if (value === null || value === undefined) return '';
                  if (typeof value === 'string') return value.trim();
                  return String(value).trim();
                };

                const categoryValue = normalizeValue(movie.category || movie.movie_category || movie.genre);
                const durationValue = normalizeValue(movie.duration || movie.movie_duration || movie.runtime);
                const imdbValue = normalizeValue(movie.imdb_rating || movie.imdbRating || movie.imdb);
                const languageValue = normalizeValue(movie.language || movie.movie_language);

                return (
                  <>
              <div className="booking-summary">
                <h1 className="booking-movie-title">
                  {movie.title}
                </h1>

                <p className="booking-movie-description">
                  {movie.description}
                </p>
              </div>

              <div className="booking-info-columns">
                <div className="booking-info-grid booking-info-left">
                  <div className="booking-info-row">
                    <span className="booking-info-label">Date:</span>
                    <span className="booking-info-value">
                      {new Date(movie.date).toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  <div className="booking-info-row">
                    <span className="booking-info-label">Time:</span>
                    <span className="booking-info-value">
                      {new Date(movie.date).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="booking-info-row">
                    <span className="booking-info-label">Venue:</span>
                    <span className="booking-info-value">
                      {movie.venue}
                    </span>
                  </div>
                  <div className="booking-info-row booking-info-food">
                    <span className="booking-info-label">Available Food:</span>
                    <div className="booking-food-grid">
                      {availableFoods && availableFoods.length > 0 ? (
                        availableFoods.map(food => (
                          <span key={food.id} className="booking-food-pill">
                            {food.name} - ₹{food.price}
                          </span>
                        ))
                      ) : (
                        <span className="booking-info-empty">No food available</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="booking-info-grid booking-info-right">
                  {categoryValue ? (
                    <div className="booking-info-row">
                      <span className="booking-info-label">Category:</span>
                      <span className="booking-info-value">
                        {categoryValue}
                      </span>
                    </div>
                  ) : null}
                  {durationValue ? (
                    <div className="booking-info-row">
                      <span className="booking-info-label">Duration:</span>
                      <span className="booking-info-value">
                        {durationValue}
                      </span>
                    </div>
                  ) : null}
                  {imdbValue ? (
                    <div className="booking-info-row">
                      <span className="booking-info-label">Subtitle:</span>
                      <span className="booking-info-value">
                        {imdbValue}
                      </span>
                    </div>
                  ) : null}
                  {languageValue ? (
                    <div className="booking-info-row">
                      <span className="booking-info-label">Language:</span>
                      <span className="booking-info-value">
                        {languageValue}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Seat Selection */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{marginBottom: '48px'}}
        >
          <div className="bg-glass border-glass booking-seat-card" style={{
            backdropFilter: 'blur(16px)',
            borderRadius: '24px',
            padding: '32px'
          }}>
            <div style={{
              position: 'relative',
              marginBottom: '32px'
            }}>
              <h2 className="booking-seat-title" style={{
                fontSize: '24px',
                textAlign: 'center',
                marginBottom: 0,
                color: '#ffffff',
                fontWeight: 'bold',
                fontFamily: 'Arial, sans-serif'
              }}>
                Select Your Seats
              </h2>
            </div>

            {/* Curved Screen */}
            <motion.div
              className="booking-seat-screen"
              style={{textAlign: 'center', marginBottom: '32px', marginTop: '-40px'}}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div style={{position: 'relative'}}>
                {/* Curved screen effect using SVG */}
                <svg width="400" height="80" viewBox="0 0 400 80" style={{margin: '0 auto 16px', display: 'block'}}>
                  <defs>
                    <linearGradient id="screenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{stopColor: 'rgba(255, 255, 255, 0.1)', stopOpacity: 1}} />
                      <stop offset="50%" style={{stopColor: 'rgba(255, 255, 255, 0.15)', stopOpacity: 1}} />
                      <stop offset="100%" style={{stopColor: 'rgba(255, 255, 255, 0.1)', stopOpacity: 1}} />
                    </linearGradient>
                  </defs>
                  {/* Curved path for the screen */}
                  <path
                    d="M20,60 Q200,20 380,60 L380,70 Q200,30 20,70 Z"
                    fill="url(#screenGradient)"
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth="2"
                    style={{filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.1))'}}
                  />
                  {/* Animated glow effect */}
                  <motion.path
                    d="M20,60 Q200,20 380,60 L380,70 Q200,30 20,70 Z"
                    fill="none"
                    stroke="url(#screenGradient)"
                    strokeWidth="1"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                  />
                </svg>
                <motion.h3
                  className="font-cinzel"
                  style={{
                    fontSize: '24px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                    marginTop: '-10px'
                  }}
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Screen
                </motion.h3>
              </div>
            </motion.div>

            {/* Pushkar Layout with Separate Block Containers */}
            {['Pushkar 11AC2022', 'Pushkar 11AC3027'].includes(movie.venue) ? (
              <div className="seat-layout-scroll" ref={seatScrollRef} style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                gap: '20px',
                flexWrap: 'nowrap',
                marginTop: '32px',
                overflowX: 'hidden',
                padding: '0 20px'
              }}>
                {/* Block A - 5 rows × 5 seats */}
                <div className="seat-block-wrap" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#ffffff',
                    marginBottom: '16px',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
                  }}>
                    Block A
                  </div>
                  <motion.div
                    className="seat-block"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      padding: '30px',
                      background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
                      backdropFilter: 'blur(15px)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      position: 'relative',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                    }}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    {Array.from({ length: 5 }, (_, rowIndex) => {
                      // Progressive seat sizing: smaller at front, larger at back
                      const baseSize = 24;
                      const sizeIncrement = 2.5;
                      const seatSize = baseSize + (rowIndex * sizeIncrement); // 24, 26.5, 29, 31.5, 34
                      const fontSize = 9 + (rowIndex * 0.4); // 9, 9.4, 9.8, 10.2, 10.6
                      const seatGap = 4 + (rowIndex * 0.4); // 4, 4.4, 4.8, 5.2, 5.6
                      // First row right, last row left for Block A
                      const shiftAmount = rowIndex === 0 ? 20 : rowIndex === 4 ? -20 : 0; // Row 1: +20px, Row 5: -20px, others: 0

                      return (
                        <motion.div
                          key={rowIndex}
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: `${seatGap}px`,
                            marginBottom: '2px',
                            transform: `translateX(${shiftAmount}px)`
                          }}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.05 * rowIndex }}
                        >
                          {Array.from({ length: 5 }, (_, col) => {
                            const seatNumber = col + 1;
                            const seatId = `A-R${rowIndex + 1}-S${col + 1}`;
                            const isSelected = selectedSeats.includes(seatId);
                            const isOccupied = occupiedSeats.includes(seatId);

                            return (
                              <Seat
                                key={col}
                                seatId={seatId}
                                seatNumber={seatNumber}
                                isSelected={isSelected}
                                isOccupied={isOccupied}
                                onClick={handleSeatClick}
                                shake={shakeSeat}
                                size={seatSize}
                                fontSize={fontSize}
                              />
                            );
                          })}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>

                {/* Block B - 7 rows with varying seats */}
                <div className="seat-block-wrap" ref={blockBRef} style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#ffffff',
                    marginBottom: '16px',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
                  }}>
                    Block B
                  </div>
                  <motion.div
                    className="seat-block"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      padding: '30px',
                      background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02))',
                      backdropFilter: 'blur(18px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '20px',
                      position: 'relative',
                      boxShadow: '0 6px 25px rgba(0, 0, 0, 0.2)'
                    }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 }}
                  >
                    {Array.from({ length: 7 }, (_, rowIndex) => {
                      // Define seats per row for Block B
                      const seatsPerRow = [8, 8, 9, 10, 11, 12, 12];
                      // Progressive seat sizing: smaller at front, larger at back
                      const baseSize = 22;
                      const sizeIncrement = 2;
                      const seatSize = baseSize + (rowIndex * sizeIncrement); // 22, 24, 26, 28, 30, 32, 34
                      const fontSize = 8.5 + (rowIndex * 0.3); // 8.5, 8.8, 9.1, 9.4, 9.7, 10.0, 10.3
                      const seatGap = 3 + (rowIndex * 0.2); // 3, 3.2, 3.4, 3.6, 3.8, 4.0, 4.2

                      return (
                        <motion.div
                          key={rowIndex}
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: `${seatGap}px`,
                            marginBottom: '2px'
                          }}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.05 * rowIndex }}
                        >
                          {Array.from({ length: seatsPerRow[rowIndex] }, (_, col) => {
                            const seatNumber = col + 1;
                            const seatId = `B-R${rowIndex + 1}-S${col + 1}`;
                            const isSelected = selectedSeats.includes(seatId);
                            const isOccupied = occupiedSeats.includes(seatId);

                            return (
                              <Seat
                                key={col}
                                seatId={seatId}
                                seatNumber={seatNumber}
                                isSelected={isSelected}
                                isOccupied={isOccupied}
                                onClick={handleSeatClick}
                                shake={shakeSeat}
                                size={seatSize}
                                fontSize={fontSize}
                              />
                            );
                          })}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                  <div className="booking-seat-venue-inline">
                    {movie?.venue}
                  </div>
                </div>

                {/* Block C - 5 rows × 5 seats */}
                <div className="seat-block-wrap" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#ffffff',
                    marginBottom: '16px',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
                  }}>
                    Block C
                  </div>
                  <motion.div
                    className="seat-block"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      padding: '30px',
                      background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
                      backdropFilter: 'blur(15px)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      position: 'relative',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                    }}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0 }}
                  >
                    {Array.from({ length: 5 }, (_, rowIndex) => {
                      // Progressive seat sizing: smaller at front, larger at back
                      const baseSize = 24;
                      const sizeIncrement = 2.5;
                      const seatSize = baseSize + (rowIndex * sizeIncrement); // 24, 26.5, 29, 31.5, 34
                      const fontSize = 9 + (rowIndex * 0.4); // 9, 9.4, 9.8, 10.2, 10.6
                      const seatGap = 4 + (rowIndex * 0.4); // 4, 4.4, 4.8, 5.2, 5.6
                      // First row left, last row right for Block C
                      const shiftAmount = rowIndex === 0 ? -20 : rowIndex === 4 ? 20 : 0; // Row 1: -20px, Row 5: +20px, others: 0

                      return (
                        <motion.div
                          key={rowIndex}
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: `${seatGap}px`,
                            marginBottom: '2px',
                            transform: `translateX(${shiftAmount}px)`
                          }}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.05 * rowIndex }}
                        >
                          {Array.from({ length: 5 }, (_, col) => {
                            const seatNumber = col + 1;
                            const seatId = `C-R${rowIndex + 1}-S${col + 1}`;
                            const isSelected = selectedSeats.includes(seatId);
                            const isOccupied = occupiedSeats.includes(seatId);

                            return (
                              <Seat
                                key={col}
                                seatId={seatId}
                                seatNumber={seatNumber}
                                isSelected={isSelected}
                                isOccupied={isOccupied}
                                onClick={handleSeatClick}
                                shake={shakeSeat}
                                size={seatSize}
                                fontSize={fontSize}
                              />
                            );
                          })}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>
              </div>
            ) : (
              // Mansar Auditorium Layout (existing)
              <div className="seat-layout-scroll" ref={seatScrollRef} style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                gap: '12px',
                flexWrap: 'nowrap',
                marginTop: '32px',
                overflowX: 'hidden',
                padding: '0 20px'
              }}>
                {/* Left Block - Block A */}
                <div className="seat-block-wrap" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#ffffff',
                    marginBottom: '16px',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
                  }}>
                    Block A
                  </div>
                  <motion.div
                    className="seat-block"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                      padding: '40px',
                      background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
                      backdropFilter: 'blur(15px)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      position: 'relative',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                    }}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    {/* Block A: 15 rows × 7 seats */}
                    {Array.from({ length: 15 }, (_, rowIndex) => {
                      const seatSize = 28;
                      const fontSize = 10;
                      const seatGap = 4;

                      return (
                        <div key={rowIndex} style={{display: 'flex', alignItems: 'center'}}>
                          {/* Row number */}
                          <div style={{
                            width: '30px',
                            textAlign: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: '#ffffff',
                            marginRight: '8px'
                          }}>
                            {rowIndex + 1}
                          </div>
                          {/* Seats */}
                          <motion.div
                            style={{
                              display: 'flex',
                              justifyContent: 'center',
                              gap: `${seatGap}px`,
                              marginBottom: '1px'
                            }}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.03 * rowIndex }}
                          >
                            {Array.from({ length: 7 }, (_, col) => {
                              const seatNumber = col + 1;
                              const seatId = `A-R${rowIndex + 1}-S${col + 1}`;
                              const isSelected = selectedSeats.includes(seatId);
                              const isOccupied = occupiedSeats.includes(seatId);

                              return (
                                <Seat
                                  key={col}
                                  seatId={seatId}
                                  seatNumber={seatNumber}
                                  isSelected={isSelected}
                                  isOccupied={isOccupied}
                                  onClick={handleSeatClick}
                                  shake={shakeSeat}
                                  size={seatSize}
                                  fontSize={fontSize}
                                />
                              );
                            })}
                          </motion.div>
                        </div>
                      );
                    })}
                  </motion.div>
                </div>

                {/* Center Block - Block B */}
                <div className="seat-block-wrap" ref={blockBRef} style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#ffffff',
                    marginBottom: '16px',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
                  }}>
                    Block B
                  </div>
                  <motion.div
                    className="seat-block"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                      padding: '48px',
                      background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02))',
                      backdropFilter: 'blur(18px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '20px',
                      position: 'relative',
                      boxShadow: '0 6px 25px rgba(0, 0, 0, 0.2)'
                    }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 }}
                  >
                    {/* Block B: 14 rows × 11 seats */}
                    {Array.from({ length: 14 }, (_, rowIndex) => {
                      const seatSize = 28;
                      const fontSize = 10;
                      const seatGap = 4;

                      return (
                        <motion.div
                          key={rowIndex}
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: `${seatGap}px`,
                            marginBottom: '1px'
                          }}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.03 * rowIndex }}
                        >
                          {Array.from({ length: 11 }, (_, col) => {
                            const seatNumber = col + 1;
                            const seatId = `B-R${rowIndex + 1}-S${col + 1}`;
                            const isSelected = selectedSeats.includes(seatId);
                            const isOccupied = occupiedSeats.includes(seatId);

                            return (
                              <Seat
                                key={col}
                                seatId={seatId}
                                seatNumber={seatNumber}
                                isSelected={isSelected}
                                isOccupied={isOccupied}
                                onClick={handleSeatClick}
                                shake={shakeSeat}
                                size={seatSize}
                                fontSize={fontSize}
                              />
                            );
                          })}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                  <div className="booking-seat-venue-inline">
                    {movie?.venue}
                  </div>
                </div>

                {/* Right Block - Block C */}
                <div className="seat-block-wrap" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#ffffff',
                    marginBottom: '16px',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
                  }}>
                    Block C
                  </div>
                  <motion.div
                    className="seat-block"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                      padding: '40px',
                      background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
                      backdropFilter: 'blur(15px)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      position: 'relative',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                    }}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0 }}
                  >
                    {/* Block C: 15 rows × 7 seats */}
                    {Array.from({ length: 15 }, (_, rowIndex) => {
                      const seatSize = 28;
                      const fontSize = 10;
                      const seatGap = 4;

                      return (
                        <motion.div
                          key={rowIndex}
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: `${seatGap}px`,
                            marginBottom: '1px'
                          }}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.03 * rowIndex }}
                        >
                          {Array.from({ length: 7 }, (_, col) => {
                            const seatNumber = col + 1;
                            const seatId = `C-R${rowIndex + 1}-S${col + 1}`;
                            const isSelected = selectedSeats.includes(seatId);
                            const isOccupied = occupiedSeats.includes(seatId);

                            return (
                              <Seat
                                key={col}
                                seatId={seatId}
                                seatNumber={seatNumber}
                                isSelected={isSelected}
                                isOccupied={isOccupied}
                                onClick={handleSeatClick}
                                shake={shakeSeat}
                                size={seatSize}
                                fontSize={fontSize}
                              />
                            );
                          })}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>
              </div>
            )}

            {/* Legend */}
            <motion.div
              className="booking-seat-legend"
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '32px',
                marginTop: '32px'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px'
                }}></div>
                <span className="font-inter booking-seat-legend-text" style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.8)'
                }}>Available</span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: '4px'
                }}></div>
                <span className="font-inter booking-seat-legend-text" style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.8)'
                }}>Selected</span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  background: 'rgba(5, 5, 5, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px'
                }}></div>
                <span className="font-inter booking-seat-legend-text" style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.8)'
                }}>Occupied</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Food Selection */}
        {availableFoods && availableFoods.length > 0 && (
          <div style={{marginBottom: '48px'}}>
            <div className="booking-food-panel" style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '32px'
            }}>
              <h2 className="booking-food-title" style={{
                fontSize: '24px',
                textAlign: 'center',
                marginBottom: '32px',
                color: '#ffffff',
                fontWeight: 'bold',
                fontFamily: 'Arial, sans-serif'
              }}>
                Available Food
              </h2>

              <div className="booking-food-grid">
                {availableFoods.map(food => (
                  <div
                    key={food.id}
                    className="booking-food-card"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '12px',
                      minHeight: '140px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: '12px'
                    }}
                  >
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'}}>
                      <img
                        src={food.image_url ? (food.image_url.startsWith('http') ? food.image_url : `${apiBaseUrl}${food.image_url}`) : '/placeholder-movie.jpg'}
                        alt={food.name}
                        className="booking-food-image"
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          marginBottom: '8px',
                          objectFit: 'cover'
                        }}
                      />
                      <div>
                        <h4 className="booking-food-name" style={{
                          color: '#ffffff',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          marginBottom: '4px',
                          fontFamily: 'Arial, sans-serif'
                        }}>
                          {food.name}
                        </h4>
                        <p className="booking-food-desc" style={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: '14px',
                          marginBottom: '8px'
                        }}>
                          {food.description}
                        </p>
                        <p className="booking-food-price" style={{
                          color: '#ffffff',
                          fontSize: '16px',
                          fontWeight: 'bold'
                        }}>
                          ₹{food.price}
                        </p>
                      </div>
                    </div>

                    <div className="booking-food-controls" style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      marginTop: '-10px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <button
                          onClick={() => {
                            const currentQty = selectedFoods[food.id] || 0;
                            handleFoodChange(food.id, currentQty - 1);
                          }}
                          disabled={!selectedFoods[food.id] || selectedFoods[food.id] <= 0}
                          className="booking-food-btn"
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#ffffff',
                            borderRadius: '6px',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}
                        >
                          -
                        </button>

                        <span className="booking-food-qty" style={{
                          color: '#ffffff',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          minWidth: '30px',
                          textAlign: 'center'
                        }}>
                          {selectedFoods[food.id] || 0}
                        </span>

                        <button
                          onClick={() => {
                            const currentQty = selectedFoods[food.id] || 0;
                            handleFoodChange(food.id, currentQty + 1);
                          }}
                          className="booking-food-btn"
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#ffffff',
                            borderRadius: '6px',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Selected Items Summary */}
        {selectedSeats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{marginBottom: '48px'}}
          >
            <div className="booking-selected-panel" style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              <h2 className="booking-selected-title" style={{
                fontSize: '24px',
                textAlign: 'center',
                marginBottom: '32px',
                color: '#ffffff',
                fontWeight: 'bold',
                fontFamily: 'Arial, sans-serif'
              }}>
                Selected Items
              </h2>

              <div style={{marginBottom: '32px'}}>
                {/* Selected Seats */}
                <div style={{marginBottom: '24px'}}>
                  <h4 className="booking-selected-subtitle" style={{
                    color: '#ffffff',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    marginBottom: '12px',
                    fontFamily: 'Arial, sans-serif'
                  }}>
                    Selected Seats ({selectedSeats.length})
                  </h4>
                  <div className="booking-selected-card" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '16px'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      {selectedSeats.map(seat => (
                        <span
                          key={seat}
                          className="booking-selected-tag"
                          style={{
                            background: 'rgba(0, 255, 255, 0.1)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(0, 255, 255, 0.3)',
                            color: '#ffffff',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            fontFamily: 'Arial, sans-serif',
                            boxShadow: '0 2px 8px rgba(0, 255, 255, 0.2)'
                          }}
                        >
                          {seat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Selected Food Items */}
                {Object.keys(selectedFoods).length > 0 && (
                  <div style={{marginBottom: '24px'}}>
                    <h4 className="booking-selected-subtitle" style={{
                      color: '#ffffff',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      marginBottom: '12px',
                      fontFamily: 'Arial, sans-serif'
                    }}>
                      Selected Food Items
                    </h4>
                    <div className="booking-selected-card" style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '16px'
                    }}>
                      {Object.entries(selectedFoods).map(([foodId, quantity]) => {
                        const food = availableFoods.find(f => f.id === parseInt(foodId));
                        if (!food || quantity <= 0) return null;

                        return (
                          <div
                            key={foodId}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '6px',
                              padding: '6px',
                              background: 'rgba(255, 255, 255, 0.03)',
                              borderRadius: '6px'
                            }}
                          >
                            <div>
                              <span style={{
                                color: '#ffffff',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                fontFamily: 'Arial, sans-serif'
                              }}>
                                {food.name}
                              </span>
                              <span style={{
                                color: 'rgba(255, 255, 255, 0.6)',
                                marginLeft: '6px',
                                fontSize: '12px'
                              }}>
                                × {quantity}
                              </span>
                            </div>
                            <span style={{
                              color: '#ffffff',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              fontFamily: 'Arial, sans-serif'
                            }}>
                              ₹{food.price * quantity}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Total Price and Book Ticket Button in same row */}
                <div className="booking-total-row" style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '20px',
                  marginBottom: '32px'
                }}>
                  <div className="booking-total-box" style={{
                    color: '#ffffff',
                    fontSize: '18px',
                    fontWeight: '700',
                    fontFamily: 'Arial, sans-serif',
                    minWidth: '140px',
                    textAlign: 'center'
                  }}>
                    <span style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: 'rgba(255, 255, 255, 0.8)',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Total Amount
                    </span>
                    ₹{getTotalPrice()}
                  </div>

                  <button
                    onClick={handleBook}
                    className="booking-book-btn"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '16px',
                      fontWeight: '600',
                      fontFamily: 'Arial, sans-serif',
                      padding: '16px 24px',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 4px 20px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                      minWidth: '220px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 8px 30px rgba(255, 255, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.25)';
                      e.target.style.border = '1px solid rgba(255, 255, 255, 0.45)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 20px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
                      e.target.style.border = '1px solid rgba(255, 255, 255, 0.3)';
                    }}
                  >
                    <i className="fas fa-ticket-alt me-2" style={{fontSize: '14px'}}></i>
                    Book Ticket{selectedSeats.length > 1 ? 's' : ''}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}



        {/* Toast Notification */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              style={{
                position: 'fixed',
                bottom: '96px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '16px',
                color: 'white',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Already Booked Modal */}
        <AnimatePresence>
          {showAlreadyBookedModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000
              }}
              onClick={() => navigate('/')} // Redirect to home screen when clicking outside
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                style={{
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))',
                  backdropFilter: 'blur(30px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '20px',
                  padding: '20px',
                  maxWidth: '350px',
                  width: '90%',
                  textAlign: 'center',
                  position: 'relative',
                  boxShadow: '0 25px 80px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => navigate('/')} // Redirect to home screen
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '20px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  ×
                </button>

                {/* Main Message */}
                <h2 style={{
                  color: '#ffffff',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  marginBottom: '12px',
                  fontFamily: 'Arial, sans-serif'
                }}>
                  Already Booked! 🎬
                </h2>

                <p style={{
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontSize: '14px',
                  marginBottom: '24px',
                  lineHeight: '1.6',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  You have already booked tickets for this movie. <br/>
                  <strong style={{color: 'white'}}>Check your email for the ticket or go to My Bookings page!</strong>
                </p>

                {/* View My Bookings Button */}
                <motion.button
                  onClick={() => {
                    setShowAlreadyBookedModal(false);
                    navigate('/my-bookings');
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                    fontFamily: 'Arial, sans-serif',
                    marginBottom: '10px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <i className="fas fa-list-alt" style={{marginRight: '8px'}}></i>
                  View My Bookings
                </motion.button>

                {/* Close Button */}
                <motion.button
                  onClick={() => navigate('/')} // Redirect to home screen
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%',
                    padding: '12px 24px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: 'Arial, sans-serif'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    e.target.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.color = 'rgba(255, 255, 255, 0.8)';
                  }}
                >
                  <i className="fas fa-times" style={{marginRight: '8px'}}></i>
                  Close
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>


      </div>

      <style>
        {`
          @keyframes randomFloat0 {
            0% { transform: translate(0px, 0px) rotate(0deg); opacity: 0.2; }
            25% { transform: translate(15px, -20px) rotate(90deg); opacity: 0.6; }
            50% { transform: translate(-10px, -40px) rotate(180deg); opacity: 0.3; }
            75% { transform: translate(5px, -20px) rotate(270deg); opacity: 0.5; }
            100% { transform: translate(0px, 0px) rotate(360deg); opacity: 0.2; }
          }

          @keyframes randomFloat1 {
            0% { transform: translate(0px, 0px) scale(1); opacity: 0.3; }
            33% { transform: translate(-15px, -25px) scale(1.2); opacity: 0.7; }
            66% { transform: translate(20px, -15px) scale(0.8); opacity: 0.4; }
            100% { transform: translate(0px, 0px) scale(1); opacity: 0.3; }
          }

          @keyframes randomFloat2 {
            0% { transform: translate(0px, 0px) rotate(0deg); opacity: 0.25; }
            50% { transform: translate(18px, -22px) rotate(180deg); opacity: 0.6; }
            100% { transform: translate(0px, 0px) rotate(360deg); opacity: 0.25; }
          }

          @keyframes randomFloat3 {
            0% { transform: translate(0px, 0px) scale(1); opacity: 0.2; }
            25% { transform: translate(10px, -15px) scale(1.3); opacity: 0.5; }
            50% { transform: translate(-8px, -30px) scale(0.9); opacity: 0.3; }
            75% { transform: translate(12px, -15px) scale(1.1); opacity: 0.4; }
            100% { transform: translate(0px, 0px) scale(1); opacity: 0.2; }
          }

          @keyframes gentleWave {
            0%, 100% { opacity: 0.2; transform: translateX(-10px); }
            50% { opacity: 0.4; transform: translateX(10px); }
          }

          @keyframes slowRotate {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
          }

          @keyframes slowRotateReverse {
            0% { transform: translate(-50%, -50%) rotate(360deg); }
            100% { transform: translate(-50%, -50%) rotate(0deg); }
          }

          @media (max-width: 576px) {
            .booking-title-wrap {
              margin-top: -14px !important;
              margin-bottom: 16px !important;
            }

            .booking-title {
              font-size: 1.65rem !important;
              font-weight: 500 !important;
              margin-top: -10px !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Booking;
