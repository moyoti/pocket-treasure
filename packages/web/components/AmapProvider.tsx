'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AmapContextType {
  amapLoaded: boolean;
  amapReady: boolean;
}

const AmapContext = createContext<AmapContextType | undefined>(undefined);

export function AmapProvider({ children }: { children: ReactNode }) {
  const [amapLoaded, setAmapLoaded] = useState(false);
  const [amapReady, setAmapReady] = useState(false);

  useEffect(() => {
    // Check if script already exists
    const existingScript = document.querySelector('script[src*="webapi.amap.com"]');
    
    if (existingScript) {
      // Script already loaded, just mark as loaded
      setAmapLoaded(true);
      if (window.AMap) {
        setAmapReady(true);
      }
      return;
    }

    // Create and load the Amap script
    const script = document.createElement('script');
    script.src = 'https://webapi.amap.com/maps?v=2.0&key=68eb7700f1011a06dedbb0daabddd770';
    script.async = true;
    
    script.onload = () => {
      setAmapLoaded(true);
      // Wait for AMap to be fully initialized
      const checkAmapReady = () => {
        if (window.AMap) {
          setAmapReady(true);
        } else {
          setTimeout(checkAmapReady, 100);
        }
      };
      checkAmapReady();
    };
    
    script.onerror = () => {
      console.error('Failed to load Amap script');
      setAmapLoaded(false);
    };
    
    document.head.appendChild(script);

    return () => {
      // Cleanup not needed since script is shared
    };
  }, []);

  return (
    <AmapContext.Provider value={{ amapLoaded, amapReady }}>
      {children}
    </AmapContext.Provider>
  );
}

export function useAmap() {
  const context = useContext(AmapContext);
  if (context === undefined) {
    // Return default values if not wrapped by provider
    return { amapLoaded: true, amapReady: typeof window !== 'undefined' && !!window.AMap };
  }
  return context;
}