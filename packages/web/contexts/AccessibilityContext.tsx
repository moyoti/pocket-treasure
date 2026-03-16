'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'normal' | 'large' | 'extra-large';
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
  setHighContrast: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  setFontSize: (size: AccessibilitySettings['fontSize']) => void;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  fontSize: 'normal',
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [mounted, setMounted] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('userSettings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSettings(prev => ({
            ...prev,
            highContrast: parsed.highContrast ?? false,
            reducedMotion: parsed.reducedMotion ?? false,
            fontSize: parsed.fontSize ?? 'normal',
          }));
        } catch (e) {
          console.error('Failed to parse accessibility settings:', e);
        }
      }
    }
  }, []);

  // Listen for settings changes
  useEffect(() => {
    const handleSettingsChange = () => {
      const saved = localStorage.getItem('userSettings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSettings(prev => ({
            ...prev,
            highContrast: parsed.highContrast ?? false,
            reducedMotion: parsed.reducedMotion ?? false,
            fontSize: parsed.fontSize ?? 'normal',
          }));
        } catch (e) {
          console.error('Failed to parse accessibility settings:', e);
        }
      }
    };

    window.addEventListener('storage', handleSettingsChange);
    window.addEventListener('settingsChange', handleSettingsChange);

    return () => {
      window.removeEventListener('storage', handleSettingsChange);
      window.removeEventListener('settingsChange', handleSettingsChange);
    };
  }, []);

  // Apply CSS classes to document
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    const root = document.documentElement;

    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Font size
    root.classList.remove('font-size-normal', 'font-size-large', 'font-size-extra-large');
    root.classList.add(`font-size-${settings.fontSize}`);
  }, [settings, mounted]);

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      // Save to localStorage
      const saved = localStorage.getItem('userSettings');
      const settings = saved ? JSON.parse(saved) : {};
      localStorage.setItem('userSettings', JSON.stringify({ ...settings, ...updated }));
      // Dispatch event
      window.dispatchEvent(new CustomEvent('settingsChange', { detail: updated }));
      return updated;
    });
  };

  const setHighContrast = (enabled: boolean) => updateSettings({ highContrast: enabled });
  const setReducedMotion = (enabled: boolean) => updateSettings({ reducedMotion: enabled });
  const setFontSize = (size: AccessibilitySettings['fontSize']) => updateSettings({ fontSize: size });

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSettings,
        setHighContrast,
        setReducedMotion,
        setFontSize,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    return {
      settings: defaultSettings,
      updateSettings: () => {},
      setHighContrast: () => {},
      setReducedMotion: () => {},
      setFontSize: () => {},
    };
  }
  return context;
}