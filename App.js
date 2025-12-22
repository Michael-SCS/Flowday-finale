import 'react-native-gesture-handler'; // 🔥 SIEMPRE PRIMERO
import 'react-native-get-random-values';

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AuthGate from './src/navigation/AuthGate';
import { SettingsProvider } from './src/utils/settingsContext';
import { requestNotificationPermissions } from './src/utils/notifications';

export default function App() {
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <SettingsProvider>
            <AuthGate />
          </SettingsProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
