import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

const THEME_KEY = 'FLUU_THEME_COLOR';
const LANG_KEY = 'FLUU_LANGUAGE';

const SettingsContext = createContext({
  themeColor: 'blue',
  language: 'en',
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
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    (async () => {
      try {
        const [storedTheme, storedLang] = await Promise.all([
          AsyncStorage.getItem(THEME_KEY),
          AsyncStorage.getItem(LANG_KEY),
        ]);
        if (storedTheme) setThemeColorState(storedTheme);
        if (storedLang) {
          setLanguageState(storedLang);
        } else {
          // Si no hay idioma guardado, detectamos el idioma del dispositivo
          // y si no está soportado usamos inglés por defecto.
          let systemLanguage = 'en';
          try {
            // En Expo/React Native, expo-localization es la forma más fiable
            // de obtener el locale del sistema.
            const locale = Localization.locale || Localization.locales?.[0];

            if (locale && typeof locale === 'string') {
              const code = locale
                .split(/[-_]/)[0]
                .toLowerCase();

              if (code === 'es') {
                systemLanguage = 'es';
              } else if (code === 'pt') {
                systemLanguage = 'pt';
              } else if (code === 'fr') {
                systemLanguage = 'fr';
              } else if (code === 'en') {
                systemLanguage = 'en';
              } else {
                // Idioma no soportado -> inglés por defecto
                systemLanguage = 'en';
              }
            }
          } catch {
            // si falla la detección, mantenemos 'en' como valor por defecto
          }

          setLanguageState(systemLanguage);
          try {
            await AsyncStorage.setItem(LANG_KEY, systemLanguage);
          } catch {
            // ignorar error de persistencia
          }
        }
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
