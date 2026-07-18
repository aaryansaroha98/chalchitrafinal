import React from 'react';

const Loader = () => {
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
      <div className="loader-spinner" role="status" aria-label="Loading">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="loader-spinner-bar" />
        ))}
      </div>
    </div>
  );
};

export default Loader;
