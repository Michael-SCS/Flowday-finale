import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthProvider';
import AppNavigator from './AppNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import AuthNavigator from './AuthNavigator';
import MoodCheckInModal from '../components/MoodCheckInModal';
import { getLastPromptDate, saveMoodForToday, setLastPromptDate, todayMoodKey } from '../utils/moodTracker';
import { useI18n } from '../utils/i18n';

const Stack = createNativeStackNavigator();

export default function RootNavigator({ navigationTheme }) {
  const { user, loading, authInvalid } = useAuth();
  const { t } = useI18n();
  const navRef = useRef(null);
  const [navReady, setNavReady] = useState(false);
  const [onboardingInProgress, setOnboardingInProgress] = useState(false);
  const [moodVisible, setMoodVisible] = useState(false);
  const [moodSaving, setMoodSaving] = useState(false);

  // Guest mode: allow full app entry without requiring auth.
  // Users can still navigate to Auth to create an account later.

  const accent = navigationTheme?.colors?.primary || '#7c3aed';
  const isDark = !!navigationTheme?.dark;

  const refreshFlags = async () => {
    const [inProgress, deviceShown] = await Promise.all([
      AsyncStorage.getItem('onboarding_in_progress'),
      AsyncStorage.getItem('device_onboarding_shown'),
    ]);

    // Explicit in-progress flag always wins (e.g. user tapped "create account").
    if (inProgress === 'true') {
      setOnboardingInProgress(true);
      return;
    }

    // Guest-first experience: do not force onboarding when unauthenticated.
    // Keep onboarding only when explicitly started via onboarding_in_progress.
    if (deviceShown !== 'true') {
      // Mark as shown so we don't repeatedly re-evaluate first-run flows.
      try {
        await AsyncStorage.setItem('device_onboarding_shown', 'true');
      } catch {}
    }

    setOnboardingInProgress(false);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await refreshFlags();
      } catch {
        if (mounted) setOnboardingInProgress(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Re-check flags when auth state changes.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await refreshFlags();
      } catch {
        if (mounted) setOnboardingInProgress(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user, authInvalid]);

  const desiredRoot = useMemo(() => {
    if (onboardingInProgress) return 'Onboarding';
    return 'App';
  }, [onboardingInProgress, user, authInvalid]);

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
      onStateChange={() => {
        // Keep desiredRoot in sync with AsyncStorage flags when screens navigate.
        refreshFlags().catch(() => {});
      }}
      theme={navigationTheme}
    >
      <Stack.Navigator initialRouteName={desiredRoot} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="App" component={AppNavigator} />
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
          try {
            const today = todayMoodKey();
            await Promise.all([
              saveMoodForToday({ score, emoji }),
              setLastPromptDate(today),
            ]);
            setMoodVisible(false);
          } finally {
            setMoodSaving(false);
          }
        }}
      />
    </NavigationContainer>
  );
}
