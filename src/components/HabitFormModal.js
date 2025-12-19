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
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../utils/i18n';
import { useSettings } from '../utils/settingsContext';

/* ======================
   CONSTANTES
====================== */

const WEEK_DAYS = [
  { key: 'mon', es: 'L', en: 'M' },
  { key: 'tue', es: 'M', en: 'T' },
  { key: 'wed', es: 'X', en: 'W' },
  { key: 'thu', es: 'J', en: 'T' },
  { key: 'fri', es: 'V', en: 'F' },
  { key: 'sat', es: 'S', en: 'S' },
  { key: 'sun', es: 'D', en: 'S' },
];

const FREQUENCIES = [
  { key: 'once', icon: 'radio-button-on' },
  { key: 'daily', icon: 'today' },
  { key: 'weekly', icon: 'calendar' },
  { key: 'monthly', icon: 'calendar-outline' },
  { key: 'yearly', icon: 'time' },
];

/* ======================
   COMPONENTE
====================== */

export default function HabitFormModal({
  habit,
  selectedDate,
  editingActivity,
  initialSchedule,
  onSave,
  onClose,
  onChangeHabit,
}) {
  const { t } = useI18n();
  const { language } = useSettings();
  const baseDate = useMemo(() => {
    if (typeof selectedDate === 'string') {
      const [y, m, d] = selectedDate.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  }, [selectedDate]);

  const [startDate, setStartDate] = useState(baseDate);
  const [endDate, setEndDate] = useState(baseDate);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [activePicker, setActivePicker] = useState(null);
  const [frequency, setFrequency] = useState('once');
  const [daysOfWeek, setDaysOfWeek] = useState([]);
  const [description, setDescription] = useState('');
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (editingActivity && initialSchedule) {
      setStartDate(initialSchedule.startDate || baseDate);
      setEndDate(initialSchedule.endDate || initialSchedule.startDate || baseDate);
      setHasEndDate(!!initialSchedule.endDate);
      setFrequency(initialSchedule.frequency || 'once');
      setDaysOfWeek(
        initialSchedule.frequency === 'weekly'
          ? initialSchedule.daysOfWeek || []
          : []
      );
    } else {
      setStartDate(baseDate);
      setEndDate(baseDate);
      setHasEndDate(false);
      setFrequency('once');
      setDaysOfWeek([]);
    }
    setDescription(editingActivity?.description || '');
    setFormData(editingActivity?.data || {});
    setActivePicker(null);
  }, [habit, baseDate, editingActivity, initialSchedule]);

  const config = useMemo(() => {
    if (!habit?.config) return null;
    if (typeof habit.config === 'object') return habit.config;
    try {
      return JSON.parse(habit.config);
    } catch {
      return null;
    }
  }, [habit]);

  function toggleDay(day) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function updateField(key, value) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function renderField(field) {
    const value = formData[field.key];

    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <TextInput
            style={styles.input}
            placeholder={field.label}
            placeholderTextColor="#9ca3af"
            keyboardType={field.type === 'number' ? 'numeric' : 'default'}
            value={value || ''}
            onChangeText={(v) => updateField(field.key, v)}
          />
        );

      case 'checklist':
        return (
          <View style={styles.optionsWrap}>
            {field.options.map((opt) => {
              const selected = (value || []).includes(opt);
              return (
                <Pressable
                  key={opt}
                  style={[styles.optionBtn, selected && styles.optionBtnActive]}
                  onPress={() => {
                    const next = selected
                      ? value.filter((v) => v !== opt)
                      : [...(value || []), opt];
                    updateField(field.key, next);
                  }}
                >
                  <Ionicons
                    name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={18}
                    color={selected ? '#fff' : '#38BDF8'}
                  />
                  <Text style={[styles.optionTxt, selected && styles.optionTxtActive]}>
                    {opt}
                  </Text>
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
                <View style={styles.marketNum}>
                  <Text style={styles.marketNumTxt}>{i + 1}</Text>
                </View>
                <TextInput
                  style={[styles.input, { flex: 2 }]}
                  placeholder={t('habitForm.marketProductPlaceholder')}
                  placeholderTextColor="#9ca3af"
                  value={item.name}
                  onChangeText={(v) => {
                    const copy = [...items];
                    copy[i].name = v;
                    updateField(field.key, copy);
                  }}
                />
                <TextInput
                  style={[styles.input, { width: 60 }]}
                  placeholder={t('habitForm.marketQtyPlaceholder')}
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  value={item.qty}
                  onChangeText={(v) => {
                    const copy = [...items];
                    copy[i].qty = v;
                    updateField(field.key, copy);
                  }}
                />
                <TextInput
                  style={[styles.input, { width: 70 }]}
                  placeholder={t('habitForm.marketPricePlaceholder')}
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  value={item.price}
                  onChangeText={(v) => {
                    const copy = [...items];
                    copy[i].price = v;
                    updateField(field.key, copy);
                  }}
                />
                <Pressable
                  onPress={() => {
                    const copy = items.filter((_, idx) => idx !== i);
                    updateField(field.key, copy);
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </Pressable>
              </View>
            ))}

            <Pressable
              style={styles.addBtn}
              onPress={() =>
                updateField(field.key, [
                  ...(items || []),
                  { name: '', qty: '', price: '' },
                ])
              }
            >
              <Ionicons name="add-circle" size={20} color="#38BDF8" />
              <Text style={styles.addTxt}>
                {t('habitForm.marketAddButton')}
              </Text>
            </Pressable>
          </>
        );

      case 'vitamins': {
        const vitamins = value || [];
        return (
          <>
            {vitamins.map((item, i) => (
              <View key={i} style={styles.marketRow}>
                <View style={styles.marketNum}>
                  <Text style={styles.marketNumTxt}>{i + 1}</Text>
                </View>
                <TextInput
                  style={[styles.input, { flex: 2 }]}
                  placeholder={t('habitForm.vitaminsNamePlaceholder')}
                  placeholderTextColor="#9ca3af"
                  value={item.name}
                  onChangeText={(v) => {
                    const copy = [...vitamins];
                    copy[i].name = v;
                    updateField(field.key, copy);
                  }}
                />
                <TextInput
                  style={[styles.input, { width: 70 }]}
                  placeholder={t('habitForm.vitaminsQtyPlaceholder')}
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  value={item.qty}
                  onChangeText={(v) => {
                    const copy = [...vitamins];
                    copy[i].qty = v;
                    updateField(field.key, copy);
                  }}
                />
                <Pressable
                  onPress={() => {
                    const copy = vitamins.filter((_, idx) => idx !== i);
                    updateField(field.key, copy);
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </Pressable>
              </View>
            ))}

            <Pressable
              style={styles.addBtn}
              onPress={() =>
                updateField(field.key, [
                  ...(vitamins || []),
                  { name: '', qty: '' },
                ])
              }
            >
              <Ionicons name="add-circle" size={20} color="#22c55e" />
              <Text style={styles.addTxt}>
                {t('habitForm.vitaminsAddButton')}
              </Text>
            </Pressable>
          </>
        );
      }

      default:
        return null;
    }
  }

  function handleSave() {
    if (frequency === 'weekly' && daysOfWeek.length === 0) {
      Alert.alert(
        t('habitForm.weeklyErrorTitle'),
        t('habitForm.weeklyErrorMessage')
      );
      return;
    }

    onSave({
      habit,
      description,
      data: formData,
      editingActivityId: editingActivity?.id || null,
      schedule: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: hasEndDate ? endDate.toISOString().split('T')[0] : null,
        frequency,
        daysOfWeek: frequency === 'weekly' ? daysOfWeek : [],
      },
    });
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.overlay}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.sheet}>
        {/* HEADER SIMPLE */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image source={{ uri: habit.icon }} style={styles.icon} />
            <View>
              <Text style={styles.title}>{habit.title}</Text>
              {habit.category && (
                <Text style={styles.category}>{habit.category}</Text>
              )}
            </View>
          </View>
          <View style={styles.headerRight}>
            {onChangeHabit && (
              <Pressable style={styles.changeHabitBtn} onPress={onChangeHabit}>
                <Ionicons name="swap-horizontal" size={18} color="#2563eb" />
                <Text style={styles.changeHabitTxt}>{t('calendar.changeHabit')}</Text>
              </Pressable>
            )}
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={28} color="#111" />
            </Pressable>
          </View>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* PERIODO */}
          <View style={styles.section}>
            <Text style={styles.label}>{t('habitForm.periodLabel')}</Text>

            <Pressable
              style={styles.box}
              onPress={() => setActivePicker('start')}
            >
              <Text style={styles.boxLabel}>{t('habitForm.startLabel')}</Text>
              <View style={styles.boxRight}>
                <Text style={styles.boxValue}>
                  {startDate.toLocaleDateString(
                    language === 'en' ? 'en-US' : 'es-ES',
                    {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    }
                  )}
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
              </View>
            </Pressable>

            <Pressable
              style={styles.checkRow}
              onPress={() => setHasEndDate((v) => !v)}
            >
              <Ionicons
                name={hasEndDate ? 'checkbox' : 'square-outline'}
                size={22}
                color="#38BDF8"
              />
              <Text style={styles.checkTxt}>
                {t('habitForm.hasEndDateQuestion')}
              </Text>
            </Pressable>

            {hasEndDate && (
              <Pressable
                style={styles.box}
                onPress={() => setActivePicker('end')}
              >
                <Text style={styles.boxLabel}>{t('habitForm.endLabel')}</Text>
                <View style={styles.boxRight}>
                  <Text style={styles.boxValue}>
                    {endDate.toLocaleDateString(
                      language === 'en' ? 'en-US' : 'es-ES',
                      {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      }
                    )}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                </View>
              </Pressable>
            )}

            {activePicker && (
              <View style={styles.picker}>
                <DateTimePicker
                  value={activePicker === 'start' ? startDate : endDate}
                  mode="date"
                  minimumDate={activePicker === 'end' ? startDate : undefined}
                  display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                  locale={
                    Platform.OS === 'ios'
                      ? language === 'en'
                        ? 'en-US'
                        : 'es-ES'
                      : undefined
                  }
                  themeVariant="light"
                  textColor={Platform.OS === 'ios' ? '#111827' : undefined}
                  onChange={(_, date) => {
                    if (!date) {
                      setActivePicker(null);
                      return;
                    }
                    const prev = activePicker === 'start' ? startDate : endDate;
                    let next = date;

                    if (prev) {
                      const prevMonth = prev.getMonth();
                      const prevYear = prev.getFullYear();
                      const newMonth = date.getMonth();
                      const newYear = date.getFullYear();

                      // Si el usuario baja el mes (por ejemplo de diciembre a febrero)
                      // y el año no ha cambiado, asumimos que quiere el siguiente año
                      if (newYear === prevYear && newMonth < prevMonth) {
                        next = new Date(prevYear + 1, newMonth, date.getDate());
                      }
                    }

                    if (activePicker === 'start') {
                      setStartDate(next);
                      if (next > endDate) setEndDate(next);
                    } else {
                      setEndDate(next);
                    }
                    if (Platform.OS === 'android') setActivePicker(null);
                  }}
                />
              </View>
            )}
          </View>

          {/* FRECUENCIA */}
          <View style={styles.section}>
            <Text style={styles.label}>{t('habitForm.frequencyLabel')}</Text>

            <View style={styles.freqGrid}>
              {FREQUENCIES.map((f) => (
                <Pressable
                  key={f.key}
                  style={[styles.freqBtn, frequency === f.key && styles.freqBtnActive]}
                  onPress={() => setFrequency(f.key)}
                >
                  <Ionicons
                    name={f.icon}
                    size={20}
                    color={frequency === f.key ? '#fff' : '#38BDF8'}
                  />
                  <Text style={[styles.freqTxt, frequency === f.key && styles.freqTxtActive]}>
                    {t(`habitForm.frequency${
                      f.key.charAt(0).toUpperCase() + f.key.slice(1)
                    }`)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {frequency === 'weekly' && (
              <>
                <Text style={styles.sublabel}>
                  {t('habitForm.weeklySelectDays')}
                </Text>
                <View style={styles.daysRow}>
                  {WEEK_DAYS.map((d) => (
                    <Pressable
                      key={d.key}
                      style={[
                        styles.dayBtn,
                        daysOfWeek.includes(d.key) && styles.dayBtnActive,
                      ]}
                      onPress={() => toggleDay(d.key)}
                    >
                      <Text
                        style={[
                          styles.dayTxt,
                          daysOfWeek.includes(d.key) && styles.dayTxtActive,
                        ]}
                      >
                        {language === 'en' ? d.en : d.es}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </View>

          {/* CAMPOS PERSONALIZADOS */}
          {config?.fields?.map((field) => (
            <View key={field.key} style={styles.section}>
              <Text style={styles.label}>
                {field.type === 'market' ? '🛒' : field.type === 'checklist' ? '✅' : '✏️'}{' '}
                {field.label}
              </Text>
              {renderField(field)}
            </View>
          ))}

          {/* NOTAS */}
          <View style={styles.section}>
            <Text style={styles.label}>{t('habitForm.notesLabel')}</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder={t('habitForm.notesPlaceholder')}
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Pressable style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.saveTxt}>{t('habitForm.saveButton')}</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ======================
   ESTILOS SIMPLES
====================== */

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
  },
  category: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },

  changeHabitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#eff6ff',
  },
  changeHabitTxt: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },

  // Sections
  section: {
    padding: 20,
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  sublabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 8,
  },

  // Boxes
  box: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  boxLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  boxRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  boxValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },

  // Checkbox
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  checkTxt: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4b5563',
  },

  // Picker
  picker: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  // Frequency
  freqGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  freqBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#bfdbfe',
    backgroundColor: '#fff',
    minWidth: '30%',
  },
  freqBtnActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  freqTxt: {
    fontSize: 14,
    fontWeight: '600',
    color: '#38BDF8',
  },
  freqTxtActive: {
    color: '#fff',
  },

  // Days
  daysRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dayBtn: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBtnActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  dayTxt: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6b7280',
  },
  dayTxtActive: {
    color: '#fff',
  },

  // Inputs
  input: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#111',
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  // Options
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#bfdbfe',
    backgroundColor: '#fff',
  },
  optionBtnActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  optionTxt: {
    fontSize: 14,
    fontWeight: '600',
    color: '#38BDF8',
  },
  optionTxtActive: {
    color: '#fff',
  },

  // Market
  marketRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  marketNum: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  marketNumTxt: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#bfdbfe',
    backgroundColor: '#fffbfb',
  },
  addTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#38BDF8',
  },

  // Footer
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#38BDF8',
    padding: 18,
    borderRadius: 14,
  },
  saveTxt: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
});