import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from './api/axios';
import { useAuth } from '../contexts/AuthContext';
import { isUpcomingMovie, compareMovieDatesAsc } from '../utils/movieStatus';

const UpcomingMovies = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      // Fetch all movies and filter based on current date & time (client-side)
      const res = await api.get('/api/movies/all');
      const now = new Date();
      const upcoming = (res.data || [])
        .filter((movie) => isUpcomingMovie(movie.date, now))
        .sort(compareMovieDatesAsc);
      setMovies(upcoming);
      setLoading(false);
    } catch (err) {
      setError('Failed to load movies');
      setLoading(false);
    }
  };

  const upcomingMovies = movies;

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#f8f9fa',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e9ecef'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e9ecef',
            borderTop: '3px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <h4 style={{
            color: '#495057',
            marginBottom: '0.5rem',
            fontWeight: '600'
          }}>Loading Movies</h4>
          <p style={{
            color: '#6c757d',
            margin: 0,
            fontSize: '0.9rem'
          }}>Please wait while we load the upcoming movies...</p>
        </div>

        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }

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

            @media (max-width: 576px) {
              .upcoming-heading {
                font-size: 1.65rem !important;
                margin-bottom: 0.5rem !important;
                font-weight: 500 !important;
                letter-spacing: -0.01em !important;
              }

              .upcoming-subtitle {
                font-size: 1.18rem !important;
                line-height: 1.4 !important;
                color: #6c757d !important;
              }
            }

            @keyframes slowRotateReverse {
              0% { transform: translate(-50%, -50%) rotate(360deg); }
              100% { transform: translate(-50%, -50%) rotate(0deg); }
            }

            @keyframes gridMove {
              0% { transform: translate(0, 0); }
              100% { transform: translate(50px, 50px); }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div className="bg-void" style={{minHeight: '100vh', position: 'relative', overflow: 'hidden'}}>
      <style>
        {`
          .home-featured-info {
            padding: clamp(0.3rem, 1vw, 0.5rem) !important;
          }

          .home-featured-title {
            font-size: clamp(0.62rem, 1vw, 0.82rem) !important;
            line-height: 1.15 !important;
            max-width: 100% !important;
            overflow-wrap: anywhere !important;
            word-break: break-word !important;
          }

          .home-featured-desc {
            font-size: clamp(0.5rem, 1vw, 0.68rem) !important;
            line-height: 1.2 !important;
          }

          .home-featured-label {
            font-size: clamp(0.42rem, 0.9vw, 0.55rem) !important;
            letter-spacing: 0.3px !important;
            line-height: 1.1 !important;
          }

          .home-featured-value {
            font-size: clamp(0.5rem, 1.05vw, 0.72rem) !important;
            line-height: 1.15 !important;
          }

          .home-featured-meta i {
            font-size: clamp(0.5rem, 0.95vw, 0.7rem) !important;
          }

          .home-featured-badge {
            font-size: clamp(0.36rem, 0.7vw, 0.54rem) !important;
            padding: clamp(1px, 0.3vw, 2.2px) clamp(2.5px, 0.65vw, 5.5px) !important;
            top: 6px !important;
            left: 6px !important;
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
              font-size: clamp(0.56rem, 2vw, 0.7rem) !important;
              margin-bottom: 0.2rem !important;
              -webkit-line-clamp: 2 !important;
            }

            .upcoming-desc,
            .upcoming-meta {
              display: none !important;
            }

            .upcoming-badge {
              top: 4px !important;
              left: 4px !important;
              padding: clamp(1px, 0.7vw, 2.2px) clamp(2.2px, 1.1vw, 4px) !important;
              font-size: clamp(0.34rem, 1.4vw, 0.48rem) !important;
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
              font-size: clamp(0.56rem, 2vw, 0.7rem) !important;
              margin-bottom: 0.2rem !important;
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
              top: 4px !important;
              left: 4px !important;
              padding: clamp(1px, 0.7vw, 2.2px) clamp(2.2px, 1.1vw, 4px) !important;
              font-size: clamp(0.34rem, 1.4vw, 0.48rem) !important;
            }

            .home-featured-btn {
              padding: clamp(0.14rem, 0.85vw, 0.24rem) clamp(0.22rem, 1vw, 0.32rem) !important;
              font-size: clamp(0.48rem, 1.9vw, 0.6rem) !important;
              border-radius: 8px !important;
            }
          }
        `}
      </style>
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

      {/* Animated Background Grid */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          radial-gradient(circle at 25% 25%, var(--primary-color) 1px, transparent 1px),
          radial-gradient(circle at 75% 75%, var(--secondary-color) 1px, transparent 1px),
          radial-gradient(circle at 50% 50%, var(--accent-color) 1px, transparent 1px)
        `,
        backgroundSize: '100px 100px, 150px 150px, 200px 200px',
        backgroundPosition: '0 0, 50px 50px, 25px 25px',
        opacity: 0.03,
        animation: 'gridMove 20s linear infinite'
      }}></div>



      <Container className="upcoming-container" style={{padding: '6rem 2rem 4rem', position: 'relative', zIndex: 2}}>
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
            color: 'white',
            marginBottom: '1rem',
            letterSpacing: '-0.025em'
          }}>
            <i className="fas fa-calendar-alt" style={{
              color: '#007bff',
              marginRight: '0.75rem',
              fontSize: '2rem'
            }}></i>
            Upcoming Movies
          </h1>
          <p className="upcoming-subtitle" style={{
            fontSize: '1.1rem',
            color: '#6c757d',
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
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(25px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '24px',
            boxShadow: `
              0 8px 32px rgba(0, 0, 0, 0.12),
              0 2px 8px rgba(0, 0, 0, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              0 0 0 1px rgba(255, 255, 255, 0.05)
            `
          }}>
            <i className="fas fa-film" style={{
              fontSize: '4rem',
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '1.5rem',
              display: 'block'
            }}></i>
            <p style={{
              fontFamily: '"Times New Roman", Times, Georgia, serif',
              fontSize: '1.5rem',
              color: 'white',
              fontStyle: 'italic',
              margin: 0,
              lineHeight: '1.6',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}>
              Stay tuned—we'll be back with amazing stories very soon!
            </p>
          </div>
        ) : (
          <Row className="g-4 upcoming-movies-row">
            {upcomingMovies.map((movie) => (
              <Col xl={4} lg={4} md={4} sm={4} xs={4} key={movie.id} style={{ alignSelf: 'flex-start' }}>
                <div className="upcoming-card" style={{
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))',
                  backdropFilter: 'blur(25px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: `
                    0 8px 32px rgba(0, 0, 0, 0.12),
                    0 2px 8px rgba(0, 0, 0, 0.08),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1),
                    0 0 0 1px rgba(255, 255, 255, 0.05)
                  `,
                  transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
                  position: 'relative',
                  transform: 'perspective(1000px) rotateX(0deg)',
                  willChange: 'transform',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  if (!isAuthenticated) {
                    setShowLoginModal(true);
                  } else {
                    navigate(`/booking/${movie.id}`);
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'perspective(1000px) rotateX(-2deg) translateY(-8px) scale(1.02)';
                  e.currentTarget.style.boxShadow = `
                    0 20px 60px rgba(0, 0, 0, 0.2),
                    0 8px 32px rgba(0, 255, 255, 0.15),
                    inset 0 1px 0 rgba(255, 255, 255, 0.15),
                    0 0 0 1px rgba(255, 255, 255, 0.1)
                  `;
                  e.currentTarget.style.background = 'linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))';
                  e.currentTarget.style.borderColor = 'rgba(0, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = `
                    0 8px 32px rgba(0, 0, 0, 0.12),
                    0 2px 8px rgba(0, 0, 0, 0.08),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1),
                    0 0 0 1px rgba(255, 255, 255, 0.05)
                  `;
                  e.currentTarget.style.background = 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
                }}
                >
                  {/* Movie Poster */}
                  <div style={{
                    position: 'relative',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
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
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '6px',
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
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    marginBottom: '0.25rem',
                    color: 'white',




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
                      color: 'var(--gray-600)',
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
                            color: 'var(--gray-500)',
                            fontSize: '0.7rem',
                            marginRight: '0.5rem',
                            minWidth: '14px'
                          }}></i>
                        <div>
                          <div style={{
                            fontSize: '0.55rem',
                            color: 'white',
                            fontWeight: '500',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '0.1rem'
                          }}>Venue</div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: 'white',
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
                            color: 'var(--gray-500)',
                            fontSize: '0.7rem',
                            marginRight: '0.5rem',
                            minWidth: '14px'
                          }}></i>
                          <div>
                            <div style={{
                              fontSize: '0.55rem',
                              color: 'white',
                              fontWeight: '500',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              marginBottom: '0.1rem'
                            }}>Show Time</div>
                            <div style={{
                              fontSize: '0.75rem',
                              color: 'white',
                              fontWeight: '500'
                            }}>{new Date(movie.date).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Book Tickets Button - Glass Style */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isAuthenticated) {
                          setShowLoginModal(true);
                        } else {
                          navigate(`/booking/${movie.id}`);
                        }
                      }}
                      className="upcoming-btn"
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '0.6rem 0.85rem',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        color: 'white',
                        textDecoration: 'none',
                        textAlign: 'center',
                        fontWeight: '500',
                        fontSize: '0.75rem',
                        boxShadow: '0 4px 15px rgba(0, 255, 255, 0.2)',
                        transition: 'all 0.3s ease',
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                        marginTop: 'auto',
                        cursor: 'pointer',
                        fontFamily: 'inherit'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 20px rgba(0, 255, 255, 0.4)';
                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 15px rgba(0, 255, 255, 0.2)';
                        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                      }}
                    >
                      <i className="fas fa-ticket-alt" style={{marginRight: '0.5rem'}}></i>
                      Book Tickets
                    </button>
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
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(20px)',
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
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '24px',
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
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                ×
              </button>

              {/* IIT Jammu Logo */}
              <div style={{marginBottom: '16px'}}>
                <img
                  src="/iitjammu-logo.png"
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
                color: '#ffffff',
                fontSize: '22px',
                fontWeight: 'bold',
                marginBottom: '12px',
                fontFamily: 'Arial, sans-serif'
              }}>
                Login Required
              </h2>

              <p style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '14px',
                marginBottom: '20px',
                lineHeight: '1.6'
              }}>
                Please login with your <strong style={{color: '#FFD700'}}>IIT Jammu email</strong> to book movie tickets.
              </p>

              {/* Login button */}
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  navigate('/login');
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  padding: '10px 24px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 6px 20px rgba(255, 255, 255, 0.18)',
                  fontFamily: 'Arial, sans-serif',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.boxShadow = '0 12px 40px rgba(255, 255, 255, 0.3)';
                  e.target.style.borderColor = 'rgba(0, 255, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.boxShadow = '0 8px 32px rgba(255, 255, 255, 0.2)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
              >
                <i className="fas fa-sign-in-alt" style={{marginRight: '10px'}}></i>
                Login with IIT Jammu Mail
              </button>

              {/* Additional info */}
              <p style={{
                color: 'rgba(255, 255, 255, 0.6)',
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
    </div>
  );
};

export default UpcomingMovies;
