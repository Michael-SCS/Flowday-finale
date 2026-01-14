import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Animated, Platform, Keyboard, TouchableWithoutFeedback, Modal, ScrollView, Pressable } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useI18n } from '../../utils/i18n';

export default function RegisterForm({ navigation, route }) {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const passwordTooShort = String(password || '').length > 0 && String(password || '').length < 8;
  
  const mascotImages = [
    require('../../../assets/mascota_calendario.png'),
    require('../../../assets/mascota_pomodoro.png'),
    require('../../../assets/mascota_final.png'),
    require('../../../assets/login.png'),
  ];
  const [mascotIndex, setMascotIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;
  const mascotScale = useRef(new Animated.Value(1)).current;
  const cardTranslate = useRef(new Animated.Value(20)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      // fade out, change image, fade in
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setMascotIndex((i) => (i + 1) % mascotImages.length);
        mascotScale.setValue(0.92);
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.spring(mascotScale, { toValue: 1, friction: 6, useNativeDriver: true }),
        ]).start();
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [opacity]);

  // card entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardTranslate, { toValue: 0, duration: 450, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  async function handleRegister() {
    if (!email || !password) {
      alert('Ingresa correo y contraseña');
      return;
    }

    if (String(password || '').length < 8) {
      setPasswordTouched(true);
      return;
    }

    if (!acceptedPolicy) {
      alert(t('register.policyHelper') || 'Debes aceptar la política para continuar.');
      return;
    }

    setLoading(true);
    try {
      // Onboarding requirement: do NOT create the user in Supabase here.
      // Save credentials locally; the real signUp happens in OnboardingFinal.
      try {
        await AsyncStorage.setItem(
          'onboarding_auth_payload',
          JSON.stringify({ email: String(email).trim(), password: String(password) })
        );
      } catch (e) {
        // ignore
      }

      navigation.replace('Profile', {
        onboarding: true,
        fromRegistration: true,
        fromSettings: route?.params?.fromSettings,
      });
    } catch (err) {
      alert(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  const goToLogin = () => {
    const canNavigate = (nav, name) => {
      const state = nav?.getState?.();
      return Array.isArray(state?.routeNames) && state.routeNames.includes(name);
    };

    // If the current navigator has Login (rare in onboarding), use it.
    if (canNavigate(navigation, 'Login')) {
      navigation.navigate('Login');
      return;
    }

    // Onboarding stack doesn't include Auth/Login; go up to the root stack.
    const parent = navigation?.getParent?.();
    const root = parent?.getParent?.() || parent;
    if (canNavigate(root, 'Auth')) {
      root.navigate('Auth', { screen: 'Login' });
      return;
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.scrollContent}
      enableOnAndroid={true}
      extraScrollHeight={20}
      keyboardShouldPersistTaps="handled"
      enableAutomaticScroll={true}
      showsVerticalScrollIndicator={false}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.innerWrapper}>
          {!keyboardVisible && (
            <Animated.Image 
              source={mascotImages[mascotIndex]} 
              style={[styles.mascot, { opacity, transform: [{ scale: mascotScale }] }]} 
              resizeMode="contain" 
            />
          )}

          <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ translateY: cardTranslate }] }]}>
            {!keyboardVisible && (
              <>
                <Text style={styles.welcome}>{t('register.welcome')}</Text>
                <Text style={styles.title}>{t('register.step1Title')}</Text>
              </>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>{t('auth.emailLabel')}</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={18} color="#9ca3af" style={{ marginRight: 8 }} />
                <TextInput 
                  autoCapitalize="none" 
                  value={email} 
                  onChangeText={setEmail} 
                  style={styles.input} 
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('auth.passwordLabel')}</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" style={{ marginRight: 8 }} />
                <TextInput 
                  secureTextEntry={!showPassword} 
                  value={password} 
                  onChangeText={setPassword} 
                  onBlur={() => setPasswordTouched(true)}
                  style={[styles.input, !showPassword && styles.passwordMasked]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  autoComplete="password"
                />
                <TouchableOpacity onPress={() => setShowPassword((s) => !s)} style={styles.eyeButton}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={18} color="#6b7280" />
                </TouchableOpacity>
              </View>
              {passwordTouched && passwordTooShort ? (
                <Text style={styles.inlineError}>La contraseña debe tener al menos 8 caracteres.</Text>
              ) : null}
            </View>

            <View style={styles.policyCard}>
              <Text style={styles.policyTitle}>{t('profile.privacyPolicy')}</Text>
              <Text style={styles.policyHelper}>{t('register.policyHelper')}</Text>
              <View style={styles.acceptRow}>
                <Pressable onPress={() => setAcceptedPolicy((v) => !v)} style={styles.checkbox}>
                  <Ionicons
                    name={acceptedPolicy ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={acceptedPolicy ? '#2563eb' : '#6b7280'}
                  />
                </Pressable>
                <Text style={styles.acceptText}>
                  {t('register.policyAcceptPrefix') || 'Acepto la '}
                  <Text style={styles.inlinePolicyLink} onPress={() => setShowPolicyModal(true)}>
                    {t('register.policyAcceptLink') || 'Política de tratamiento de datos, uso y privacidad'}
                  </Text>
                </Text>
              </View>
            </View>

            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[styles.btn, (!acceptedPolicy || loading || passwordTooShort) && styles.btnDisabled]}
                onPress={handleRegister}
                disabled={loading || !acceptedPolicy || passwordTooShort}
                onPressIn={() => Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start()}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('register.submit')}</Text>}
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity onPress={goToLogin} style={styles.loginLinkWrap}>
              <Text style={styles.loginLinkText}>
                {t('register.goToLogin') || '¿Ya tienes cuenta? Inicia sesión'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>

      <Modal
        visible={showPolicyModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPolicyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('profile.privacyPolicy')}</Text>
              <Pressable onPress={() => setShowPolicyModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              <Text style={styles.modalText}>{t('profile.privacyIntro')}</Text>

              <Text style={styles.modalSectionTitle}>{t('profile.privacyUseOfDataTitle')}</Text>
              <Text style={styles.modalText}>{t('profile.privacyUseOfDataText')}</Text>
              <Text style={styles.modalBullet}>• {t('profile.privacyUseOfDataBullet1')}</Text>
              <Text style={styles.modalBullet}>• {t('profile.privacyUseOfDataBullet2')}</Text>
              <Text style={styles.modalBullet}>• {t('profile.privacyUseOfDataBullet3')}</Text>

              <Text style={styles.modalSectionTitle}>{t('profile.privacySharingTitle')}</Text>
              <Text style={styles.modalText}>{t('profile.privacySharingText')}</Text>

              <Text style={styles.modalSectionTitle}>{t('profile.privacyLiabilityTitle')}</Text>
              <Text style={styles.modalText}>{t('profile.privacyLiabilityText')}</Text>

              <Text style={styles.modalSectionTitle}>{t('profile.privacyNotAdviceTitle')}</Text>
              <Text style={styles.modalText}>{t('profile.privacyNotAdviceText')}</Text>

              <Text style={styles.modalSectionTitle}>{t('profile.privacyRightsTitle')}</Text>
              <Text style={styles.modalText}>{t('profile.privacyRightsText')}</Text>

              <Text style={styles.modalSectionTitle}>{t('profile.privacyMinorsTitle')}</Text>
              <Text style={styles.modalText}>{t('profile.privacyMinorsText')}</Text>

              <Text style={styles.modalSectionTitle}>{t('profile.privacyChangesTitle')}</Text>
              <Text style={styles.modalText}>{t('profile.privacyChangesText')}</Text>

              <Text style={styles.modalText}>{t('profile.privacyAcceptanceText')}</Text>
            </ScrollView>

            <TouchableOpacity style={styles.modalAcceptButton} onPress={() => setShowPolicyModal(false)}>
              <Text style={styles.modalAcceptText}>{t('profile.policyAccept')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 0, backgroundColor: '#f8fafc' },
  scrollContent: { 
    flexGrow: 1,
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20,
    paddingBottom: 120,
  },
  mascot: { width: 160, height: 160, marginBottom: 8 },
  card: { 
    width: '100%', 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 18, 
    shadowColor: '#000', 
    shadowOpacity: 0.06, 
    shadowRadius: 12, 
    elevation: 6 
  },
  welcome: { fontSize: 14, textAlign: 'center', color: '#374151', marginBottom: 12, lineHeight: 20 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  field: { width: '100%', marginBottom: 12 },
  label: { alignSelf: 'flex-start', marginBottom: 6, color: '#374151', fontWeight: '600' },
  inputRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f8fafc', 
    paddingHorizontal: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#e6eef9' 
  },
  input: { flex: 1, paddingVertical: 10, color: '#111827', fontSize: 16 },
  passwordMasked: Platform.OS === 'android' ? { fontFamily: 'sans-serif' } : {},
  eyeButton: { padding: 6 },
  btn: { 
    backgroundColor: '#2563eb', 
    padding: 14, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 6 
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700' },
  innerWrapper: { width: '100%', alignItems: 'center' },
  loginLinkWrap: { marginTop: 10 },
  loginLinkText: { color: '#2563eb', fontWeight: '700' },
  policyCard: {
    width: '100%',
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6eef9',
    backgroundColor: '#fff',
    alignItems: 'stretch',
  },
  policyTitle: { fontSize: 13, fontWeight: '800', marginBottom: 6, color: '#111827', textAlign: 'center' },
  policyHelper: { fontSize: 12, color: '#374151', marginBottom: 10, lineHeight: 18, textAlign: 'justify', alignSelf: 'stretch' },
  acceptRow: { width: '100%', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'flex-start', flexWrap: 'wrap', marginBottom: 8 },
  checkbox: { marginRight: 8, marginTop: 2, flexShrink: 0 },
  acceptText: { flex: 1, minWidth: 0, fontSize: 12, color: '#374151', lineHeight: 18, textAlign: 'justify', alignSelf: 'stretch' },
  inlinePolicyLink: { color: '#2563eb', fontWeight: '800' },
  inlineError: { color: '#ef4444', fontWeight: '700', fontSize: 12, marginTop: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#111827', flex: 1, paddingRight: 10 },
  modalCloseButton: { padding: 6 },
  modalScroll: { marginTop: 6 },
  modalScrollContent: { paddingBottom: 14 },
  modalSectionTitle: { marginTop: 14, fontWeight: '800', color: '#111827' },
  modalText: { color: '#374151', lineHeight: 18, marginTop: 8 },
  modalBullet: { color: '#374151', lineHeight: 18, marginTop: 6 },
  modalAcceptButton: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
  modalAcceptText: { color: '#fff', fontWeight: '800' },
});