import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Modal } from 'react-bootstrap';
import api from '../api/axios';

const Gallery = () => {
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const parseGalleryDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (dateOnlyMatch) {
        const [, year, month, day] = dateOnlyMatch;
        return new Date(Number(year), Number(month) - 1, Number(day));
      }
      const normalized = trimmed.replace(' ', 'T');
      const parsed = new Date(normalized);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatGalleryEventDate = (eventDate, longFormat = false) => {
    const date = parseGalleryDate(eventDate);
    if (!date) return 'Date not available';
    return date.toLocaleDateString('en-IN', longFormat
      ? { year: 'numeric', month: 'long', day: 'numeric' }
      : { year: 'numeric', month: 'short', day: 'numeric' }
    );
  };

  // Helper function to get the full image URL
  const getGalleryImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    // Handle paths - if starts with /, use as-is, otherwise add /gallery/ prefix
    if (url.startsWith('/')) return `${window.location.origin}${url}`;
    return `${window.location.origin}/gallery/${url}`;
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const res = await api.get('/api/admin/gallery');
      setGallery(res.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load gallery');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, var(--gray-50) 0%, var(--gray-100) 50%, var(--gray-200) 100%)',
        minHeight: '100vh',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
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

        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '20px',
          padding: '3rem',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0, 255, 255, 0.2)',
          zIndex: 2
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(0, 255, 255, 0.3)',
            borderTop: '4px solid var(--primary-color)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.5rem'
          }}></div>
          <h3 style={{
            color: 'var(--gray-800)',
            marginBottom: '0.5rem',
            fontWeight: '600'
          }}>Loading Gallery</h3>
          <p style={{
            color: 'var(--gray-600)',
            margin: 0,
            fontSize: '0.95rem'
          }}>Preparing your memories...</p>
        </div>

        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
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



      <Container className="gallery-container" style={{padding: '6rem 2rem 4rem', position: 'relative', zIndex: 2}}>
        {/* Professional Header */}
        <div className="gallery-header">
          <h1 className="gallery-title">
            <i className="fas fa-images me-3 gallery-title-icon" style={{fontSize: '2.5rem'}}></i>
            Event Gallery
          </h1>
          <p className="gallery-subtitle">
            Relive the magical moments from our cinematic events
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(220, 53, 69, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(220, 53, 69, 0.2)',
            borderRadius: '15px',
            padding: '2rem',
            textAlign: 'center',
            marginBottom: '3rem',
            boxShadow: '0 8px 32px rgba(220, 53, 69, 0.1)'
          }}>
            <i className="fas fa-exclamation-triangle" style={{
              fontSize: '2rem',
              color: '#dc3545',
              marginBottom: '1rem',
              display: 'block'
            }}></i>
            <h4 style={{color: '#dc3545', marginBottom: '0.5rem'}}>Unable to Load Gallery</h4>
            <p style={{color: 'var(--gray-600)', margin: 0}}>{error}</p>
          </div>
        )}

        {gallery.length === 0 && !error ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(25px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '25px',
            padding: '4rem 2rem',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 255, 255, 0.1)'
          }}>
            <i className="fas fa-camera" style={{
              fontSize: '4rem',
              color: 'var(--gray-400)',
              marginBottom: '1.5rem',
              display: 'block'
            }}></i>
            <h3 style={{color: 'var(--gray-700)', marginBottom: '1rem', fontWeight: '600'}}>
              Gallery Coming Soon
            </h3>
            <p style={{
              color: 'var(--gray-600)',
              margin: 0,
              fontSize: '1.1rem',
              maxWidth: '400px',
              margin: '0 auto 2rem'
            }}>
              Photos from our upcoming events will be showcased here.
            </p>
          </div>
        ) : (
          <Row className="gallery-grid g-4">
            {gallery.map((image, index) => (
              <Col xl={4} lg={6} md={6} sm={12} key={image.id} className="mb-4" style={{ alignSelf: 'flex-start' }}>
                <div className="gallery-card" style={{
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
                  {/* Gallery Image */}
                <div style={{position: 'relative', flexShrink: 0}}>
                    <img
                      src={getGalleryImageUrl(image.image_url)}
                      alt={image.event_name || 'Gallery Image'}
                      onClick={() => {
                        setSelectedImage(image);
                        setShowModal(true);
                      }}
                      className="gallery-card-image"
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                      }}
                    />
                  </div>

                  {/* Image Info */}
                  <div className="gallery-card-info" style={{padding: '0.5rem', textAlign: 'center'}}>
                    <h5 className="gallery-card-title" style={{
                      fontSize: '1rem',
                      fontWeight: '700',
                      marginBottom: '0.5rem',
                      color: '#ffffff',
                      lineHeight: '1.3'
                    }}>
                      {image.event_name || 'Gallery Image'}
                    </h5>
                    <p className="gallery-card-date" style={{
                      fontSize: '0.8rem',
                      color: 'rgba(255, 255, 255, 0.8)',
                      margin: 0,
                      fontWeight: '500'
                    }}>
                      <i className="fas fa-calendar me-1"></i>
                      Event on {formatGalleryEventDate(image.event_date || image.eventDate || image.uploaded_at)}
                    </p>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        )}
      </Container>

      {/* Image Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        size="xl"
        style={{zIndex: 9999}}
      >
        <Modal.Body style={{
          background: 'linear-gradient(135deg, var(--gray-900), var(--gray-800))',
          padding: '2rem',
          borderRadius: '20px',
          textAlign: 'center'
        }}>
          {selectedImage && (
            <>
              <img
                src={getGalleryImageUrl(selectedImage.image_url)}
                alt={selectedImage.event_name || 'Gallery Image'}
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: '15px',
                  boxShadow: '0 20px 60px rgba(0, 255, 255, 0.3)',
                  border: '2px solid rgba(0, 255, 255, 0.2)'
                }}
              />
              <div style={{marginTop: '2rem'}}>
                <h3 style={{
                  color: 'var(--gray-100)',
                  marginBottom: '0.5rem',
                  fontSize: '1.8rem',
                  fontWeight: '700'
                }}>
                  {selectedImage.event_name || 'Gallery Image'}
                </h3>
                <p style={{
                  color: 'var(--gray-400)',
                  margin: 0,
                  fontSize: '1.1rem'
                }}>
                  <i className="fas fa-calendar me-2"></i>
                  Event on {formatGalleryEventDate(selectedImage.event_date || selectedImage.eventDate || selectedImage.uploaded_at, true)}
                </p>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* Custom CSS for animations */}
      <style>
        {`
          @keyframes gridMove {
            0% { transform: translate(0, 0); }
            100% { transform: translate(50px, 50px); }
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

          @keyframes slowRotateReverse {
            0% { transform: translate(-50%, -50%) rotate(360deg); }
            100% { transform: translate(-50%, -50%) rotate(0deg); }
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
          }

          @keyframes rotateGlow {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Gallery;
