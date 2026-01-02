import 'react-native-gesture-handler'; // 🔥 SIEMPRE PRIMERO
import 'react-native-get-random-values';

import React, { useEffect } from 'react';
import { DefaultTheme, DarkTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/auth/AuthProvider';
import RootNavigator from './src/navigation/RootNavigator';
import { SettingsProvider, useSettings, getAccentColor } from './src/utils/settingsContext';
import { requestNotificationPermissions } from './src/utils/notifications';

function AppInner() {
  const { themeColor, themeMode } = useSettings();
  const accent = getAccentColor(themeColor);

  const baseTheme = themeMode === 'dark' ? DarkTheme : DefaultTheme;

  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: accent,
      background: themeMode === 'dark' ? '#020617' : '#ffffff',
      card: themeMode === 'dark' ? '#020617' : '#ffffff',
      border: themeMode === 'dark' ? '#1e293b' : baseTheme.colors.border,
      text: themeMode === 'dark' ? '#e5e7eb' : baseTheme.colors.text,
    },
  };

  return (
    <RootNavigator navigationTheme={navigationTheme} />
  );
}

export default function App() {
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <AuthProvider>
            <AppInner />
          </AuthProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
