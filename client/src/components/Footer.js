import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="qt-footer">
      <div className="qt-footer-shell">
        <div className="qt-footer-brand">Chalchitra Series</div>
        <div className="qt-footer-copy">© 2026 Chalchitra Series. All rights reserved.</div>
        <div className="qt-footer-legal">
          <Link to="/privacy-policy">Privacy Policy</Link>
        </div>
        <div className="qt-footer-social" aria-label="Social links">
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
      </div>
    </footer>
  );
};

export default Footer;
