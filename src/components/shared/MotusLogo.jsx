import React from 'react';

export function MotusLogo({ size = 40, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="motusGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4A853"/>
          <stop offset="100%" stopColor="#C49B4A"/>
        </linearGradient>
      </defs>

      {/* Rounded square background */}
      <rect x="4" y="4" width="56" height="56" rx="14" fill="#1A1A1A"/>

      {/* Stylized M with motion */}
      <path
        d="M14 44 L24 24 L32 34 L40 24 L50 44"
        stroke="url(#motusGold)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Forward arrow accent */}
      <path
        d="M48 28 L54 34 L48 40"
        stroke="#D4A853"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.8"
      />
    </svg>
  );
}

export function MotusLogoMark({ size = 32, className = '' }) {
  // Simplified version without background - just the M mark
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="motusGoldMark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4A853"/>
          <stop offset="100%" stopColor="#C49B4A"/>
        </linearGradient>
      </defs>

      {/* Stylized M */}
      <path
        d="M6 38 L16 14 L24 26 L32 14 L42 38"
        stroke="url(#motusGoldMark)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Forward arrow accent */}
      <path
        d="M40 20 L46 26 L40 32"
        stroke="#D4A853"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.8"
      />
    </svg>
  );
}

export default MotusLogo;
