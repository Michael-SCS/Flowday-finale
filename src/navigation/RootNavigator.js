import React, { useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthProvider';
import AppNavigator from './AppNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import AuthErrorScreen from './AuthErrorScreen';
import LoginScreen from './LoginScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator({ navigationTheme }) {
  const { user, loading, authInvalid } = useAuth();
  const navRef = useRef(null);
  const [navReady, setNavReady] = useState(false);
  const [deviceOnboardingChecked, setDeviceOnboardingChecked] = useState(false);
  const [deviceOnboardingNeeded, setDeviceOnboardingNeeded] = useState(false);
  const [onboardingInProgress, setOnboardingInProgress] = useState(false);

  const refreshFlags = async () => {
    const v = await AsyncStorage.getItem('device_onboarding_shown');
    const inProgress = await AsyncStorage.getItem('onboarding_in_progress');
    setDeviceOnboardingNeeded(v !== 'true');
    setOnboardingInProgress(inProgress === 'true');
    setDeviceOnboardingChecked(true);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await refreshFlags();
      } catch {
        if (mounted) {
          setDeviceOnboardingNeeded(false);
          setOnboardingInProgress(false);
          setDeviceOnboardingChecked(true);
        }
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
    if (!user || authInvalid) return deviceOnboardingNeeded ? 'Onboarding' : 'Login';
    return 'App';
  }, [onboardingInProgress, user, authInvalid, deviceOnboardingNeeded]);

  useEffect(() => {
    if (!navReady) return;
    const current = navRef.current?.getCurrentRoute?.()?.name;
    if (!current || current === desiredRoot) return;
    try {
      navRef.current?.resetRoot({ index: 0, routes: [{ name: desiredRoot }] });
    } catch {}
  }, [navReady, desiredRoot]);

  if (loading) return null;
  if (!deviceOnboardingChecked) return null;

  return (
    <NavigationContainer
      ref={navRef}
      onReady={() => setNavReady(true)}
      theme={navigationTheme}
    >
      <Stack.Navigator initialRouteName={desiredRoot} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="AuthError" component={AuthErrorScreen} />
        <Stack.Screen name="App" component={AppNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
