import React, { useEffect, useState } from 'react';
import { Navbar, Nav, Container, Offcanvas, CloseButton } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRef } from 'react';

const NavigationBar = () => {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  const [navHidden, setNavHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
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

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleMouseEnter = (e) => {
    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
    e.target.style.transform = 'translateY(-1px)';
  };

  const handleMouseLeave = (e) => {
    e.target.style.background = 'rgba(255, 255, 255, 0.05)';
    e.target.style.transform = 'translateY(0)';
  };

  if (loading) {
    return (
      <Navbar style={{ backgroundColor: '#1a1a1a', transform: navHidden ? 'translateY(-100%)' : 'translateY(0)', transition: 'transform 0.25s ease' }} variant="dark" sticky="top">
        <Container fluid style={{ display: 'flex', alignItems: 'center' }}>
          <Navbar.Brand as={Link} to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', textDecoration: 'none' }}>
            <img src="/logos/logo-removebg-preview.png" alt="Logo" style={{ height: '32px' }} />
            <span style={{ fontSize: '1.25rem', fontWeight: '600', letterSpacing: '1px' }}>CHALCHITRA</span>
          </Navbar.Brand>
          {!user && <button onClick={handleLoginClick} style={{ background: 'transparent', border: 'none', padding: '0.5rem', cursor: 'pointer', marginLeft: 'auto' }}><img src="/logos/login_b_inverted.png" alt="Login" style={{ width: '24px', height: '24px' }} /></button>}
        </Container>
      </Navbar>
    );
  }

  return (
    <Navbar style={{ backgroundColor: '#1a1a1a', transform: navHidden ? 'translateY(-100%)' : 'translateY(0)', transition: 'transform 0.25s ease', padding: '0', height: isMobile ? '45px' : '45px' }} variant="dark" sticky="top">
      <Container fluid style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        {/* Logo - Left */}
        <Navbar.Brand as={Link} to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', textDecoration: 'none' }}>
          <img src="/logos/logo-removebg-preview.png" alt="Logo" style={{ height: '32px' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: '600', letterSpacing: '1px' }}>CHALCHITRA</span>
        </Navbar.Brand>

        {/* Desktop: Main nav links - Center */}
        <div className="d-none d-lg-flex" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <Nav style={{ display: 'flex', gap: '0.35rem' }}>
            <Nav.Link as={Link} to="/" style={{ padding: '0.1rem 0.5rem', borderRadius: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', textDecoration: 'none', fontWeight: '500', fontSize: '0.85rem', letterSpacing: '-0.5px' }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>Home</Nav.Link>
            <Nav.Link as={Link} to="/upcoming-movies" style={{ padding: '0.1rem 0.5rem', borderRadius: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', textDecoration: 'none', fontWeight: '500', fontSize: '0.85rem', letterSpacing: '-0.5px' }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>Upcoming</Nav.Link>
            <Nav.Link as={Link} to="/past-movies" style={{ padding: '0.1rem 0.5rem', borderRadius: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', textDecoration: 'none', fontWeight: '500', fontSize: '0.85rem', letterSpacing: '-0.5px' }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>Past Movies</Nav.Link>
            <Nav.Link as={Link} to="/gallery" style={{ padding: '0.1rem 0.5rem', borderRadius: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', textDecoration: 'none', fontWeight: '500', fontSize: '0.85rem', letterSpacing: '-0.5px' }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>Gallery</Nav.Link>
            <Nav.Link as={Link} to="/team" style={{ padding: '0.1rem 0.5rem', borderRadius: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', textDecoration: 'none', fontWeight: '500', fontSize: '0.85rem', letterSpacing: '-0.5px' }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>Team</Nav.Link>
          </Nav>
        </div>

        {/* Desktop: User nav links - Right */}
        <div className="d-none d-lg-flex" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: 'auto' }}>
          <Nav style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            {user ? (
              <>
                <Nav.Link as={Link} to="/my-bookings" style={{ padding: '0.1rem 0.5rem', borderRadius: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', textDecoration: 'none', fontWeight: '500', fontSize: '0.85rem', letterSpacing: '-0.5px' }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}><i className="fas fa-ticket-alt me-1"></i>My Bookings</Nav.Link>
                  {(user.code_scanner || user.team_scanner) && <Nav.Link as={Link} to="/scanner" style={{ padding: '0.1rem 0.5rem', borderRadius: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', textDecoration: 'none', fontWeight: '500', fontSize: '0.85rem', letterSpacing: '-0.5px' }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}><i className="fas fa-qrcode me-1"></i>Scanner</Nav.Link>}
                {user.is_admin && <Nav.Link as={Link} to="/admin" style={{ padding: '0.1rem 0.5rem', borderRadius: '15px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', textDecoration: 'none', fontWeight: '500', fontSize: '0.85rem', letterSpacing: '-0.5px' }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}><i className="fas fa-cog me-1"></i>{user.admin_tag || 'Admin'}</Nav.Link>}
                <Nav.Link onClick={() => logout()} style={{ padding: '0.1rem 0.5rem', color: 'white', textDecoration: 'none', fontWeight: '500', fontSize: '0.85rem', letterSpacing: '-0.5px', cursor: 'pointer' }}>Logout</Nav.Link>
              </>
            ) : (
              <Nav.Link as={Link} to="/login" style={{ padding: '0.1rem 0.5rem', borderRadius: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', textDecoration: 'none', fontWeight: '500', fontSize: '0.85rem', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '0.25rem' }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                <img src="/logos/google-logo-icon-PNG-Transparent-Background.png" alt="" style={{ width: '18px', height: '18px' }} />Login
              </Nav.Link>
            )}
          </Nav>
          {user && <span style={{ color: '#ffd700', fontSize: '0.85rem', fontWeight: '500', marginLeft: '0.5rem', letterSpacing: '-0.5px' }}>Hi, {user?.name?.split(' ')[0] || 'User'}</span>}
        </div>

        {/* Mobile: Login + Hamburger - Right */}
        <div className="d-lg-none" style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
          {!user && <button onClick={handleLoginClick} style={{ background: 'transparent', border: 'none', padding: '0.5rem', cursor: 'pointer' }}><img src="/logos/login_b_inverted.png" alt="Login" style={{ width: '24px', height: '24px' }} /></button>}
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'transparent', border: 'none', padding: '0.5rem', cursor: 'pointer', marginLeft: '0.25rem' }}>
            <span style={{ color: 'white', fontSize: '2rem' }}>☰</span>
          </button>
        </div>

        {/* Mobile Offcanvas Menu */}
        <Offcanvas
          show={menuOpen}
          onHide={() => setMenuOpen(false)}
          placement="end"
          style={{ backgroundColor: '#1a1a1a', display: 'flex', flexDirection: 'column', width: '70%' }}
        >
          {/* Keep close button, remove heading, tighten spacing so links sit higher */}
          <Offcanvas.Header
            closeButton
            closeVariant="white"
            style={{ padding: '0.5rem 0.75rem 0.25rem', borderBottom: 'none', minHeight: 'auto' }}
          />
          <Offcanvas.Body style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingTop: '0.25rem' }}>
            {/* Main Navigation Links - Top */}
            <Nav className="flex-column" style={{ gap: '0.5rem' }}>
              <Nav.Link as={Link} to="/" onClick={() => setMenuOpen(false)} style={{ padding: '0.1rem 1rem', borderRadius: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', textDecoration: 'none', fontWeight: '500', fontSize: '1rem' }}>Home</Nav.Link>
              <Nav.Link as={Link} to="/upcoming-movies" onClick={() => setMenuOpen(false)} style={{ padding: '0.1rem 1rem', borderRadius: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', textDecoration: 'none', fontWeight: '500', fontSize: '1rem' }}>Upcoming</Nav.Link>
              <Nav.Link as={Link} to="/past-movies" onClick={() => setMenuOpen(false)} style={{ padding: '0.1rem 1rem', borderRadius: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', textDecoration: 'none', fontWeight: '500', fontSize: '1rem' }}>Past Movies</Nav.Link>
              <Nav.Link as={Link} to="/gallery" onClick={() => setMenuOpen(false)} style={{ padding: '0.1rem 1rem', borderRadius: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', textDecoration: 'none', fontWeight: '500', fontSize: '1rem' }}>Gallery</Nav.Link>
              <Nav.Link as={Link} to="/team" onClick={() => setMenuOpen(false)} style={{ padding: '0.1rem 1rem', borderRadius: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', textDecoration: 'none', fontWeight: '500', fontSize: '1rem' }}>Team</Nav.Link>
            </Nav>

            {/* Spacer to push user section down */}
            <div style={{ flex: 1 }}></div>

            {/* User Section - Bottom */}
            {user ? (
              <Nav className="flex-column" style={{ gap: '0.5rem', marginTop: 'auto' }}>
                <div style={{ color: '#ffd700', fontSize: '1.1rem', fontWeight: '600', padding: '0.35rem 0.75rem 0.25rem', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '1rem' }}>
                  Hi, {user?.name?.split(' ')[0] || 'User'}
                </div>

                {user.is_admin && (
                  <Nav.Link
                    as={Link}
                    to="/admin"
                    onClick={() => setMenuOpen(false)}
                    style={{ padding: '0.1rem 1rem', borderRadius: '15px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', textDecoration: 'none', fontWeight: '500', fontSize: '1rem', marginTop: '0.1rem' }}
                  >
                    <i className="fas fa-cog me-1"></i>{user.admin_tag || 'Admin'}
                  </Nav.Link>
                )}

                <Nav.Link
                  as={Link}
                  to="/my-bookings"
                  onClick={() => setMenuOpen(false)}
                  style={{ padding: '0.1rem 1rem', borderRadius: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', textDecoration: 'none', fontWeight: '500', fontSize: '1rem' }}
                >
                  <i className="fas fa-ticket-alt me-1"></i>My Bookings
                </Nav.Link>

                {(user.code_scanner || user.team_scanner) && (
                  <Nav.Link
                    as={Link}
                    to="/scanner"
                    onClick={() => setMenuOpen(false)}
                    style={{ padding: '0.1rem 1rem', borderRadius: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', textDecoration: 'none', fontWeight: '500', fontSize: '1rem' }}
                  >
                    <i className="fas fa-qrcode me-1"></i>Scanner
                  </Nav.Link>
                )}

                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  style={{ padding: '0.1rem 1rem', borderRadius: '15px', background: 'transparent', border: 'none', color: '#ff6b6b', textDecoration: 'none', fontWeight: '500', fontSize: '1rem', cursor: 'pointer', textAlign: 'left', width: '100%' }}
                >
                  Logout
                </button>
              </Nav>
            ) : (
              <Nav className="flex-column" style={{ gap: '0.5rem', marginTop: 'auto' }}>
                <Nav.Link as={Link} to="/login" onClick={() => setMenuOpen(false)} style={{ padding: '0.1rem 1rem', borderRadius: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', textDecoration: 'none', fontWeight: '500', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <img src="/logos/google-logo-icon-PNG-Transparent-Background.png" alt="" style={{ width: '16px', height: '16px' }} />Login
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
