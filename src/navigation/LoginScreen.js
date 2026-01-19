import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../utils/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const TOUR_PENDING_KEY = 'fluu_mascotTourPending';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValidEmail = (value) => {
    const v = (value || '').trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  };

  const showEmailInvalid = emailTouched && !!(email || '').trim() && !isValidEmail(email);

  const handleLogin = async () => {
    setLoading(true);
    
    try {
      const trimmedEmail = (email || '').trim();
      if (!trimmedEmail) {
        Alert.alert(t('auth.errorTitle'), t('auth.errorEmailRequired'));
        return;
      }

      if (!isValidEmail(trimmedEmail)) {
        setEmailTouched(true);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: trimmedEmail,
        password 
      });
      
      if (error) {
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

      // Successful login: ensure the app isn't stuck in the onboarding root.
      try { await AsyncStorage.setItem('device_onboarding_shown', 'true'); } catch {}
      try { await AsyncStorage.removeItem('onboarding_in_progress'); } catch {}

      // Login should NOT trigger the mascot tour.
      try {
        const userId = data?.user?.id;
        if (userId) {
          await AsyncStorage.removeItem(`${TOUR_PENDING_KEY}_${userId}`);
        }
      } catch {}

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
      const user = sess?.data?.session?.user ?? null;
      
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

    // Start the onboarding signup flow (RegisterForm -> Profile -> Final).
    try { await AsyncStorage.setItem('onboarding_in_progress', 'true'); } catch {}

    const parent = navigation.getParent?.();

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
                {
                  name: 'RegisterForm',
                  params: { from: 'login_no_account' },
                },
              ],
            },
          },
        ],
      });
    } catch {
      const nav = parent || navigation;
      nav.navigate('Onboarding', {
        screen: 'RegisterForm',
        params: { from: 'login_no_account' },
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 20 + (insets?.bottom || 0) }]}
        enableOnAndroid
        extraScrollHeight={24}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.innerContainer}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/login.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>{t('auth.loginTitle')}</Text>
            <View style={styles.titleUnderline} />
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.emailFieldLabel')}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="ejemplo@correo.com"
                  placeholderTextColor="#D1D5DB"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  onBlur={() => setEmailTouched(true)}
                  returnKeyType="next"
                />
              </View>
              {showEmailInvalid ? (
                <Text style={styles.inlineErrorText}>{t('auth.errorEmailInvalid')}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.passwordFieldLabel')}</Text>
              <View style={styles.passwordContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="••••••••"
                    placeholderTextColor="#D1D5DB"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                </View>
                <Pressable
                  style={styles.eyeButton}
                  onPress={() => setShowPassword((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color="#6B7280"
                  />
                </Pressable>
              </View>
            </View>

            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>{t('auth.loginButtonLoading')}</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>{t('auth.loginButton')}</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </View>
              )}
            </Pressable>
          </View>

          {/* Footer Section */}
          <View style={styles.footerSection}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable style={styles.link} onPress={handleNoAccount}>
              <Text style={styles.linkText}>{t('auth.noAccountLink')}</Text>
              <Ionicons name="chevron-forward" size={16} color="#2563EB" />
            </Pressable>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  
  // Header Styles
  headerSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  titleUnderline: {
    width: 60,
    height: 4,
    backgroundColor: '#2563EB',
    borderRadius: 2,
  },
  
  // Form Styles
  formSection: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111827',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  button: { 
    backgroundColor: '#2563EB',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#93C5FD',
    shadowOpacity: 0.15,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: { 
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  // Footer Styles
  footerSection: {
    alignItems: 'center',
    marginTop: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  link: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 6,
  },
  linkText: { 
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
  inlineErrorText: {
    marginTop: 8,
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
});