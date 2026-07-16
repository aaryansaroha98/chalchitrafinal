import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="qt-footer">
      <Container style={{ maxWidth: '1120px', padding: '0 20px' }}>
        <Row className="gy-4">
          {/* Brand */}
          <Col lg={4} md={6}>
            <h3 className="qt-footer-brand">Chalchitra Series</h3>
            <div className="qt-footer-rule" />
            <p className="qt-footer-desc">
              Elevating cinematic experiences for the IIT Jammu community with premium
              screenings and exclusive events.
            </p>
            <div className="qt-footer-social">
              <a href="https://www.instagram.com/chalchitra.iitjammu/" aria-label="Instagram" target="_blank" rel="noreferrer">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="mailto:chalchitra@iitjammu.ac.in" aria-label="Email">
                <i className="fas fa-envelope"></i>
              </a>
              <a href="tel:+919569579671" aria-label="Phone">
                <i className="fas fa-phone"></i>
              </a>
              <a href="https://www.google.com/maps/search/?api=1&query=IIT+Jammu,+Jagti" aria-label="Location" target="_blank" rel="noreferrer">
                <i className="fas fa-map-marker-alt"></i>
              </a>
            </div>
          </Col>

          {/* Legal */}
          <Col lg={3} md={6} className="ms-lg-auto">
            <h5 className="qt-footer-head">Legal</h5>
            <div className="qt-footer-links">
              <Link to="/privacy-policy">Privacy Policy</Link>
              <Link to="/terms-of-service">Terms of Service</Link>
            </div>
          </Col>

          {/* Contact */}
          <Col lg={3} md={6}>
            <h5 className="qt-footer-head">Contact</h5>
            <div className="qt-footer-contact">
              <p><strong>Chalchitra Series, IIT Jammu</strong></p>
              <p>Jagti, PO Nagrota, NH-44</p>
              <p>Jammu — 181221, J&amp;K, India</p>
              <p><a href="mailto:chalchitra@iitjammu.ac.in">chalchitra@iitjammu.ac.in</a></p>
            </div>
          </Col>
        </Row>

        <div className="qt-footer-bottom">
          <span>© 2026 Chalchitra Series. All rights reserved.</span>
          <span>Cinematic excellence for IIT Jammu</span>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
