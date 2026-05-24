'use client';

import React, { useState, useRef, MouseEvent } from 'react';

interface ThreeDCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  perspective?: number;
}

export const ThreeDCard: React.FC<ThreeDCardProps> = ({
  children,
  className = '',
  maxTilt = 8,
  perspective = 1000,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transformStyle, setTransformStyle] = useState('rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Mouse coordinates relative to card
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert to percentage (-0.5 to 0.5)
    const xPercent = (mouseX / width) - 0.5;
    const yPercent = (mouseY / height) - 0.5;

    // Calculate rotation angles (rotateX depends on Y mouse percent, rotateY on X mouse percent)
    const rotateX = -yPercent * maxTilt;
    const rotateY = xPercent * maxTilt;

    setTransformStyle(`perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
    
    // Calculate glare position
    const glareX = (mouseX / width) * 100;
    const glareY = (mouseY / height) * 100;
    setGlarePosition({
      x: glareX,
      y: glareY,
      opacity: 0.15,
    });
  };

  const handleMouseLeave = () => {
    setTransformStyle(`perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`);
    setGlarePosition(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative preserve-3d transition-transform duration-200 ease-out ${className}`}
      style={{
        transform: transformStyle,
      }}
    >
      {/* Glare/Sheen layer */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl z-10 transition-opacity duration-200"
        style={{
          background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 50%)`,
          opacity: glarePosition.opacity,
          mixBlendMode: 'overlay',
        }}
      />
      
      {/* Inner wrapper to apply transform-style: preserve-3d */}
      <div className="h-full w-full preserve-3d">
        {children}
      </div>
    </div>
  );
};

export default ThreeDCard;
