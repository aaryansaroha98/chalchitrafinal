import React, { useState } from 'react';
import { Container, Row, Col, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // Use current browser origin for mobile compatibility
    const apiBaseUrl = window.location.origin;
    window.location.href = `${apiBaseUrl}/api/auth/google`;
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



      {/* Main Container */}
      <Container fluid style={{padding: '2rem', position: 'relative', zIndex: 10}}>
        <Row className="justify-content-center align-items-center" style={{minHeight: '80vh'}}>
          <Col xs={12} lg={9} xl={7}>
            <div className="login-card-container" style={{
              background: 'rgba(255, 255, 255, 0.02)',
              backdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '32px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.02)',
              minHeight: '400px'
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
                          src="/logos/logo-removebg-preview.png"
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
                      Welcome to Chalchitra
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
              background: rgba(255, 255, 255, 0.05) !important;
              padding: 1rem 0.75rem !important;
              border-radius: 20px !important;
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
