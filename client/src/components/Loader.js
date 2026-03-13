import React from 'react';

const Loader = ({ message = 'Loading...', subtitle = 'Please wait while we prepare things for you...' }) => {
  return (
    <div style={{
      backgroundColor: '#000000',
      backgroundImage: 'none',
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
      {/* Animated Background Grid */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          radial-gradient(circle at 25% 25%, var(--primary-color) 1px, transparent 1px),
          radial-gradient(circle at 75% 75%, var(--secondary-color) 1px, transparent 1px),
          radial-gradient(circle at 50% 50%, var(--accent-color) 1px, transparent 1px)
        `,
        backgroundSize: '100px 100px, 150px 150px, 200px 200px',
        backgroundPosition: '0 0, 50px 50px, 25px 25px',
        opacity: 0.03,
        animation: 'gridMove 20s linear infinite'
      }}></div>

      <div className="loader-glass-card">
        <div className="loader-spinner"></div>
        <h3 style={{
          color: 'rgba(255, 255, 255, 0.95)',
          marginBottom: '1rem',
          fontWeight: '600',
          fontSize: '1.5rem',
          letterSpacing: '0.02em'
        }}>{message}</h3>
        <p style={{
          color: 'rgba(255, 255, 255, 0.6)',
          margin: 0,
          fontSize: '1rem',
          lineHeight: '1.5'
        }}>{subtitle}</p>
      </div>
    </div>
  );
};

export default Loader;
