import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  SafeAreaView,
} from 'react-native';
import { supabase } from '../utils/supabase';
import { Picker } from '@react-native-picker/picker';
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

          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.half]}
              placeholder="Edad"
              keyboardType="numeric"
              value={edad}
              onChangeText={setEdad}
            />

            <View
              style={[
                styles.input,
                styles.half,
                styles.pickerBox,
              ]}
            >
              <Picker
                selectedValue={genero}
                onValueChange={setGenero}
              >
                <Picker.Item
                  label="Selecciona género"
                  value=""
                />
                <Picker.Item
                  label="Masculino"
                  value="masculino"
                />
                <Picker.Item
                  label="Femenino"
                  value="femenino"
                />
                <Picker.Item
                  label="No binario"
                  value="no_binario"
                />
                <Picker.Item
                  label="Prefiero no decirlo"
                  value="no_especifica"
                />
              </Picker>
            </View>
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
    padding: 24,
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
  row: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  half: {
    flex: 1,
  },
  pickerBox: {
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
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
    backgroundColor: '#fb7185',
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
    color: '#fb7185',
    fontWeight: '600',
  },
  error: {
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 8,
  },
});
