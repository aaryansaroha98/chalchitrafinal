import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{
      background: '#1a1a1a',
      color: '#ffffff',
      padding: '1rem 0 1rem',
      position: 'relative',
      zIndex: 100,
      fontFamily: "'Inter', sans-serif"
    }}>
      <Container style={{
        padding: '0 1.5rem',
        maxWidth: '1200px'
      }}>
        {/* Main Footer Content */}
        <Row className="mb-3" style={{gap: '0.5rem'}}>
          {/* Brand Section - Modern & Professional */}
          <Col lg={4} md={6} className="mb-4 mb-lg-0">
            <div style={{textAlign: 'left'}}>
              <h3 style={{
                color: '#ffffff',
                margin: '0 0 0.5rem 0',
                fontSize: '2rem',
                fontWeight: '700',
                fontFamily: "'Montserrat', sans-serif",
                letterSpacing: '-1px',
                background: 'linear-gradient(45deg, #ffffff, #e0e0e0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block'
              }}>
                Chalchitra Series
              </h3>

              {/* Modern Divider */}
              <div style={{
                width: '50px',
                height: '3px',
                background: 'linear-gradient(90deg, #e94560, #ff7f50)',
                margin: '1rem 0',
                borderRadius: '2px',
                opacity: '0.9'
              }}></div>

              <p style={{
                color: '#ffffff',
                fontSize: '0.95rem',
                lineHeight: '1.7',
                maxWidth: '320px',
                fontStyle: 'normal',
                fontWeight: '300'
              }}>
                Elevating cinematic experiences for IIT Jammu students with premium screenings and exclusive events.
              </p>

              {/* Social Media Icons - Simple */}
              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '1.5rem'
              }}>
                <a href="#" style={{
                  color: '#ffffff',
                  fontSize: '1.2rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = '#e94560';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#ffffff';
                  e.target.style.transform = 'translateY(0)';
                }}>
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" style={{
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = '#e94560';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#ffffff';
                  e.target.style.transform = 'translateY(0)';
                }}>
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" style={{
                  color: '#ffffff',
                  fontSize: '1.2rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = '#e94560';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#ffffff';
                  e.target.style.transform = 'translateY(0)';
                }}>
                  <i className="fab fa-twitter"></i>
                </a>
              </div>
            </div>
          </Col>

          {/* Legal Links - Modern Style */}
          <Col lg={3} md={6} className="mb-4 mb-lg-0 ms-lg-auto footer-legal" style={{
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '1rem'
          }}>
            <h5 style={{
              color: '#ffffff',
              marginBottom: '1.5rem',
              fontSize: '1.1rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Legal
            </h5>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <Link to="/privacy-policy" style={{
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '400',
                transition: 'all 0.3s ease',
                padding: '0.3rem 0',
                position: 'relative',
                display: 'inline-block',
                textTransform: 'uppercase',
                letterSpacing: '0.6px'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#ffffff';
                e.target.style.transform = 'translateX(5px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#ffffff';
                e.target.style.transform = 'translateX(0)';
              }}>
                Privacy Policy
              </Link>
              <Link to="/terms-of-service" style={{
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '400',
                transition: 'all 0.3s ease',
                padding: '0.3rem 0',
                position: 'relative',
                display: 'inline-block',
                textTransform: 'uppercase',
                letterSpacing: '0.6px'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#ffffff';
                e.target.style.transform = 'translateX(5px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#ffffff';
                e.target.style.transform = 'translateX(0)';
              }}>
                Terms of Service
              </Link>
              <Link to="/refund-policy" style={{
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '400',
                transition: 'all 0.3s ease',
                padding: '0.3rem 0',
                position: 'relative',
                display: 'inline-block',
                textTransform: 'uppercase',
                letterSpacing: '0.6px'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#ffffff';
                e.target.style.transform = 'translateX(5px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#ffffff';
                e.target.style.transform = 'translateX(0)';
              }}>
                Refund Policy
              </Link>
            </div>
          </Col>

          {/* Contact Information - Modern Style */}
          <Col lg={3} md={6} className="footer-contact" style={{
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '1rem'
          }}>
            <h5 style={{
              color: '#ffffff',
              marginBottom: '1.5rem',
              fontSize: '1.1rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Contact Us
            </h5>
            
            {/* Contact Icons Row */}
            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <a href="mailto:chalchitra@iitjammu.ac.in" style={{
                color: '#e94560',
                fontSize: '1.5rem',
                transition: 'all 0.3s ease',
                padding: '10px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '52px',
                height: '52px'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#ffffff';
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#e94560';
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.transform = 'translateY(0)';
              }}>
                <img
                  src="/logos/maillogo.png"
                  alt="Email"
                  style={{
                    width: '30px',
                    height: '30px',
                    objectFit: 'contain'
                  }}
                />
              </a>

              <a href="https://www.instagram.com/chalchitra.iitjammu/" style={{
                color: '#e94560',
                fontSize: '1.5rem',
                transition: 'all 0.3s ease',
                padding: '10px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '52px',
                height: '52px'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#ffffff';
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#e94560';
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.transform = 'translateY(0)';
              }}>
                <img
                  src="/logos/instalogo.png"
                  alt="Instagram"
                  style={{
                    width: '48px',
                    height: '48px',
                    objectFit: 'contain'
                  }}
                />
              </a>

              <a href="tel:+919569579671" style={{
                color: '#e94560',
                fontSize: '1.5rem',
                transition: 'all 0.3s ease',
                padding: '10px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '52px',
                height: '52px'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#ffffff';
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#e94560';
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.transform = 'translateY(0)';
              }}>
                <img
                  src="/misc/telephone.png"
                  alt="Mobile"
                  style={{
                    width: '30px',
                    height: '30px',
                    objectFit: 'contain'
                  }}
                />
              </a>

              <a href="https://www.google.com/maps/search/?api=1&query=IIT+Jammu,+Jagti" style={{
                color: '#e94560',
                fontSize: '1.5rem',
                transition: 'all 0.3s ease',
                padding: '10px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '52px',
                height: '52px'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#ffffff';
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#e94560';
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.transform = 'translateY(0)';
              }}>
                <img
                  src="/misc/adress.jpeg"
                  alt="Address"
                  style={{
                    width: '35px',
                    height: '35px',
                    objectFit: 'contain',
                    borderRadius: '50%'
                  }}
                />
              </a>
            </div>

            {/* Address Below Icons */}
            <div style={{
              textAlign: 'center',
              color: '#b8c5d6',
              fontSize: '0.85rem',
              lineHeight: '1.4',
              marginTop: '0.5rem'
            }}>
              <p style={{margin: '0 0 0.25rem 0'}}>
                <strong style={{color: '#ffffff'}}>Chalchitra Series</strong>
              </p>
              <p style={{margin: '0 0 0.25rem 0', color: '#ffffff'}}>
                IIT Jammu, Jagti
              </p>
              <p style={{margin: '0', color: '#ffffff'}}>
                Jammu & Kashmir, India
              </p>
            </div>
          </Col>
        </Row>

        {/* Footer Bottom - Compact Style */}
        <Row style={{
          marginTop: '0.5rem',
          paddingTop: '0.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Col md={6} sm={12} className="text-center text-sm-start mb-1 mb-sm-0">
            <p style={{
              color: '#ffffff',
              margin: 0,
              fontSize: '0.8rem',
              fontWeight: '400'
            }}>
              © 2026 Chalchitra Series. All rights reserved.
            </p>
          </Col>
          <Col md={6} sm={12} className="text-center text-sm-end">
            <p style={{
              color: '#ffffff',
              margin: 0,
              fontSize: '0.8rem',
              fontWeight: '400'
            }}>
              Cinematic excellence for IIT Jammu
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;

