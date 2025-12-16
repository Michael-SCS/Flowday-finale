import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const WEEK_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export default function HabitFormModal({
  habit,
  date,
  onSave,
  onClose,
}) {
  const [frequency, setFrequency] = useState('daily');
  const [days, setDays] = useState([]);
  const [description, setDescription] = useState('');

  function toggleDay(day) {
    setDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  }

  function handleSave() {
    onSave({
      type: habit.type,
      title: habit.title,
      icon: habit.icon,
      frequency,
      days: frequency === 'weekly' ? days : [],
      description,
      date,
    });
  }

  return (
    <View style={styles.sheet}>
      {/* HEADER */}
      <View style={styles.header}>
        <Image source={{ uri: habit.icon }} style={styles.icon} />
        <Text style={styles.title}>{habit.title}</Text>
      </View>

      {/* 👇 SOLO EL CONTENIDO SE AJUSTA AL TECLADO */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {/* FRECUENCIA */}
          <Text style={styles.label}>Frecuencia</Text>
          <View style={styles.row}>
            {[
              ['daily', 'Diaria'],
              ['weekly', 'Semanal'],
              ['monthly', 'Mensual'],
              ['yearly', 'Anual'],
            ].map(([key, label]) => (
              <Pressable
                key={key}
                onPress={() => setFrequency(key)}
                style={[
                  styles.freqBtn,
                  frequency === key &&
                    styles.freqBtnActive,
                ]}
              >
                <Text>{label}</Text>
              </Pressable>
            ))}
          </View>

          {/* SEMANAL */}
          {frequency === 'weekly' && (
            <>
              <Text style={styles.label}>
                Días de la semana
              </Text>
              <View style={styles.row}>
                {WEEK_DAYS.map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => toggleDay(d)}
                    style={[
                      styles.dayBtn,
                      days.includes(d) &&
                        styles.dayBtnActive,
                    ]}
                  >
                    <Text
                      style={{
                        color: days.includes(d)
                          ? '#fff'
                          : '#111827',
                      }}
                    >
                      {d}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {/* DESCRIPCIÓN */}
          <Text style={styles.label}>
            Descripción (opcional)
          </Text>
          <TextInput
            style={styles.textarea}
            placeholder="Escribe algo si lo deseas…"
            placeholderTextColor="#9ca3af"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ACCIONES (NO SE MUEVEN) */}
      <Pressable style={styles.save} onPress={handleSave}>
        <Text style={styles.saveText}>Guardar</Text>
      </Pressable>

      <Pressable onPress={onClose}>
        <Text style={styles.cancel}>Cancelar</Text>
      </Pressable>
    </View>
  );
}

/* ======================
   ESTILOS
====================== */
const styles = StyleSheet.create({
  sheet: {
    backgroundColor: '#fff7ed',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    width: 48,
    height: 48,
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  label: {
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  freqBtn: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  freqBtnActive: {
    backgroundColor: '#fde68a',
  },
  dayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  dayBtnActive: {
    backgroundColor: '#fb7185',
  },
  textarea: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    minHeight: 100,
  },
  save: {
    backgroundColor: '#fb7185',
    padding: 16,
    borderRadius: 16,
    marginTop: 12,
  },
  saveText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  cancel: {
    textAlign: 'center',
    marginTop: 10,
    color: '#6b7280',
  },
});
