import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthProvider';
import AppNavigator from './AppNavigator';
import AuthNavigator from './AuthNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import MoodCheckInModal from '../components/MoodCheckInModal';
import { getLastPromptDate, saveMoodForToday, setLastPromptDate, todayMoodKey } from '../utils/moodTracker';
import { useI18n } from '../utils/i18n';

const Stack = createNativeStackNavigator();

export default function RootNavigator({ navigationTheme }) {
  const { user, loading, authInvalid } = useAuth();
  const { t } = useI18n();
  const navRef = useRef(null);
  const [navReady, setNavReady] = useState(false);
  const [moodVisible, setMoodVisible] = useState(false);
  const [moodSaving, setMoodSaving] = useState(false);

  // Guest mode: allow full app entry without requiring auth.
  // Users can still navigate to Auth to create an account later.

  const accent = navigationTheme?.colors?.primary || '#7c3aed';
  const isDark = !!navigationTheme?.dark;

  const desiredRoot = useMemo(() => 'App', [user, authInvalid]);

  const maybeShowMoodPrompt = useCallback(async () => {
    // Only prompt inside the authenticated app experience.
    if (desiredRoot !== 'App') return;
    if (moodVisible || moodSaving) return;

    const today = todayMoodKey();
    const last = await getLastPromptDate();
    if (last === today) return;

    setMoodVisible(true);
  }, [desiredRoot, moodVisible, moodSaving]);

  useEffect(() => {
    // First entry into the day (cold start / after login)
    maybeShowMoodPrompt().catch(() => {});
  }, [maybeShowMoodPrompt]);

  useEffect(() => {
    // Also check when app returns to foreground (covers "only once per day")
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      maybeShowMoodPrompt().catch(() => {});
    });

    return () => {
      try { sub?.remove?.(); } catch {}
    };
  }, [maybeShowMoodPrompt]);

  useEffect(() => {
    if (!navReady) return;
    const rootState = navRef.current?.getRootState?.();
    const current = rootState?.routes?.[rootState.index]?.name;
    if (!current || current === desiredRoot) return;
    try {
      navRef.current?.resetRoot({ index: 0, routes: [{ name: desiredRoot }] });
    } catch {}
  }, [navReady, desiredRoot]);

  if (loading) return null;

  return (
    <NavigationContainer
      ref={navRef}
      onReady={() => setNavReady(true)}
      theme={navigationTheme}
    >
      <Stack.Navigator initialRouteName={desiredRoot} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="App" component={AppNavigator} />
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      </Stack.Navigator>

      <MoodCheckInModal
        visible={moodVisible}
        accent={accent}
        isDark={isDark}
        title={t('mood.checkInTitle')}
        subtitle={t('mood.checkInSubtitle')}
        onSelect={async ({ score, emoji }) => {
          if (moodSaving) return;
          setMoodSaving(true);
          // Close immediately for better UX; keep moodSaving true to avoid re-open.
          setMoodVisible(false);
          try {
            const today = todayMoodKey();
            await Promise.all([
              saveMoodForToday({ score, emoji }),
              setLastPromptDate(today),
            ]);
          } finally {
            setMoodSaving(false);
          }
        }}
      />
    </NavigationContainer>
  );
}
