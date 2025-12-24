import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

const THEME_KEY = 'FLUU_THEME_COLOR';
const THEME_MODE_KEY = 'FLUU_THEME_MODE';
const LANG_KEY = 'FLUU_LANGUAGE';
const LANG_SOURCE_KEY = 'FLUU_LANGUAGE_SOURCE'; // 'system' | 'user'

const SettingsContext = createContext({
  themeColor: 'blue',
  themeMode: 'light',
  language: 'en',
  setThemeColor: () => {},
  setThemeMode: () => {},
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

export function mapLocaleToLang(locale) {
  if (!locale || typeof locale !== 'string') return 'en';
  const code = locale.split(/[-_]/)[0].toLowerCase();
  if (['es', 'en', 'pt', 'fr', 'de', 'it'].includes(code)) return code;
  return 'en';
}

export function SettingsProvider({ children }) {
  const [themeColor, setThemeColorState] = useState('blue');
  const [themeMode, setThemeModeState] = useState('light');
  const [languageSource, setLanguageSource] = useState('system');
  const mapLocaleToLang = (locale) => {
    if (!locale || typeof locale !== 'string') return 'en';
    const code = locale.split(/[-_]/)[0].toLowerCase();
    if (['es', 'en', 'pt', 'fr', 'de', 'it'].includes(code)) return code;
    return 'en';
  };

  // Inicializar idioma inmediatamente desde la configuración del sistema
  const initialSystemLang = mapLocaleToLang(Localization.locale || Localization.locales?.[0]);
  const [language, setLanguageState] = useState(initialSystemLang);

  useEffect(() => {
    (async () => {
      try {
        const [storedTheme, storedThemeMode, storedLang, storedLangSource] = await Promise.all([
          AsyncStorage.getItem(THEME_KEY),
          AsyncStorage.getItem(THEME_MODE_KEY),
          AsyncStorage.getItem(LANG_KEY),
          AsyncStorage.getItem(LANG_SOURCE_KEY),
        ]);
        if (storedTheme) setThemeColorState(storedTheme);
        if (storedThemeMode === 'dark' || storedThemeMode === 'light') {
          setThemeModeState(storedThemeMode);
        }
        if (storedLang) {
          // Si ya hay un idioma guardado, comprobamos si fue guardado
          // automáticamente por el sistema o por el usuario.
          // Compatibilidad: si no hay storedLangSource pero el valor coincide
          // con el idioma del sistema al instalar (initialSystemLang),
          // asumimos que lo estableció el sistema.
          const considerSystem = storedLangSource === 'system' || (!storedLangSource && storedLang === initialSystemLang);
          if (considerSystem) {
            const currentSystem = mapLocaleToLang(Localization.locale || Localization.locales?.[0]);
            if (currentSystem !== storedLang) {
              setLanguageState(currentSystem);
              try {
                await AsyncStorage.setItem(LANG_KEY, currentSystem);
                await AsyncStorage.setItem(LANG_SOURCE_KEY, 'system');
                setLanguageSource('system');
              } catch {
                // ignorar errores de persistencia
              }
            } else {
              setLanguageState(storedLang);
              setLanguageSource(storedLangSource || 'system');
            }
          } else {
            // source === 'user' -> respetamos elección del usuario
            setLanguageState(storedLang);
            setLanguageSource(storedLangSource || 'user');
          }
        } else {
          const systemLanguage = mapLocaleToLang(Localization.locale || Localization.locales?.[0]);
          setLanguageState(systemLanguage);
          try {
            await AsyncStorage.setItem(LANG_KEY, systemLanguage);
            await AsyncStorage.setItem(LANG_SOURCE_KEY, 'system');
            setLanguageSource('system');
          } catch {
            // ignorar error de persistencia
          }
        }
      } catch {
        // si falla, usamos defaults
      }
    })();
  }, []);

  // Re-sincronizar idioma cuando la app vuelve a primer plano
  useEffect(() => {
    const handle = AppState.addEventListener?.('change', (next) => {
      if (next !== 'active') return;
      (async () => {
        try {
          const storedLangSource = await AsyncStorage.getItem(LANG_SOURCE_KEY);
          // Solo re-sincronizamos si la preferencia la puso el sistema
          if (storedLangSource === 'system') {
            const currentSystem = mapLocaleToLang(Localization.locale || Localization.locales?.[0]);
            setLanguageState(currentSystem);
            try {
              await AsyncStorage.setItem(LANG_KEY, currentSystem);
              await AsyncStorage.setItem(LANG_SOURCE_KEY, 'system');
              setLanguageSource('system');
            } catch {
              // ignorar persistencia
            }
          }
        } catch {
          // ignore
        }
      })();
    });

    return () => {
      try {
        handle && handle.remove && handle.remove();
      } catch {
        // ignore
      }
    };
  }, []);

  const setThemeColor = async (value) => {
    try {
      setThemeColorState(value);
      await AsyncStorage.setItem(THEME_KEY, value);
    } catch {
      // ignorar error de persistencia
    }
  };

  const setThemeMode = async (value) => {
    try {
      const next = value === 'dark' ? 'dark' : 'light';
      setThemeModeState(next);
      await AsyncStorage.setItem(THEME_MODE_KEY, next);
    } catch {
      // ignorar error de persistencia
    }
  };

  const setLanguage = async (value) => {
    try {
      setLanguageState(value);
      await AsyncStorage.setItem(LANG_KEY, value);
      // Marca como ajuste manual del usuario
      try {
        await AsyncStorage.setItem(LANG_SOURCE_KEY, 'user');
        setLanguageSource('user');
      } catch {
        // ignore
      }
    } catch {
      // ignorar error de persistencia
    }
  };

  // Cambiar idioma temporalmente sin persistir (útil para onboarding)
  const setLanguageTemp = (value) => {
    setLanguageState(value);
  };

  return (
    <SettingsContext.Provider
      value={{
        themeColor,
        themeMode,
        language,
        languageSource,
        setThemeColor,
        setThemeMode,
        setLanguage,
        setLanguageTemp,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
