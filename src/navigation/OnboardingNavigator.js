import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingSlides from '../components/onboarding/OnboardingSlides';
import ProfileForm from '../components/onboarding/ProfileForm';
import AppSettings from '../components/onboarding/AppSettings';
import OnboardingFinal from '../components/onboarding/OnboardingFinal';

const Stack = createNativeStackNavigator();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Slides" component={OnboardingSlides} />
      <Stack.Screen name="Profile" component={ProfileForm} />
      <Stack.Screen name="AppSettings" component={AppSettings} />
      <Stack.Screen name="Final" component={OnboardingFinal} />
    </Stack.Navigator>
  );
}
