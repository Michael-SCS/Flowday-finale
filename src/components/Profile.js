import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';

export default function ProfileScreen() {
  const [reminder, setReminder] = useState('');
  const [reminders, setReminders] = useState([]);

  const addReminder = () => {
    if (!reminder.trim()) return;
    setReminders([...reminders, reminder]);
    setReminder('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>

      <TextInput
        placeholder="Nuevo recordatorio"
        value={reminder}
        onChangeText={setReminder}
        style={styles.input}
      />

      <Pressable style={styles.button} onPress={addReminder}>
        <Text style={styles.buttonText}>Agregar</Text>
      </Pressable>

      {reminders.map((r, i) => (
        <Text key={i} style={styles.reminder}>
          • {r}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 6,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
  },
  reminder: {
    fontSize: 16,
    marginBottom: 6,
  },
});
