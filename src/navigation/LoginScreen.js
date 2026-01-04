import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../utils/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    
    try {
      const trimmedEmail = (email || '').trim();
      if (!trimmedEmail) {
        Alert.alert(t('auth.errorTitle'), t('auth.errorEmailRequired'));
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: trimmedEmail,
        password 
      });
      
      if (error) {
        // Supabase often returns a generic "Invalid login credentials" for both
        // unknown emails and wrong passwords. Best-effort: check if the email exists.
        try {
          const { data: existsData, error: existsErr } = await supabase.functions.invoke('check-email', {
            body: { email: trimmedEmail },
          });

          if (!existsErr && existsData && typeof existsData.exists === 'boolean') {
            if (existsData.exists) {
              Alert.alert(t('auth.errorTitle'), t('auth.errorInvalidCredentials'));
            } else {
              Alert.alert(t('auth.accountNotFoundTitle'), t('auth.accountNotFoundMessage'));
            }
            return;
          }
        } catch {
          // ignore and fall back
        }

        Alert.alert(t('auth.errorTitle'), error.message || t('auth.errorGeneric'));
        return;
      }

      // Optional: if authenticated but profile row is missing, show a warning.
      try {
        const userId = data?.user?.id;
        if (userId) {
          const { data: profile } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
          if (!profile?.id) {
            Alert.alert(t('auth.profileMissingTitle'), t('auth.profileMissingMessage'));
          }
        }
      } catch {
        // ignore
      }
    } catch (e) {
      Alert.alert(t('auth.errorTitle'), t('auth.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const handleNoAccount = async () => {
    try {
      const sess = await supabase.auth.getSession();
      const user = sess?.data?.session?.user ?? (await supabase.auth.getUser()).data.user;
      
      if (user) {
        Alert.alert(
          t('auth.sessionActiveTitle'),
          t('auth.sessionActiveMessage')
        );
        return;
      }
    } catch (e) {
      // Ignorar error y permitir navegación
    }

    // Keep RootNavigator pinned to Onboarding during the registration flow.
    try { await AsyncStorage.setItem('onboarding_in_progress', 'true'); } catch {}

    const parent = navigation.getParent?.();

    // Use reset on the *root* navigator so it doesn't override and drop nested state.
    try {
      const nav = parent || navigation;
      nav.reset({
        index: 0,
        routes: [
          {
            name: 'Onboarding',
            state: {
              index: 0,
              routes: [
                { name: 'AppSettings', params: { from: 'login_no_account' } },
              ],
            },
          },
        ],
      });
    } catch {
      // Fallback to navigate if reset isn't available.
      const nav = parent || navigation;
      nav.navigate('Onboarding', {
        screen: 'AppSettings',
        params: { from: 'login_no_account' },
      });
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/login.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>{t('auth.loginTitle')}</Text>

      <Text style={styles.label}>{t('auth.emailFieldLabel')}</Text>
      
      <TextInput
        style={styles.input}
        placeholder=""
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.label}>{t('auth.passwordFieldLabel')}</Text>

      <View style={styles.passwordRow}>
        <TextInput
          style={[styles.input, styles.passwordInput]}
          placeholder=""
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />

        <Pressable
          style={styles.eyeButton}
          onPress={() => setShowPassword((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
        >
          <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#6b7280" />
        </Pressable>
      </View>
      
      <Pressable 
        style={styles.button} 
        onPress={handleLogin} 
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? t('auth.loginButtonLoading') : t('auth.loginButton')}
        </Text>
      </Pressable>

      <Pressable style={styles.link} onPress={handleNoAccount}>
        <Text style={styles.linkText}>{t('auth.noAccountLink')}</Text>
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
  logo: {
    width: 140,
    height: 140,
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: { 
    fontSize: 22, 
    fontWeight: '700', 
    marginBottom: 12, 
    textAlign: 'center' 
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  passwordRow: {
    position: 'relative',
    marginBottom: 12,
  },
  passwordInput: {
    marginBottom: 0,
    paddingRight: 44,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  button: { 
    backgroundColor: '#2563eb', 
    padding: 12, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: '700' 
  },
  link: { 
    marginTop: 12, 
    alignItems: 'center' 
  },
  linkText: { 
    color: '#6b7280' 
  },
});