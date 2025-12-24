import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../utils/supabase';

export default function RegisterForm({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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

  async function handleRegister() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      navigation.replace('Profile');
    } catch (err) {
      alert(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Animated.Image source={mascotImages[mascotIndex]} style={[styles.mascot, { opacity, transform: [{ scale: mascotScale }] }]} resizeMode="contain" />

      <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ translateY: cardTranslate }] }] }>
        <Text style={styles.welcome}>🌱 Bienvenido a Fluu{"\n\n"}Estás a punto de empezar un espacio creado para ayudarte a organizar tus días, crear hábitos y avanzar a tu propio ritmo.{"\n"}Aquí no se trata de hacerlo perfecto, sino de hacerlo posible.{"\n\n"}Regístrate y comencemos paso a paso ✨</Text>

        <Text style={styles.title}>Email y password</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={18} color="#9ca3af" style={{ marginRight: 8 }} />
            <TextInput autoCapitalize="none" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" style={{ marginRight: 8 }} />
            <TextInput secureTextEntry={!showPassword} value={password} onChangeText={setPassword} style={styles.input} />
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
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Crear</Text>}
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  mascot: { width: 160, height: 160, marginBottom: 8 },
  card: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 6 },
  welcome: { fontSize: 14, textAlign: 'center', color: '#374151', marginBottom: 12, lineHeight: 20 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  field: { width: '100%', marginBottom: 12 },
  label: { alignSelf: 'flex-start', marginBottom: 6, color: '#374151', fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e6eef9' },
  input: { flex: 1, paddingVertical: 10 },
  eyeButton: { padding: 6 },
  btn: { backgroundColor: '#2563eb', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 6 },
  btnText: { color: '#fff', fontWeight: '700' },
});
