'use client';

import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
  circular?: boolean;
  textColor?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 48,
  circular = true,
  textColor,
}) => {
  const circleFill = 'var(--accent)';
  const textFill = textColor || 'var(--accent-text)';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} select-none`}
    >
      {circular && (
        <circle
          cx="100"
          cy="100"
          r="96"
          fill={circleFill}
        />
      )}
      
      {/* CarRevive Symbol */}
      <text
        x="100"
        y="112"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontSize="50"
        letterSpacing="-1"
        fill={circular ? textFill : (textColor || 'var(--text-primary)')}
      >
        CR
      </text>

      {/* Slogan */}
      <text
        x="100"
        y="142"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontSize="14"
        letterSpacing="1"
        fill={circular ? textFill : (textColor || 'var(--text-secondary)')}
      >
        CARREVIVE
      </text>
    </svg>
  );
};

export default Logo;
