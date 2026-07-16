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

  const fetchMovies = async (retries = 2) => {
    try {
      const res = await api.get('/api/movies/all');
      const now = new Date();
      const past = (res.data || [])
        .filter((movie) => isPastMovie(movie.date, now))
        .sort(compareMovieDatesDesc);
      setMovies(past);
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

  const pastMovies = movies;

  if (loading) {
    return <Loader message="Loading Past Movies" subtitle="Reliving our previous screenings..." />;
  }


  return (
    <div className="bg-void" style={{ minHeight: '100vh' }}>
      <Container className="past-movies-container" style={{padding: '6rem 2rem 4rem'}}>
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
            color: '#0b0e17',
            marginBottom: '1rem',
            letterSpacing: '-0.025em'
          }}>
            PAST MOVIES
          </h1>
          <p className="past-movies-subtitle" style={{
            fontSize: '1.1rem',
            color: '#5c6270',
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
              No past movies to show yet. Check back after our first screening!
            </p>
          </div>
        ) : (
          <Row className="past-movies-grid g-4">
            {pastMovies.map((movie) => (
              <Col xl={3} lg={3} md={4} sm={6} xs={12} key={movie.id} style={{ alignSelf: 'flex-start' }}>
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0b0e17';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
                >
                  {/* Movie Poster Only */}
                  <div style={{
                    position: 'relative',
                    backgroundColor: '#f6f6f7',
                    borderBottom: '1px solid #eef0f2',
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
