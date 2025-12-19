import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { supabase } from '../utils/supabase';

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Correo o contraseña incorrectos');
    }

    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        {/* LOGO */}
        <Image
          source={require('../../assets/adaptive-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.subtitle}>
          Inicia sesión para continuar
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Correo"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}

        <Pressable
          style={styles.primary}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.primaryText}>
            {loading ? 'Entrando…' : 'Entrar'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.link}>
            ¿No tienes cuenta? Regístrate
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  primary: {
    width: '100%',
    backgroundColor: '#38BDF8',
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  primaryText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  link: {
    textAlign: 'center',
    marginTop: 14,
    color: '#38BDF8',
    fontWeight: '600',
  },
  error: {
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 8,
  },
});
