import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../../utils/supabase';
import { generateInitialHabits } from '../../utils/initialHabits';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettings } from '../../utils/settingsContext';

const TOUR_PENDING_KEY = 'fluu_mascotTourPending';

export default function OnboardingFinal({ navigation }) {
  const [loading, setLoading] = useState(true);
  const { language } = useSettings();

  const updateProfileBestEffort = async (userId, patch) => {
    // Profile row is created by a DB trigger; never INSERT/UPSERT from the frontend.
    // Best-effort only: do not block onboarding if this fails.
    try {
      await supabase.from('profiles').update(patch).eq('id', userId);
    } catch {
      // ignore
    }
  };

  const ensureSessionUser = async (email, password) => {
    const { data: sess0 } = await supabase.auth.getSession();
    const sessUser0 = sess0?.session?.user ?? null;
    if (sessUser0) return sessUser0;

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) throw signInError;

    const u = signInData?.user ?? null;
    if (u) return u;

    const { data: sess1 } = await supabase.auth.getSession();
    return sess1?.session?.user ?? null;
  };

  const safeResetToApp = () => {
    try {
      const parent = navigation.getParent && navigation.getParent();
        if (parent && typeof parent.reset === 'function') {
        parent.reset({ index: 0, routes: [{ name: 'App', state: { index: 0, routes: [{ name: 'Calendar' }] } }] });
        return;
      }
    } catch (e) {
      // ignore and fallback
    }

    // Fallback: try resetting within this stack to avoid unhandled RESET action
    try {
      navigation.reset({ index: 0, routes: [{ name: 'App', state: { index: 0, routes: [{ name: 'Calendar' }] } }] });
    } catch (e) {
      navigation.popToTop && navigation.popToTop();
    }
  };

  useEffect(() => {
    (async () => {
      try {
        // Ensure RootNavigator stays on onboarding while auth changes happen.
        try { await AsyncStorage.setItem('onboarding_in_progress', 'true'); } catch {}

        // Read locally-collected onboarding auth info
        let authPayload = null;
        try {
          const raw = await AsyncStorage.getItem('onboarding_auth_payload');
          if (raw) authPayload = JSON.parse(raw);
        } catch {
          authPayload = null;
        }

        const email = authPayload?.email ? String(authPayload.email).trim() : '';
        const password = authPayload?.password ? String(authPayload.password) : '';

        if (!email || !password) {
          throw new Error('Faltan los datos de registro. Vuelve al paso anterior.');
        }

        // Read locally-collected onboarding profile info (to attach as Auth metadata)
        let profilePayload = null;
        try {
          const raw = await AsyncStorage.getItem('onboarding_profile_payload');
          if (raw) profilePayload = JSON.parse(raw);
        } catch {
          profilePayload = null;
        }

        const metadata = profilePayload
          ? {
              nombre: profilePayload.nombre || null,
              apellido: profilePayload.apellido || null,
              edad: typeof profilePayload.edad === 'number' ? profilePayload.edad : null,
              genero: profilePayload.genero || null,
            }
          : null;

        // Create account only at the end of onboarding.
        // If the user already exists, fall back to sign-in.
        let user = null;
        try {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            ...(metadata
              ? {
                  options: {
                    data: metadata,
                  },
                }
              : {}),
          });
          if (signUpError) throw signUpError;
          user = signUpData?.user ?? null;
        } catch (e) {
          const msg = (e && (e.message || e.error_description)) ? String(e.message || e.error_description) : String(e);
          // Common case when retrying: user already exists.
          const looksLikeExists = msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists') || msg.toLowerCase().includes('registered');
          if (!looksLikeExists) throw e;

          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) throw signInError;
          user = signInData?.user ?? null;
        }

        // Ensure we have an authenticated session (login must not be blocked).
        user = await ensureSessionUser(email, password);

        if (!user) {
          throw new Error('No se pudo iniciar sesión. Intenta de nuevo.');
        }

        if (profilePayload) {
          const payload = {
            nombre: profilePayload.nombre || '',
            apellido: profilePayload.apellido || '',
            edad: typeof profilePayload.edad === 'number' ? profilePayload.edad : null,
            genero: profilePayload.genero || null,
            language: language,
          };

          await updateProfileBestEffort(user.id, payload);
        }

        const { error } = await supabase.from('user_onboarding').upsert({
          user_id: user.id,
          onboarding_completed: true,
          completed_at: new Date().toISOString(),
        });
        if (error) throw error;

        await generateInitialHabits(user.id);

        // Only brand-new users should auto-see the mascot tour.
        try { await AsyncStorage.setItem(`${TOUR_PENDING_KEY}_${user.id}`, 'true'); } catch {}

        // Marcar localmente que en este dispositivo ya se mostró el onboarding
        // y finalizar el estado en progreso (esto evita que se reinicie el flujo).
        try { await AsyncStorage.setItem('device_onboarding_shown', 'true'); } catch {}
        try { await AsyncStorage.removeItem('onboarding_in_progress'); } catch {}
        try { await AsyncStorage.removeItem('onboarding_profile_payload'); } catch {}
        try { await AsyncStorage.removeItem('onboarding_auth_payload'); } catch {}

            // Ahora que AuthGate expone un Stack raíz con la pantalla 'App', resetear a 'App'
            try {
              navigation.reset({ index: 0, routes: [{ name: 'App', state: { index: 0, routes: [{ name: 'Calendar' }] } }] });
            } catch (e) {
              // fallback al comportamiento seguro (buscar parent que soporte reset)
              safeResetToApp();
            }
      } catch (err) {
        console.log(err);
        alert(err.message || String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 12 }}>Finalizando configuración...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¡Listo!</Text>
      <Text style={{ textAlign:'center', marginBottom:20 }}>Tu cuenta está configurada. Te llevamos a la app.</Text>
      <TouchableOpacity style={styles.btn} onPress={() => safeResetToApp()}>
        <Text style={{ color:'#fff', fontWeight:'700' }}>Ir al inicio</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center', padding:20 },
  title: { fontSize:24, fontWeight:'800', marginBottom:8 },
  btn: { backgroundColor:'#2563eb', padding:12, borderRadius:999, paddingHorizontal:20 },
});
