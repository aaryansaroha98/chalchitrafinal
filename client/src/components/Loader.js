import React from 'react';

const Loader = ({ message = 'Loading...', subtitle = 'Please wait while we prepare things for you...' }) => {
  return (
    <div style={{
      backgroundColor: '#0a0a0f',
      backgroundImage: 'linear-gradient(135deg, #0a0a0f 0%, #111118 50%, #1a1a23 100%)',
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

      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '3.5rem',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        zIndex: 2,
        maxWidth: '400px',
        width: '90%'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          border: '4px solid rgba(0, 255, 255, 0.1)',
          borderTop: '4px solid var(--primary-color)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 2rem'
        }}></div>
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
