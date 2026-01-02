import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Animated, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useI18n } from '../../utils/i18n';

export default function RegisterForm({ navigation, route }) {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
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

    setLoading(true);
    try {
      // Mark onboarding as in-progress BEFORE auth changes, so RootNavigator
      // won't jump to the App when the session appears.
      try { await AsyncStorage.setItem('onboarding_in_progress', 'true'); } catch (e) {}

      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      // After signing up inside onboarding, proceed to profile step.
      // Mark onboarding as in-progress so RootNavigator won't jump to App.
      navigation.replace('Profile', { onboarding: true, fromRegistration: true, fromSettings: route?.params?.fromSettings });
    } catch (err) {
      try { await AsyncStorage.removeItem('onboarding_in_progress'); } catch (e) {}
      alert(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

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
                  style={styles.input}
                />
                <TouchableOpacity onPress={() => setShowPassword((s) => !s)} style={styles.eyeButton}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={18} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>

            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={styles.btn}
                onPress={handleRegister}
                disabled={loading}
                onPressIn={() => Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start()}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('register.submit')}</Text>}
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
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
  input: { flex: 1, paddingVertical: 10 },
  eyeButton: { padding: 6 },
  btn: { 
    backgroundColor: '#2563eb', 
    padding: 14, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 6 
  },
  btnText: { color: '#fff', fontWeight: '700' },
  innerWrapper: { width: '100%', alignItems: 'center' },
});