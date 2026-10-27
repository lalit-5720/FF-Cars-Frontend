'use client';

import React from 'react';

interface CarReviveIconProps {
  size?: number | string;
  className?: string;
  variant?: 'shield' | 'circle' | 'flat';
}

/**
 * CarRevive Brand Vector Icon
 * High-resolution, scalable automotive emblem for CarRevive Dealership.
 */
export const CarReviveIcon: React.FC<CarReviveIconProps> = ({
  size = 32,
  className = '',
  variant = 'shield',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="CarRevive Logo"
    >
      <defs>
        <linearGradient id="crShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E40AF" />
          <stop offset="50%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="crAccentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
        <linearGradient id="crGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>

      {/* Background container */}
      {variant === 'shield' && (
        <rect
          x="24"
          y="24"
          width="464"
          height="464"
          rx="112"
          fill="url(#crShieldGrad)"
          stroke="#38BDF8"
          strokeWidth="6"
          strokeOpacity="0.4"
        />
      )}
      {variant === 'circle' && (
        <circle
          cx="256"
          cy="256"
          r="232"
          fill="url(#crShieldGrad)"
          stroke="#38BDF8"
          strokeWidth="6"
          strokeOpacity="0.4"
        />
      )}

      {/* Inner Geometric Bevel Ring */}
      {variant !== 'flat' && (
        <rect
          x="48"
          y="48"
          width="416"
          height="416"
          rx="94"
          fill="none"
          stroke="#60A5FA"
          strokeWidth="2"
          strokeOpacity="0.25"
        />
      )}

      {/* Dynamic Aerodynamic Speed Arc */}
      <path
        d="M 96 280 C 140 180, 260 140, 416 170"
        fill="none"
        stroke="url(#crAccentGrad)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray="8 6"
        opacity="0.65"
      />

      {/* Sleek Sports Car Silhouette */}
      <path
        d="M 148 270 Q 190 200 256 195 Q 330 195 380 250 L 418 266 Q 436 274 436 294 L 436 312 Q 436 322 426 322 L 86 322 Q 76 322 76 312 L 76 294 Q 76 278 98 272 Z"
        fill="#FFFFFF"
        opacity="0.96"
      />

      {/* Windshield & Window Glass */}
      <path
        d="M 186 262 Q 215 212 256 210 Q 312 210 348 252 L 370 262 Z"
        fill="#0F172A"
        opacity="0.88"
      />
      <path d="M 276 210 L 274 262" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />

      {/* Headlight and Taillight */}
      <ellipse cx="408" cy="276" rx="14" ry="5" fill="url(#crGoldGrad)" />
      <path d="M 88 280 L 112 280" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" />

      {/* Wheels */}
      <circle cx="152" cy="322" r="38" fill="#0F172A" stroke="#334155" strokeWidth="4" />
      <circle cx="152" cy="322" r="24" fill="#1E293B" stroke="#60A5FA" strokeWidth="3" />
      <circle cx="152" cy="322" r="8" fill="#F8FAFC" />

      <circle cx="360" cy="322" r="38" fill="#0F172A" stroke="#334155" strokeWidth="4" />
      <circle cx="360" cy="322" r="24" fill="#1E293B" stroke="#60A5FA" strokeWidth="3" />
      <circle cx="360" cy="322" r="8" fill="#F8FAFC" />

      {/* CarRevive 'CR' Plaque */}
      <g transform="translate(256, 396)">
        <rect
          x="-84"
          y="-22"
          width="168"
          height="44"
          rx="22"
          fill="#0F172A"
          stroke="#38BDF8"
          strokeWidth="2"
          strokeOpacity="0.45"
        />
        <text
          x="0"
          y="8"
          fontFamily="Arial, Helvetica, sans-serif"
          fontWeight="700"
          fontSize="20"
          fill="#FFFFFF"
          letterSpacing="4"
          textAnchor="middle"
        >
          CARREVIVE
        </text>
      </g>
    </svg>
  );
};

export default CarReviveIcon;
