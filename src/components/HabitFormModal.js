import React, { useState, useMemo, useEffect } from 'react';
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

/* ======================
   CONSTANTES
====================== */

const WEEK_DAYS = [
  { key: 'mon', label: 'L' },
  { key: 'tue', label: 'M' },
  { key: 'wed', label: 'X' },
  { key: 'thu', label: 'J' },
  { key: 'fri', label: 'V' },
  { key: 'sat', label: 'S' },
  { key: 'sun', label: 'D' },
];

/* ======================
   COMPONENTE
====================== */

export default function HabitFormModal({
  habit,
  selectedDate,
  onSave,
  onClose,
}) {
  /* ======================
     FECHA BASE
  ====================== */
  const baseDate = useMemo(() => {
    if (typeof selectedDate === 'string') {
      const [y, m, d] = selectedDate.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  }, [selectedDate]);

  const [startDate, setStartDate] = useState(baseDate);
  const [endDate, setEndDate] = useState(baseDate);

  // 👉 NUEVO: ¿tiene fin?
  const [hasEndDate, setHasEndDate] = useState(false);

  // Picker único
  const [activePicker, setActivePicker] = useState(null); // 'start' | 'end'

  /* ======================
     FRECUENCIA
  ====================== */
  const [frequency, setFrequency] = useState('once');
  const [daysOfWeek, setDaysOfWeek] = useState([]);

  /* ======================
     DATA
  ====================== */
  const [description, setDescription] = useState('');
  const [formData, setFormData] = useState({});

  /* ======================
     RESET AL ABRIR
  ====================== */
  useEffect(() => {
    setStartDate(baseDate);
    setEndDate(baseDate);
    setHasEndDate(false);
    setFrequency('once');
    setDaysOfWeek([]);
    setDescription('');
    setFormData({});
    setActivePicker(null);
  }, [habit, baseDate]);

  /* ======================
     CONFIG DESDE SUPABASE
  ====================== */
  const config = useMemo(() => {
    if (!habit?.config) return null;
    if (typeof habit.config === 'object') return habit.config;
    try {
      return JSON.parse(habit.config);
    } catch {
      return null;
    }
  }, [habit]);

  /* ======================
     HELPERS
  ====================== */
  function toggleDay(day) {
    setDaysOfWeek((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  }

  function updateField(key, value) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  /* ======================
     RENDER DINÁMICO
  ====================== */
  function renderField(field) {
    const value = formData[field.key];

    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <TextInput
            style={styles.input}
            keyboardType={field.type === 'number' ? 'numeric' : 'default'}
            value={value || ''}
            onChangeText={(v) => updateField(field.key, v)}
          />
        );

      case 'checklist':
        return (
          <View style={styles.row}>
            {field.options.map((opt) => {
              const selected = (value || []).includes(opt);
              return (
                <Pressable
                  key={opt}
                  style={[styles.chip, selected && styles.chipActive]}
                  onPress={() => {
                    const next = selected
                      ? value.filter((v) => v !== opt)
                      : [...(value || []), opt];
                    updateField(field.key, next);
                  }}
                >
                  <Text>{opt}</Text>
                </Pressable>
              );
            })}
          </View>
        );

      case 'market':
        const items = value || [];
        return (
          <>
            {items.map((item, i) => (
              <View key={i} style={styles.marketRow}>
                <TextInput
                  style={[styles.input, { flex: 2 }]}
                  placeholder="Producto"
                  value={item.name}
                  onChangeText={(v) => {
                    const copy = [...items];
                    copy[i].name = v;
                    updateField(field.key, copy);
                  }}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Cant."
                  keyboardType="numeric"
                  value={item.qty}
                  onChangeText={(v) => {
                    const copy = [...items];
                    copy[i].qty = v;
                    updateField(field.key, copy);
                  }}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="$"
                  keyboardType="numeric"
                  value={item.price}
                  onChangeText={(v) => {
                    const copy = [...items];
                    copy[i].price = v;
                    updateField(field.key, copy);
                  }}
                />
              </View>
            ))}

            <Pressable
              style={styles.addItem}
              onPress={() =>
                updateField(field.key, [
                  ...(items || []),
                  { name: '', qty: '', price: '' },
                ])
              }
            >
              <Text style={styles.addItemText}>+ Agregar item</Text>
            </Pressable>
          </>
        );

      default:
        return null;
    }
  }

  /* ======================
     GUARDAR
  ====================== */
  function handleSave() {
    onSave({
      habit,
      description,
      data: formData,
      schedule: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: hasEndDate
          ? endDate.toISOString().split('T')[0]
          : null, // 🔥 INFINITO REAL
        frequency,
        daysOfWeek: frequency === 'weekly' ? daysOfWeek : [],
      },
    });
  }

  /* ======================
     UI
  ====================== */
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.overlay}
    >
      <View style={styles.sheet}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Ionicons name="arrow-back" size={24} />
          </Pressable>

          <Text style={styles.title}>{habit.title}</Text>

          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} />
          </Pressable>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={styles.iconBox}>
            <Image source={{ uri: habit.icon }} style={styles.icon} />
          </View>

          {/* PERIODO */}
          <Text style={styles.label}>Periodo</Text>

          {/* INICIO */}
          <Pressable
            style={styles.dateBox}
            onPress={() => setActivePicker('start')}
          >
            <Text>Inicio</Text>
            <Text>{startDate.toLocaleDateString()}</Text>
          </Pressable>

          {/* TOGGLE FIN */}
          <Pressable
            style={styles.endToggle}
            onPress={() => setHasEndDate((v) => !v)}
          >
            <Ionicons
              name={hasEndDate ? 'checkbox' : 'square-outline'}
              size={20}
            />
            <Text style={{ marginLeft: 8 }}>
              ¿Esta actividad tiene fin?
            </Text>
          </Pressable>

          {/* FIN */}
          {hasEndDate && (
            <Pressable
              style={styles.dateBox}
              onPress={() => setActivePicker('end')}
            >
              <Text>Fin</Text>
              <Text>{endDate.toLocaleDateString()}</Text>
            </Pressable>
          )}

          {/* PICKER */}
          {activePicker && (
            <View style={styles.pickerWrapper}>
              <DateTimePicker
                value={activePicker === 'start' ? startDate : endDate}
                mode="date"
                minimumDate={
                  activePicker === 'end' ? startDate : undefined
                }
                display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                themeVariant="light"
                onChange={(_, date) => {
                  if (!date) {
                    setActivePicker(null);
                    return;
                  }

                  if (activePicker === 'start') {
                    setStartDate(date);
                    if (date > endDate) setEndDate(date);
                  } else {
                    setEndDate(date);
                  }

                  if (Platform.OS === 'android') {
                    setActivePicker(null);
                  }
                }}
              />
            </View>
          )}

          {/* FRECUENCIA */}
          <Text style={styles.label}>Frecuencia</Text>
          <View style={styles.row}>
            {[
              ['once', 'Una vez'],
              ['daily', 'Diaria'],
              ['weekly', 'Semanal'],
              ['monthly', 'Mensual'],
              ['yearly', 'Anual'],
            ].map(([k, l]) => (
              <Pressable
                key={k}
                style={[styles.chip, frequency === k && styles.chipActive]}
                onPress={() => setFrequency(k)}
              >
                <Text>{l}</Text>
              </Pressable>
            ))}
          </View>

          {frequency === 'weekly' && (
            <View style={styles.row}>
              {WEEK_DAYS.map((d) => (
                <Pressable
                  key={d.key}
                  style={[
                    styles.dayChip,
                    daysOfWeek.includes(d.key) &&
                      styles.dayChipActive,
                  ]}
                  onPress={() => toggleDay(d.key)}
                >
                  <Text>{d.label}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* CAMPOS EXTRA */}
          {config?.fields?.map((field) => (
            <View key={field.key}>
              <Text style={styles.label}>{field.label}</Text>
              {renderField(field)}
            </View>
          ))}

          {/* DESCRIPCIÓN */}
          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, { minHeight: 80 }]}
            multiline
            value={description}
            onChangeText={setDescription}
          />
        </ScrollView>

        <Pressable style={styles.save} onPress={handleSave}>
          <Text style={styles.saveText}>Guardar</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ======================
   ESTILOS
====================== */

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff7ed',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '95%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 16, fontWeight: '600' },
  iconBox: { alignItems: 'center', marginVertical: 10 },
  icon: { width: 48, height: 48 },
  label: { marginTop: 16, marginBottom: 6, fontWeight: '600' },

  dateBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#fff',
    borderColor: '#fde68a',
    marginBottom: 8,
  },

  endToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },

  pickerWrapper: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 8,
  },

  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 12,
    padding: 12,
  },

  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#fff',
    borderColor: '#fde68a',
  },
  chipActive: { backgroundColor: '#fde68a' },

  dayChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fde68a',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  dayChipActive: { backgroundColor: '#fde68a' },

  marketRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  addItem: {
    padding: 12,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  addItemText: { textAlign: 'center', color: '#fb7185' },

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
});
