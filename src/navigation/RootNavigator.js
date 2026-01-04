import React, { useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthProvider';
import AppNavigator from './AppNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import AuthNavigator from './AuthNavigator';

const Stack = createNativeStackNavigator();

export default function RootNavigator({ navigationTheme }) {
  const { user, loading, authInvalid } = useAuth();
  const navRef = useRef(null);
  const [navReady, setNavReady] = useState(false);
  const [onboardingInProgress, setOnboardingInProgress] = useState(false);

  const refreshFlags = async () => {
    const inProgress = await AsyncStorage.getItem('onboarding_in_progress');
    setOnboardingInProgress(inProgress === 'true');
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
  
  // Re-check flags when auth state changes (e.g. after signup/profile completion)
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

  useEffect(() => {
    if (!onboardingInProgress) return;
    let cancelled = false;
    const id = setInterval(async () => {
      try {
        const inProgress = await AsyncStorage.getItem('onboarding_in_progress');
        if (cancelled) return;
        if (inProgress !== 'true') {
          setOnboardingInProgress(false);
        }
      } catch {
        // ignore
      }
    }, 400);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [onboardingInProgress]);

  const desiredRoot = useMemo(() => {
    if (onboardingInProgress) return 'Onboarding';
    if (!user || authInvalid) return 'Auth';
    return 'App';
  }, [onboardingInProgress, user, authInvalid]);

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
    </NavigationContainer>
  );
}
