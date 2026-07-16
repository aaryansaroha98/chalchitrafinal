import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Modal } from 'react-bootstrap';
import api from '../api/axios';
import Loader from '../components/Loader';

const Gallery = () => {
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const parseGalleryDate = (value) => {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dateOnlyMatch) {
        const [, year, month, day] = dateOnlyMatch;
        return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
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
      ? { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }
      : { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }
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
    return <Loader message="Loading Gallery" subtitle="Preparing your memories..." />;
  }

  return (
    <div className="bg-void" style={{ minHeight: '100vh' }}>
      <Container className="gallery-container" style={{ padding: '6rem 2rem 4rem' }}>
        {/* Professional Header */}
        <div className="gallery-header" style={{ textAlign: 'center', marginBottom: '1.5rem', marginTop: '-5rem', padding: '0 1rem' }}>
          <h1 className="gallery-title" style={{ fontSize: '2.5rem', fontWeight: '600', color: '#0b0e17', marginBottom: '1rem', letterSpacing: '-0.025em' }}>
            <i className="fas fa-images me-3 gallery-title-icon" style={{ fontSize: '2rem', color: '#0b0e17', marginRight: '0.75rem' }}></i>
            EVENT GALLERY
          </h1>
          <p className="gallery-subtitle" style={{ fontSize: '1.1rem', color: '#5c6270', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6', fontWeight: '400' }}>
            Relive the magical moments from our cinematic events
          </p>
        </div>

        {error && (
          <div style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            padding: '2rem',
            textAlign: 'center',
            marginBottom: '3rem'
          }}>
            <i className="fas fa-exclamation-triangle" style={{
              fontSize: '2rem',
              color: '#d64545',
              marginBottom: '1rem',
              display: 'block'
            }}></i>
            <h4 style={{ color: '#d64545', marginBottom: '0.5rem' }}>Unable to Load Gallery</h4>
            <p style={{ color: '#5c6270', margin: 0 }}>{error}</p>
          </div>
        )}

        {gallery.length === 0 && !error ? (
          <div style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            padding: '4rem 2rem',
            textAlign: 'center'
          }}>
            <i className="fas fa-camera" style={{
              fontSize: '4rem',
              color: '#8b909c',
              marginBottom: '1.5rem',
              display: 'block'
            }}></i>
            <h3 style={{ color: '#0b0e17', marginBottom: '1rem', fontWeight: '600' }}>
              Gallery Coming Soon
            </h3>
            <p style={{
              color: '#5c6270',
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
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#0b0e17';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  {/* Gallery Image */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
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
                  <div className="gallery-card-info" style={{ padding: '0.5rem', textAlign: 'center' }}>
                    <h5 className="gallery-card-title" style={{
                      fontSize: '1rem',
                      fontWeight: '700',
                      marginBottom: '0.5rem',
                      color: '#0b0e17',
                      lineHeight: '1.3'
                    }}>
                      {image.event_name || 'Gallery Image'}
                    </h5>
                    <p className="gallery-card-date" style={{
                      fontSize: '0.8rem',
                      color: '#5c6270',
                      margin: 0,
                      fontWeight: '500'
                    }}>
                      <i className="fas fa-calendar me-1"></i>
                      {formatGalleryEventDate(image.event_date || image.eventDate || image.uploaded_at)}
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
        style={{ zIndex: 9999 }}
      >
        <Modal.Body style={{
          background: '#ffffff',
          padding: '2rem',
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
                  border: '1px solid #e5e7eb'
                }}
              />
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{
                  color: '#0b0e17',
                  marginBottom: '0.5rem',
                  fontSize: '1.8rem',
                  fontWeight: '700'
                }}>
                  {selectedImage.event_name || 'Gallery Image'}
                </h3>
                <p style={{
                  color: '#5c6270',
                  margin: 0,
                  fontSize: '1.1rem'
                }}>
                  <i className="fas fa-calendar me-2"></i>
                  {formatGalleryEventDate(selectedImage.event_date || selectedImage.eventDate || selectedImage.uploaded_at, true)}
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
