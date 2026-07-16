import React, { useEffect, useState, useRef } from 'react';
import { Navbar, Nav, Container, Offcanvas } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NavigationBar = () => {
  const navigate = useNavigate();
  const { user, logout, loading, coinBalance, coinBalanceLoading } = useAuth();
  const [navHidden, setNavHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const mountTimeRef = useRef(Date.now());

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateNav = () => {
      const currentY = window.scrollY;
      // Keep navbar visible during initial landing/auto-scroll (first 3s)
      if (Date.now() - mountTimeRef.current < 3000) {
        setNavHidden(false);
        lastScrollY = currentY;
        ticking = false;
        return;
      }
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

  const shellStyle = {
    transform: navHidden ? 'translateY(-100%)' : 'translateY(0)',
    transition: 'transform 0.25s ease',
  };

  if (loading) {
    return (
      <Navbar className="qt-nav" style={shellStyle} sticky="top">
        <Container fluid className="qt-nav-inner">
          <Navbar.Brand as={Link} to="/" className="qt-brand">
            <img src="/logos/logo-removebg-preview.png" alt="Chalchitra" className="qt-brand-logo" />
            <span className="qt-brand-name">CHALCHITRA</span>
          </Navbar.Brand>
        </Container>
      </Navbar>
    );
  }

  const mainLinks = [
    { to: '/', label: 'Home' },
    { to: '/upcoming-movies', label: 'Upcoming' },
    { to: '/past-movies', label: 'Past Movies' },
    { to: '/gallery', label: 'Gallery' },
    { to: '/team', label: 'Team' },
  ];

  return (
    <Navbar className="qt-nav" style={shellStyle} sticky="top" expand={false}>
      <Container fluid className="qt-nav-inner">
        {/* Logo — left */}
        <Navbar.Brand as={Link} to="/" className="qt-brand">
          <img src="/logos/logo-removebg-preview.png" alt="Chalchitra" className="qt-brand-logo" />
          <span className="qt-brand-name">CHALCHITRA</span>
        </Navbar.Brand>

        {/* Desktop: center nav */}
        <div className="d-none d-lg-flex qt-nav-center">
          <Nav className="qt-nav-links">
            {mainLinks.map((l) => (
              <Nav.Link key={l.to} as={Link} to={l.to} className="qt-nav-link">{l.label}</Nav.Link>
            ))}
          </Nav>
        </div>

        {/* Desktop: right cluster */}
        <div className="d-none d-lg-flex qt-nav-right">
          <Nav className="qt-nav-links">
            {user ? (
              <>
                <Nav.Link as={Link} to="/my-bookings" className="qt-nav-link"><i className="fas fa-ticket-alt me-1" />My Bookings</Nav.Link>
                {!!(user.code_scanner || user.team_scanner) && (
                  <Nav.Link as={Link} to="/scanner" className="qt-nav-link"><i className="fas fa-qrcode me-1" />Scanner</Nav.Link>
                )}
                {!!user.is_admin && (
                  <Nav.Link as={Link} to="/admin" className="qt-nav-link qt-nav-link-strong"><i className="fas fa-cog me-1" />{user.admin_tag || 'Admin'}</Nav.Link>
                )}
                <Nav.Link onClick={() => logout()} className="qt-nav-link" style={{ cursor: 'pointer' }}>Logout</Nav.Link>
              </>
            ) : (
              <Nav.Link as={Link} to="/login" className="qt-nav-link qt-nav-link-login">
                <img src="/logos/google-logo-icon-PNG-Transparent-Background.png" alt="" className="qt-google-icon" />Login
              </Nav.Link>
            )}
          </Nav>
          {user && (
            <div className="qt-user-cluster">
              <span className="qt-user-name">Hi, {user?.name?.split(' ')[0] || 'User'}</span>
              <span className="qt-coin-badge">🪙 {coinBalanceLoading ? '...' : coinBalance}</span>
            </div>
          )}
        </div>

        {/* Mobile: login + hamburger */}
        <div className="d-lg-none qt-nav-mobile">
          {!user && (
            <button onClick={() => navigate('/login')} className="qt-icon-btn" aria-label="Login">
              <img src="/logos/login_b_inverted.png" alt="Login" className="qt-mobile-login-icon" />
            </button>
          )}
          <button onClick={() => setMenuOpen(!menuOpen)} className="qt-icon-btn qt-burger" aria-label="Open menu">
            <span>☰</span>
          </button>
        </div>

        {/* Mobile offcanvas */}
        <Offcanvas show={menuOpen} onHide={() => setMenuOpen(false)} placement="end" className="qt-offcanvas">
          <Offcanvas.Header closeButton className="qt-offcanvas-head" />
          <Offcanvas.Body className="qt-offcanvas-body">
            <Nav className="flex-column qt-mobile-links">
              {mainLinks.map((l) => (
                <Nav.Link key={l.to} as={Link} to={l.to} onClick={() => setMenuOpen(false)} className="qt-mobile-link">{l.label}</Nav.Link>
              ))}
            </Nav>

            <div style={{ flex: 1 }} />

            {user ? (
              <Nav className="flex-column qt-mobile-links qt-mobile-user">
                <div className="qt-mobile-greeting">Hi, {user?.name?.split(' ')[0] || 'User'}</div>
                {!!user.is_admin && (
                  <Nav.Link as={Link} to="/admin" onClick={() => setMenuOpen(false)} className="qt-mobile-link qt-mobile-link-strong">
                    <i className="fas fa-cog me-1" />{user.admin_tag || 'Admin'}
                  </Nav.Link>
                )}
                <Nav.Link as={Link} to="/my-bookings" onClick={() => setMenuOpen(false)} className="qt-mobile-link">
                  <i className="fas fa-ticket-alt me-1" />My Bookings
                </Nav.Link>
                {!!(user.code_scanner || user.team_scanner) && (
                  <Nav.Link as={Link} to="/scanner" onClick={() => setMenuOpen(false)} className="qt-mobile-link">
                    <i className="fas fa-qrcode me-1" />Scanner
                  </Nav.Link>
                )}
                <button onClick={() => { logout(); setMenuOpen(false); }} className="qt-mobile-logout">Logout</button>
              </Nav>
            ) : (
              <Nav className="flex-column qt-mobile-links qt-mobile-user">
                <Nav.Link as={Link} to="/login" onClick={() => setMenuOpen(false)} className="qt-mobile-link qt-mobile-link-login">
                  <img src="/logos/google-logo-icon-PNG-Transparent-Background.png" alt="" className="qt-google-icon" />Login
                </Nav.Link>
              </Nav>
            )}
          </Offcanvas.Body>
        </Offcanvas>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;
