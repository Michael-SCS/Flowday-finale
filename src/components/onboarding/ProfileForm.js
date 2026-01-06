import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Image, Alert, KeyboardAvoidingView, ScrollView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { supabase } from '../../utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useI18n } from '../../utils/i18n';
import { useSettings } from '../../utils/settingsContext';

export default function ProfileForm({ navigation, route }) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [edad, setEdad] = useState('');
  const [genero, setGenero] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { t } = useI18n();
  const { languageSource, language, themeMode } = useSettings();
  const isDark = themeMode === 'dark';

  // Función para capitalizar cada palabra
  const capitalizeWords = (text) => {
    return text
      .split(' ')
      .map(word => {
        if (word.length === 0) return '';
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!apellido.trim()) newErrors.apellido = 'El apellido es requerido';
    if (!edad.trim()) newErrors.edad = 'La edad es requerida';
    else if (parseInt(edad) < 1 || parseInt(edad) > 120) newErrors.edad = 'Edad inválida';
    if (!genero) newErrors.genero = 'Selecciona tu género';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function goNext() {
    if (!validateForm()) return;
    const profilePayload = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      edad: parseInt(edad, 10),
      genero,
    };

    const isOnboarding = !!(route?.params?.onboarding || route?.params?.fromRegistration || route?.params?.fromSettings);

    // Onboarding requirement: don't write anything to Supabase until OnboardingFinal.
    if (isOnboarding) {
      try {
        await AsyncStorage.setItem('onboarding_profile_payload', JSON.stringify(profilePayload));
      } catch {
        // ignore
      }
      navigation.replace('Final');
      return;
    }

    // Non-onboarding path (if this screen is reused elsewhere): allow saving.
    if (languageSource === 'user' || route?.params?.fromSettings) {
      setLoading(true);
      try {
        let user = null;

        const { data: sessData } = await supabase.auth.getSession();
        user = sessData?.session?.user ?? null;
        if (!user) throw new Error('Usuario no autenticado');

        if (!user) throw new Error('Usuario no autenticado');

        const payload = {
          nombre: profilePayload.nombre || '',
          apellido: profilePayload.apellido || '',
          edad: profilePayload.edad || null,
          genero: profilePayload.genero || null,
          language: language,
        };

        // Profile row is created by a DB trigger; never INSERT/UPSERT from the frontend.
        const { error } = await supabase.from('profiles').update(payload).eq('id', user.id);
        if (error) throw error;

        try {
          navigation.goBack && navigation.goBack();
        } catch {
          // ignore
        }
        return;
      } catch (err) {
        Alert.alert('Error', err.message || 'No se pudo guardar el perfil');
      } finally {
        setLoading(false);
      }
    }

    // Default fallback: just go back
    try {
      navigation.goBack && navigation.goBack();
    } catch {
      // ignore
    }
  }

  const GenderButton = ({ value, label, icon }) => (
    <TouchableOpacity
      style={[
        styles.genderBtn,
        {
          backgroundColor: isDark ? '#0f172a' : '#f8fafc',
          borderColor: isDark ? '#334155' : '#e6eef9',
        },
        genero === value && styles.genderBtnActive,
      ]}
      onPress={() => {
        setGenero(value);
        setErrors(prev => ({ ...prev, genero: null }));
      }}
    >
      <Text style={styles.genderIcon}>{icon}</Text>
      <Text style={[styles.genderText, { color: isDark ? '#94a3b8' : '#64748b' }, genero === value && styles.genderTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const isFormValid = nombre.trim() && apellido.trim() && edad.trim() && genero;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardWrapper}>
            <Image
              source={require('../../../assets/mascota_sentada.png')}
              style={styles.mascot}
              resizeMode="contain"
            />
            
            <View style={[styles.card, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
              <Text style={[styles.pageTitle, { color: isDark ? '#f1f5f9' : '#111827' }]}>{t('register.step1Helper')}</Text>

              <View style={styles.fieldContainer}>
                <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#374151' }]}>{t('profile.firstName')}</Text>
                <TextInput
                  value={nombre}
                  onChangeText={(text) => {
                    setNombre(text);
                    setErrors(prev => ({ ...prev, nombre: null }));
                  }}
                  style={[
                    styles.input,
                    { backgroundColor: isDark ? '#0f172a' : '#f8fafc', color: isDark ? '#e2e8f0' : '#1f2937', borderColor: isDark ? '#334155' : '#e6eef9' },
                    errors.nombre && styles.inputError,
                  ]}
                  placeholder={t('profile.firstName')}
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  autoCapitalize="words"
                />
                {errors.nombre && <Text style={styles.errorText}>{errors.nombre}</Text>}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#374151' }]}>{t('profile.lastName')}</Text>
                <TextInput
                  value={apellido}
                  onChangeText={(text) => {
                    setApellido(text);
                    setErrors(prev => ({ ...prev, apellido: null }));
                  }}
                  style={[
                    styles.input,
                    { backgroundColor: isDark ? '#0f172a' : '#f8fafc', color: isDark ? '#e2e8f0' : '#1f2937', borderColor: isDark ? '#334155' : '#e6eef9' },
                    errors.apellido && styles.inputError,
                  ]}
                  placeholder={t('profile.lastName')}
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  autoCapitalize="words"
                />
                {errors.apellido && <Text style={styles.errorText}>{errors.apellido}</Text>}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#374151' }]}>{t('profile.age')}</Text>
                <TextInput
                  value={edad}
                  onChangeText={(text) => {
                    setEdad(text.replace(/[^0-9]/g, ''));
                    setErrors(prev => ({ ...prev, edad: null }));
                  }}
                  keyboardType="numeric"
                  maxLength={3}
                  style={[
                    styles.input,
                    { backgroundColor: isDark ? '#0f172a' : '#f8fafc', color: isDark ? '#e2e8f0' : '#1f2937', borderColor: isDark ? '#334155' : '#e6eef9' },
                    errors.edad && styles.inputError,
                  ]}
                  placeholder="Ej: 25"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                />
                {errors.edad && <Text style={styles.errorText}>{errors.edad}</Text>}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#374151' }]}>{t('profile.gender')}</Text>
                <View style={styles.genderColumn}>
                  <GenderButton value={t('profile.genderOptions.male')} label={t('profile.genderOptions.male')} icon="♂️" />
                  <GenderButton value={t('profile.genderOptions.female')} label={t('profile.genderOptions.female')} icon="♀️" />
                  <GenderButton value={t('profile.genderOptions.other')} label={t('profile.genderOptions.other')} icon="⚧" />
                </View>
                {errors.genero && <Text style={styles.errorText}>{errors.genero}</Text>}
              </View>

              <TouchableOpacity
                style={[styles.btn, (!isFormValid || loading) && styles.btnDisabled]}
                onPress={goNext}
                disabled={!isFormValid || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>{t('register.finish') || t('register.next')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc', 
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 100,
  },
  cardWrapper: { 
    width: '100%', 
    maxWidth: 500,
    alignItems: 'center', 
    position: 'relative' 
  },
  mascot: {
    width: 120,
    height: 120,
    marginBottom: -30,
    zIndex: 1,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 3,
    borderBottomColor: '#fde68a',
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    paddingTop: 50,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  fieldContainer: {
    marginBottom: 14,
  },
  label: { 
    marginBottom: 6, 
    color: '#374151', 
    fontWeight: '600',
    fontSize: 14,
  },
  input: { 
    borderWidth: 1.5, 
    borderColor: '#e6eef9', 
    borderRadius: 12, 
    paddingHorizontal: 14,
    paddingVertical: 12, 
    backgroundColor: '#f8fafc',
    fontSize: 15,
    color: '#1f2937',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 11,
    marginTop: 4,
  },
  genderColumn: {
    gap: 10,
  },
  genderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e6eef9',
    backgroundColor: '#f8fafc',
  },
  genderBtnActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
  },
  genderIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  genderText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 15,
  },
  genderTextActive: {
    color: '#16a34a',
  },
  btn: { 
    backgroundColor: '#16a34a', 
    paddingVertical: 15, 
    borderRadius: 14, 
    alignItems: 'center', 
    marginTop: 16,
    shadowColor: '#16a34a',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.6,
    shadowOpacity: 0,
  },
  btnText: { 
    color: '#fff', 
    fontWeight: '700',
    fontSize: 16,
  },
});