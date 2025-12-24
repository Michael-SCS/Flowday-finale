import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Image, Alert, KeyboardAvoidingView, ScrollView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { supabase } from '../../utils/supabase';
import { useI18n } from '../../utils/i18n';
import { useSettings } from '../../utils/settingsContext';

export default function ProfileForm({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [edad, setEdad] = useState('');
  const [genero, setGenero] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { t } = useI18n();
  const { languageSource, language } = useSettings();

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

  async function goToAppSettings() {
    if (!validateForm()) return;
    const profilePayload = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      edad: parseInt(edad, 10),
      genero,
    };

    // If the language was already chosen by the user earlier, skip asking again
    // and save the profile directly, then continue to Personalization.
    if (languageSource === 'user') {
      setLoading(true);
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error('Usuario no autenticado');

        const payload = {
          id: user.id,
          nombre: profilePayload.nombre || '',
          apellido: profilePayload.apellido || '',
          edad: profilePayload.edad || null,
          genero: profilePayload.genero || null,
          email: user.email,
          language: language,
        };

        const { error } = await supabase.from('profiles').upsert(payload);
        if (error) throw error;

        navigation.replace('Personalization');
        return;
      } catch (err) {
        Alert.alert('Error', err.message || 'No se pudo guardar el perfil');
      } finally {
        setLoading(false);
      }
    }

    // Otherwise, ask for language/theme now
    navigation.navigate('AppSettings', {
      profile: profilePayload,
    });
  }

  const GenderButton = ({ value, label, icon }) => (
    <TouchableOpacity
      style={[styles.genderBtn, genero === value && styles.genderBtnActive]}
      onPress={() => {
        setGenero(value);
        setErrors(prev => ({ ...prev, genero: null }));
      }}
    >
      <Text style={[styles.genderIcon, genero === value && styles.genderIconActive]}>{icon}</Text>
      <Text style={[styles.genderText, genero === value && styles.genderTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  

  const isFormValid = nombre.trim() && apellido.trim() && edad.trim() && genero;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.cardWrapper}>
            <View style={styles.card}>
              <Text style={styles.pageTitle}>{t('register.step1Helper')}</Text>
              <Image
                source={require('../../../assets/mascota_sentada.png')}
                style={styles.mascot}
                resizeMode="contain"
              />

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>{t('profile.firstName')}</Text>
                  <TextInput
                    value={nombre}
                    onChangeText={(text) => {
                      setNombre(text);
                      setErrors(prev => ({ ...prev, nombre: null }));
                    }}
                    style={[styles.input, errors.nombre && styles.inputError]}
                    placeholder={t('profile.firstName')}
                    placeholderTextColor="#94a3b8"
                  />
                  {errors.nombre && <Text style={styles.errorText}>{errors.nombre}</Text>}
                </View>
                <View style={[styles.col, { marginLeft: 12 }] }>
                  <Text style={styles.label}>{t('profile.lastName')}</Text>
                  <TextInput
                    value={apellido}
                    onChangeText={(text) => {
                      setApellido(text);
                      setErrors(prev => ({ ...prev, apellido: null }));
                    }}
                    style={[styles.input, errors.apellido && styles.inputError]}
                    placeholder={t('profile.lastName')}
                    placeholderTextColor="#94a3b8"
                  />
                  {errors.apellido && <Text style={styles.errorText}>{errors.apellido}</Text>}
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>{t('profile.age')}</Text>
                <TextInput
                  value={edad}
                  onChangeText={(text) => {
                    setEdad(text.replace(/[^0-9]/g, ''));
                    setErrors(prev => ({ ...prev, edad: null }));
                  }}
                  keyboardType="numeric"
                  maxLength={3}
                  style={[styles.input, errors.edad && styles.inputError]}
                  placeholder="Ej: 25"
                  placeholderTextColor="#94a3b8"
                />
                {errors.edad && <Text style={styles.errorText}>{errors.edad}</Text>}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>{t('profile.gender')}</Text>
                <View style={styles.genderRow}>
                  <GenderButton value={t('profile.genderOptions.male')} label={t('profile.genderOptions.male')} icon="♂️" />
                  <GenderButton value={t('profile.genderOptions.female')} label={t('profile.genderOptions.female')} icon="♀️" />
                  <GenderButton value={t('profile.genderOptions.other')} label={t('profile.genderOptions.other')} icon="⚧" />
                </View>
                {errors.genero && <Text style={styles.errorText}>{errors.genero}</Text>}
              </View>


              <TouchableOpacity
                style={[styles.btn, (!isFormValid || loading) && styles.btnDisabled]}
                onPress={goToAppSettings}
                disabled={!isFormValid || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>{t('register.next')}</Text>
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
    padding: 0, 
    backgroundColor: '#f8fafc', 
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardWrapper: { 
    width: '100%', 
    maxWidth: 500,
    alignItems: 'center', 
    position: 'relative' 
  },
  mascot: {
    width: 150,
    height: 150,
    position: 'absolute',
    top: -60,
    alignSelf: 'center',
    zIndex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 4,
    borderBottomColor: '#fde68a',
    zIndex: 3,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 22,
    paddingTop: 120,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
  },
  row: { 
    flexDirection: 'row', 
    marginBottom: 16 
  },
  col: { 
    flex: 1 
  },
  fieldContainer: {
    marginBottom: 16
  },
  label: { 
    marginBottom: 6, 
    color: '#374151', 
    fontWeight: '600',
    fontSize: 14
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#e6eef9', 
    borderRadius: 12, 
    padding: 12, 
    backgroundColor: '#f8fafc',
    fontSize: 16,
    color: '#1f2937'
  },
  inputError: {
    borderColor: '#ef4444'
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
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
    fontSize: 18,
    marginRight: 6,
  },
  genderIconActive: {
    fontSize: 18,
  },
  genderText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 13,
  },
  genderTextActive: {
    color: '#16a34a',
  },
  
  btn: { 
    backgroundColor: '#16a34a', 
    padding: 14, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 8 
  },
  btnDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.6
  },
  btnText: { 
    color: '#fff', 
    fontWeight: '700',
    fontSize: 16
  },
});