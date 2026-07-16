import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NavigationBar = () => {
  const navigate = useNavigate();
  const { user, logout, loading, coinBalance, coinBalanceLoading } = useAuth();
  const [navHidden, setNavHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const mountTimeRef = useRef(Date.now());

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    document.body.classList.remove('menu-open');
  }, []);

  const toggleMenu = useCallback(() => {
    setMenuOpen((prev) => {
      const next = !prev;
      document.body.classList.toggle('menu-open', next);
      return next;
    });
  }, []);

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
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.body.classList.remove('menu-open');
    };
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
            <img src="/logos/newlogo.png" alt="Chalchitra" className="qt-brand-logo" />
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
          <img src="/logos/newlogo.png" alt="Chalchitra" className="qt-brand-logo" />
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

        {/* Mobile: hamburger */}
        <div className="d-lg-none qt-nav-mobile">
          <button
            onClick={toggleMenu}
            className={`nav-burger${menuOpen ? ' is-open' : ''}`}
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={String(menuOpen)}
            aria-controls="mobile-menu"
          ><span></span></button>
        </div>

        {/* Mobile menu (full-screen overlay like Quantify) */}
        <div className={`mobile-menu${menuOpen ? ' is-open' : ''}`} id="mobile-menu" aria-label="Mobile navigation">
          {mainLinks.map((l) => (
            <Link key={l.to} to={l.to} onClick={closeMenu} className="mobile-menu-link">{l.label}</Link>
          ))}

          <span className="mobile-menu-sep" />

          {user ? (
            <>
              <span className="mobile-menu-greeting">Hi, {user?.name?.split(' ')[0] || 'User'}</span>
              <Link to="/my-bookings" onClick={closeMenu} className="mobile-menu-link">My Bookings</Link>
              {!!(user.code_scanner || user.team_scanner) && (
                <Link to="/scanner" onClick={closeMenu} className="mobile-menu-link">Scanner</Link>
              )}
              {!!user.is_admin && (
                <Link to="/admin" onClick={closeMenu} className="mobile-menu-link">Admin</Link>
              )}
              <button onClick={() => { logout(); closeMenu(); }} className="mobile-menu-logout">Logout</button>
            </>
          ) : (
            <Link to="/login" onClick={closeMenu} className="mobile-menu-link mobile-menu-login-link">
              <img src="/logos/google-logo-icon-PNG-Transparent-Background.png" alt="" className="qt-google-icon" />
              Login
            </Link>
          )}

          <div className="mobile-menu-legal">
            <Link to="/privacy-policy" onClick={closeMenu}>Privacy Policy</Link>
            <Link to="/terms-of-service" onClick={closeMenu}>Terms of Service</Link>
          </div>
        </div>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;
