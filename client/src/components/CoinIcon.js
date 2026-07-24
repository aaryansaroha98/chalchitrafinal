import React from 'react';

// Inline SVG coin icon — renders identically across all devices/browsers,
// unlike the 🪙 emoji which shows as a tofu box on many Android/Windows setups.
const CoinIcon = ({ size = 16, style = {}, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'text-bottom', flexShrink: 0, ...style }}
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="12" cy="12" r="10" fill="#F5C542" stroke="#D4A017" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="7" fill="none" stroke="#D4A017" strokeWidth="1" opacity="0.6" />
    <text
      x="12"
      y="16.5"
      textAnchor="middle"
      fontSize="10"
      fontWeight="700"
      fill="#8A6D0B"
      fontFamily="Georgia, 'Times New Roman', serif"
    >
      C
    </text>
  </svg>
);

export default CoinIcon;
