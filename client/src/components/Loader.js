import React from 'react';

const Loader = ({ message = 'Loading...', subtitle = 'Please wait while we prepare things for you...' }) => {
  return (
    <div style={{
      background: '#ffffff',
      minHeight: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div className="loader-glass-card" style={{
        textAlign: 'center',
        padding: '2.5rem 3rem',
        maxWidth: '420px'
      }}>
        <div className="loader-spinner"></div>
        <h3 style={{
          color: 'var(--qt-text)',
          margin: '1.25rem 0 0.5rem',
          fontWeight: 700,
          fontSize: '1.35rem',
          letterSpacing: '-0.02em'
        }}>{message}</h3>
        <p style={{
          color: 'var(--qt-muted)',
          margin: 0,
          fontSize: '0.95rem',
          lineHeight: '1.5'
        }}>{subtitle}</p>
      </div>
    </div>
  );
};

export default Loader;
