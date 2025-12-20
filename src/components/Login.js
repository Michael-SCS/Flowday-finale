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
import { useI18n } from '../utils/i18n';
import { Ionicons } from '@expo/vector-icons';

export default function Login({ navigation }) {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(t('auth.errorInvalidCredentials') || 'Correo o contraseña incorrectos');
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
          {t('auth.loginSubtitle')}
        </Text>

        <TextInput
          style={styles.input}
          placeholder={t('auth.emailLabel')}
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <View style={styles.passwordBox}>
          <TextInput
            style={styles.passwordInput}
            placeholder={t('auth.passwordLabel')}
            placeholderTextColor="#9ca3af"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={22}
              color="#6b7280"
            />
          </Pressable>
        </View>

        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}

        <Pressable
          style={styles.primary}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.primaryText}>
            {loading ? t('auth.loginButtonLoading') || 'Entrando…' : t('auth.loginButton')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.link}>
            {t('auth.goToRegister')}
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
  passwordBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
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
