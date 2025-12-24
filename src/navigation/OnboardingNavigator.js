import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingSlides from '../components/onboarding/OnboardingSlides';
import RegisterForm from '../components/onboarding/RegisterForm';
import ProfileForm from '../components/onboarding/ProfileForm';
import PersonalizationForm from '../components/onboarding/PersonalizationForm';
import OnboardingFinal from '../components/onboarding/OnboardingFinal';

const Stack = createNativeStackNavigator();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Slides" component={OnboardingSlides} />
      <Stack.Screen name="Register" component={RegisterForm} />
      <Stack.Screen name="Profile" component={ProfileForm} />
      <Stack.Screen name="Personalization" component={PersonalizationForm} />
      <Stack.Screen name="Final" component={OnboardingFinal} />
    </Stack.Navigator>
  );
}
