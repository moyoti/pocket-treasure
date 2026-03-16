'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load theme from localStorage settings
    if (typeof window !== 'undefined') {
      // First check explicit theme setting
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme) {
        setThemeState(savedTheme);
      } else {
        // Then check userSettings for darkMode
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings);
            if (parsed.darkMode) {
              setThemeState('dark');
            }
          } catch (e) {
            console.error('Failed to parse theme settings:', e);
          }
        } else {
          // Check system preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setThemeState(prefersDark ? 'dark' : 'light');
        }
      }
    }
  }, []);

  // Listen for settings changes
  useEffect(() => {
    const handleSettingsChange = () => {
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          // Only change if darkMode is explicitly set
          if (typeof parsed.darkMode === 'boolean') {
            setThemeState(parsed.darkMode ? 'dark' : 'light');
          }
        } catch (e) {
          console.error('Failed to parse theme settings:', e);
        }
      }
    };

    window.addEventListener('settingsChange', handleSettingsChange);
    window.addEventListener('storage', handleSettingsChange);

    return () => {
      window.removeEventListener('settingsChange', handleSettingsChange);
      window.removeEventListener('storage', handleSettingsChange);
    };
  }, []);

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      // Save theme setting
      localStorage.setItem('theme', theme);

      // Apply theme to document
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
      }
    }
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    // Also update userSettings
    const saved = localStorage.getItem('userSettings');
    const settings = saved ? JSON.parse(saved) : {};
    settings.darkMode = newTheme === 'dark';
    localStorage.setItem('userSettings', JSON.stringify(settings));
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Prevent flash during SSR
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    return {
      theme: 'light' as Theme,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
}