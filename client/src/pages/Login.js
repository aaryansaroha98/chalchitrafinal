import React, { useState } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    const searchParams = new URLSearchParams(window.location.search);
    const redirectTo = searchParams.get('redirectTo');
    const apiBaseUrl = window.location.origin;
    let authUrl = `${apiBaseUrl}/api/auth/google`;
    if (redirectTo) {
      authUrl += `?redirectTo=${encodeURIComponent(redirectTo)}`;
    }
    window.location.href = authUrl;
  };

  if (isLoading) {
    return <Loader message="Authenticating" subtitle="Securely signing you in with Google..." />;
  }

  return (
    <div className="login-page">
      <Container fluid className="login-container">
        <Row className="login-row">
          <Col xs={12} lg={9} xl={7} className="login-col">
            <div className="login-card">
              <Row className="g-0">
                {/* Left Side - Brand Section */}
                <Col lg={6} className="login-brand-col">
                  <div className="login-brand-content">
                    <div className="login-brand-icon">
                      <img
                        src="/logos/logo-removebg-preview.png"
                        alt="Chalchitra Logo"
                        className="login-brand-logo"
                      />
                    </div>
                    <h2 className="login-brand-title">Welcome to Chalchitra</h2>
                    <p className="login-brand-subtitle">
                      Experience movies like never before
                    </p>
                  </div>
                </Col>

                {/* Right Side - Login Form */}
                <Col lg={6} className="login-form-col">
                  <div className="login-form-wrap">

                    <h1 className="login-heading">LOGIN</h1>
                    <div className="login-divider"></div>

                    {/* Welcome Info (Desktop) */}
                    <div className="login-info-box d-none d-lg-block">
                      <div className="login-info-title">Welcome Back!</div>
                      <div className="login-info-subtitle">Please Login to continue</div>
                      <p className="login-info-text">
                        Only @iitjammu.ac.in email addresses are authorized to access this platform.
                      </p>
                    </div>

                    {/* Welcome Info (Mobile) */}
                    <div className="login-info-box login-info-mobile d-lg-none">
                      <div className="login-info-title">Welcome Back!</div>
                      <div className="login-info-subtitle">Please Login to continue</div>
                      <p className="login-info-text">
                        Only @iitjammu.ac.in email addresses are authorized to access this platform.
                      </p>
                    </div>

                    {/* Google Login Button */}
                    <Button
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      className="login-google-btn"
                    >
                      <div className="login-google-btn-inner">
                        <img
                          src="/logos/google-logo-icon-PNG-Transparent-Background.png"
                          alt="Google"
                          className="login-google-icon"
                        />
                        <span>Continue with Google</span>
                      </div>
                    </Button>

                    {/* Terms */}
                    <div className="login-terms-wrap">
                      <p className="login-terms-text">
                        By signing in, you agree to our{' '}
                        <span
                          onClick={() => navigate('/terms-of-service')}
                          className="login-link"
                        >
                          Terms of Service
                        </span>
                        {' '}and{' '}
                        <span
                          onClick={() => navigate('/privacy-policy')}
                          className="login-link"
                        >
                          Privacy Policy
                        </span>
                      </p>
                    </div>

                    {/* Security notice */}
                    <div className="login-security-box">
                      <div className="login-security-header">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        <small className="login-security-label">SECURE & PRIVATE</small>
                      </div>
                      <p className="login-security-text">
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

      <style>{`
        .login-page {
          background: #f6f6f7;
          min-height: 100vh;
        }

        .login-container {
          padding: 2rem;
        }

        .login-row {
          justify-content: center;
          align-items: center;
          min-height: 80vh;
        }

        .login-col {
          padding: 0;
        }

        .login-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          min-height: 400px;
        }

        .login-brand-col {
          display: none;
          background: #f6f6f7;
          position: relative;
          overflow: hidden;
        }

        @media (min-width: 992px) {
          .login-brand-col {
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }

        .login-brand-content {
          text-align: center;
          position: relative;
          z-index: 2;
          padding: 2rem;
        }

        .login-brand-icon {
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: center;
        }

        .login-brand-logo {
          width: 90px;
          height: auto;
          object-fit: contain;
          filter: brightness(0);
          opacity: 0.9;
        }

        .login-brand-title {
          color: #0b0e17;
          font-size: 2rem;
          font-weight: 300;
          margin-bottom: 0.75rem;
          letter-spacing: 1px;
        }

        .login-brand-subtitle {
          color: #5c6270;
          font-size: 1.1rem;
          font-weight: 300;
          margin: 0;
          line-height: 1.6;
        }

        .login-form-col {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.6rem 0.8rem;
        }

        .login-form-wrap {
          width: 100%;
          max-width: 220px;
          padding: 0 4px;
        }

        .login-heading {
          color: #0b0e17;
          font-size: 2.6rem;
          font-weight: 600;
          margin-bottom: 0.35rem;
          letter-spacing: 0.6px;
          text-align: center;
        }

        .login-divider {
          width: 52px;
          height: 1.5px;
          background: #0b0e17;
          margin: 0 auto 1.5rem;
        }

        .login-info-box {
          width: 100%;
          background: #f6f6f7;
          border: 1px solid #e5e7eb;
          padding: 0.75rem;
          margin-bottom: 1rem;
          text-align: center;
        }

        .login-info-title {
          font-size: 1.35rem;
          font-weight: 600;
          color: #0b0e17;
          margin-bottom: 0.2rem;
        }

        .login-info-subtitle {
          font-size: 0.95rem;
          font-weight: 400;
          color: #5c6270;
          margin-bottom: 0.6rem;
        }

        .login-info-text {
          color: #5c6270;
          font-size: 0.75rem;
          margin: 0;
          line-height: 1.5;
        }

        .login-info-mobile .login-info-title {
          font-size: 1.2rem;
        }

        .login-info-mobile .login-info-subtitle {
          font-size: 0.9rem;
        }

        .login-info-mobile .login-info-text {
          font-size: 0.9rem;
        }

        .login-google-btn {
          width: 100%;
          background: #0b0e17;
          border: 1px solid #0b0e17;
          padding: clamp(0.38rem, 2vw, 0.55rem) 1.6rem;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: #ffffff;
          transition: all 0.2s ease;
          margin-bottom: 1rem;
        }

        .login-google-btn:hover {
          background: #ffffff;
          color: #0b0e17;
        }

        .login-google-btn-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .login-google-icon {
          width: 20px;
          height: 20px;
        }

        .login-terms-wrap {
          text-align: center;
        }

        .login-terms-text {
          font-size: 0.82rem;
          color: #5c6270;
          margin: 0;
          line-height: 1.5;
        }

        .login-link {
          color: #0b0e17;
          cursor: pointer;
          text-decoration: underline;
          font-weight: 400;
        }

        .login-link:hover {
          color: #5c6270;
        }

        .login-security-box {
          margin-top: 1.25rem;
          padding: 0.75rem 0.85rem;
          width: 100%;
          background: #f6f6f7;
          border: 1px solid #e5e7eb;
        }

        .login-security-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          color: #5c6270;
        }

        .login-security-label {
          font-size: 0.75rem;
          font-weight: 600;
        }

        .login-security-text {
          font-size: 0.75rem;
          color: #8b909c;
          margin: 0;
          text-align: center;
          line-height: 1.4;
        }

        @media (max-width: 991px) {
          .login-container {
            padding: 1rem !important;
          }
          .login-heading {
            font-size: 2.5rem !important;
          }
        }

        @media (max-width: 576px) {
          .login-container {
            padding: 0 !important;
          }
          .login-card {
            background: transparent !important;
            border: none !important;
          }
          .login-heading {
            font-size: 2rem !important;
            margin-bottom: 1.25rem !important;
            font-weight: 700 !important;
          }
          .login-google-btn {
            padding: 1rem 1.5rem !important;
            font-size: 1.15rem !important;
          }
          .login-info-box {
            display: block !important;
            background: #f6f6f7 !important;
            border: 1px solid #e5e7eb !important;
            padding: 1rem 0.75rem !important;
            margin-bottom: 1.5rem !important;
          }
          .login-info-box.d-none.d-lg-block {
            display: none !important;
          }
          .login-info-mobile {
            display: block !important;
          }
          .login-info-title {
            font-size: 1.5rem !important;
            margin-bottom: 0.4rem !important;
          }
          .login-info-subtitle {
            font-size: 1.05rem !important;
            margin-bottom: 0.8rem !important;
          }
          .login-info-text {
            font-size: 0.95rem !important;
            line-height: 1.5 !important;
          }
          .login-terms-text {
            font-size: 0.9rem !important;
            margin-top: 0.75rem !important;
          }
          .login-security-label {
            font-size: 0.85rem !important;
          }
          .login-security-text {
            font-size: 0.8rem !important;
          }
          .login-form-wrap {
            max-width: 380px;
            width: 96%;
            margin: 0 auto;
            padding: 0 4px;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
