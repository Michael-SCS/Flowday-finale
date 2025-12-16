import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
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

  if (loading) return null;

  return session ? <AppNavigator /> : <AuthNavigator />;
}
