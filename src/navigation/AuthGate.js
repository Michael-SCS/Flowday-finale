import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { loadHabitTemplates } from '../utils/habitCache';
import AppNavigator from './AppNavigator';
import AuthNavigator from './AuthNavigator';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSettings } from '../utils/settingsContext';

const Stack = createNativeStackNavigator();

export default function AuthGate() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [authInvalid, setAuthInvalid] = useState(false);
  const { language } = useSettings();

  useEffect(() => {
    // Sesión inicial (persistida)
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);

        // Session-first: don't mark auth invalid based on getUser(), which may fail temporarily.
        const u = data?.session?.user ?? null;
        setCurrentUser(u);
        setAuthInvalid(!u);
      } finally {
        setLoading(false);
      }
    })();

    // Escuchar cambios de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);

      const u = session?.user ?? null;
      setCurrentUser(u);
      setAuthInvalid(!u);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Precargar hábitos una vez que haya sesión, para que el modal sea fluido
  useEffect(() => {
    if (!session || !currentUser) return;

    loadHabitTemplates(language).catch(() => {
      // si falla, simplemente se cargará más tarde desde Calendar
    });
  }, [session, language]);

  if (loading) return null;

  // Onboarding has been removed from the app flow.
  const initialRoute = !session || authInvalid ? 'Auth' : 'App';

  return (
    <Stack.Navigator key={initialRoute} initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthNavigator} />
      <Stack.Screen name="Login" component={require('./LoginScreen').default} />
      <Stack.Screen name="App" component={AppNavigator} />
    </Stack.Navigator>
  );
}
