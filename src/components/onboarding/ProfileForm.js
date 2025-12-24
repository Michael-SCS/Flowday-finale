import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../utils/supabase';

export default function ProfileForm({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [edad, setEdad] = useState('');
  const [genero, setGenero] = useState('');
  const [loading, setLoading] = useState(false);

  async function saveProfile() {
    setLoading(true);
    try {
      const user = supabase.auth.user();
      if (!user) throw new Error('Usuario no autenticado');
      const payload = {
        id: user.id,
        nombre,
        apellido,
        edad: edad ? parseInt(edad, 10) : null,
        genero,
        email: user.email,
      };
      const { error } = await supabase.from('profiles').upsert(payload);
      if (error) throw error;
      navigation.replace('Personalization');
    } catch (err) {
      alert(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.cardWrapper}>
        <Text style={styles.pageTitle}>Cuéntanos sobre ti</Text>
        <View style={styles.card}>
          <Image source={require('../../../assets/mascota_sentada.png')} style={styles.mascot} resizeMode="contain" />

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput value={nombre} onChangeText={setNombre} style={styles.input} />
          </View>
          <View style={[styles.col, { marginLeft: 12 }]}>
            <Text style={styles.label}>Apellido</Text>
            <TextInput value={apellido} onChangeText={setApellido} style={styles.input} />
          </View>
        </View>

        <View style={styles.rowSmall}>
          <View style={styles.colSmall}>
            <Text style={styles.label}>Edad</Text>
            <TextInput value={edad} onChangeText={setEdad} keyboardType="numeric" style={styles.input} />
          </View>
          <View style={[styles.colSmall, { marginLeft: 12 }]}>
            <Text style={styles.label}>Género</Text>
            <TextInput value={genero} onChangeText={setGenero} style={styles.input} />
          </View>
        </View>

        <TouchableOpacity style={styles.btn} onPress={saveProfile} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Guardar y continuar</Text>}
        </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#f8fafc', alignItems: 'center' },
  cardWrapper: { width: '100%', alignItems: 'center', position: 'relative' },
  mascot: { width: 150, height: 150, position: 'absolute', top: -80, left: 0, right: 0, marginLeft: 'auto', marginRight: 'auto', zIndex: 3 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 4, borderBottomColor: '#fde68a', alignSelf: 'center' },
  card: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 22, paddingTop: 90, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 6 },
  row: { flexDirection: 'row', marginBottom: 12 },
  rowSmall: { flexDirection: 'row', marginBottom: 12, alignItems: 'center' },
  col: { flex: 1 },
  colSmall: { flex: 1 },
  label: { marginBottom: 6, color: '#374151', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#e6eef9', borderRadius: 12, padding: 12, backgroundColor: '#f8fafc' },
  btn: { backgroundColor: '#16a34a', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 6 },
  btnText: { color: '#fff', fontWeight: '700' },
});
