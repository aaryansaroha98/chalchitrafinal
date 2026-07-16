import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import Loader from '../components/Loader';
import { useAuth } from '../contexts/AuthContext';
import { isUpcomingMovie, compareMovieDatesAsc } from '../utils/movieStatus';

const UpcomingMovies = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showBookingClosedModal, setShowBookingClosedModal] = useState(false);
  const [bookingClosedMovieTitle, setBookingClosedMovieTitle] = useState('');

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async (retries = 2) => {
    try {
      const res = await api.get('/api/movies/all');
      const now = new Date();
      const upcoming = (res.data || [])
        .filter((movie) => isUpcomingMovie(movie.date, now))
        .sort(compareMovieDatesAsc);
      setMovies(upcoming);
      setLoading(false);
    } catch (err) {
      if (retries > 0) {
        setTimeout(() => fetchMovies(retries - 1), 1500);
      } else {
        setError('Failed to load movies');
        setLoading(false);
      }
    }
  };

  const isBookingStoppedForMovie = (movie) => Number(movie?.booking_stopped) === 1 || movie?.booking_stopped === true;

  const handleMovieCardClick = (movie) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (isBookingStoppedForMovie(movie)) {
      setBookingClosedMovieTitle(movie?.title || 'This movie');
      setShowBookingClosedModal(true);
      return;
    }

    navigate(`/booking/${movie.id}`);
  };

  const upcomingMovies = movies;

  if (loading) {
    return <Loader message="Loading Upcoming Movies" subtitle="Preparing your memories..." />;
  }


  return (
    <div className="bg-void" style={{ minHeight: '100vh' }}>
      <style>
        {`
          .home-featured-info {
            padding: clamp(0.3rem, 1vw, 0.5rem) !important;
          }

          .home-featured-title {
            font-size: clamp(0.85rem, 1.2vw, 1.15rem) !important;
            line-height: 1.25 !important;
            max-width: 100% !important;
            overflow-wrap: anywhere !important;
            word-break: break-word !important;
            margin-bottom: 0.4rem !important;
          }

          .home-featured-desc {
            font-size: clamp(0.5rem, 1vw, 0.68rem) !important;
            line-height: 1.2 !important;
          }

          .home-featured-label {
            font-size: clamp(0.5rem, 1.1vw, 0.7rem) !important;
            letter-spacing: 0.3px !important;
            line-height: 1.1 !important;
          }

          .home-featured-value {
            font-size: clamp(0.7rem, 1.3vw, 0.95rem) !important;
            line-height: 1.15 !important;
          }

          .home-featured-meta i {
            font-size: clamp(0.5rem, 0.95vw, 0.7rem) !important;
          }

          .home-featured-badge {
            font-size: clamp(0.65rem, 1vw, 0.85rem) !important;
            padding: clamp(3.5px, 0.5vw, 6px) clamp(7px, 1vw, 12px) !important;
            top: 10px !important;
            left: 10px !important;
            z-index: 10;
          }

          .home-featured-btn {
            font-size: clamp(0.6rem, 1.05vw, 0.8rem) !important;
            padding: clamp(0.22rem, 0.75vw, 0.4rem) clamp(0.3rem, 0.85vw, 0.6rem) !important;
          }

          @media (max-width: 576px) {
            .upcoming-container {
              padding-left: 1rem !important;
              padding-right: 1rem !important;
              padding-top: 5.4rem !important;
            }

            .upcoming-movies-row {
              margin-top: -0.4rem;
              --bs-gutter-x: 0.4rem;
              --bs-gutter-y: 0.6rem;
            }

            .upcoming-header {
              padding-left: 0.5rem !important;
              padding-right: 0.5rem !important;
              margin-top: -4.6rem !important;
              margin-bottom: 1.1rem !important;
            }

            .upcoming-heading {
              font-size: 1.65rem !important;
              font-weight: 500 !important;
              margin-bottom: 0.4rem !important;
              letter-spacing: -0.01em !important;
            }

            .upcoming-heading i {
              font-size: 1.35rem !important;
              margin-right: 0.5rem !important;
            }

            .upcoming-subtitle {
              font-size: 1.18rem !important;
              line-height: 1.4 !important;
              max-width: 100% !important;
              margin-top: -0.2rem !important;
              color: #6c757d !important;
            }

            .upcoming-card {
              border-radius: 10px !important;
            }

            .upcoming-info {
              padding: clamp(0.3rem, 1.8vw, 0.45rem) !important;
            }

            .upcoming-title {
              font-size: clamp(0.9rem, 3.8vw, 1.1rem) !important;
              margin-bottom: 0.35rem !important;
              font-weight: 700 !important;
              -webkit-line-clamp: 2 !important;
            }

            .upcoming-desc,
            .upcoming-meta {
              display: none !important;
            }

            .upcoming-badge {
              top: 6px !important;
              left: 6px !important;
              padding: clamp(2px, 2vw, 5px) clamp(6px, 3.5vw, 10px) !important;
              font-size: clamp(0.65rem, 3vw, 0.85rem) !important;
              background-color: #ffffff !important;
              color: #0b0e17 !important;
              border: 1px solid #e5e7eb !important;
            }

            .upcoming-btn {
              padding: clamp(0.14rem, 0.85vw, 0.24rem) clamp(0.22rem, 1vw, 0.32rem) !important;
              font-size: clamp(0.48rem, 1.9vw, 0.6rem) !important;
              border-radius: 8px !important;
            }

            .home-featured-row {
              --bs-gutter-x: 0.4rem;
              --bs-gutter-y: 0.6rem;
              margin-top: -0.4rem !important;
            }

            .home-featured-desc,
            .home-featured-meta {
              display: none !important;
            }

            .home-featured-card {
              border-radius: 10px !important;
            }

            .home-featured-info {
              padding: clamp(0.3rem, 1.8vw, 0.45rem) !important;
            }

            .home-featured-title {
              font-size: clamp(0.9rem, 3.8vw, 1.1rem) !important;
              margin-bottom: 0.35rem !important;
              font-weight: 700 !important;
              -webkit-line-clamp: 2 !important;
            }

            .home-featured-desc {
              font-size: clamp(0.45rem, 2vw, 0.6rem) !important;
              margin-bottom: 0.25rem !important;
            }

            .home-featured-meta {
              margin-bottom: 0.25rem !important;
            }

            .home-featured-label {
              font-size: clamp(0.38rem, 1.8vw, 0.5rem) !important;
              letter-spacing: 0.25px !important;
            }

            .home-featured-value {
              font-size: clamp(0.45rem, 2vw, 0.62rem) !important;
            }

            .home-featured-meta i {
              font-size: clamp(0.45rem, 1.8vw, 0.6rem) !important;
            }

            .home-featured-badge {
              top: 6px !important;
              left: 6px !important;
              padding: clamp(2px, 2vw, 5px) clamp(6px, 3.5vw, 10px) !important;
              font-size: clamp(0.65rem, 3vw, 0.85rem) !important;
              border-radius: 6px !important;
              border: 1px solid #e5e7eb !important;
              background-color: #ffffff !important;
              color: #0b0e17 !important;
            }

            .home-featured-btn {
              padding: clamp(0.14rem, 0.85vw, 0.24rem) clamp(0.22rem, 1vw, 0.32rem) !important;
              font-size: clamp(0.48rem, 1.9vw, 0.6rem) !important;
              border-radius: 8px !important;
            }
          }
        `}
      </style>
      <Container className="upcoming-container" style={{padding: '6rem 2rem 4rem'}}>
        {/* Clean Header */}
        <div className="upcoming-header" style={{
          textAlign: 'center',
          marginBottom: '1.5rem',
          marginTop: '-5rem',
          padding: '0 1rem'
        }}>
          <h1 className="upcoming-heading" style={{
            fontSize: '2.5rem',
            fontWeight: '600',
            color: '#0b0e17',
            marginBottom: '1rem',
            letterSpacing: '-0.025em'
          }}>
            UPCOMING MOVIES
          </h1>
          <p className="upcoming-subtitle" style={{
            fontSize: '1.1rem',
            color: '#5c6270',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6',
            fontWeight: '400'
          }}>
            Experience the next wave of cinematic storytelling at IIT Jammu
          </p>
        </div>

        {error && (
          <Alert variant="danger" style={{
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '1rem 1.5rem',
            marginBottom: '2rem'
          }}>
            <i className="fas fa-exclamation-triangle" style={{marginRight: '0.5rem'}}></i>
            {error}
          </Alert>
        )}

        {upcomingMovies.length === 0 && !error ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: '#ffffff',
            border: '1px solid #e5e7eb'
          }}>
            <i className="fas fa-film" style={{
              fontSize: '4rem',
              color: '#8b909c',
              marginBottom: '1.5rem',
              display: 'block'
            }}></i>
            <p style={{
              fontFamily: '"Times New Roman", Times, Georgia, serif',
              fontSize: '1.5rem',
              color: '#0b0e17',
              fontStyle: 'italic',
              margin: 0,
              lineHeight: '1.6'
            }}>
              Stay tuned—we'll be back with amazing stories very soon!
            </p>
          </div>
        ) : (
          <Row className="g-4 upcoming-movies-row">
            {upcomingMovies.map((movie) => (
              <Col xl={4} lg={4} md={4} sm={6} xs={6} key={movie.id} style={{ alignSelf: 'flex-start' }}>
                <div className="upcoming-card" style={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s ease',
                  position: 'relative',
                  cursor: 'pointer'
                }}
                onClick={() => handleMovieCardClick(movie)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0b0e17';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
                >
                  {/* Movie Poster */}
                  <div style={{
                    position: 'relative',
                    backgroundColor: '#f6f6f7',
                    borderBottom: '1px solid #eef0f2'
                  }}>
                  {movie.poster_url ? (
                    <img
                      src={movie.poster_url.startsWith('http') ? movie.poster_url : `${window.location.origin}${movie.poster_url}`}
                      alt={movie.title}
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block'
                      }}
                    />
                  ) : (
                      <div style={{
                        backgroundColor: '#e9ecef',
                        width: '100%',
                        aspectRatio: '2 / 3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <i className="fas fa-film" style={{
                          fontSize: '3rem',
                          color: '#adb5bd'
                        }}></i>
                      </div>
                    )}

                    {/* Date Badge */}
                    <div className="upcoming-badge" style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: '#ffffff',
                      color: '#0b0e17',
                      border: '1px solid #e5e7eb',
                      padding: '4px 8px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      <i className="fas fa-calendar" style={{marginRight: '0.25rem'}}></i>
                      {new Date(movie.date).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>

                  {/* Movie Info */}
                  <div className="upcoming-info" style={{
                    padding: '0.55rem',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                  <h4 className="upcoming-title" style={{
                    fontSize: '1.05rem',
                    fontWeight: '600',
                    marginBottom: '0.25rem',
                    color: '#0b0e17',
                    lineHeight: '1.2',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {movie.title}
                  </h4>

                    {/* Description */}
                    <p className="upcoming-desc" style={{
                      color: '#5c6270',
                      fontSize: '0.65rem',
                      marginBottom: '0.4rem',
                      lineHeight: '1.3',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      flex: 1
                    }}>
                      {movie.description}
                    </p>

                    {/* Details */}
                    <div className="upcoming-meta" style={{marginBottom: '0.4rem'}}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        position: 'relative'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginLeft: '0px'
                        }}>
                          <i className="fas fa-map-marker-alt" style={{
                            color: '#8b909c',
                            fontSize: '0.7rem',
                            marginRight: '0.5rem',
                            minWidth: '14px'
                          }}></i>
                        <div>
                          <div className="upcoming-label" style={{
                            fontSize: '0.6rem',
                            color: '#8b909c',
                            fontWeight: '500',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '0.1rem'
                          }}>Venue</div>
                          <div className="upcoming-value" style={{
                            fontSize: '0.85rem',
                            color: '#0b0e17',
                            fontWeight: '500'
                          }}>{movie.venue}</div>
                        </div>
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          position: 'absolute',
                          right: '0'
                        }}>
                          <i className="fas fa-clock" style={{
                            color: '#8b909c',
                            fontSize: '0.7rem',
                            marginRight: '0.5rem',
                            minWidth: '14px'
                          }}></i>
                          <div>
                            <div className="upcoming-label" style={{
                              fontSize: '0.6rem',
                              color: '#8b909c',
                              fontWeight: '500',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              marginBottom: '0.1rem'
                            }}>Show Time</div>
                            <div className="upcoming-value" style={{
                              fontSize: '0.85rem',
                              color: '#0b0e17',
                              fontWeight: '500'
                            }}>{new Date(movie.date).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </Col>
            ))}
          </Row>
        )}

      </Container>

      {/* Login Required Modal */}
      <AnimatePresence>
        {showLoginModal && (
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
              zIndex: 1000
            }}
            onClick={() => setShowLoginModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                padding: '24px',
                maxWidth: '360px',
                textAlign: 'center',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setShowLoginModal(false)}
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0b0e17',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                ×
              </button>

              {/* IIT Jammu Logo */}
              <div style={{marginBottom: '16px'}}>
                <img
                  src="/logos/iitjammu-logo.png"
                  alt="IIT Jammu"
                  style={{
                    width: '90px',
                    height: 'auto',
                    marginBottom: '12px'
                  }}
                />
              </div>

              {/* Main message */}
              <h2 style={{
                color: '#0b0e17',
                fontSize: '22px',
                fontWeight: 'bold',
                marginBottom: '12px'
              }}>
                Login Required
              </h2>

              <p style={{
                color: '#5c6270',
                fontSize: '14px',
                marginBottom: '20px',
                lineHeight: '1.6'
              }}>
                Please login with your <strong style={{color: '#0b0e17'}}>IIT Jammu email</strong> to book movie tickets.
              </p>

              {/* Login button */}
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  navigate('/login');
                }}
                style={{
                  background: '#0b0e17',
                  border: '1px solid #0b0e17',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  padding: '10px 24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#ffffff';
                  e.target.style.color = '#0b0e17';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#0b0e17';
                  e.target.style.color = '#ffffff';
                }}
              >
                <i className="fas fa-sign-in-alt" style={{marginRight: '10px'}}></i>
                Login with IIT Jammu Mail
              </button>

              {/* Additional info */}
              <p style={{
                color: '#8b909c',
                fontSize: '12px',
                marginTop: '14px',
                lineHeight: '1.5'
              }}>
                Only IIT Jammu students and faculty can book tickets.<br/>
                Use your official @iitjammu.ac.in email address.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking Closed Modal */}
      <AnimatePresence>
        {showBookingClosedModal && (
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
              zIndex: 1000
            }}
            onClick={() => setShowBookingClosedModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                padding: '24px',
                maxWidth: '360px',
                textAlign: 'center',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowBookingClosedModal(false)}
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  background: '#f6f6f7',
                  border: '1px solid #e5e7eb',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0b0e17',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                ×
              </button>

              <h2 style={{
                color: '#0b0e17',
                fontSize: '22px',
                fontWeight: 'bold',
                marginBottom: '12px'
              }}>
                Booking Closed
              </h2>

              <p style={{
                color: '#5c6270',
                fontSize: '14px',
                marginBottom: '20px',
                lineHeight: '1.6'
              }}>
                Movie booking time is complete for <strong style={{ color: '#0b0e17' }}>{bookingClosedMovieTitle}</strong>.
              </p>

              <button
                onClick={() => setShowBookingClosedModal(false)}
                style={{
                  background: '#0b0e17',
                  border: '1px solid #0b0e17',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  padding: '10px 24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                OK
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UpcomingMovies;
