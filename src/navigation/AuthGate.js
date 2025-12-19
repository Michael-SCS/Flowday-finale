import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { loadHabitTemplates } from '../utils/habitCache';
import AppNavigator from './AppNavigator';
import AuthNavigator from './AuthNavigator';

export default function AuthGate() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sesión inicial (persistida)
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // Escuchar cambios de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Precargar hábitos una vez que haya sesión, para que el modal sea fluido
  useEffect(() => {
    if (!session) return;

    loadHabitTemplates().catch(() => {
      // si falla, simplemente se cargará más tarde desde Calendar
    });
  }, [session]);

  if (loading) return null;

  return session ? <AppNavigator /> : <AuthNavigator />;
}
