'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import zhCN from '@/locales/zh-CN.json';
import en from '@/locales/en.json';
import ja from '@/locales/ja.json';

type Locale = 'zh-CN' | 'en' | 'ja';
type Messages = typeof zhCN;

const messages: Record<Locale, Messages> = {
  'zh-CN': zhCN,
  'en': en,
  'ja': ja,
};

const defaultLocale: Locale = 'zh-CN';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  localeNames: Record<Locale, { name: string; flag: string }>;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  // Load locale from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('userSettings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.language && messages[parsed.language as Locale]) {
            setLocaleState(parsed.language as Locale);
          }
        } catch (e) {
          console.error('Failed to parse saved locale:', e);
        }
      }
    }
  }, []);

  // Listen for storage changes (from settings page)
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('userSettings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.language && messages[parsed.language as Locale]) {
            setLocaleState(parsed.language as Locale);
          }
        } catch (e) {
          console.error('Failed to parse saved locale:', e);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom event from settings page
    window.addEventListener('localeChange', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localeChange', handleStorageChange);
    };
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    // Update localStorage
    const saved = localStorage.getItem('userSettings');
    const settings = saved ? JSON.parse(saved) : {};
    settings.language = newLocale;
    localStorage.setItem('userSettings', JSON.stringify(settings));
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('localeChange', { detail: { locale: newLocale } }));
  }, []);

  // Translation function with nested key support and parameter interpolation
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = messages[locale];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to zh-CN if key not found
        let fallback: any = messages['zh-CN'];
        for (const fk of keys) {
          if (fallback && typeof fallback === 'object' && fk in fallback) {
            fallback = fallback[fk];
          } else {
            return key; // Return key if not found in any locale
          }
        }
        value = fallback;
        break;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Interpolate parameters
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() ?? match;
      });
    }

    return value;
  }, [locale]);

  const localeNames: Record<Locale, { name: string; flag: string }> = {
    'zh-CN': { name: '简体中文', flag: '🇨🇳' },
    'en': { name: 'English', flag: '🇬🇧' },
    'ja': { name: '日本語', flag: '🇯🇵' },
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, localeNames }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

// Export types for use in other files
export type { Locale, Messages };
export { messages };