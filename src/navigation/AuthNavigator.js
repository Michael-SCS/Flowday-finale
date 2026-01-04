import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AuthErrorScreen from './AuthErrorScreen';
import LoginScreen from './LoginScreen';
import Register from '../components/Register';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator initialRouteName="AuthError" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AuthError" component={AuthErrorScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={Register} />
    </Stack.Navigator>
  );
}
