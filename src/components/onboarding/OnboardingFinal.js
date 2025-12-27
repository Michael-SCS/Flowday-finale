import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../../utils/supabase';
import { generateInitialHabits } from '../../utils/initialHabits';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OnboardingFinal({ navigation }) {
  const [loading, setLoading] = useState(true);

  const safeResetToApp = () => {
    try {
      const parent = navigation.getParent && navigation.getParent();
      if (parent && typeof parent.reset === 'function') {
        parent.reset({ index: 0, routes: [{ name: 'Calendar' }] });
        return;
      }
    } catch (e) {
      // ignore and fallback
    }

    // Fallback: try resetting within this stack to avoid unhandled RESET action
    try {
      navigation.reset({ index: 0, routes: [{ name: 'Calendar' }] });
    } catch (e) {
      navigation.popToTop && navigation.popToTop();
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error('Usuario no autenticado');

        const { error } = await supabase.from('user_onboarding').upsert({
          user_id: user.id,
          onboarding_completed: true,
          completed_at: new Date().toISOString(),
        });
        if (error) throw error;

        // Marcar localmente que en este dispositivo ya se mostró el onboarding
        try {
          await AsyncStorage.setItem('device_onboarding_shown', 'true');
        } catch {
          // no bloqueante
        }

        await generateInitialHabits(user.id);

            // Ahora que AuthGate expone un Stack raíz con la pantalla 'App', resetear a 'App'
            try {
              navigation.reset({ index: 0, routes: [{ name: 'App' }] });
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
