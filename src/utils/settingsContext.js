import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'FLOWDAY_THEME_COLOR';
const LANG_KEY = 'FLOWDAY_LANGUAGE';

const SettingsContext = createContext({
  themeColor: 'blue',
  language: 'es',
  setThemeColor: () => {},
  setLanguage: () => {},
});

const THEME_PALETTE = {
  blue: '#38BDF8',
  pink: '#FB7185',
  yellow: '#FACC15',
  purple: '#A855F7',
  teal: '#14B8A6',
};

export function getAccentColor(themeColor) {
  return THEME_PALETTE[themeColor] || THEME_PALETTE.blue;
}

export function SettingsProvider({ children }) {
  const [themeColor, setThemeColorState] = useState('blue');
  const [language, setLanguageState] = useState('es');

  useEffect(() => {
    (async () => {
      try {
        const [storedTheme, storedLang] = await Promise.all([
          AsyncStorage.getItem(THEME_KEY),
          AsyncStorage.getItem(LANG_KEY),
        ]);
        if (storedTheme) setThemeColorState(storedTheme);
        if (storedLang) setLanguageState(storedLang);
      } catch {
        // si falla, usamos defaults
      }
    })();
  }, []);

  const setThemeColor = async (value) => {
    try {
      setThemeColorState(value);
      await AsyncStorage.setItem(THEME_KEY, value);
    } catch {
      // ignorar error de persistencia
    }
  };

  const setLanguage = async (value) => {
    try {
      setLanguageState(value);
      await AsyncStorage.setItem(LANG_KEY, value);
    } catch {
      // ignorar error de persistencia
    }
  };

  return (
    <SettingsContext.Provider
      value={{ themeColor, language, setThemeColor, setLanguage }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
