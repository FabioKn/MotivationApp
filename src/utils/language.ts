import AsyncStorage from '@react-native-async-storage/async-storage';
import { type Language } from '../constants/translations';

let currentLanguage: Language = 'de';
const listeners = new Set<(language: Language) => void>();

export const getCurrentLanguage = (): Language => currentLanguage;

export const getStoredLanguage = async (): Promise<Language> => {
  try {
    const stored = await AsyncStorage.getItem('language');
    if (stored === 'de' || stored === 'en') {
      currentLanguage = stored;
      return stored;
    }
  } catch (error) {
    console.error('Fehler beim Laden der Sprache:', error);
  }

  return currentLanguage;
};

export const setStoredLanguage = async (language: Language): Promise<void> => {
  currentLanguage = language;
  await AsyncStorage.setItem('language', language);
  listeners.forEach((listener) => listener(language));
};

export const subscribeToLanguageChanges = (listener: (language: Language) => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
