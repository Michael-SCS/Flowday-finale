import React, { createContext, useContext, useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { AppState } from 'react-native';
import { supabase } from '../utils/supabase';
import { setCurrentUserId } from '../utils/userScope';

const AuthContext = createContext(null);

function nowBogotaIso() {
  // Colombia (America/Bogota) is UTC-05 and does not observe DST.
  // Store an ISO string with explicit -05:00 offset so Postgres can parse it reliably.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const map = Object.fromEntries(parts.filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}:${map.second}-05:00`;
}

async function touchLastActive(userId) {
  if (!userId) return;
  try {
    await supabase
      .from('profiles')
      .update({ last_active_at: nowBogotaIso() })
      .eq('id', userId);
  } catch (e) {
    // Best-effort: don't break auth flow if this fails (e.g., RLS or offline).
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authInvalid, setAuthInvalid] = useState(false);
  const lastTouchMsRef = useRef(0);
  const currentUserIdRef = useRef(null);

  const maybeTouch = useCallback(async (userId) => {
    const now = Date.now();
    // Avoid spamming updates if AppState toggles quickly.
    if (now - lastTouchMsRef.current < 30_000) return;
    lastTouchMsRef.current = now;
    await touchLastActive(userId);
  }, []);

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
        currentUserIdRef.current = data.session?.user?.id ?? null;
        setCurrentUserId(currentUserIdRef.current);
        setAuthInvalid(false);

        if (currentUserIdRef.current) {
          // Mark active on app open (cold start).
          maybeTouch(currentUserIdRef.current);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      currentUserIdRef.current = newSession?.user?.id ?? null;
      setCurrentUserId(currentUserIdRef.current);
      setAuthInvalid(false);

      if (currentUserIdRef.current) {
        // Mark active after login / session refresh.
        maybeTouch(currentUserIdRef.current);
      }
    });

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      if (!mounted) return;
      const uid = currentUserIdRef.current;
      if (uid) maybeTouch(uid);
    });

    return () => {
      mounted = false;
      try { subscription.unsubscribe(); } catch (e) {}
      try { appStateSub?.remove?.(); } catch (e) {}
    };
  }, [maybeTouch]);

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
