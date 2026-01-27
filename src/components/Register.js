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
  UIManager,
} from 'react-native';
import { supabase } from '../utils/supabase';
import { useI18n } from '../utils/i18n';
import { useSettings } from '../utils/settingsContext';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';

/* ======================
   HELPERS
====================== */
function capitalizeWords(text = '') {
  return text
    .trim()
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function Register({ navigation }) {
  const { t } = useI18n();
  const { language } = useSettings();

  // Perfil
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [edad, setEdad] = useState('');
  const [genero, setGenero] = useState('');

  // Cuenta
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // UI
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
  const genderOptions = useMemo(
    () => genderKeys.map(k => t(`profile.genderOptions.${k}`)),
    [t]
  );

  const goToApp = () => {
    const root = navigation?.getParent?.();
    try {
      root?.reset?.({ index: 0, routes: [{ name: 'App' }] });
    } catch {
      try {
        root?.navigate?.('App');
      } catch {}
    }
  };

  async function handleRegister() {
    setError('');
    setLoading(true);

    if (String(password).length < 8) {
      setPasswordTouched(true);
      setError('La contraseña debe tener al menos 8 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
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

      let sessionUser = null;
      const { data: sess } = await supabase.auth.getSession();
      sessionUser = sess?.session?.user ?? null;

      if (!sessionUser) {
        const { data, error } =
          await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        sessionUser = data?.user ?? null;
      }

      if (!sessionUser) {
        throw new Error('No se pudo iniciar sesión.');
      }

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
      } catch {}

      navigation.reset({
        index: 0,
        routes: [{ name: 'App' }],
      });
    } catch (e) {
      setError(e?.message || 'No se pudo crear la cuenta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAwareScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Image source={require('../../assets/login.png')} style={styles.logo} />

          <Text style={styles.mascotWelcome}>
            {language === 'es' && 'Kuro te da la bienvenida a Fluu 🐾'}
            {language === 'en' && 'Kuro welcomes you to Fluu 🐾'}
            {language === 'pt' && 'Kuro dá as boas-vindas a você no Fluu 🐾'}
            {language === 'fr' && 'Kuro vous souhaite la bienvenue sur Fluu 🐾'}
          </Text>

          <Text style={styles.title}>{t('register.title')}</Text>
          <Text style={styles.subtitle}>{t('register.subtitle')}</Text>

          <TextInput style={styles.input} placeholder={t('profile.firstName')} value={nombre} onChangeText={setNombre} />
          <TextInput style={styles.input} placeholder={t('profile.lastName')} value={apellido} onChangeText={setApellido} />
          <TextInput style={styles.input} placeholder={t('profile.age')} keyboardType="numeric" value={edad} onChangeText={setEdad} />

          <Pressable style={styles.genderSelect} onPress={() => setShowGenderModal(true)}>
            <Text>{genero || t('profile.genderPlaceholder')}</Text>
            <Ionicons name="chevron-down" size={18} />
          </Pressable>

          <TextInput style={styles.input} placeholder={t('auth.emailLabel')} value={email} onChangeText={setEmail} autoCapitalize="none" />
          <TextInput
            style={styles.input}
            placeholder={t('auth.passwordLabel')}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={styles.primary} onPress={handleRegister} disabled={!acceptedTerms || loading}>
            <Text style={styles.primaryText}>
              {loading ? 'Creando cuenta…' : t('register.submit')}
            </Text>
          </Pressable>

          <Pressable onPress={goToApp}>
            <Text style={styles.linkSecondary}>{t('register.backToApp')}</Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

/* ======================
   ESTILOS
====================== */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff7ed' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 28, padding: 24 },
  logo: { width: 130, height: 130, alignSelf: 'center' },
  mascotWelcome: { textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  subtitle: { textAlign: 'center', marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  primary: { backgroundColor: '#A8D8F0', padding: 16, borderRadius: 18 },
  primaryText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
  linkSecondary: { textAlign: 'center', marginTop: 12, color: '#64748b' },
  error: { color: '#ef4444', textAlign: 'center' },
  genderSelect: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderWidth: 1, borderRadius: 14, marginBottom: 12 },
});
