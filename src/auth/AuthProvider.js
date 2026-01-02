import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authInvalid, setAuthInvalid] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(data.session);

        try {
          const userRes = await supabase.auth.getUser();
          const u = userRes?.data?.user ?? null;
          setUser(u);
          setAuthInvalid(!u);
        } catch {
          setUser(null);
          setAuthInvalid(true);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      try {
        const userRes = await supabase.auth.getUser();
        const u = userRes?.data?.user ?? null;
        setUser(u);
        setAuthInvalid(!u);
      } catch {
        setUser(null);
        setAuthInvalid(true);
      }
    });

    return () => {
      mounted = false;
      try { subscription.unsubscribe(); } catch (e) {}
    };
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setSession(null);
      setAuthInvalid(true);
    }
  }, []);

  const value = useMemo(() => ({ user, session, loading, authInvalid, signOut }), [user, session, loading, authInvalid, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};
