'use client';

import React, { useEffect, useState } from 'react';

export const Preloader: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    const hasPreloaded = sessionStorage.getItem('carrevive_preloaded');
    if (hasPreloaded) {
      return;
    }

    setIsVisible(true);

    let current = 0;
    const duration = 1500;
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
          }, 400);
        }, 300);
      }
      setProgress(Math.min(Math.floor(current), 100));
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-bg-page transition-opacity duration-300 ${
        isAnimatingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-6 max-w-md px-6 text-center">
        {/* Simple Brand mark */}
        <div className="w-20 h-20 rounded-lg bg-accent text-accent-text flex items-center justify-center font-bold text-2xl">
          CR
        </div>

        {/* Loading progress */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            CarRevive Dealership
          </span>
          <div className="text-24 font-bold text-text-primary">
            {progress}%
          </div>
          {/* Progress bar */}
          <div className="w-48 h-1 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preloader;
