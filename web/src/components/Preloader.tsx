'use client';

import React, { useEffect, useState } from 'react';

export const Preloader: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    // Check session storage to see if we've already shown the preloader in this session
    const hasPreloaded = sessionStorage.getItem('carrevive_preloaded');
    if (hasPreloaded) {
      return;
    }

    setIsVisible(true);

    // Progress counter animation
    let current = 0;
    const duration = 2000; // ms
    const intervalTime = 30;
    const steps = duration / intervalTime;
    const increment = 100 / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= 100) {
        current = 100;
        clearInterval(timer);
        setTimeout(() => {
          setIsAnimatingOut(true);
          setTimeout(() => {
            setIsVisible(false);
            sessionStorage.setItem('carrevive_preloaded', 'true');
          }, 700); // Match exit transition duration
        }, 500); // Stay at 100% for 500ms
      }
      setProgress(Math.min(Math.floor(current), 100));
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-all duration-700 ease-in-out ${
        isAnimatingOut ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'
      }`}
    >
      <div className="relative flex flex-col items-center gap-8 max-w-md px-6 text-center">
        {/* Animated Circular Logo Outline */}
        <div className="relative w-36 h-36 md:w-44 md:h-44 flex items-center justify-center">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {/* Background circle outline drawing */}
            <circle
              cx="100"
              cy="100"
              r="95"
              stroke="#FFFFFF"
              strokeWidth="2"
              fill="none"
              strokeDasharray="600"
              strokeDashoffset="600"
              style={{
                animation: 'drawStroke 1.6s cubic-bezier(0.25, 1, 0.5, 1) forwards',
              }}
            />
            {/* White solid backing circle that fades in */}
            <circle
              cx="100"
              cy="100"
              r="94"
              fill="#FFFFFF"
              className="opacity-0"
              style={{
                animation: 'fillLogo 0.5s cubic-bezier(0.25, 1, 0.5, 1) 1.0s forwards',
              }}
            />
            
            {/* CarRevive Text */}
            <text
              x="100"
              y="112"
              textAnchor="middle"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              fontWeight="800"
              fontSize="52"
              letterSpacing="-1"
              fill="#1a1a1a"
              className="opacity-0"
              style={{
                animation: 'fillLogo 0.4s cubic-bezier(0.25, 1, 0.5, 1) 1.2s forwards',
              }}
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
              fill="#1a1a1a"
              className="opacity-0"
              style={{
                animation: 'fillLogo 0.4s cubic-bezier(0.25, 1, 0.5, 1) 1.4s forwards',
              }}
            >
              Drive Better
            </text>
          </svg>
          
          {/* Subtle Ambient Pulse behind the logo */}
          <div className="absolute inset-0 bg-card/5 rounded-full blur-2xl -z-10 animate-[pulseGlow_3s_infinite]" />
        </div>

        {/* Loading progress elements */}
        <div className="flex flex-col items-center gap-2 mt-4">
          <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
            CarRevive Company
          </span>
          <div className="text-3xl font-extrabold tracking-tight text-foreground font-mono">
            {progress}%
          </div>
          {/* Small modern thin loading bar */}
          <div className="w-48 h-[1px] bg-secondary relative overflow-hidden rounded-full mt-2">
            <div
              className="h-full bg-card transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preloader;
