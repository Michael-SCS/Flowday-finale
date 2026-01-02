import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { supabase } from '../utils/supabase';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        Alert.alert('Error', error.message || 'No se pudo iniciar sesión');
        setLoading(false);
        return;
      }

      // on success, AuthGate will handle navigation via auth state change
      setLoading(false);
    } catch (e) {
      Alert.alert('Error', 'No se pudo iniciar sesión');
      setLoading(false);
    }
  }

  async function handleNoAccount() {
    // Protect onboarding: only navigate if there's no active session/user
    try {
      const sess = await supabase.auth.getSession();
      const user = sess?.data?.session?.user ?? (await supabase.auth.getUser()).data.user;
      if (user) {
        Alert.alert('Sesión activa', 'Ya hay una sesión activa. Cierra sesión antes de crear una cuenta.');
        return;
      }
    } catch (e) {
      // ignore and allow navigation
    }

    // Navigate directly to AppSettings within the Onboarding stack
    navigation.navigate('Onboarding', { screen: 'AppSettings', params: { from: 'login_no_account' } });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar sesión</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Cargando...' : 'Iniciar sesión'}</Text>
      </Pressable>

      <Pressable style={styles.link} onPress={handleNoAccount}>
        <Text style={styles.linkText}>¿No tienes cuenta?</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  button: { backgroundColor: '#2563eb', padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  link: { marginTop: 12, alignItems: 'center' },
  linkText: { color: '#6b7280' },
});
