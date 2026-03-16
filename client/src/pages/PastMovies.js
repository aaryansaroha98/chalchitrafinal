import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import Loader from '../components/Loader';
import { useAuth } from '../contexts/AuthContext';
import { isPastMovie, compareMovieDatesDesc } from '../utils/movieStatus';

const PastMovies = () => {
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
      const past = (res.data || [])
        .filter((movie) => isPastMovie(movie.date, now))
        .sort(compareMovieDatesDesc);
      setMovies(past);
      setLoading(false);
    } catch (err) {
      setError('Failed to load movies');
      setLoading(false);
    }
  };

  const pastMovies = movies;

  if (loading) {
    return <Loader message="Loading Past Movies" subtitle="Reliving our previous screenings..." />;
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

      <Container className="past-movies-container" style={{padding: '6rem 2rem 4rem', position: 'relative', zIndex: 2}}>
        {/* Clean Header */}
        <div className="past-movies-header" style={{
          textAlign: 'center',
          marginBottom: '1.5rem',
          marginTop: '-5rem',
          padding: '0 1rem'
        }}>
          <h1 className="past-movies-title" style={{
            fontSize: '2.5rem',
            fontWeight: '600',
            color: 'white',
            marginBottom: '1rem',
            letterSpacing: '-0.025em'
          }}>
            <i className="fas fa-history past-movies-title-icon" style={{
              color: '#007bff',
              marginRight: '0.75rem',
              fontSize: '2rem'
            }}></i>
            PAST MOVIES
          </h1>
          <p className="past-movies-subtitle" style={{
            fontSize: '1.1rem',
            color: '#6c757d',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6',
            fontWeight: '400'
          }}>
            Relive the cinematic moments from our past screenings
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

        {pastMovies.length === 0 && !error ? (
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
              No past movies to show yet. Check back after our first screening!
            </p>
          </div>
        ) : (
          <Row className="past-movies-grid g-4">
            {pastMovies.map((movie) => (
              <Col xl={3} lg={3} md={4} sm={6} xs={12} key={movie.id} style={{ alignSelf: 'flex-start' }}>
                <div style={{
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
                  willChange: 'transform'
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
                  {/* Movie Poster Only */}
                  <div style={{
                    position: 'relative',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    alignSelf: movie.poster_url ? 'center' : 'stretch',
                    maxWidth: movie.poster_url ? '100%' : 'none'
                  }}>
                    {movie.poster_url ? (
                      <img
                        src={movie.poster_url.startsWith('http') ? movie.poster_url : `${window.location.origin}${movie.poster_url}`}
                        alt={movie.title}
                        style={{
                          maxWidth: '100%',
                          width: 'auto',
                          height: 'auto',
                          display: 'block',
                          margin: '0 auto'
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

                  </div>
                </div>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
};

export default PastMovies;
