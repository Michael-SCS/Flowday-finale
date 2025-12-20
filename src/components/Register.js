import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  SafeAreaView,
  Modal,
} from 'react-native';
import { supabase } from '../utils/supabase';
import { useI18n } from '../utils/i18n';
import { useSettings } from '../utils/settingsContext';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';

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
  const { language, setLanguage } = useSettings();
  // Paso actual del formulario
  const [step, setStep] = useState(1);
  const [languageChosen, setLanguageChosen] = useState(false);

  // Datos de perfil
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [edad, setEdad] = useState('');
  const [genero, setGenero] = useState('');

  // Datos de cuenta
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] =
    useState(false);

  // UI y estados
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);

  const genderOptions = useMemo(() => {
    if (language === 'en') {
      return [
        'Male',
        'Female',
        'Non-binary',
        'Gender fluid',
        'Prefer not to say',
        'Other',
      ];
    }
    return [
      'Masculino',
      'Femenino',
      'No binario',
      'Género fluido',
      'Prefiero no decirlo',
      'Otro',
    ];
  }, [language]);

  async function handleRegister() {
    setError('');
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const user = data.user;

    if (user) {
      await supabase.from('profiles').insert({
        id: user.id,
        nombre: capitalizeWords(nombre),
        apellido: capitalizeWords(apellido),
        edad: edad ? parseInt(edad) : null,
        genero,
        email,
        language,
      });
    }

    setLoading(false);
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
          {/* LOGO */}
          <Image
            source={require('../../assets/adaptive-icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          {!languageChosen ? (
            <>
              <Text style={styles.title}>
                Elige tu idioma / Choose your language
              </Text>
              <Text style={styles.subtitle}>
                Selecciona cómo quieres ver la app.
              </Text>

              <View style={{ width: '100%', marginTop: 16 }}>
                <Pressable
                  style={styles.languageBtn}
                  onPress={() => {
                    setLanguage('es');
                    setLanguageChosen(true);
                    setStep(1);
                  }}
                >
                  <Text style={styles.languageBtnText}>Español</Text>
                </Pressable>

                <Pressable
                  style={[styles.languageBtn, { marginTop: 10 }]}
                  onPress={() => {
                    setLanguage('en');
                    setLanguageChosen(true);
                    setStep(1);
                  }}
                >
                  <Text style={styles.languageBtnText}>English</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
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

              {/* PASO 1: NOMBRE / APELLIDO / EDAD */}
              {step === 1 && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder={t('profile.firstName')}
                    value={nombre}
                    onChangeText={setNombre}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder={t('profile.lastName')}
                    value={apellido}
                    onChangeText={setApellido}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder={t('profile.age')}
                    keyboardType="numeric"
                    value={edad}
                    onChangeText={setEdad}
                  />
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

                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.emailLabel')}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                  />

                  <View style={styles.passwordBox}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder={t('auth.passwordLabel')}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
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
                </>
              )}
            </>
          )}

          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : null}

          {/* BOTONES DE NAVEGACIÓN ENTRE PASOS */}
          {languageChosen && (
            <View style={styles.actionsRow}>
              {step > 1 && (
                <Pressable
                  style={styles.secondary}
                  onPress={() => {
                    setError('');
                    setStep(step - 1);
                  }}
                  disabled={loading}
                >
                  <Text style={styles.secondaryText}>
                    Atrás
                  </Text>
                </Pressable>
              )}

              {step === 1 && (
                <Pressable
                  style={styles.primary}
                  onPress={() => {
                    // Validación simple antes de avanzar
                    if (!nombre.trim()) {
                      setError(
                        t('register.errorNameRequired') ||
                          'Por favor, ingresa tu nombre.'
                      );
                      return;
                    }
                    setError('');
                    setStep(2);
                  }}
                >
                  <Text style={styles.primaryText}>
                    {t('register.next')}
                  </Text>
                </Pressable>
              )}

              {step === 2 && (
                <Pressable
                  style={styles.primary}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  <Text style={styles.primaryText}>
                    {loading
                      ? t('register.creating') || 'Creando cuenta…'
                      : t('register.submit')}
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.link}>
              {t('register.goToLogin') || 'Ya tengo una cuenta'}
            </Text>
          </Pressable>
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
    backgroundColor: '#38BDF8',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 6,
  },
  stepLineActive: {
    backgroundColor: '#38BDF8',
  },
  stepLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
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
    backgroundColor: '#38BDF8',
    padding: 16,
    borderRadius: 18,
    marginTop: 8,
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
    color: '#38BDF8',
    fontWeight: '600',
  },
  error: {
    color: '#ef4444',
    textAlign: 'center',
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
});
