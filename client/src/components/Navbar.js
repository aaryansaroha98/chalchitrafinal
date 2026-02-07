import React, { useEffect, useState } from 'react';
import { Navbar, Nav, Container, Offcanvas } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NavigationBar = () => {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  const [navHidden, setNavHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateNav = () => {
      const currentY = window.scrollY;
      const shouldHide = currentY > 80 && currentY > lastScrollY + 5;
      const shouldShow = currentY < lastScrollY - 5;

      if (shouldHide) {
        setNavHidden(true);
      } else if (shouldShow || currentY <= 20) {
        setNavHidden(false);
      }

      lastScrollY = currentY;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateNav);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLoginClick = () => {
    navigate('/login');
  };

  if (loading) {
    return (
      <Navbar
        style={{
          backgroundColor: '#1a1a1a',
          transform: navHidden ? 'translateY(-100%)' : 'translateY(0)',
          transition: 'transform 0.25s ease',
          willChange: 'transform'
        }}
        variant="dark"
        expand="lg"
        sticky="top"
      >
        <Container style={{ position: 'relative' }}>
          <Navbar.Toggle aria-controls="basic-navbar-nav" style={{ position: 'relative', zIndex: 10, marginRight: 'auto' }} />
          <Navbar.Brand as={Link} to="/" style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '1.25rem',
            fontWeight: '600',
            color: 'white',
            textDecoration: 'none',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            letterSpacing: '1px',
            zIndex: 1
          }}>
            CHALCHITRA SERIES
          </Navbar.Brand>
          {!user && (
            <button
              onClick={handleLoginClick}
              className="nav-login-icon"
              style={{
                position: 'relative',
                zIndex: 10,
                marginLeft: 'auto',
                marginRight: '0.4rem',
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer'
              }}
              aria-label="Login"
            >
              <img
                src="/login_b_inverted.png"
                alt="Login"
                style={{ width: '24px', height: '24px' }}
              />
            </button>
          )}
        </Container>
      </Navbar>
    );
  }

  return (
    <Navbar
      style={{
        backgroundColor: '#1a1a1a',
        transform: navHidden ? 'translateY(-100%)' : 'translateY(0)',
        transition: 'transform 0.25s ease',
        willChange: 'transform'
      }}
      variant="dark"
      expand="lg"
      sticky="top"
      expanded={menuOpen}
      onToggle={(nextExpanded) => setMenuOpen(nextExpanded)}
    >
      <Container style={{ position: 'relative' }}>
        <Navbar.Toggle aria-controls="basic-navbar-nav" style={{ position: 'relative', zIndex: 10, marginRight: 'auto' }} />
        <Navbar.Brand as={Link} to="/" style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '1.25rem',
          fontWeight: '600',
          color: 'white',
          textDecoration: 'none',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          letterSpacing: '1px',
          zIndex: 1
        }}>
          CHALCHITRA SERIES
        </Navbar.Brand>
          {!user && (
            <button
              onClick={handleLoginClick}
              className="nav-login-icon"
              style={{
                position: 'relative',
                zIndex: 10,
                marginLeft: 'auto',
                marginRight: '0.4rem',
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer'
              }}
            aria-label="Login"
          >
            <img
              src="/login_b_inverted.png"
              alt="Login"
              style={{ width: '24px', height: '24px' }}
            />
          </button>
        )}
        <Navbar.Offcanvas
          id="basic-navbar-nav"
          aria-labelledby="basic-navbar-nav-label"
          placement="start"
          show={menuOpen}
          onHide={() => setMenuOpen(false)}
        >
          <Offcanvas.Header closeButton closeVariant="white">
            <Offcanvas.Title id="basic-navbar-nav-label" style={{
              color: 'white',
              fontWeight: '600',
              letterSpacing: '1px',
              whiteSpace: 'nowrap'
            }}>
              CHALCHITRA SERIES
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body
            onClick={(event) => {
              const target = event.target;
              if (target.closest('a, button')) {
                return;
              }
              setMenuOpen(false);
            }}
          >
          <Nav className="me-auto" style={{ zIndex: 10 }}>
            <Nav.Link
              as={Link}
              to="/"
              onClick={() => setMenuOpen(false)}
              style={{
                padding: '0.25rem 0.5rem',
                margin: '0 0.125rem',
                borderRadius: '15px',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.9)',
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                fontSize: '0.75rem'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 15px rgba(0, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Home
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/upcoming-movies"
              onClick={() => setMenuOpen(false)}
              style={{
                padding: '0.25rem 0.5rem',
                margin: '0 0.125rem',
                borderRadius: '15px',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.9)',
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                fontSize: '0.75rem'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 15px rgba(0, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Upcoming
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/past-movies"
              onClick={() => setMenuOpen(false)}
              style={{
                padding: '0.25rem 0.5rem',
                margin: '0 0.125rem',
                borderRadius: '15px',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.9)',
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                fontSize: '0.75rem'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 15px rgba(0, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Past Movies
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/gallery"
              onClick={() => setMenuOpen(false)}
              style={{
                padding: '0.25rem 0.5rem',
                margin: '0 0.125rem',
                borderRadius: '15px',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.9)',
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                fontSize: '0.75rem'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 15px rgba(0, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Gallery
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/team"
              onClick={() => setMenuOpen(false)}
              style={{
                padding: '0.25rem 0.5rem',
                margin: '0 0.125rem',
                borderRadius: '15px',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.9)',
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                fontSize: '0.75rem'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 15px rgba(0, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Team
            </Nav.Link>

          </Nav>
          <Nav className="ms-auto" style={{ zIndex: 10 }}>
            {user ? (
              <>
                <div
                  className="nav-username nav-username-mobile-only"
                  style={{
                    color: '#ffd700',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    textDecoration: 'none',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    marginRight: '0.125rem'
                  }}
                >
                  Hi, {user?.name?.split(' ')[0] || 'User'}
                </div>
                <Nav.Link as={Link} to="/my-bookings" onClick={() => setMenuOpen(false)} style={{
                  padding: '0.25rem 0.5rem',
                  margin: '0 0.125rem',
                  borderRadius: '15px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  textDecoration: 'none',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  fontSize: '0.75rem'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 15px rgba(0, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}>
                  <i className="fas fa-ticket-alt me-1"></i>
                  My Bookings
                </Nav.Link>
                {(user.code_scanner || user.team_scanner) && (
                  <Nav.Link as={Link} to="/scanner" onClick={() => setMenuOpen(false)} style={{
                    padding: '0.25rem 0.5rem',
                    margin: '0 0.125rem',
                    borderRadius: '15px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    textDecoration: 'none',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    fontSize: '0.75rem'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 15px rgba(0, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}>
                    <i className="fas fa-qrcode me-1"></i>
                    Scanner
                  </Nav.Link>
                )}
                {user.is_admin && (
                  <Nav.Link
                    as={Link}
                    to="/admin"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      margin: '0 0.125rem',
                      borderRadius: '15px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      color: 'white',
                      textDecoration: 'none',
                      fontWeight: '500',
                      transition: 'all 0.3s ease',
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                      fontSize: '0.75rem'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 4px 15px rgba(0, 255, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <i className="fas fa-cog me-1"></i>
                    {user.admin_tag || 'Admin'}
                  </Nav.Link>
                )}
                <div
                  className="nav-username nav-username-desktop-only"
                  style={{
                    color: '#ffd700',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    textDecoration: 'none',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    marginRight: '0.125rem'
                  }}
                >
                  Hi, {user?.name?.split(' ')[0] || 'User'}
                </div>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="nav-logout-btn"
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '15px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 15px rgba(0, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <Nav.Link
                as={Link}
                to="/login"
                className="nav-login-link-desktop"
                style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  textDecoration: 'none',
                  fontWeight: '500',
                  fontSize: '0.75rem'
                }}
              >
                <img
                  src="/google-logo-icon-PNG-Transparent-Background.png"
                  alt=""
                  className="nav-login-icon-img"
                />
                Login
              </Nav.Link>
            )}
          </Nav>
          </Offcanvas.Body>
        </Navbar.Offcanvas>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;
