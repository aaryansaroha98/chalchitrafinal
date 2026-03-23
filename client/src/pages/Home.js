import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { isUpcomingMovie, compareMovieDatesAsc } from '../utils/movieStatus';
import Loader from '../components/Loader';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const hasAutoScrolled = useRef(false);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [settings, setSettings] = useState({
    tagline: 'Student-led movie screening initiative at IIT Jammu',
    hero_background: '#007bff',
    about_text: 'Chalchitra Series is a student-led initiative at IIT Jammu dedicated to bringing quality movie screenings to our campus community. We organize regular movie screenings featuring a diverse range of films, from classics to contemporary hits.\n\nOur mission is to create a vibrant cultural atmosphere on campus while providing students with affordable entertainment options.',
    about_image: '/about/about-image.jpg'
  });

  useEffect(() => {
    fetchUpcomingMovies();
    fetchSettings();
  }, []);

  // Gentle auto-scroll on desktop to reveal content below hero video
  useEffect(() => {
    if (hasAutoScrolled.current) return;
    const isDesktop = window.innerWidth >= 992;
    const isHomePath = window.location.pathname === '/' || window.location.pathname === '';
    if (!isDesktop || !isHomePath) return;
    hasAutoScrolled.current = true;
    const timer = setTimeout(() => {
      // Scroll a bit further and make sure navbar becomes visible
      window.scrollTo({ top: window.innerHeight * 0.35, behavior: 'smooth' });
      setTimeout(() => {
        window.dispatchEvent(new Event('scroll'));
      }, 600);
    }, 900); // let hero load before nudging
    return () => clearTimeout(timer);
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/api/admin/settings');
      setSettings(res.data);
    } catch (err) {
      console.error('Error fetching settings:', err);
      // Set default settings if API fails
      setSettings({
        tagline: 'Student-led movie screening initiative at IIT Jammu',
        hero_background: '#007bff',
        about_text: 'Chalchitra Series is a pioneering student-led initiative at IIT Jammu dedicated to bringing world-class cinematic experiences to our vibrant campus community. Founded with the vision to create a cultural hub on campus, we organize premium movie screenings featuring a diverse collection of films - from timeless classics to contemporary blockbusters, independent gems to international masterpieces. Our mission goes beyond entertainment; we strive to foster a thriving cultural atmosphere that enriches the lives of IIT Jammu students, providing affordable access to quality cinema while creating memorable experiences that bring our community together. Through innovation, dedication, and a passion for storytelling, Chalchitra Series continues to be the heartbeat of cinematic culture at IIT Jammu, creating lasting memories one screening at a time.',
        about_image: '/about/about-image.jpg'
      });
    }
  };

  const fetchUpcomingMovies = async () => {
    try {
      const res = await api.get('/api/movies/all');
      const now = new Date();
      const upcoming = Array.isArray(res.data) ? res.data
        .filter((movie) => isUpcomingMovie(movie.date, now))
        .sort(compareMovieDatesAsc) : [];
      setUpcomingMovies(upcoming);
    } catch (err) {
      console.error('Error fetching movies:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader message="Loading Chalchitra" subtitle="Preparing the best cinema for you..." />;
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
          bottom: '100px', /* Shift black space down by 100px */
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


        {/* Hero Video Background Section */}
      <section style={{
        position: 'relative',
        height: '100vh',
        marginTop: '0px', // Start from very top
        overflow: 'hidden',
        left: 0,
        right: 0,
        zIndex: 1
      }}
      className="video-section">
        {/* Background Video with Normal Opacity */}
        {settings.hero_background_video && (
          <video
            autoPlay
            muted
            loop
            playsInline
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              zIndex: 1,
              opacity: 1
            }}
          >
            <source 
              src={
                settings.hero_background_video.startsWith('http') 
                  ? settings.hero_background_video 
                  : settings.hero_background_video.startsWith('/')
                    ? `${window.location.origin}${settings.hero_background_video}`
                    : `${window.location.origin}/${settings.hero_background_video}`
              } 
              type="video/mp4" 
            />
          </video>
        )}

        {/* Background Image (fallback) */}
        {settings.hero_background_image && !settings.hero_background_video && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url(${
                settings.hero_background_image.startsWith('http') 
                  ? settings.hero_background_image 
                  : settings.hero_background_image.startsWith('/hero/')
                    ? `${window.location.origin}${settings.hero_background_image}`
                    : `${window.location.origin}/hero/${settings.hero_background_image}`
              })`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              zIndex: 1,
              opacity: 1
            }}
          />
        )}

        {/* Background Color (fallback) */}
        {!settings.hero_background_image && !settings.hero_background_video && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: settings.hero_background || '#007bff',
              zIndex: 1,
              opacity: 1
            }}
          />
        )}

        {/* Overlay Content */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'center',
          textAlign: 'center',
          padding: '2rem',
          paddingBottom: '8rem', // Extra padding to shift text up from bottom
          background: 'rgba(0, 0, 0, 0.3)' // Dark overlay for text readability
        }}>
          {/* Text removed as requested */}
        </div>
      </section>

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





      <Container className="home-content" style={{padding: '2rem 2rem 4rem', position: 'relative', zIndex: 2}}>

        {/* Clean Header */}
        <div
          className="home-hero-text"
          style={{
            textAlign: 'center',
            margin: '0 auto 2rem',
            padding: '0 1rem',
            width: 'min(92vw, 820px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: 'white',
            marginBottom: '0.5rem',
            letterSpacing: '0.05em'
          }}>
            <i className="fas fa-home" style={{
              color: '#007bff',
              marginRight: '0.75rem',
              fontSize: '2rem'
            }}></i>
            WELCOME TO CHALCHITRA
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 2.4vw, 1.25rem)',
            color: '#6c757d',
            maxWidth: 'none',
            width: '100%',
            margin: 0,
            lineHeight: '1.5',
            fontWeight: '400'
          }}>
            Experience premium cinema screenings exclusively for IIT JAMMU community
          </p>
        </div>

        <div
          className="home-upcoming-mobile"
          style={{
            textAlign: 'center',
            margin: '0 auto 1.25rem',
            fontSize: '1.65rem',
            fontWeight: '600',
            color: 'white',
            letterSpacing: '0.05em',
            display: 'none'
          }}
        >
          WELCOME TO CHALCHITRA
        </div>
        <div
          className="home-upcoming-subtitle"
          style={{
            textAlign: 'center',
            margin: '0 auto 1.25rem',
            fontSize: '1.18rem',
            lineHeight: '1.4',
            color: '#6c757d',
            display: 'none'
          }}
        >
          Experience premium cinema screenings exclusively for IIT JAMMU community
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

        {/* Featured Movies Section */}
        <div className="row g-4 home-featured-row">
          {upcomingMovies.slice(0, 3).map((movie) => (
            <Col xl={4} lg={4} md={4} sm={6} xs={6} key={movie.id} style={{ alignSelf: 'flex-start' }} className="home-featured-col">
              <div className="home-featured-card" style={{
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
                      className="home-featured-poster"
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
                  <div className="home-featured-badge" style={{
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
                <div className="home-featured-info" style={{
                  padding: '0.55rem',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <h4 className="home-featured-title" style={{
                    fontSize: '1.05rem',
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
                  <p className="home-featured-desc" style={{
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
                  <div className="home-featured-meta" style={{marginBottom: '0.4rem'}}>
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
                          <div
                            className="home-featured-label"
                            style={{
                              fontSize: '0.6rem',
                              color: 'white',
                              fontWeight: '500',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              marginBottom: '0.1rem'
                            }}
                          >
                            Venue
                          </div>
                          <div
                            className="home-featured-value"
                            style={{
                              fontSize: '0.85rem',
                              color: 'white',
                              fontWeight: '500'
                            }}
                          >
                            {movie.venue}
                          </div>
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
                          <div
                            className="home-featured-label"
                            style={{
                              fontSize: '0.6rem',
                              color: 'white',
                              fontWeight: '500',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              marginBottom: '0.1rem'
                            }}
                          >
                            Show Time
                          </div>
                          <div
                            className="home-featured-value"
                            style={{
                              fontSize: '0.85rem',
                              color: 'white',
                              fontWeight: '500'
                            }}
                          >
                            {new Date(movie.date).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </Col>
          ))}
        </div>

        {/* "View All Movies" CTA */}
        <div className="text-center mt-5 home-cta-wrap">
          <Link
            to="/upcoming-movies"
            className="home-cta-button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.1rem',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: '600',
              boxShadow: '0 8px 32px rgba(255, 255, 255, 0.1)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-4px) scale(1.05)';
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              e.target.style.boxShadow = '0 16px 48px rgba(255, 255, 255, 0.15)';
              e.target.style.borderColor = 'rgba(0, 255, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.boxShadow = '0 8px 32px rgba(255, 255, 255, 0.1)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            <i className="fas fa-film"></i>
            <span>View All Upcoming Movies</span>
            <i className="fas fa-arrow-right"></i>
          </Link>
        </div>

        {/* About Us Section */}
        <div style={{marginTop: '2.5rem'}}>
          <div className="about-card" style={{
            background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))',
            backdropFilter: 'blur(25px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: `
              0 8px 32px rgba(0, 0, 0, 0.12),
              0 2px 8px rgba(0, 0, 0, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              0 0 0 1px rgba(255, 255, 255, 0.05)
            `,
            padding: '3rem'
          }}>
            <Row className="align-items-center about-row">
              {/* About Text - Left Side */}
              <Col lg={8} md={7}>
                <h2 className="about-heading" style={{
                  fontSize: '2.5rem',
                  fontWeight: '700',
                  color: 'white',
                  marginTop: '-0.3rem',
                  marginBottom: '1.5rem',
                  letterSpacing: '-0.025em'
                }}>
                  ABOUT US
                </h2>
                <div className="about-text" style={{
                  fontSize: '1.18rem',
                  color: '#6c757d',
                  lineHeight: '1.4',
                  marginBottom: '2rem'
                }}>
                  {settings.about_text ? settings.about_text.split('\n\n').map((paragraph, index) => (
                    <p
                      key={index}
                      style={{
                        marginBottom: index === settings.about_text.split('\n\n').length - 1 ? '0' : '1.5rem',
                        color: '#6c757d'
                      }}
                    >
                      {paragraph}
                    </p>
                  )) : (
                    <>
                      <p style={{marginBottom: '1.5rem', color: '#6c757d'}}>
                        <strong>Chalchitra Series</strong> is a pioneering student-led initiative at <strong>Indian Institute of Technology Jammu</strong>,
                        dedicated to bringing world-class cinematic experiences to our vibrant campus community.
                      </p>
                      <p style={{marginBottom: '0', color: '#6c757d'}}>
                        Our mission goes beyond entertainment; we strive to foster a thriving cultural atmosphere that enriches
                        the lives of IIT Jammu students, providing affordable access to quality cinema while creating memorable
                        experiences that bring our community together.
                      </p>
                    </>
                  )}
                </div>

                <div className="about-badges" style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
                  <div className="about-badge" style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    padding: '0.75rem 1.25rem',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: 'white',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 2px 8px rgba(255, 255, 255, 0.1)'
                  }}>
                    <i className="fas fa-users"></i>
                    Student-Led Initiative
                  </div>
                  <div className="about-badge" style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    padding: '0.75rem 1.25rem',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: 'white',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 2px 8px rgba(255, 255, 255, 0.1)'
                  }}>
                    <i className="fas fa-film"></i>
                    Premium Experience
                  </div>
                  <div className="about-badge" style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    padding: '0.75rem 1.25rem',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: 'white',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 2px 8px rgba(255, 255, 255, 0.1)'
                  }}>
                    <i className="fas fa-heart"></i>
                    Community Focused
                  </div>
                </div>
              </Col>

              {/* Logo - Right Side */}
              <Col lg={4} md={5} className="text-center about-logo-wrap">
                <img
                  className="about-logo"
                  src={settings.about_image ? (settings.about_image.startsWith('http') ? settings.about_image : `${window.location.origin}${settings.about_image}`) : '/logos/newlogo.png'}
                  alt="Chalchitra Logo"
                  style={{
                    maxWidth: '300px',
                    width: '100%',
                    height: 'auto'
                  }}
                />
              </Col>
            </Row>
          </div>
        </div>
      </Container>

      {/* Custom CSS for animations */}
      <style>
        {`
          @keyframes gridMove {
            0% { transform: translate(0, 0); }
            100% { transform: translate(50px, 50px); }
          }

          @keyframes enhancedFloat0 {
            0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: 0.2; }
            25% { transform: translateY(-20px) translateX(15px) rotate(90deg); opacity: 0.6; }
            50% { transform: translateY(-40px) translateX(-10px) rotate(180deg); opacity: 0.3; }
            75% { transform: translateY(-20px) translateX(5px) rotate(270deg); opacity: 0.5; }
          }

          @keyframes enhancedFloat1 {
            0%, 100% { transform: translateY(0px) translateX(0px) scale(1); opacity: 0.3; }
            33% { transform: translateY(-25px) translateX(-15px) scale(1.2); opacity: 0.7; }
            66% { transform: translateY(-15px) translateX(20px) scale(0.8); opacity: 0.4; }
          }

          @keyframes enhancedFloat2 {
            0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: 0.25; }
            50% { transform: translateY(-22px) translateX(18px) rotate(180deg); opacity: 0.6; }
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

          @keyframes simpleFloat0 {
            0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
            25% { transform: translateY(-15px) translateX(8px); opacity: 0.6; }
            50% { transform: translateY(-30px) translateX(-5px); opacity: 0.4; }
            75% { transform: translateY(-15px) translateX(3px); opacity: 0.5; }
          }

          @keyframes simpleFloat1 {
            0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.4; }
            33% { transform: translateY(-20px) translateX(-10px); opacity: 0.7; }
            66% { transform: translateY(-10px) translateX(15px); opacity: 0.5; }
          }

          @keyframes simpleFloat2 {
            0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.35; }
            50% { transform: translateY(-18px) translateX(12px); opacity: 0.6; }
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

          .home-cta-wrap {
            margin-top: clamp(2rem, 3.6vw, 3rem) !important;
          }

          .home-cta-button {
            font-size: clamp(0.75rem, 0.95vw, 0.9rem) !important;
            padding: clamp(0.5rem, 0.95vw, 0.7rem) clamp(0.85rem, 1.6vw, 1.15rem) !important;
            gap: 0.45rem !important;
            border-radius: 10px !important;
          }

          /* Featured Movies - Responsive Compact Sizing */
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

          /* Premium Mobile Optimizations */
          @media (max-width: 768px) {
            .video-section {
              height: min(55vh, 420px) !important; /* Smaller hero video on mobile */
              margin-top: 0px !important; /* Shift video to upper side */
            }
          }

          /* Premium Mobile Styles */
          @media (max-width: 576px) {
            .about-heading {
              margin-top: -0.4rem !important;
              margin-bottom: 0.6rem !important;
              font-size: 1.18rem !important;
            }

            .about-text {
              font-size: 1.18rem !important;
              line-height: 1.4 !important;
              margin-bottom: 0.8rem !important;
              max-width: 100% !important;
              width: 100% !important;
            }

            .about-text p {
              margin-bottom: 0.5rem !important;
            }

            .about-card {
              padding: 1.1rem 2.6rem !important;
              width: 100% !important;
              max-width: 100% !important;
            }

            .about-card .row {
              margin-left: 0 !important;
              margin-right: 0 !important;
            }

            .about-card .row > [class*="col-"] {
              padding-left: 0 !important;
              padding-right: 0 !important;
            }

            .about-row {
              display: flex !important;
              flex-direction: column !important;
              flex-wrap: nowrap !important;
              align-items: stretch !important;
              gap: 0.8rem !important;
            }

            .about-row > [class*="col-"] {
              flex: 1 1 auto !important;
              width: 100% !important;
              max-width: 100% !important;
            }

            .about-logo-wrap {
              display: flex !important;
              justify-content: center !important;
              align-items: center !important;
              margin-left: 0 !important;
              margin-top: 0.6rem !important;
            }

            .home-content {
              padding-left: 1rem !important;
              padding-right: 1rem !important;
            }

            .about-badges {
              justify-content: center !important;
              align-items: center !important;
              gap: 0.6rem !important;
              width: 100% !important;
              margin-left: 0 !important;
              margin-right: 0 !important;
              flex-direction: column !important;
            }

            .about-badge {
              padding: 0.45rem 0.9rem !important;
              font-size: 0.72rem !important;
              border-radius: 10px !important;
              gap: 0.3rem !important;
            }

            .about-badge i {
              font-size: 0.7rem !important;
            }

            .about-logo {
              max-width: 180px !important;
            }

            .home-cta-button {
              font-size: 0.85rem !important;
              padding: 0.6rem 1rem !important;
            }

            .home-hero-text {
              display: none !important; /* Hide welcome text on mobile */
            }

            .home-upcoming-mobile {
              display: block !important;
              font-size: 1.65rem !important;
              margin-top: 0.6rem !important;
              margin-bottom: 0.3rem !important;
              text-align: center !important;
              margin-left: 0 !important;
            }

            .home-upcoming-subtitle {
              display: block !important;
              font-size: 1.18rem !important;
              line-height: 1.4 !important;
              color: #6c757d !important;
              margin: 0 auto 0.6rem !important;
              text-align: center !important;
            }

            .home-featured-row {
              --bs-gutter-x: 0.4rem;
              --bs-gutter-y: 0.6rem;
              margin-top: -0.4rem !important;
            }

            /* Mobile: show only movie name + booking button in info container */
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
              box-shadow: 0 2px 10px rgba(0,0,0,0.5) !important;
              background-color: rgba(0, 0, 0, 0.8) !important;
            }

            .home-featured-btn {
              padding: clamp(0.14rem, 0.85vw, 0.24rem) clamp(0.22rem, 1vw, 0.32rem) !important;
              font-size: clamp(0.48rem, 1.9vw, 0.6rem) !important;
              border-radius: 8px !important;
            }

            .home-hero-text {
              width: min(96vw, 520px);
              padding: 0 0.75rem !important;
              gap: 0.25rem;
            }

            .home-hero-text h1 {
              font-size: 1.55rem !important;
              font-weight: 500 !important;
              line-height: 1.15 !important;
              margin-bottom: 0.3rem !important;
            }

            .home-hero-text p {
              font-size: clamp(0.72rem, 3.2vw, 0.86rem) !important;
              line-height: 1.35 !important;
              max-width: 100% !important;
              white-space: normal !important; /* allow wrapping */
              overflow-wrap: break-word !important;
              padding: 0 0.5rem !important; /* keep inside frame */
            }

            .home-content {
              padding-top: 0 !important; /* Pull content right under video */
              margin-top: 0 !important;
            }

            .video-section {
              height: auto !important; /* Let video define height */
              min-height: 0 !important; /* Remove extra vertical space */
              margin-top: 0 !important; /* Flush to topbar */
              padding-top: 0 !important;
            }

            .video-section video {
              position: relative !important;
              width: 100% !important;
              height: auto !important; /* Fully visible */
              display: block !important;
              object-fit: contain !important; /* No cropping */
              object-position: top center !important;
              transform: none !important;
            }

            /* Hero Section Mobile */
            section:first-of-type {
              padding: 2rem 0 0 0;
              min-height: 90vh !important;
            }

            /* Ensure video section isn't forced tall */
            section.video-section {
              padding: 0 !important;
              min-height: 0 !important;
            }

            /* Logo and Typography Mobile */
            section:first-of-type .col-lg-6 .col-12 {
              text-align: center !important;
              margin-bottom: 3rem !important;
            }

            section:first-of-type h1 {
              font-size: 1.7rem !important;
              font-weight: 500 !important;
              line-height: 1.2 !important;
              margin-bottom: 0.35rem !important;
            }

            section:first-of-type .col-lg-6 .col-12 p {
              font-size: clamp(0.78rem, 3.2vw, 0.92rem) !important;
              white-space: nowrap !important; /* keep in one line */
              padding: 0 !important;
              letter-spacing: -0.003em !important;
              word-spacing: -0.005em !important;
              margin-bottom: 1.25rem !important;
            }

            /* Stats Cards Mobile */
            section:first-of-type .row .col-6 {
              margin-bottom: 1.5rem;
            }

            section:first-of-type .row .col-6 div {
              padding: 1.5rem 1rem !important;
            }

            /* Featured Movies Mobile */
            section:nth-of-type(2) {
              padding: 3rem 0 !important;
            }

            section:nth-of-type(2) h2 {
              font-size: 2rem !important;
              margin-bottom: 1rem !important;
            }

            section:nth-of-type(2) p {
              font-size: 0.95rem !important;
              margin-bottom: 2rem !important;
            }

            /* Movie Cards Mobile */
            section:nth-of-type(2) .col-12 {
              margin-bottom: 1.5rem;
            }

            section:nth-of-type(2) .col-12 .col-sm-6 {
              margin-bottom: 1rem;
            }

            /* Features Section Mobile */
            section:nth-of-type(3) {
              padding: 3rem 0 !important;
            }

            section:nth-of-type(3) h2 {
              font-size: 2rem !important;
            }

            section:nth-of-type(3) .col-md-4 {
              margin-bottom: 2rem;
            }

            /* CTA Section Mobile */
            section:nth-of-type(4) {
              padding: 3rem 0 !important;
            }

            section:nth-of-type(4) h2 {
              font-size: 2.2rem !important;
              margin-bottom: 1.5rem !important;
            }

            section:nth-of-type(4) p {
              font-size: 1rem !important;
              margin-bottom: 2rem !important;
            }

            /* Footer Mobile */
            footer {
              padding: 1.5rem 0 !important;
            }

            footer .col-md-6 {
              text-align: center !important;
              margin-bottom: 1rem;
            }

            footer .col-md-6:last-child {
              text-align: center !important;
            }
          }

          /* Premium Tablet Styles */
          @media (min-width: 577px) and (max-width: 991px) {
            section:first-of-type h1 {
              font-size: 3.8rem !important;
            }

            section:first-of-type .col-lg-6 .col-12 p {
              font-size: 1.1rem !important;
            }

            section:nth-of-type(2) h2 {
              font-size: 2.8rem !important;
            }

            section:nth-of-type(3) h2 {
              font-size: 2.8rem !important;
            }
          }

          /* Premium Desktop Enhancements */
          @media (min-width: 992px) {
            /* Smooth parallax effect for hero */
            section:first-of-type {
              background-attachment: fixed;
            }

            /* Enhanced hover effects */
            section:nth-of-type(2) .col-xl-3 > div {
              transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
            }

            section:nth-of-type(2) .col-xl-3 > div:hover {
              transform: perspective(1000px) rotateX(-3deg) translateY(-12px) scale(1.03) !important;
            }
          }

          /* Premium Loading States */
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }

          .premium-loading {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
          }

          /* Premium Focus States */
          button:focus,
          a:focus {
            outline: 2px solid #00ffff !important;
            outline-offset: 2px !important;
          }

          /* Premium Scroll Animations */
          .scroll-fade-in {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .scroll-fade-in.in-view {
            opacity: 1;
            transform: translateY(0);
          }

          /* Premium Accessibility */
          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
        @keyframes glassFloat {
          0%, 100% {
            transform: translateY(0px) rotate(0deg) scale(1);
            opacity: 0.1;
          }
          25% {
            transform: translateY(-10px) rotate(90deg) scale(1.1);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) rotate(180deg) scale(1.2);
            opacity: 0.5;
          }
          75% {
            transform: translateY(-10px) rotate(270deg) scale(1.1);
            opacity: 0.3;
          }
        }
        `}
      </style>

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

export default Home;
