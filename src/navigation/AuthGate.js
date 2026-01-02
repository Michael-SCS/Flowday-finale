import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';
import { loadHabitTemplates } from '../utils/habitCache';
import AppNavigator from './AppNavigator';
import AuthNavigator from './AuthNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import AuthErrorScreen from './AuthErrorScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSettings, mapLocaleToLang } from '../utils/settingsContext';
import * as Localization from 'expo-localization';

const Stack = createNativeStackNavigator();

export default function AuthGate() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [authInvalid, setAuthInvalid] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(null);
  const [deviceOnboardingChecked, setDeviceOnboardingChecked] = useState(false);
  const [deviceOnboardingNeeded, setDeviceOnboardingNeeded] = useState(false);
  const { language, setLanguageTemp } = useSettings();

  useEffect(() => {
    // Sesión inicial (persistida)
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);

        // Validate user presence immediately
        try {
          const userRes = await supabase.auth.getUser();
          const user = userRes?.data?.user ?? null;
          setCurrentUser(user);
          setAuthInvalid(!user);
        } catch (e) {
          setCurrentUser(null);
          setAuthInvalid(true);
        }
      } finally {
        setLoading(false);
      }
    })();

    // Escuchar cambios de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);

      // whenever auth changes, update currentUser and authInvalid
      (async () => {
        try {
          const userRes = await supabase.auth.getUser();
          const user = userRes?.data?.user ?? null;
          setCurrentUser(user);
          setAuthInvalid(!user);
        } catch (e) {
          setCurrentUser(null);
          setAuthInvalid(true);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  // Revisar si en este dispositivo ya se mostró el onboarding
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const v = await AsyncStorage.getItem('device_onboarding_shown');
        if (!mounted) return;
        if (v === 'true') {
          setDeviceOnboardingNeeded(false);
        } else {
          setDeviceOnboardingNeeded(true);
        }
        setDeviceOnboardingChecked(true);
      } catch {
        if (mounted) {
          setDeviceOnboardingNeeded(false);
          setDeviceOnboardingChecked(true);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Precargar hábitos una vez que haya sesión, para que el modal sea fluido
  useEffect(() => {
    if (!session || !currentUser) return;

    loadHabitTemplates(language).catch(() => {
      // si falla, simplemente se cargará más tarde desde Calendar
    });
  }, [session, language]);

  // Consultar estado de onboarding cuando haya sesión
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!session || !currentUser) {
        if (mounted) {
          setOnboardingChecked(false);
          setOnboardingCompleted(null);
        }
        return;
      }

      try {
        const user = currentUser;

        const { data, error } = await supabase
          .from('user_onboarding')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          // si falla la consulta, no bloqueamos: asumimos completado
          if (mounted) {
            setOnboardingCompleted(true);
            setOnboardingChecked(true);
          }
        } else {
          if (mounted) {
            setOnboardingCompleted(!!(data && data.onboarding_completed));
            setOnboardingChecked(true);
          }
        }
      } catch {
        if (mounted) {
          setOnboardingCompleted(true);
          setOnboardingChecked(true);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [session]);

  // No autenticado => flujo de auth (login/register)
  // Si es la primera vez en este dispositivo mostramos el onboarding antes de auth
  useEffect(() => {
    if (deviceOnboardingChecked && deviceOnboardingNeeded) {
      try {
        const sys = mapLocaleToLang(Localization.locale || Localization.locales?.[0]);
        setLanguageTemp && setLanguageTemp(sys);
      } catch {
        // ignore
      }
    }
  }, [deviceOnboardingChecked, deviceOnboardingNeeded]);

  if (loading) return null;

  // Decide ruta inicial del Stack según estado
  if (loading) return null;

  const decideInitial = () => {
    if (deviceOnboardingChecked && deviceOnboardingNeeded) return 'Onboarding';
    // If this device already showed onboarding, but there's no valid user/session -> show AuthError
    if (!session || authInvalid) return 'AuthError';
    // If device showed onboarding and session+user ok, continue evaluating
    if (!onboardingChecked || onboardingCompleted === null) return 'Auth';
    if (!onboardingCompleted) return 'Onboarding';
    return 'App';
  };

  const initialRoute = decideInitial();

  return (
    <Stack.Navigator key={initialRoute} initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      <Stack.Screen name="Auth" component={AuthNavigator} />
      <Stack.Screen name="AuthError" component={AuthErrorScreen} />
      <Stack.Screen name="Login" component={require('./LoginScreen').default} />
      <Stack.Screen name="App" component={AppNavigator} />
    </Stack.Navigator>
  );
}
