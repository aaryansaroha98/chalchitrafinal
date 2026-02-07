import React, { useState } from 'react';
import { Container, Row, Col, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    const apiBaseUrl = process.env.VITE_API_BASE_URL || 'https://chalchitra-api.onrender.com';
    window.location.href = `${apiBaseUrl}/api/auth/google`;
  };

  const handlePrivacyPolicyClick = () => {
    navigate('/privacy-policy');
  };

  const handleTermsOfServiceClick = () => {
    navigate('/terms-of-service');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Dark Glass Background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #1a1a1a 100%)',
        opacity: 0.95
      }}></div>

      {/* Subtle animated background pattern */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
          radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.01) 1px, transparent 1px)
        `,
        backgroundSize: '100px 100px',
        animation: 'subtleMove 40s linear infinite'
      }}></div>



      {/* Main Container */}
      <Container fluid style={{padding: '2rem', position: 'relative', zIndex: 10}}>
        <Row className="justify-content-center align-items-center" style={{minHeight: '80vh'}}>
          <Col lg={9} xl={7}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              backdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '32px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.02)',
              minHeight: '520px'
            }}>
              <Row className="g-0 h-100">
                {/* Left Side - Animated Image Section */}
                <Col lg={6} className="d-none d-lg-flex align-items-center justify-content-center" style={{
                  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(20, 20, 20, 0.9) 100%)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Animated movie reel background */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    opacity: 0.1
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '300px',
                      height: '300px',
                      border: '2px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '50%',
                      animation: 'spin 20s linear infinite'
                    }}></div>
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '200px',
                      height: '200px',
                      border: '2px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '50%',
                      animation: 'spinReverse 15s linear infinite'
                    }}></div>
                  </div>

                  {/* Main animated content */}
                  <div style={{textAlign: 'center', position: 'relative', zIndex: 2}}>
                    {/* Film strip animation */}
                    <div style={{marginBottom: '2rem'}}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        marginBottom: '1rem'
                      }}>
                        {[...Array(6)].map((_, i) => (
                          <div
                            key={i}
                            style={{
                              width: '4px',
                              height: '40px',
                              background: i % 2 === 0 ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.4)',
                              borderRadius: '2px',
                              animation: `filmStrip ${2 + i * 0.3}s ease-in-out infinite`,
                              animationDelay: `${i * 0.2}s`
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>

                    {/* Chalchitra Logo */}
                    <div style={{marginBottom: '1.5rem'}}>
                      <div style={{
                        width: '120px',
                        height: '120px',
                        margin: '0 auto',
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                        animation: 'gentleFloat 4s ease-in-out infinite'
                      }}>
                        <img
                          src="/team-1768254574776.png"
                          alt="Chalchitra Logo"
                          style={{
                            width: '90px',
                            height: 'auto',
                            objectFit: 'contain',
                            filter: 'brightness(0) invert(1)',
                            opacity: 0.9
                          }}
                        />
                      </div>
                    </div>

                    {/* Animated text */}
                    <h3 style={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '2rem',
                      fontWeight: '300',
                      marginBottom: '1rem',
                      letterSpacing: '1px',
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
                    }}>
                      Welcome to Cinema
                    </h3>
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '1.1rem',
                      margin: 0,
                      fontWeight: '300',
                      lineHeight: '1.6'
                    }}>
                      Experience movies like never before
                    </p>


                  </div>
                </Col>

                {/* Right Side - Login Form */}
                <Col lg={6} className="d-flex align-items-center justify-content-center" style={{padding: '1.6rem 0.8rem'}}>
                  <div className="login-form-wrap" style={{width: '100%', maxWidth: '220px', padding: '0 4px'}}>
                    {/* Login/Sign Up Container Title */}
                    <div style={{
                      textAlign: 'center',
                      marginBottom: '1.5rem'
                    }}>
                      <h1 style={{
                        color: 'white',
                        fontSize: '2.6rem',
                        fontWeight: '600',
                        marginBottom: '0.35rem',
                        letterSpacing: '0.6px'
                      }}>
                        Login
                      </h1>
                      <div style={{
                        width: '52px',
                        height: '1.5px',
                        background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.3))',
                        margin: '0 auto',
                        borderRadius: '1px'
                      }}></div>
                    </div>

                    {/* Welcome Info (Desktop) */}
                    <div className="login-iit-info" style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.03)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      padding: '0.75rem 0.75rem',
                      marginBottom: '1rem',
                      textAlign: 'center'
                    }}>
                      <div className="login-welcome-title" style={{
                        fontSize: '1.35rem',
                        fontWeight: '600',
                        color: 'rgba(255, 255, 255, 0.95)',
                        marginBottom: '0.2rem'
                      }}>
                        Welcome Back!
                      </div>
                      <div className="login-welcome-subtitle" style={{
                        fontSize: '0.95rem',
                        fontWeight: '400',
                        color: 'rgba(255, 255, 255, 0.7)',
                        marginBottom: '0.6rem'
                      }}>
                        Please Login to continue
                      </div>
                      <p className="login-only-email" style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.75rem',
                        margin: 0,
                        lineHeight: '1.5'
                      }}>
                        Only @iitjammu.ac.in email addresses are authorized to access this platform.
                      </p>
                    </div>

                    {/* Welcome Info (Mobile) */}
                    <div className="login-welcome-mobile" style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.03)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      padding: '0.75rem 0.75rem',
                      marginBottom: '1rem',
                      textAlign: 'center'
                    }}>
                      <div className="login-welcome-title" style={{
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        color: 'rgba(255, 255, 255, 0.95)',
                        marginBottom: '0.2rem'
                      }}>
                        Welcome Back!
                      </div>
                      <div className="login-welcome-subtitle" style={{
                        fontSize: '0.9rem',
                        fontWeight: '400',
                        color: 'rgba(255, 255, 255, 0.7)',
                        marginBottom: '0.6rem'
                      }}>
                        Please Login to continue
                      </div>
                      <p className="login-only-email" style={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '0.9rem',
                        margin: 0,
                        lineHeight: '1.5'
                      }}>
                        Only @iitjammu.ac.in email addresses are authorized to access this platform.
                      </p>
                    </div>

                    {/* Google Login Button */}
                    <Button
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '16px',
                        padding: '0.55rem 1.6rem',
                        fontSize: '0.9rem',
                        fontWeight: '400',
                        color: 'white',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
                        marginBottom: '1rem'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.target.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.15)';
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      }}
                    >
                      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'}}>
                        {isLoading ? (
                          <>
                            <Spinner animation="border" size="sm" style={{color: 'white'}} />
                            <span>Connecting...</span>
                          </>
                        ) : (
                          <>
                            <img
                              src="/google-logo-icon-PNG-Transparent-Background.png"
                              alt="Google"
                              style={{width: '20px', height: '20px'}}
                            />
                            <span>Continue with Google</span>
                          </>
                        )}
                      </div>
                    </Button>

                    {/* Terms */}
                    <div style={{textAlign: 'center'}}>
                      <p className="login-terms" style={{
                        fontSize: '0.82rem',
                        color: 'rgba(255, 255, 255, 0.6)',
                        margin: 0,
                        lineHeight: '1.5'
                      }}>
                        By signing in, you agree to our{' '}
                        <span
                          onClick={handleTermsOfServiceClick}
                          style={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontWeight: '400'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.color = 'rgba(255, 255, 255, 1)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.color = 'rgba(255, 255, 255, 0.8)';
                          }}
                        >
                          Terms of Service
                        </span>
                        {' '}and{' '}
                        <span
                          onClick={handlePrivacyPolicyClick}
                          style={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontWeight: '400'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.color = 'rgba(255, 255, 255, 1)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.color = 'rgba(255, 255, 255, 0.8)';
                          }}
                        >
                          Privacy Policy
                        </span>
                      </p>
                    </div>

                    {/* Additional info */}
                    <div style={{
                      marginTop: '1.25rem',
                      padding: '0.75rem 0.85rem',
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem'}}>
                        <i className="fas fa-shield-alt login-secure-icon" style={{color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem'}}></i>
                        <small className="login-secure-title" style={{color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem', fontWeight: '600'}}>
                          SECURE & PRIVATE
                        </small>
                      </div>
                      <p className="login-secure-text" style={{
                        fontSize: '0.75rem',
                        color: 'rgba(255, 255, 255, 0.5)',
                        margin: 0,
                        textAlign: 'center',
                        lineHeight: '1.4'
                      }}>
                        Your data is protected with enterprise-grade security. Only IIT Jammu students can access this platform.
                      </p>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Custom CSS for animations */}
      <style>
        {`
          .login-welcome-mobile {
            display: none;
          }

          .login-form-wrap {
            max-width: 220px;
            max-height: none;
            overflow: visible;
            padding-left: 4px;
            padding-right: 4px;
          }

          @keyframes subtleMove {
            0% { transform: translate(0, 0); }
            100% { transform: translate(20px, 20px); }
          }

          @keyframes floatLight {
            0%, 100% {
              transform: translateY(0px) scale(1);
              opacity: 0.3;
            }
            50% {
              transform: translateY(-20px) scale(1.1);
              opacity: 0.6;
            }
          }

          @keyframes gentleFloat {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
          }

          @keyframes spin {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
          }

          @keyframes spinReverse {
            from { transform: translate(-50%, -50%) rotate(360deg); }
            to { transform: translate(-50%, -50%) rotate(0deg); }
          }

          @keyframes filmStrip {
            0%, 100% {
              opacity: 0.3;
              transform: scaleY(1);
            }
            50% {
              opacity: 1;
              transform: scaleY(1.2);
            }
          }

          @keyframes particleFloat {
            0%, 100% {
              transform: translateY(0px) translateX(0px);
              opacity: 0;
            }
            50% {
              transform: translateY(-40px) translateX(10px);
              opacity: 0.8;
            }
          }

          /* Responsive adjustments */
          @media (max-width: 991px) {
            .container-fluid {
              padding: 1rem !important;
            }

            h1 {
              font-size: 2rem !important;
            }
          }

          @media (max-width: 576px) {
            .container-fluid {
              padding: 0.5rem !important;
            }

            h1 {
              font-size: 1.8rem !important;
              margin-bottom: 1rem !important;
            }

            .btn {
              padding: 0.875rem 1.5rem !important;
              font-size: 1rem !important;
            }

            .login-iit-info {
              display: none !important;
            }

            .login-welcome-mobile {
              display: block !important;
            }

            .login-welcome-title {
              font-size: 1.15rem !important;
            }

            .login-welcome-subtitle {
              font-size: 0.9rem !important;
            }

            .login-only-email {
              font-size: 0.85rem !important;
            }

            .login-terms {
              font-size: 0.8rem !important;
            }

            .login-secure-title {
              font-size: 0.75rem !important;
            }

            .login-secure-text {
              font-size: 0.75rem !important;
            }

            .login-secure-icon {
              font-size: 0.9rem !important;
            }

            .login-form-wrap {
              max-width: 180px;
              max-height: none;
              overflow: visible;
              padding-left: 4px;
              padding-right: 4px;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Login;
