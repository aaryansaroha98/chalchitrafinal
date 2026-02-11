import React from 'react';
import { Container, Row, Col, Card, ListGroup } from 'react-bootstrap';

const Contact = () => {
  return (
    <div className="bg-void" style={{minHeight: '100vh', position: 'relative', overflow: 'hidden'}}>
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



      <Container className="contact-container" style={{padding: '6rem 2rem 4rem', position: 'relative', zIndex: 2}}>
        {/* Clean Header */}
        <div className="contact-header" style={{
          textAlign: 'center',
          marginBottom: '4rem',
          marginTop: '-4rem',
          padding: '0 1rem'
        }}>
          <h1 className="contact-title" style={{
            fontSize: '2.5rem',
            fontWeight: '600',
            color: 'white',
            marginBottom: '1rem',
            letterSpacing: '-0.025em',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
          }}>
            <i className="fas fa-envelope" style={{
              color: '#007bff',
              marginRight: '0.75rem',
              fontSize: '2rem'
            }}></i>
            Contact Us
          </h1>
          <p className="contact-subtitle" style={{
            fontSize: '1.1rem',
            color: 'white',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6',
            fontWeight: '400',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
          }}>
            Get in touch with the Chalchitra team. We're here to help and love hearing from you!
          </p>
        </div>

        <Row className="g-4">
          <Col lg={8}>
            {/* Get in Touch Card */}
            <div style={{
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
              marginBottom: '2rem'
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
              <div style={{
                padding: '2rem',
                background: 'linear-gradient(135deg, rgba(0, 123, 255, 0.05), rgba(108, 117, 125, 0.05))',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: 'white',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                }}>
                  <i className="fas fa-handshake" style={{
                    color: '#007bff',
                    marginRight: '0.75rem',
                    fontSize: '1.25rem'
                  }}></i>
                  Get in Touch
                </h3>
              </div>
              <div style={{padding: '2rem'}}>
                <p style={{
                  fontSize: '1rem',
                  color: 'white',
                  lineHeight: '1.6',
                  marginBottom: '1.5rem',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                }}>
                  Have questions about Chalchitra Series? Want to collaborate or provide feedback?
                  We'd love to hear from you! As a student-led initiative, we're always looking for
                  ways to improve our events and make them more enjoyable for the IIT Jammu community.
                </p>
                <div style={{
                  background: 'rgba(0, 123, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid rgba(0, 123, 255, 0.15)'
                }}>
                  <h5 style={{
                    color: 'white',
                    marginBottom: '1rem',
                    fontWeight: '600',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                  }}>
                    <i className="fas fa-lightbulb" style={{marginRight: '0.5rem'}}></i>
                    Student-Led Initiative
                  </h5>
                  <p style={{
                    color: 'white',
                    margin: 0,
                    fontSize: '0.95rem',
                    lineHeight: '1.5',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                  }}>
                    We're passionate about bringing quality entertainment to our campus community.
                    Your feedback helps us create better experiences for everyone!
                  </p>
                </div>
              </div>
            </div>

            {/* How to Reach Us Card */}
            <div style={{
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
              position: 'relative'
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
              <div style={{
                padding: '2rem',
                background: 'linear-gradient(135deg, rgba(40, 167, 69, 0.05), rgba(108, 117, 125, 0.05))',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h4 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: 'white',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                }}>
                  <i className="fas fa-paper-plane" style={{
                    color: '#28a745',
                    marginRight: '0.75rem',
                    fontSize: '1.1rem'
                  }}></i>
                  How to Reach Us
                </h4>
              </div>
              <div style={{padding: '2rem'}}>
                <p style={{
                  fontSize: '1rem',
                  color: 'white',
                  lineHeight: '1.6',
                  marginBottom: '1.5rem',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                }}>
                  For inquiries about upcoming movies, booking issues, or general feedback,
                  please reach out to our team through the following channels:
                </p>
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => window.open('mailto:chalchitra@iitjammu.ac.in')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  >
                    <img
                      src="/logos/maillogo.png"
                      alt="Email"
                      style={{
                        width: '50px',
                        height: '50px',
                        marginRight: '1rem',
                        flexShrink: 0,
                        borderRadius: '8px',
                        objectFit: 'contain'
                      }}
                    />
                    <div style={{
                      fontSize: '1rem',
                      color: 'white',
                      fontWeight: '500',
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                      fontFamily: 'monospace'
                    }}>chalchitra@iitjammu.ac.in</div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => window.open('https://instagram.com/chalchitra.iitjammu', '_blank')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  >
                    <img
                      src="/logos/instalogo.png"
                      alt="Instagram"
                      style={{
                        width: '50px',
                        height: '50px',
                        marginRight: '1rem',
                        flexShrink: 0,
                        borderRadius: '8px',
                        objectFit: 'contain'
                      }}
                    />
                    <div style={{
                      fontSize: '1rem',
                      color: 'white',
                      fontWeight: '500',
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                    }}>@chalchitra.iitjammu</div>
                  </div>


                </div>
              </div>
            </div>
          </Col>

          <Col lg={4}>
            {/* Chalchitra Head Card */}
            <div style={{
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
              marginBottom: '2rem'
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
              <div style={{
                padding: '2rem',
                background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.05), rgba(108, 117, 125, 0.05))',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h5 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: 'white',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                }}>
                  <i className="fas fa-crown" style={{
                    color: '#ffc107',
                    marginRight: '0.75rem',
                    fontSize: '1rem'
                  }}></i>
                  Chalchitra Head
                </h5>
              </div>
              <div style={{padding: '2rem'}}>
                <p style={{
                  fontSize: '0.95rem',
                  color: 'white',
                  lineHeight: '1.6',
                  marginBottom: '1.5rem',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                }}>
                  Contact the head of Chalchitra for important matters:
                </p>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '1.1rem',
                      color: 'white',
                      fontWeight: '600',
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                    }}>KHUSHI</div>
                    <div style={{
                      fontSize: '1rem',
                      color: 'white',
                      fontWeight: '500',
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                      fontFamily: 'monospace'
                    }}>2024ucs0096@iitjammu.ac.in</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visit Us Card */}
            <div style={{
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
              position: 'relative'
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
              <div style={{
                padding: '2rem',
                background: 'linear-gradient(135deg, rgba(108, 117, 125, 0.05), rgba(0, 123, 255, 0.05))',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h5 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: 'white',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                }}>
                  <i className="fas fa-map-marker-alt" style={{
                    color: '#6c757d',
                    marginRight: '0.75rem',
                    fontSize: '1rem'
                  }}></i>
                  Visit Us
                </h5>
              </div>
              <div style={{padding: '2rem'}}>
                <p style={{
                  fontSize: '0.95rem',
                  color: 'white',
                  lineHeight: '1.6',
                  marginBottom: '1rem',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                }}>
                  Find us at IIT Jammu campus events and movie screenings.
                  We're active throughout the academic year bringing quality entertainment to students.
                </p>
                <div style={{
                  background: 'rgba(0, 123, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '1rem',
                  border: '1px solid rgba(0, 123, 255, 0.15)'
                }}>
                  <p style={{
                    fontSize: '0.9rem',
                    color: '#007bff',
                    margin: 0,
                    fontWeight: '500',
                    textAlign: 'center'
                  }}>
                    <i className="fas fa-bell" style={{marginRight: '0.5rem'}}></i>
                    Next event location and timing will be announced on our social media channels
                  </p>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Custom CSS for animations */}
      <style>
        {`
          @keyframes gridMove {
            0% { transform: translate(0, 0); }
            100% { transform: translate(50px, 50px); }
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
          }
        `}
      </style>
    </div>
  );
};

export default Contact;
