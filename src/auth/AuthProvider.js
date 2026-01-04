import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { setCurrentUserId } from '../utils/userScope';

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

        // Avoid forcing "invalid" auth based on getUser(), which can fail temporarily.
        // If there's a persisted session, use its user.
        setUser(data.session?.user ?? null);
        setCurrentUserId(data.session?.user?.id ?? null);
        setAuthInvalid(false);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setCurrentUserId(newSession?.user?.id ?? null);
      setAuthInvalid(false);
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
      setCurrentUserId(null);
      setAuthInvalid(true);
    }
  }, []);

  const value = useMemo(() => ({ user, session, loading, authInvalid, signOut }), [user, session, loading, authInvalid, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};
