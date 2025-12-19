import React, { useState } from 'react';
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
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [edad, setEdad] = useState('');
  const [genero, setGenero] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGenderModal, setShowGenderModal] =
    useState(false);

  const genderOptions = [
    'Masculino',
    'Femenino',
    'No binario',
    'Género fluido',
    'Prefiero no decirlo',
    'Otro',
  ];

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

          <Text style={styles.title}>Crea tu cuenta</Text>
          <Text style={styles.subtitle}>
            Empieza a organizar tu vida 🌱
          </Text>

          {/* FORMULARIO */}
          <TextInput
            style={styles.input}
            placeholder="Nombre"
            value={nombre}
            onChangeText={setNombre}
          />

          <TextInput
            style={styles.input}
            placeholder="Apellido"
            value={apellido}
            onChangeText={setApellido}
          />

          <TextInput
            style={styles.input}
            placeholder="Edad"
            keyboardType="numeric"
            value={edad}
            onChangeText={setEdad}
          />

          <View style={styles.genderField}>
            <Text style={styles.genderLabel}>Género</Text>
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
                {genero || 'Selecciona género'}
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
            placeholder="Correo"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          {/* CONTRASEÑA CON OJO */}
          <View style={styles.passwordBox}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Contraseña"
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

          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : null}

          <Pressable
            style={styles.primary}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.primaryText}>
              {loading
                ? 'Creando cuenta…'
                : 'Registrarme'}
            </Text>
          </Pressable>

          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.link}>
              Ya tengo una cuenta
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
              Selecciona tu género
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
  primary: {
    width: '100%',
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
