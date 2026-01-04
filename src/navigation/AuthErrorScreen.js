import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function AuthErrorScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tu sesión no está activa o el usuario ya no existe</Text>
      <Text style={styles.subtitle}>
        Puede que tu cuenta haya sido eliminada, o que la sesión haya expirado. Por favor vuelve a iniciar sesión para continuar.
      </Text>
      <Pressable
        style={styles.button}
        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })}
      >
        <Text style={styles.buttonText}>Volver a iniciar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#f97316',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
