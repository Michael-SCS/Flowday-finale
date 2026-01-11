import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  SafeAreaView,
  Modal,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { supabase } from '../utils/supabase';
import { useI18n } from '../utils/i18n';
import { useSettings } from '../utils/settingsContext';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOUR_PENDING_KEY = 'fluu_mascotTourPending';

/* ======================
   HELPERS
====================== */
function capitalizeWords(text) {
  return text
    .trim()
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ');
}

export default function Register({ navigation }) {
  const { t } = useI18n();
  const { language } = useSettings();
  // Paso actual del formulario
  const [step, setStep] = useState(1);

  // Datos de perfil
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [edad, setEdad] = useState('');
  const [genero, setGenero] = useState('');

  // Datos de cuenta
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [showPassword, setShowPassword] =
    useState(false);

  // UI y estados
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  useEffect(() => {
    if (
      Platform.OS === 'android' &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const genderKeys = ['male', 'female', 'nonBinary', 'genderFluid', 'preferNotSay', 'other'];
  const genderOptions = useMemo(() => {
    return genderKeys.map((k) => t(`profile.genderOptions.${k}`));
  }, [t]);

  const goToLogin = () => {
    const canNavigate = (nav, name) => {
      const state = nav?.getState?.();
      return Array.isArray(state?.routeNames) && state.routeNames.includes(name);
    };

    if (canNavigate(navigation, 'Login')) {
      navigation.navigate('Login');
      return;
    }

    const parent = navigation?.getParent?.();
    const root = parent?.getParent?.() || parent;
    if (canNavigate(root, 'Auth')) {
      root.navigate('Auth', { screen: 'Login' });
    }
  };

  async function handleRegister() {
    setError('');
    setLoading(true);

    const trimmedPassword = String(password || '');
    if (trimmedPassword.length < 8) {
      setPasswordTouched(true);
      setError('La contraseña debe tener al menos 8 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre: capitalizeWords(nombre) || null,
            apellido: capitalizeWords(apellido) || null,
            edad: edad ? parseInt(edad, 10) : null,
            genero: genero || null,
          },
        },
      });

      if (error) throw error;

      // Ensure we have a session; some setups return user but no session.
      let sessionUser = null;
      try {
        const { data: sess0 } = await supabase.auth.getSession();
        sessionUser = sess0?.session?.user ?? null;
      } catch {
        sessionUser = null;
      }

      if (!sessionUser) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        sessionUser = signInData?.user ?? null;
      }

      if (!sessionUser) {
        throw new Error('No se pudo iniciar sesión. Intenta de nuevo.');
      }

      // Profile row is created by a DB trigger; never INSERT from the frontend.
      // Best-effort: update profile fields without blocking the user.
      try {
        await supabase
          .from('profiles')
          .update({
            nombre: capitalizeWords(nombre),
            apellido: capitalizeWords(apellido),
            edad: edad ? parseInt(edad, 10) : null,
            genero,
            language,
          })
          .eq('id', sessionUser.id);
      } catch {
        // Do not block access if profile update fails.
      }

      // Only brand-new users coming from Register should auto-see the mascot tour.
      try {
        await AsyncStorage.setItem(`${TOUR_PENDING_KEY}_${sessionUser.id}`, 'true');
      } catch {
        // ignore
      }

      // Go directly to app
      try {
        navigation.reset({ index: 0, routes: [{ name: 'App', state: { index: 0, routes: [{ name: 'Calendar' }] } }] });
      } catch {
        try { navigation.navigate('App'); } catch {}
      }
    } catch (e) {
      const message =
        e && typeof e === 'object' && (e.message || e.error_description)
          ? String(e.message || e.error_description)
          : 'No se pudo crear la cuenta. Intenta de nuevo.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scroll}
        enableOnAndroid
        extraScrollHeight={30}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* LOGO / MASCOTA */}
          <Image
            source={require('../../assets/login.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Removed login prompt: app no longer uses a Login screen */}

          <Text style={styles.mascotWelcome}>
            {language === 'es' && 'Kuro te da la bienvenida a Fluu 🐾'}
            {language === 'en' && 'Kuro welcomes you to Fluu 🐾'}
            {language === 'pt' && 'Kuro dá as boas-vindas a você no Fluu 🐾'}
            {language === 'fr' && 'Kuro vous souhaite la bienvenue sur Fluu 🐾'}
          </Text>

          <Text style={styles.title}>{t('register.title')}</Text>
          <Text style={styles.subtitle}>
            {t('register.subtitle') || 'Empieza a organizar tu vida'}
          </Text>

          {/* INDICADOR DE PASOS */}
          <View style={styles.stepsRow}>
            <View
              style={[
                styles.stepDot,
                step >= 1 && styles.stepDotActive,
              ]}
            />
            <View
              style={[
                styles.stepLine,
                step >= 2 && styles.stepLineActive,
              ]}
            />
            <View
              style={[
                styles.stepDot,
                step >= 2 && styles.stepDotActive,
              ]}
            />
          </View>
          <Text style={styles.stepLabel}>
            {step === 1
              ? t('register.step1Title')
              : t('register.step2Title')}
          </Text>
          <Text style={styles.helperText}>
            {step === 1
              ? t('register.step1Helper')
              : t('register.step2Helper')}
          </Text>

          {/* PASO 1: NOMBRE / APELLIDO / EDAD */}
          {step === 1 && (
            <>
              <View style={styles.genderField}>
                <Text style={styles.genderLabel}>
                  {t('profile.firstName')}
                </Text>
                <TextInput
                  style={styles.input}
                  value={nombre}
                  onChangeText={setNombre}
                />
              </View>

              <View style={styles.genderField}>
                <Text style={styles.genderLabel}>
                  {t('profile.lastName')}
                </Text>
                <TextInput
                  style={styles.input}
                  value={apellido}
                  onChangeText={setApellido}
                />
              </View>

              <View style={styles.genderField}>
                <Text style={styles.genderLabel}>
                  {t('profile.age')}
                </Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={edad}
                  onChangeText={setEdad}
                />
              </View>
            </>
          )}

          {/* PASO 2: GÉNERO / EMAIL / CONTRASEÑA */}
          {step === 2 && (
            <>
              <View style={styles.genderField}>
                <Text style={styles.genderLabel}>{t('profile.gender')}</Text>
                <Pressable
                  style={styles.genderSelect}
                  onPress={() => setShowGenderModal(true)}
                >
                  <Text
                    style={
                      genero
                        ? styles.genderValue
                        : styles.genderPlaceholder
                    }
                  >
                    {genero || t('profile.genderPlaceholder')}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color="#6b7280"
                  />
                </Pressable>
              </View>

              <View style={styles.genderField}>
                <Text style={styles.genderLabel}>
                  {t('auth.emailLabel')}
                </Text>
                <TextInput
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.genderField}>
                <Text style={styles.genderLabel}>
                  {t('auth.passwordLabel')}
                </Text>
                <View style={styles.passwordBox}>
                  <TextInput
                    style={styles.passwordInput}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    onBlur={() => setPasswordTouched(true)}
                  />
                  <Pressable
                    onPress={() =>
                      setShowPassword(!showPassword)
                    }
                  >
                    <Ionicons
                      name={
                        showPassword
                          ? 'eye-off'
                          : 'eye'
                      }
                      size={22}
                      color="#6b7280"
                    />
                  </Pressable>
                </View>
                {passwordTouched && String(password || '').length > 0 && String(password || '').length < 8 ? (
                  <Text style={styles.inlineError}>La contraseña debe tener al menos 8 caracteres.</Text>
                ) : null}
              </View>
            </>
          )}

          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : null}

          {step === 2 && (
            <View style={styles.legalCard}>
              <Text style={styles.legalTitle}>{t('profile.privacyPolicy')}</Text>
              <Text style={styles.legalNote}>{t('register.policyHelper')}</Text>

              <View style={styles.acceptRow}>
                <Pressable
                  style={styles.checkbox}
                  onPress={() => setAcceptedTerms(!acceptedTerms)}
                >
                  <Ionicons
                    name={acceptedTerms ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={acceptedTerms ? '#4c1d95' : '#6b7280'}
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
          )}

          <View style={styles.actionsRow}>
            {step === 2 && (
              <Pressable
                style={styles.secondary}
                onPress={() => {
                  LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut
                  );
                  setStep(1);
                  setError('');
                }}
                disabled={loading}
              >
                <Text style={styles.secondaryText}>
                  {t('register.back')}
                </Text>
              </Pressable>
            )}

            <Pressable
              style={[
                styles.primary,
                step === 2 && !acceptedTerms
                  ? styles.primaryDisabled
                  : null,
              ]}
              onPress={
                step === 1
                  ? () => {
                      if (!nombre.trim()) {
                        setError(
                          t('register.errorNameRequired') ||
                            'Por favor, ingresa tu nombre.'
                        );
                        return;
                      }
                      setError('');
                      LayoutAnimation.configureNext(
                        LayoutAnimation.Presets.easeInEaseOut
                      );
                      setStep(2);
                    }
                  : handleRegister
              }
              disabled={
                loading || (step === 2 && !acceptedTerms)
              }
            >
              <Text style={styles.primaryText}>
                {loading
                  ? t('register.creating') || 'Creando cuenta…'
                  : step === 1
                  ? t('register.next')
                  : t('register.submit')}
              </Text>
            </Pressable>
          </View>

          {step === 2 && (
            <Pressable onPress={goToLogin}>
              <Text style={styles.link}>
                {t('register.goToLogin') || '¿Ya tienes cuenta? Inicia sesión'}
              </Text>
            </Pressable>
          )}
        </View>
      </KeyboardAwareScrollView>

      {/* MODAL GÉNERO */}
      <Modal
        visible={showGenderModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGenderModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowGenderModal(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>
              {t('register.genderModalTitle') || 'Selecciona tu género'}
            </Text>
            {genderOptions.map((option) => (
              <Pressable
                key={option}
                style={styles.genderOption}
                onPress={() => {
                  setGenero(option);
                  setShowGenderModal(false);
                }}
              >
                <Text style={styles.genderOptionText}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* MODAL POLÍTICA (mismo contenido que Perfil) */}
      <Modal
        visible={showPolicyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPolicyModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowPolicyModal(false)}
        >
          <Pressable
            style={[styles.modalContent, { maxHeight: '75%' }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>
              {t('profile.privacyPolicy')}
            </Text>
            <KeyboardAwareScrollView
              style={{ maxHeight: '70%' }}
              showsVerticalScrollIndicator
            >
              <Text style={styles.modalBodyText}>{t('profile.privacyIntro')}</Text>

              <Text style={styles.modalBodyText}>{'\n' + t('profile.privacyUseOfDataTitle')}</Text>
              <Text style={styles.modalBodyText}>{t('profile.privacyUseOfDataText')}</Text>
              <Text style={styles.modalBodyText}>• {t('profile.privacyUseOfDataBullet1')}</Text>
              <Text style={styles.modalBodyText}>• {t('profile.privacyUseOfDataBullet2')}</Text>
              <Text style={styles.modalBodyText}>• {t('profile.privacyUseOfDataBullet3')}</Text>

              <Text style={styles.modalBodyText}>{'\n' + t('profile.privacySharingTitle')}</Text>
              <Text style={styles.modalBodyText}>{t('profile.privacySharingText')}</Text>

              <Text style={styles.modalBodyText}>{'\n' + t('profile.privacyLiabilityTitle')}</Text>
              <Text style={styles.modalBodyText}>{t('profile.privacyLiabilityText')}</Text>

              <Text style={styles.modalBodyText}>{'\n' + t('profile.privacyNotAdviceTitle')}</Text>
              <Text style={styles.modalBodyText}>{t('profile.privacyNotAdviceText')}</Text>

              <Text style={styles.modalBodyText}>{'\n' + t('profile.privacyRightsTitle')}</Text>
              <Text style={styles.modalBodyText}>{t('profile.privacyRightsText')}</Text>

              <Text style={styles.modalBodyText}>{'\n' + t('profile.privacyMinorsTitle')}</Text>
              <Text style={styles.modalBodyText}>{t('profile.privacyMinorsText')}</Text>

              <Text style={styles.modalBodyText}>{'\n' + t('profile.privacyChangesTitle')}</Text>
              <Text style={styles.modalBodyText}>{t('profile.privacyChangesText')}</Text>

              <Text style={styles.modalBodyText}>{'\n' + t('profile.privacyAcceptanceText')}</Text>
            </KeyboardAwareScrollView>
            <Pressable
              style={styles.modalPrimary}
              onPress={() => setShowPolicyModal(false)}
            >
              <Text style={styles.modalPrimaryText}>
                {t('profile.policyAccept')}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

/* ======================
   ESTILOS
====================== */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff7ed',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
  },
  logo: {
    width: 130,
    height: 130,
    marginBottom: 4,
  },
  loginPromptRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 8,
  },
  loginPromptText: {
    color: '#6b7280',
    fontSize: 13,
  },
  loginPromptLink: {
    color: '#A8D8F0',
    fontSize: 13,
    fontWeight: '700',
  },
  mascotWelcome: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
  },
  stepDotActive: {
    backgroundColor: '#A8D8F0',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 6,
  },
  stepLineActive: {
    backgroundColor: '#A8D8F0',
  },
  stepLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  helperText: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
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
  actionsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  primary: {
    flex: 1,
    backgroundColor: '#A8D8F0',
    padding: 16,
    borderRadius: 18,
    marginTop: 8,
  },
  primaryDisabled: {
    opacity: 0.6,
  },
  primaryText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  secondary: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    marginTop: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryText: {
    color: '#4b5563',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  link: {
    textAlign: 'center',
    marginTop: 16,
    color: '#A8D8F0',
    fontWeight: '600',
  },
  error: {
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 8,
  },
  inlineError: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
    marginTop: -6,
    marginBottom: 8,
  },
  languageBtn: {
    width: '100%',
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  languageBtnText: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '700',
  },
  genderField: {
    width: '100%',
    marginBottom: 4,
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 6,
  },
  genderChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genderChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  genderChipActive: {
    borderColor: '#38BDF8',
    backgroundColor: '#dbeafe',
  },
  genderChipText: {
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '600',
  },
  genderChipTextActive: {
    color: '#b91c1c',
  },
  genderSelect: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  genderValue: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '500',
  },
  genderPlaceholder: {
    color: '#9ca3af',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 18,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    color: '#111827',
  },
  genderOption: {
    paddingVertical: 10,
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  genderOptionText: {
    fontSize: 15,
    color: '#111827',
    textAlign: 'center',
  },
  legalCard: {
    width: '100%',
    marginTop: 4,
    marginBottom: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#e0e7ff',
    alignItems: 'stretch',
  },
  legalTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4c1d95',
    marginBottom: 4,
    textAlign: 'center',
  },
  legalRecommended: {
    fontSize: 12,
    color: '#6b21a8',
    marginBottom: 6,
  },
  legalDescription: {
    fontSize: 12,
    color: '#4b5563',
    marginBottom: 4,
  },
  legalBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legalBulletIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  legalBulletText: {
    flex: 1,
    fontSize: 12,
    color: '#374151',
  },
  legalNote: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 6,
    textAlign: 'justify',
    alignSelf: 'stretch',
  },
  acceptRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
  checkbox: {
    marginRight: 8,
    marginTop: 2,
    flexShrink: 0,
  },
  acceptText: {
    flex: 1,
    minWidth: 0,
    fontSize: 10,
    color: '#4b5563',
    textAlign: 'justify',
    alignSelf: 'stretch',
  },
  inlinePolicyLink: {
    color: '#4c1d95',
    fontWeight: '700',
  },
  legalLinksRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  legalLink: {
    fontSize: 10,
    color: '#4c1d95',
    fontWeight: '600',
    textAlign: 'center',
  },
  legalDot: {
    marginHorizontal: 6,
    color: '#9ca3af',
  },
  modalBodyText: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 20,
  },
  modalPrimary: {
    backgroundColor: '#38BDF8',
    paddingVertical: 14,
    borderRadius: 18,
    marginTop: 12,
  },
  modalPrimaryText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 15,
  },
});
