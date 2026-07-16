import React, { useState } from 'react';
import { Container, Row, Col, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // Capture redirectTo from search params to pass to backend
    const searchParams = new URLSearchParams(window.location.search);
    const redirectTo = searchParams.get('redirectTo');
    
    // Use current browser origin for mobile compatibility
    const apiBaseUrl = window.location.origin;
    let authUrl = `${apiBaseUrl}/api/auth/google`;
    if (redirectTo) {
      authUrl += `?redirectTo=${encodeURIComponent(redirectTo)}`;
    }
    window.location.href = authUrl;
  };

  const handlePrivacyPolicyClick = () => {
    navigate('/privacy-policy');
  };

  const handleTermsOfServiceClick = () => {
    navigate('/terms-of-service');
  };
  
  if (isLoading) {
    return <Loader message="Authenticating" subtitle="Securely signing you in with Google..." />;
  }

  return (
    <div className="bg-void" style={{minHeight: '100vh'}}>
      {/* Main Container */}
      <Container fluid style={{padding: '2rem'}}>
        <Row className="justify-content-center align-items-center" style={{minHeight: '80vh'}}>
          <Col xs={12} lg={9} xl={7}>
            <div className="login-card-container" style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              overflow: 'hidden',
              minHeight: '400px'
            }}>
              <Row className="g-0 h-100">
                {/* Left Side - Animated Image Section */}
                <Col lg={6} className="d-none d-lg-flex align-items-center justify-content-center" style={{
                  background: '#f6f6f7',
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
                    opacity: 0.8
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '300px',
                      height: '300px',
                      border: '2px solid #e5e7eb',
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
                      border: '2px solid #e5e7eb',
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
                              background: i % 2 === 0 ? '#0b0e17' : '#8b909c',
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
                        background: '#ffffff',
                        border: '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'gentleFloat 4s ease-in-out infinite'
                      }}>
                        <img
                          src="/logos/logo-removebg-preview.png"
                          alt="Chalchitra Logo"
                          style={{
                            width: '90px',
                            height: 'auto',
                            objectFit: 'contain',
                            filter: 'brightness(0)',
                            opacity: 0.9
                          }}
                        />
                      </div>
                    </div>

                    {/* Animated text */}
                    <h3 style={{
                      color: '#0b0e17',
                      fontSize: '2rem',
                      fontWeight: '300',
                      marginBottom: '1rem',
                      letterSpacing: '1px'
                    }}>
                      Welcome to Chalchitra
                    </h3>
                    <p style={{
                      color: '#5c6270',
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
                      color: '#0b0e17',
                      fontSize: '2.6rem',
                      fontWeight: '600',
                      marginBottom: '0.35rem',
                      letterSpacing: '0.6px'
                    }}>
                      LOGIN
                    </h1>
                      <div style={{
                        width: '52px',
                        height: '1.5px',
                        background: '#0b0e17',
                        margin: '0 auto'
                      }}></div>
                    </div>

                    {/* Welcome Info (Desktop) */}
                    <div className="login-iit-info" style={{
                      width: '100%',
                      background: '#f6f6f7',
                      border: '1px solid #e5e7eb',
                      padding: '0.75rem 0.75rem',
                      marginBottom: '1rem',
                      textAlign: 'center'
                    }}>
                      <div className="login-welcome-title" style={{
                        fontSize: '1.35rem',
                        fontWeight: '600',
                        color: '#0b0e17',
                        marginBottom: '0.2rem'
                      }}>
                        Welcome Back!
                      </div>
                      <div className="login-welcome-subtitle" style={{
                        fontSize: '0.95rem',
                        fontWeight: '400',
                        color: '#5c6270',
                        marginBottom: '0.6rem'
                      }}>
                        Please Login to continue
                      </div>
                      <p className="login-only-email" style={{
                        color: '#5c6270',
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
                      background: '#f6f6f7',
                      border: '1px solid #e5e7eb',
                      padding: '0.75rem 0.75rem',
                      marginBottom: '1rem',
                      textAlign: 'center'
                    }}>
                      <div className="login-welcome-title" style={{
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        color: '#0b0e17',
                        marginBottom: '0.2rem'
                      }}>
                        Welcome Back!
                      </div>
                      <div className="login-welcome-subtitle" style={{
                        fontSize: '0.9rem',
                        fontWeight: '400',
                        color: '#5c6270',
                        marginBottom: '0.6rem'
                      }}>
                        Please Login to continue
                      </div>
                      <p className="login-only-email" style={{
                        color: '#5c6270',
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
                        background: '#0b0e17',
                        border: '1px solid #0b0e17',
                        padding: 'clamp(0.38rem, 2vw, 0.55rem) 1.6rem',
                        fontSize: '12px',
                        fontWeight: '500',
                        letterSpacing: '0.09em',
                        textTransform: 'uppercase',
                        color: '#ffffff',
                        transition: 'all 0.2s ease',
                        marginBottom: '1rem'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#ffffff';
                        e.currentTarget.style.color = '#0b0e17';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#0b0e17';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                    >
                      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'}}>
                        {isLoading ? (
                          <>
                            <Spinner animation="border" size="sm" style={{color: '#ffffff'}} />
                            <span>Connecting...</span>
                          </>
                        ) : (
                          <>
                            <img
                              src="/logos/google-logo-icon-PNG-Transparent-Background.png"
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
                        color: '#5c6270',
                        margin: 0,
                        lineHeight: '1.5'
                      }}>
                        By signing in, you agree to our{' '}
                        <span
                          onClick={handleTermsOfServiceClick}
                          style={{
                            color: '#0b0e17',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontWeight: '400'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.color = '#5c6270';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.color = '#0b0e17';
                          }}
                        >
                          Terms of Service
                        </span>
                        {' '}and{' '}
                        <span
                          onClick={handlePrivacyPolicyClick}
                          style={{
                            color: '#0b0e17',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontWeight: '400'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.color = '#5c6270';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.color = '#0b0e17';
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
                      background: '#f6f6f7',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem'}}>
                        <i className="fas fa-shield-alt login-secure-icon" style={{color: '#5c6270', fontSize: '0.9rem'}}></i>
                        <small className="login-secure-title" style={{color: '#5c6270', fontSize: '0.75rem', fontWeight: '600'}}>
                          SECURE & PRIVATE
                        </small>
                      </div>
                      <p className="login-secure-text" style={{
                        fontSize: '0.75rem',
                        color: '#8b909c',
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
              font-size: 2.5rem !important;
            }
          }

          @media (max-width: 576px) {
            .container-fluid {
              padding: 0 !important;
            }

            .login-card-container {
              background: transparent !important;
              backdrop-filter: none !important;
              border: none !important;
              box-shadow: none !important;
            }

            h1 {
              font-size: 2rem !important;
              margin-bottom: 1.25rem !important;
              font-weight: 700 !important;
            }

            .btn {
              padding: 1rem 1.5rem !important;
              font-size: 1.15rem !important;
              border-radius: 20px !important;
            }

            .login-iit-info {
              display: none !important;
            }

            .login-welcome-mobile {
              display: block !important;
              background: #f6f6f7 !important;
              border: 1px solid #e5e7eb !important;
              padding: 1rem 0.75rem !important;
              margin-bottom: 1.5rem !important;
            }

            .login-welcome-title {
              font-size: 1.5rem !important;
              margin-bottom: 0.4rem !important;
            }

            .login-welcome-subtitle {
              font-size: 1.05rem !important;
              margin-bottom: 0.8rem !important;
            }

            .login-only-email {
              font-size: 0.95rem !important;
              line-height: 1.5 !important;
            }

            .login-terms {
              font-size: 0.9rem !important;
              margin-top: 0.75rem !important;
            }

            .login-secure-title {
              font-size: 0.85rem !important;
            }

            .login-secure-text {
              font-size: 0.8rem !important;
            }

            .login-secure-icon {
              font-size: 1rem !important;
            }

            .login-form-wrap {
              max-width: 380px;
              width: 96%;
              margin: 0 auto;
              padding: 0 4px;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Login;
