import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

const THEME_KEY = 'FLUU_THEME_COLOR';
const THEME_MODE_KEY = 'FLUU_THEME_MODE';
const LANG_KEY = 'FLUU_LANGUAGE';
const LANG_SOURCE_KEY = 'FLUU_LANGUAGE_SOURCE'; // 'system' | 'user'

const NOTIFICATIONS_ENABLED_KEY = 'FLUU_NOTIFICATIONS_ENABLED'; // '1' | '0'
const TIME_FORMAT_KEY = 'FLUU_TIME_FORMAT'; // 'system' | '12h' | '24h'

const SettingsContext = createContext({
  themeColor: 'blue',
  themeMode: 'light',
  language: 'en',
  notificationsEnabled: true,
  timeFormat: 'system',
  setThemeColor: () => {},
  setThemeMode: () => {},
  setLanguage: () => {},
  setNotificationsEnabled: () => {},
  setTimeFormat: () => {},
});

const THEME_PALETTE = {
  blue: '#4F7DF3',
  pink: '#EC6BAA',
  green: '#2ECC71',
  purple: '#7B61FF',
  orange: '#FF8A3D',
};

function normalizeThemeColor(value) {
  const v = String(value || '').trim();
  return THEME_PALETTE[v] ? v : 'blue';
}

export function getAccentColor(themeColor) {
  return THEME_PALETTE[themeColor] || THEME_PALETTE.blue;
}

export function mapLocaleToLang(locale) {
  if (!locale || typeof locale !== 'string') return 'en';
  const code = locale.split(/[-_]/)[0].toLowerCase();
  // Only supported languages for now.
  if (code === 'es' || code === 'en' || code === 'pt' || code === 'fr') return code;
  return 'en';
}

function normalizeTimeFormat(value) {
  const v = String(value || '').trim();
  if (v === '12h' || v === '24h' || v === 'system') return v;
  return 'system';
}

function getSystemLocaleString() {
  try {
    // expo-localization v17+ supports getLocales() which is the most reliable.
    const locales = typeof Localization.getLocales === 'function' ? Localization.getLocales() : null;
    const first = Array.isArray(locales) ? locales[0] : null;
    const tag = first?.languageTag || first?.languageCode;
    if (typeof tag === 'string' && tag.length > 0) return tag;
  } catch {
    // ignore
  }

  // Fallbacks for older APIs
  return (
    (typeof Localization.locale === 'string' && Localization.locale) ||
    (Array.isArray(Localization.locales) && Localization.locales[0]) ||
    'en'
  );
}

export function SettingsProvider({ children }) {
  const [themeColor, setThemeColorState] = useState('blue');
  const [themeMode, setThemeModeState] = useState('light');
  const [languageSource, setLanguageSource] = useState('system');

  // Inicializar idioma inmediatamente desde la configuración del sistema
  const initialSystemLang = mapLocaleToLang(getSystemLocaleString());
  const [language, setLanguageState] = useState(initialSystemLang);

  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const [timeFormat, setTimeFormatState] = useState('system');

  useEffect(() => {
    (async () => {
      try {
        const [
          storedTheme,
          storedThemeMode,
          storedLang,
          storedLangSource,
          storedNotificationsEnabled,
          storedTimeFormat,
        ] = await Promise.all([
          AsyncStorage.getItem(THEME_KEY),
          AsyncStorage.getItem(THEME_MODE_KEY),
          AsyncStorage.getItem(LANG_KEY),
          AsyncStorage.getItem(LANG_SOURCE_KEY),
          AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY),
          AsyncStorage.getItem(TIME_FORMAT_KEY),
        ]);
        if (storedTheme) {
          const next = normalizeThemeColor(storedTheme);
          setThemeColorState(next);
          if (next !== storedTheme) {
            try {
              await AsyncStorage.setItem(THEME_KEY, next);
            } catch {
              // ignore
            }
          }
        }
        if (storedThemeMode === 'dark' || storedThemeMode === 'light') {
          setThemeModeState(storedThemeMode);
        }

        if (storedNotificationsEnabled === '0' || storedNotificationsEnabled === '1') {
          setNotificationsEnabledState(storedNotificationsEnabled === '1');
        }
        if (storedTimeFormat) {
          setTimeFormatState(normalizeTimeFormat(storedTimeFormat));
        }
        // Idioma:
        // - Si el usuario eligió manualmente -> respetar.
        // - Si no (incluye compatibilidad con instalaciones viejas sin LANG_SOURCE) -> sincronizar con idioma del sistema.
        if (storedLangSource === 'user' && storedLang) {
          const normalized = mapLocaleToLang(storedLang);
          setLanguageState(normalized);
          setLanguageSource('user');
          if (normalized !== storedLang) {
            try {
              await AsyncStorage.setItem(LANG_KEY, normalized);
            } catch {
              // ignore
            }
          }
        } else {
          const systemLanguage = mapLocaleToLang(getSystemLocaleString());
          setLanguageState(systemLanguage);
          setLanguageSource('system');
          try {
            await AsyncStorage.setItem(LANG_KEY, systemLanguage);
            await AsyncStorage.setItem(LANG_SOURCE_KEY, 'system');
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
          // Re-sincronizamos mientras el usuario no haya forzado un idioma manualmente.
          if (storedLangSource !== 'user') {
            const currentSystem = mapLocaleToLang(getSystemLocaleString());
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
      const next = normalizeThemeColor(value);
      setThemeColorState(next);
      await AsyncStorage.setItem(THEME_KEY, next);
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
      const next = mapLocaleToLang(value);
      setLanguageState(next);
      await AsyncStorage.setItem(LANG_KEY, next);
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

  const setNotificationsEnabled = async (value) => {
    try {
      const next = !!value;
      setNotificationsEnabledState(next);
      await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, next ? '1' : '0');
    } catch {
      // ignore
    }
  };

  const setTimeFormat = async (value) => {
    try {
      const next = normalizeTimeFormat(value);
      setTimeFormatState(next);
      await AsyncStorage.setItem(TIME_FORMAT_KEY, next);
    } catch {
      // ignore
    }
  };

  // Cambiar idioma temporalmente sin persistir (útil para onboarding)
  const setLanguageTemp = (value) => {
    setLanguageState(mapLocaleToLang(value));
  };

  return (
    <SettingsContext.Provider
      value={{
        themeColor,
        themeMode,
        language,
        languageSource,
        notificationsEnabled,
        timeFormat,
        setThemeColor,
        setThemeMode,
        setLanguage,
        setLanguageTemp,
        setNotificationsEnabled,
        setTimeFormat,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
