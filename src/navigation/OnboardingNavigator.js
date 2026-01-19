import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RegisterForm from '../components/onboarding/RegisterForm';
import ProfileForm from '../components/onboarding/ProfileForm';
import OnboardingFinal from '../components/onboarding/OnboardingFinal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';

const Stack = createNativeStackNavigator();

export default function OnboardingNavigator({ navigation }) {
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // If onboarding is being shown, mark it as in-progress so auth changes
        // (e.g. after signup) don't reset the root to the App mid-flow.
        const inProgress = await AsyncStorage.getItem('onboarding_in_progress');
        const sess = await supabase.auth.getSession();
        const user = sess?.data?.session?.user ?? null;
        if (!mounted) return;

        // If onboarding is in progress, don't kick the user into the App.
        if (inProgress === 'true') return;

        if (user) {
          // If there's an active user, prevent onboarding and go to App
          navigation.replace('App');
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, [navigation]);

  return (
    <Stack.Navigator initialRouteName="RegisterForm" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RegisterForm" component={RegisterForm} />
      <Stack.Screen name="Profile" component={ProfileForm} />
      <Stack.Screen name="Final" component={OnboardingFinal} />
    </Stack.Navigator>
  );
}
