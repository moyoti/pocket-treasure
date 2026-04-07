'use client';

import { useEffect, useState } from 'react';

interface ScreenShakeProps {
  isActive: boolean;
  intensity?: 'light' | 'medium' | 'heavy';
  duration?: number; // ms
  children: React.ReactNode;
}

export function ScreenShake({ 
  isActive, 
  intensity = 'medium', 
  duration = 500,
  children 
}: ScreenShakeProps) {
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    setIsShaking(true);
    const timer = setTimeout(() => {
      setIsShaking(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [isActive, duration]);

  const intensityClass = {
    light: 'animate-shake-light',
    medium: 'animate-shake-medium',
    heavy: 'animate-shake-heavy',
  };

  return (
    <div className={isShaking ? intensityClass[intensity] : ''}>
      {children}
    </div>
  );
}
