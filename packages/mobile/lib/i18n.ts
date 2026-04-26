import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from '../locales/en.json';
import ja from '../locales/ja.json';

const LANGUAGE_KEY = 'user_language';

export const SUPPORTED_LANGUAGES = ['en', 'ja'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

const resources = {
  en: { translation: en },
  ja: { translation: ja },
};

// Get saved language from AsyncStorage
export const getSavedLanguage = async (): Promise<SupportedLanguage | null> => {
  try {
    const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (savedLang && SUPPORTED_LANGUAGES.includes(savedLang as SupportedLanguage)) {
      return savedLang as SupportedLanguage;
    }
    return null;
  } catch (error) {
    console.error('Failed to get saved language:', error);
    return null;
  }
};

// Save language preference to AsyncStorage
export const saveLanguage = async (language: SupportedLanguage): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch (error) {
    console.error('Failed to save language:', error);
  }
};

// Initialize i18n with saved language or default to 'en'
const initI18n = async () => {
  const savedLanguage = await getSavedLanguage();
  
  i18n.use(initReactI18next).init({
    resources,
    lng: savedLanguage || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });
};

initI18n();

export default i18n;
