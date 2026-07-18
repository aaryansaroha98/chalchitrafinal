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
      const res = await api.get(`/api/movies/${movieId}?booking=true`);
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

  const TICKET_PRICE = parseInt(movie?.coin_price) || 20;

  const handleSeatClick = (seatId) => {
    if (occupiedSeats.includes(seatId)) return;

    setSelectedSeats(prev => {
      if (prev.includes(seatId)) {
        // Deselect
        return prev.filter(id => id !== seatId);
      } else {
        // Check movie's booking limit
        const limit = movie?.booking_limit || 6;
        if (prev.length >= limit) {
          setShakeSeat(seatId);
          setToastMessage(`Maximum ${limit} ticket${limit > 1 ? 's' : ''} allowed per booking`);
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
    if (selectedSeats.length > newQuantity) {
      setSelectedSeats(selectedSeats.slice(0, newQuantity));
    }
  };

  const getTotalPrice = () => {
    const ticketPrice = selectedSeats.length * TICKET_PRICE;
    const foodPrice = Object.entries(selectedFoods).reduce((total, [foodId, quantity]) => {
      const food = availableFoods.find(f => f.id === parseInt(foodId));
      // If food is free for this movie, price is 0
      const price = food && food.is_free ? 0 : (food ? Math.ceil(food.price / 10) : 0);
      return total + (price * quantity);
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

    const limit = movie?.booking_limit || 6;
    if (selectedSeats.length > limit) {
      setToastMessage(`Maximum ${limit} ticket${limit > 1 ? 's' : ''} allowed per booking`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      return;
    }

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
      <button
        onClick={() => !isOccupied && onClick(seatId)}
        disabled={isOccupied}
        className={`
          seat-button relative ${isOccupied
            ? 'occupied'
            : isSelected
              ? 'selected'
              : 'available'
          } ${shake === seatId ? 'shake' : ''}
        `}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          fontSize: `${fontSize}px`
        }}
      >
        <span className="relative z-10">
          {seatNumber}
        </span>
      </button>
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
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            padding: '32px',
            textAlign: 'center'
          }}
        >
          <h2 className="font-cinzel" style={{fontSize: '24px', color: '#0b0e17', marginBottom: '16px'}}>Movie Not Found</h2>
          <p style={{color: '#5c6270'}}>The requested movie could not be loaded.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-void" style={{ minHeight: '100vh' }}>
      <div className="booking-page">
        {/* Page Title */}
        <div className="booking-title-wrap" style={{textAlign: 'center', marginBottom: '48px', marginTop: '-10px'}}>
          <h1 className="booking-title" style={{
            fontSize: '2.5rem',
            fontWeight: '600',
            color: '#0b0e17',
            margin: '0',
            marginTop: '-6px',
            letterSpacing: '-0.025em'
          }}>
            BOOK YOUR TICKET
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
                            {food.name} - {food.is_free ? 'FREE' : `🪙 ${Math.ceil(food.price / 10)} Coins`}
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
          <div style={{marginBottom: '48px'}}>
          <div className="booking-seat-card" style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
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
                color: '#0b0e17',
                fontWeight: 'bold'
              }}>
                Select Your Seats
              </h2>
            </div>

            {/* Curved Screen */}
            <div
              className="booking-seat-screen"
              style={{textAlign: 'center', marginBottom: '32px', marginTop: '-40px'}}
            >
              <div style={{position: 'relative'}}>
                {/* Curved screen effect using SVG */}
                <svg width="400" height="80" viewBox="0 0 400 80" style={{margin: '0 auto 16px', display: 'block'}}>
                  <defs>
                    <linearGradient id="screenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{stopColor: 'rgba(11, 14, 23, 0.06)', stopOpacity: 1}} />
                      <stop offset="50%" style={{stopColor: 'rgba(11, 14, 23, 0.1)', stopOpacity: 1}} />
                      <stop offset="100%" style={{stopColor: 'rgba(11, 14, 23, 0.06)', stopOpacity: 1}} />
                    </linearGradient>
                  </defs>
                  {/* Curved path for the screen */}
                  <path
                    d="M20,60 Q200,20 380,60 L380,70 Q200,30 20,70 Z"
                    fill="url(#screenGradient)"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                  />
                </svg>
                <h3
                  className="font-cinzel"
                  style={{
                    fontSize: '24px',
                    color: '#5c6270',
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                    marginTop: '-10px'
                  }}
                >
                  Screen
                </h3>
              </div>
            </div>

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
                    color: '#0b0e17',
                    marginBottom: '16px'
                  }}>
                    Block A
                  </div>
                  <div
                    className="seat-block"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      padding: '30px',
                      background: '#f6f6f7',
                      border: '1px solid #e5e7eb',
                      position: 'relative'
                    }}
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
                        <div
                          key={rowIndex}
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: `${seatGap}px`,
                            marginBottom: '2px',
                            transform: `translateX(${shiftAmount}px)`
                          }}
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
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Block B - 7 rows with varying seats */}
                <div className="seat-block-wrap" ref={blockBRef} style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#0b0e17',
                    marginBottom: '16px'
                  }}>
                    Block B
                  </div>
                  <div
                    className="seat-block"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      padding: '30px',
                      background: '#f6f6f7',
                      border: '1px solid #e5e7eb',
                      position: 'relative'
                    }}
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
                        <div
                          key={rowIndex}
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: `${seatGap}px`,
                            marginBottom: '2px'
                          }}
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
                        </div>
                      );
                    })}
                  </div>
                  <div className="booking-seat-venue-inline">
                    {movie?.venue}
                  </div>
                </div>

                {/* Block C - 5 rows × 5 seats */}
                <div className="seat-block-wrap" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#0b0e17',
                    marginBottom: '16px'
                  }}>
                    Block C
                  </div>
                  <div
                    className="seat-block"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      padding: '30px',
                      background: '#f6f6f7',
                      border: '1px solid #e5e7eb',
                      position: 'relative'
                    }}
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
                        <div
                          key={rowIndex}
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: `${seatGap}px`,
                            marginBottom: '2px',
                            transform: `translateX(${shiftAmount}px)`
                          }}
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
                        </div>
                      );
                    })}
                  </div>
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
                    color: '#0b0e17',
                    marginBottom: '16px'
                  }}>
                    Block A
                  </div>
                  <div
                    className="seat-block"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                      padding: '40px',
                      background: '#f6f6f7',
                      border: '1px solid #e5e7eb',
                      position: 'relative'
                    }}
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
                            color: '#0b0e17',
                            marginRight: '8px'
                          }}>
                            {rowIndex + 1}
                          </div>
                          {/* Seats */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'center',
                              gap: `${seatGap}px`,
                              marginBottom: '1px'
                            }}
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
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Center Block - Block B */}
                <div className="seat-block-wrap" ref={blockBRef} style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#0b0e17',
                    marginBottom: '16px'
                  }}>
                    Block B
                  </div>
                  <div
                    className="seat-block"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                      padding: '48px',
                      background: '#f6f6f7',
                      border: '1px solid #e5e7eb',
                      position: 'relative'
                    }}
                  >
                    {/* Block B: 14 rows × 11 seats */}
                    {Array.from({ length: 14 }, (_, rowIndex) => {
                      const seatSize = 28;
                      const fontSize = 10;
                      const seatGap = 4;

                      return (
                        <div
                          key={rowIndex}
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: `${seatGap}px`,
                            marginBottom: '1px'
                          }}
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
                        </div>
                      );
                    })}
                  </div>
                  <div className="booking-seat-venue-inline">
                    {movie?.venue}
                  </div>
                </div>

                {/* Right Block - Block C */}
                <div className="seat-block-wrap" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#0b0e17',
                    marginBottom: '16px'
                  }}>
                    Block C
                  </div>
                  <div
                    className="seat-block"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                      padding: '40px',
                      background: '#f6f6f7',
                      border: '1px solid #e5e7eb',
                      position: 'relative'
                    }}
                  >
                    {/* Block C: 15 rows × 7 seats */}
                    {Array.from({ length: 15 }, (_, rowIndex) => {
                      const seatSize = 28;
                      const fontSize = 10;
                      const seatGap = 4;

                      return (
                        <div
                          key={rowIndex}
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: `${seatGap}px`,
                            marginBottom: '1px'
                          }}
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
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Legend */}
            <div
              className="booking-seat-legend"
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '32px',
                marginTop: '32px'
              }}
            >
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  background: '#ffffff',
                  border: '1px solid #e5e7eb'
                }}></div>
                <span className="font-inter booking-seat-legend-text" style={{
                  fontSize: '14px',
                  color: '#5c6270'
                }}>Available</span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  background: '#0b0e17',
                  border: '1px solid #0b0e17'
                }}></div>
                <span className="font-inter booking-seat-legend-text" style={{
                  fontSize: '14px',
                  color: '#5c6270'
                }}>Selected</span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  background: '#f6f6f7',
                  border: '1px solid #e5e7eb'
                }}></div>
                <span className="font-inter booking-seat-legend-text" style={{
                  fontSize: '14px',
                  color: '#5c6270'
                }}>Occupied</span>
              </div>
            </div>
          </div>
        </div>

        {/* Food Selection */}
        {availableFoods && availableFoods.length > 0 && (
          <div style={{marginBottom: '48px'}}>
            <div className="booking-food-panel" style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              padding: '32px'
            }}>
              <h2 className="booking-food-title" style={{
                fontSize: '24px',
                textAlign: 'center',
                marginBottom: '32px',
                color: '#0b0e17',
                fontWeight: 'bold'
              }}>
                Available Food
              </h2>

              <div className="booking-food-grid">
                {availableFoods.map(food => (
                  <div
                    key={food.id}
                    className="booking-food-card"
                    style={{
                      background: '#f6f6f7',
                      border: '1px solid #e5e7eb',
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
                          border: '1px solid #e5e7eb',
                          marginBottom: '8px',
                          objectFit: 'cover'
                        }}
                      />
                      <div>
                        <h4 className="booking-food-name" style={{
                          color: '#0b0e17',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          marginBottom: '4px'
                        }}>
                          {food.name}
                        </h4>
                        <p className="booking-food-desc" style={{
                          color: '#5c6270',
                          fontSize: '14px',
                          marginBottom: '8px'
                        }}>
                          {food.description}
                        </p>
                        <p className="booking-food-price" style={{
                          color: '#0b0e17',
                          fontSize: '16px',
                          fontWeight: 'bold'
                        }}>
                          {food.is_free ? 'FREE' : `🪙 ${Math.ceil(food.price / 10)} Coins`}
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
                      {food.is_free ? (
                        <button
                          onClick={() => {
                            const isSelected = !!selectedFoods[food.id];
                            handleFoodChange(food.id, isSelected ? 0 : 1);
                          }}
                          style={{
                            background: selectedFoods[food.id]
                              ? '#0b0e17'
                              : '#ffffff',
                            border: '1px solid',
                            borderColor: selectedFoods[food.id]
                              ? '#0b0e17'
                              : '#e5e7eb',
                            color: selectedFoods[food.id] ? '#ffffff' : '#0b0e17',
                            padding: '6px 16px',
                            fontSize: '12px',
                            fontWeight: '600',
                            letterSpacing: '0.09em',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {selectedFoods[food.id] ? (
                            <>
                              <i className="fas fa-check" style={{fontSize: '10px'}}></i>
                              INCLUDED
                            </>
                          ) : (
                            'INCLUDE'
                          )}
                        </button>
                      ) : (
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
                              background: '#ffffff',
                              border: '1px solid #e5e7eb',
                              color: '#0b0e17',
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
                            color: '#0b0e17',
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
                              background: '#ffffff',
                              border: '1px solid #e5e7eb',
                              color: '#0b0e17',
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
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Selected Items Summary */}
        {selectedSeats.length > 0 && (
          <div style={{marginBottom: '48px'}}>
            <div className="booking-selected-panel" style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              padding: '24px',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              <h2 className="booking-selected-title" style={{
                fontSize: '24px',
                textAlign: 'center',
                marginBottom: '32px',
                color: '#0b0e17',
                fontWeight: 'bold'
              }}>
                Selected Items
              </h2>

              <div style={{marginBottom: '32px'}}>
                {/* Selected Seats */}
                <div style={{marginBottom: '24px'}}>
                  <h4 className="booking-selected-subtitle" style={{
                    color: '#0b0e17',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    marginBottom: '12px'
                  }}>
                    Selected Seats ({selectedSeats.length})
                  </h4>
                  <div className="booking-selected-card" style={{
                    background: '#f6f6f7',
                    border: '1px solid #e5e7eb',
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
                            background: '#0b0e17',
                            border: '1px solid #0b0e17',
                            color: '#ffffff',
                            padding: '6px 10px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            fontFamily: 'Arial, sans-serif'
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
                      color: '#0b0e17',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      marginBottom: '12px'
                    }}>
                      Selected Food Items
                    </h4>
                    <div className="booking-selected-card" style={{
                      background: '#f6f6f7',
                      border: '1px solid #e5e7eb',
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
                              background: '#f6f6f7'
                            }}
                          >
                            <div>
                              <span style={{
                                color: '#0b0e17',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                fontFamily: 'Arial, sans-serif'
                              }}>
                                {food.name}
                              </span>
                              <span style={{
                                color: '#8b909c',
                                marginLeft: '6px',
                                fontSize: '12px'
                              }}>
                                × {quantity}
                              </span>
                            </div>
                            <span style={{
                              color: '#0b0e17',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              fontFamily: 'Arial, sans-serif'
                            }}>
                              {food.is_free ? 'FREE' : `🪙 ${Math.ceil(food.price / 10) * quantity}`}
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
                    color: '#0b0e17',
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
                      color: '#5c6270',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Total Amount
                    </span>
                    🪙 {getTotalPrice()}
                  </div>

                  <button
                    onClick={handleBook}
                    className="booking-book-btn"
                    style={{
                      background: '#0b0e17',
                      border: '1px solid #0b0e17',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.09em',
                      padding: '16px 24px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minWidth: '220px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#5c6270';
                      e.target.style.border = '1px solid #5c6270';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#0b0e17';
                      e.target.style.border = '1px solid #0b0e17';
                    }}
                  >
                    <i className="fas fa-ticket-alt me-2" style={{fontSize: '14px'}}></i>
                    Book Ticket{selectedSeats.length > 1 ? 's' : ''}
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
                      border: '2px dotted #b7791f',
                      color: '#b7791f',
                      fontSize: '14px',
                      fontWeight: '600',
                      letterSpacing: '1px',
                      textAlign: 'center'
                    }}>
                      {movie.special_message}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
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
                background: '#0b0e17',
                border: '1px solid #0b0e17',
                padding: '16px',
                color: '#ffffff',
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
                background: 'rgba(11, 14, 23, 0.4)',
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
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  padding: '20px',
                  maxWidth: '350px',
                  width: '90%',
                  textAlign: 'center',
                  position: 'relative'
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
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0b0e17',
                    cursor: 'pointer',
                    fontSize: '20px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f6f6f7';
                    e.target.style.borderColor = '#0b0e17';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#ffffff';
                    e.target.style.borderColor = '#e5e7eb';
                  }}
                >
                  ×
                </button>

                {/* Main Message */}
                <h2 style={{
                  color: '#0b0e17',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  marginBottom: '12px',
                  fontFamily: 'Arial, sans-serif'
                }}>
                  Already Booked! 🎬
                </h2>

                <p style={{
                  color: '#5c6270',
                  fontSize: '14px',
                  marginBottom: '24px',
                  lineHeight: '1.6',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  You have already booked tickets for this movie. <br/>
                  <strong style={{color: '#0b0e17'}}>Check your email for the ticket or go to My Bookings page!</strong>
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
                    background: '#0b0e17',
                    border: '1px solid #0b0e17',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.09em',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: 'Arial, sans-serif',
                    marginBottom: '10px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#232733';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#0b0e17';
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
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    color: '#5c6270',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.09em',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: 'Arial, sans-serif'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f6f6f7';
                    e.target.style.borderColor = '#0b0e17';
                    e.target.style.color = '#0b0e17';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#ffffff';
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.color = '#5c6270';
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
