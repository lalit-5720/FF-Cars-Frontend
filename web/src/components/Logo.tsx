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
  // If circular is true, the background is white and the text is dark grey/black (#1a1a1a).
  // Otherwise, the logo is transparent and text color inherits currentColor or a custom prop.
  const textFill = circular ? '#1a1a1a' : (textColor || 'currentColor');

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
          fill="#FFFFFF"
          className="logo-circle"
          style={{ transition: 'fill 0.3s ease' }}
        />
      )}
      
      {/* CarRevive Symbol */}
      <text
        x="100"
        y="112"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontWeight="800"
        fontSize="52"
        letterSpacing="-1"
        fill={textFill}
        style={{ transition: 'fill 0.3s ease' }}
      >
        CarRevive
      </text>

      {/* Slogan */}
      <text
        x="100"
        y="142"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontWeight="800"
        fontSize="15.5"
        letterSpacing="-0.3"
        fill={textFill}
        style={{ transition: 'fill 0.3s ease' }}
      >
        Drive Better
      </text>
    </svg>
  );
};

export default Logo;
