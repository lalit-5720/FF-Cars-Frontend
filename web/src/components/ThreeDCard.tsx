'use client';

import React from 'react';

interface ThreeDCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  perspective?: number;
}

export const ThreeDCard: React.FC<ThreeDCardProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className="h-full w-full">
        {children}
      </div>
    </div>
  );
};

export default ThreeDCard;
