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
import MarketAddModal from './MarketAddModal';
import VitaminsAddModal from './VitaminsAddModal';
import { useI18n } from '../utils/i18n';
import { useSettings } from '../utils/settingsContext';
import { formatTimeFromDate } from '../utils/timeFormat';
import { Picker } from '@react-native-picker/picker';
import { translateHabitCategory } from '../utils/habitCategories';

/* ======================
   CONSTANTES
====================== */

const WEEK_DAYS = [
  { key: 'mon', es: 'L', en: 'M', pt: 'S', fr: 'L' },
  { key: 'tue', es: 'M', en: 'T', pt: 'T', fr: 'M' },
  { key: 'wed', es: 'X', en: 'W', pt: 'Q', fr: 'M' },
  { key: 'thu', es: 'J', en: 'T', pt: 'Q', fr: 'J' },
  { key: 'fri', es: 'V', en: 'F', pt: 'S', fr: 'V' },
  { key: 'sat', es: 'S', en: 'S', pt: 'S', fr: 'S' },
  { key: 'sun', es: 'D', en: 'S', pt: 'D', fr: 'D' },
];

const FREQUENCIES = [
  { key: 'once', icon: 'radio-button-on' },
  { key: 'daily', icon: 'today' },
  { key: 'weekly', icon: 'calendar' },
  { key: 'monthly', icon: 'calendar-outline' },
  { key: 'yearly', icon: 'time' },
];

const COLOR_OPTIONS = [
  '#A8D8F0', // blue
  '#F5B3C1', // pink
  '#FEE8A8', // yellow
  '#D4B5E8', // purple
  '#A8DDD4', // teal
  '#A8E6C1', // green
  '#FFDCB3', // orange
  '#F5B3A3', // red
];

function getContrastColorLocal(hex) {
  try {
    if (!hex || typeof hex !== 'string') return '#ffffff';
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map((ch) => ch + ch).join('');
    const r = parseInt(c.substr(0, 2), 16);
    const g = parseInt(c.substr(2, 2), 16);
    const b = parseInt(c.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    // Prefer a darker check for better visibility in modals; lower the threshold
    return luminance > 0.35 ? '#111827' : '#ffffff';
  } catch {
    return '#ffffff';
  }
}

function normalizeMarketProductName(name) {
  return String(name ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function parseMoneyLike(value) {
  const n = parseFloat(String(value ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function formatMarketValue(value, currencySymbol) {
  const n = parseMoneyLike(value);
  if (n === null) return `${currencySymbol}${String(value ?? 0)}`;
  // keep it simple; avoid locale deps
  return `${currencySymbol}${n}`;
}

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
  const { language, themeMode, timeFormat } = useSettings();

  const isDark = themeMode === 'dark';

  const baseDate = useMemo(() => {
    if (selectedDate instanceof Date) return selectedDate;
    if (typeof selectedDate === 'string') {
      const [y, m, d] = selectedDate.split('-').map((n) => parseInt(n, 10));
      if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
        return new Date(y, m - 1, d);
      }
    }
    return new Date();
  }, [selectedDate]);

  const [startDate, setStartDate] = useState(baseDate);
  const [endDate, setEndDate] = useState(baseDate);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [activePicker, setActivePicker] = useState(null);
  const [frequency, setFrequency] = useState('once');
  const [daysOfWeek, setDaysOfWeek] = useState([]);
  const [formData, setFormData] = useState({});
  const [time, setTime] = useState(null);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(null);
  const [durationPickerValue, setDurationPickerValue] = useState('');

  const [selectedColor, setSelectedColor] = useState('#A8D8F0');
  const [marketAddVisible, setMarketAddVisible] = useState(false);
  const [marketAddFieldKey, setMarketAddFieldKey] = useState(null);
  const [vitaminsAddVisible, setVitaminsAddVisible] = useState(false);
  const [vitaminsAddFieldKey, setVitaminsAddFieldKey] = useState(null);

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
      if (initialSchedule.time) {
        const [h, m] = String(initialSchedule.time).split(':').map(Number);
        const d = new Date(baseDate);
        d.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
        setTime(d);
      } else {
        setTime(null);
      }
      if (typeof initialSchedule.durationMinutes === 'number') {
        setDurationMinutes(initialSchedule.durationMinutes);
        if ([10, 15, 30, 60].includes(initialSchedule.durationMinutes)) {
          setDurationPickerValue(String(initialSchedule.durationMinutes));
        } else {
          setDurationPickerValue('custom');
        }
      } else {
        setDurationMinutes(null);
        setDurationPickerValue('');
      }
    } else {
      setStartDate(baseDate);
      setEndDate(baseDate);
      setHasEndDate(false);
      setFrequency('once');
      setDaysOfWeek([]);
      // Por defecto, usar la hora actual del dispositivo
      setTime(new Date());
      setDurationMinutes(null);
      setDurationPickerValue('');
    }
    // Notes/description section removed.
    setFormData(editingActivity?.data || {});
    // Inicializar color desde la actividad editada o desde la plantilla
    const initialColor = editingActivity?.data?.color || habit?.color || '#38BDF8';
    setSelectedColor(initialColor);
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
            style={[styles.input, isDark && styles.inputDark]}
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
            {items.length > 0 && (
              <Text style={[styles.sectionLabel, isDark && { color: '#e5e7eb', marginBottom: 8 }]}>
                {t('habitForm.marketSectionTitle') || 'Productos'}
              </Text>
            )}

            {items.map((item, i) => (
              <View key={i} style={[styles.marketCard, isDark && styles.marketCardDark]}>
                <View style={styles.marketCardHeader}>
                  <Text style={[styles.marketCardIndex, isDark && { color: '#cbd5e1' }]}>{i + 1}</Text>
                  <Pressable onPress={() => {
                    const copy = items.filter((_, idx) => idx !== i);
                    updateField(field.key, copy);
                  }}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </Pressable>
                </View>

                <TextInput
                  style={[styles.input, isDark && styles.inputDark, { marginBottom: 8 }]}
                  value={item.name}
                  onChangeText={(v) => {
                    const copy = [...items];
                    copy[i].name = v;
                    updateField(field.key, copy);
                  }}
                  placeholder={t('habitForm.marketProductPlaceholder')}
                  placeholderTextColor={isDark ? '#94a3af' : '#9ca3af'}
                />

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    style={[styles.input, isDark && styles.inputDark, { flex: 1 }]}
                    keyboardType="numeric"
                    value={String(item.qty || '')}
                    onChangeText={(v) => {
                      const copy = [...items];
                      copy[i].qty = v;
                      updateField(field.key, copy);
                    }}
                    placeholder={t('habitForm.marketQtyPlaceholder')}
                    placeholderTextColor={isDark ? '#94a3af' : '#9ca3af'}
                  />

                  <TextInput
                    style={[styles.input, isDark && styles.inputDark, { width: 120 }]}
                    keyboardType="numeric"
                    value={String(item.price || '')}
                    onChangeText={(v) => {
                      const copy = [...items];
                      copy[i].price = v;
                      updateField(field.key, copy);
                    }}
                    placeholder={t('habitForm.marketPricePlaceholder')}
                    placeholderTextColor={isDark ? '#94a3af' : '#9ca3af'}
                  />
                </View>
              </View>
            ))}

            <Pressable
              style={[styles.addBtn, { marginTop: 10 }]}
              onPress={() => {
                setMarketAddFieldKey(field.key);
                setMarketAddVisible(true);
              }}
            >
              <Ionicons name="add-circle" size={20} color="#38BDF8" />
              <Text style={styles.addTxt}>
                {t('habitForm.marketAddButton')}
              </Text>
            </Pressable>

            <MarketAddModal
              visible={marketAddVisible}
              onClose={() => setMarketAddVisible(false)}
              onAdd={(newItem) => {
                const incomingName = String(newItem.product || newItem.name || '').trim();
                const nextNameKey = normalizeMarketProductName(incomingName);

                if (!nextNameKey) {
                  setMarketAddVisible(false);
                  return;
                }

                const existing = (items || []).find(
                  (it) => normalizeMarketProductName(it?.name) === nextNameKey
                );

                if (existing) {
                  const currency = t('habitForm.marketPricePlaceholder') || '$';
                  const valueText = formatMarketValue(existing?.price, currency);
                  Alert.alert(
                    t('habitForm.marketDuplicateTitle') || 'Producto repetido',
                    `"${incomingName}" ${t('habitForm.marketDuplicateMessage') || 'ya está en la lista de compras por un valor de'} ${valueText}.`
                  );
                  setMarketAddVisible(false);
                  return;
                }

                const copy = [...(items || [])];
                copy.push({
                  name: incomingName,
                  qty: String(newItem.quantity || ''),
                  price: String(newItem.price || ''),
                });
                updateField(field.key, copy);
                setMarketAddVisible(false);
              }}
            />
          </>
        );

      case 'vitamins': {
        const vitamins = value || [];
        return (
          <>
            {vitamins.length > 0 && (
              <View style={styles.marketHeaderRow}>
                <View style={{ flex: 2 }}>
                  <Text style={[styles.marketHeaderText, isDark && { color: '#e5e7eb' }]}>
                    {t('habitForm.vitaminsNamePlaceholder')}
                  </Text>
                </View>
                <View style={{ width: 70 }}>
                  <Text style={[styles.marketHeaderText, isDark && { color: '#e5e7eb' }]}>
                    {t('habitForm.vitaminsQtyPlaceholder')}
                  </Text>
                </View>
              </View>
            )}
            {vitamins.map((item, i) => (
              <View key={i} style={[styles.marketRow, isDark && { backgroundColor: '#020617', borderColor: '#1e293b' }]}>
                <View style={styles.marketNum}>
                  <Text style={styles.marketNumTxt}>{i + 1}</Text>
                </View>
                <TextInput
                  style={[styles.input, isDark && styles.inputDark, styles.marketInput, { flex: 2 }]}
                  value={item.name}
                  onChangeText={(v) => {
                    const copy = [...vitamins];
                    copy[i].name = v;
                    updateField(field.key, copy);
                  }}
                />
                <TextInput
                  style={[styles.input, isDark && styles.inputDark, styles.marketInput, { width: 70 }]}
                  keyboardType="numeric"
                  value={String(item.qty ?? item.quantity ?? '')}
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
              onPress={() => {
                setVitaminsAddFieldKey(field.key);
                setVitaminsAddVisible(true);
              }}
            >
              <Ionicons name="add" size={22} color="#22c55e" />
            </Pressable>

            <VitaminsAddModal
              visible={vitaminsAddVisible}
              onClose={() => setVitaminsAddVisible(false)}
              onAdd={(newItem) => {
                if (!vitaminsAddFieldKey) {
                  setVitaminsAddVisible(false);
                  return;
                }

                const incomingName = String(newItem?.name || '').trim();
                if (!incomingName) {
                  setVitaminsAddVisible(false);
                  return;
                }

                const copy = [...(vitamins || [])];
                copy.push({
                  name: incomingName,
                  qty: String(newItem?.quantity ?? ''),
                });
                updateField(vitaminsAddFieldKey, copy);
                setVitaminsAddVisible(false);
              }}
            />
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

    // Validate: market list must not contain repeated products (case-insensitive)
    const marketFields = (config?.fields || []).filter((f) => f?.type === 'market');
    for (const field of marketFields) {
      const list = Array.isArray(formData?.[field.key]) ? formData[field.key] : [];
      const seen = new Map();
      for (const item of list) {
        const key = normalizeMarketProductName(item?.name);
        if (!key) continue;
        if (seen.has(key)) {
          const existing = seen.get(key);
          const currency = t('habitForm.marketPricePlaceholder') || '$';
          const valueText = formatMarketValue(existing?.price, currency);
          Alert.alert(
            t('habitForm.marketDuplicateTitle') || 'Producto repetido',
            `"${String(item?.name || existing?.name || '').trim()}" ${t('habitForm.marketDuplicateMessage') || 'ya está en la lista de compras por un valor de'} ${valueText}.`
          );
          return;
        }
        seen.set(key, item);
      }
    }

    const timeString = time
      ? `${String(time.getHours()).padStart(2, '0')}:${String(
          time.getMinutes()
        ).padStart(2, '0')}`
      : null;

    const DEFAULT_DURATION_IF_EMPTY_MINUTES = 60;

    const normalizedDuration =
      typeof durationMinutes === 'number' && durationMinutes > 0
        ? durationMinutes
        : timeString
          ? DEFAULT_DURATION_IF_EMPTY_MINUTES
          : null;

    let endTimeString = null;
    if (time && normalizedDuration) {
      const startTotalMinutes = time.getHours() * 60 + time.getMinutes();
      const total = startTotalMinutes + normalizedDuration;
      const endHour = Math.floor(total / 60) % 24;
      const endMin = total % 60;
      endTimeString = `${String(endHour).padStart(2, '0')}:${String(
        endMin
      ).padStart(2, '0')}`;
    }

    const formatLocalYMD = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    onSave({
      habit,
      data: {
        ...formData,
        color: selectedColor,
      },
      editingActivityId: editingActivity?.id || null,
      schedule: {
        // Use local date (not UTC) to avoid shifting the scheduled day on some devices/timezones.
        startDate: formatLocalYMD(startDate),
        endDate: hasEndDate ? formatLocalYMD(endDate) : null,
        frequency,
        daysOfWeek: frequency === 'weekly' ? daysOfWeek : [],
        time: timeString,
        durationMinutes: normalizedDuration,
        endTime: endTimeString,
      },
    });
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.overlay}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={[styles.sheet, isDark && { backgroundColor: '#020617' }]}>
        {/* HEADER SIMPLE */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
              {onChangeHabit && (
                <Pressable onPress={onChangeHabit} style={{ marginRight: 8 }}>
                  <Ionicons name="arrow-back" size={20} color="#2563eb" />
                </Pressable>
              )}
              <Image source={{ uri: habit.icon }} style={styles.icon} />
              <View>
                <Text style={[styles.title, isDark && { color: '#e5e7eb' }]}>{habit.title}</Text>
                {habit.category && (
                      <Text style={[styles.category, isDark && { color: '#9ca3af' }]}>
                        {translateHabitCategory(habit.category, language)}
                      </Text>
                    )}
              </View>
            </View>
          <View style={styles.headerRight}>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={28} color={isDark ? '#e5e7eb' : '#111'} />
            </Pressable>
          </View>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* PERIODO */}
          <View style={styles.section}>
            <Text style={[styles.label, isDark && { color: '#e5e7eb' }]}>{t('habitForm.periodLabel')}</Text>

            <Pressable
              style={[styles.box, isDark && { backgroundColor: '#020617', borderColor: '#1e293b' }]}
              onPress={() => setActivePicker('start')}
            >
              <Text style={[styles.boxLabel, isDark && { color: '#e5e7eb' }]}>{t('habitForm.startLabel')}</Text>
              <View style={styles.boxRight}>
                <Text style={[styles.boxValue, isDark && { color: '#e5e7eb' }]}>                  
                  {startDate.toLocaleDateString(
                    language === 'en' ? 'en-US' : 'es-ES',
                    {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    }
                  )}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={isDark ? '#9ca3af' : '#9ca3af'} />
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
              <Text style={[styles.checkTxt, isDark && { color: '#e5e7eb' }]}>
                {t('habitForm.hasEndDateQuestion')}
              </Text>
            </Pressable>

            {hasEndDate && (
              <Pressable
                style={[styles.box, isDark && { backgroundColor: '#020617', borderColor: '#1e293b' }]}
                onPress={() => setActivePicker('end')}
              >
                <Text style={[styles.boxLabel, isDark && { color: '#e5e7eb' }]}>{t('habitForm.endLabel')}</Text>
                <View style={styles.boxRight}>
                  <Text style={[styles.boxValue, isDark && { color: '#e5e7eb' }]}>
                    {endDate.toLocaleDateString(
                      language === 'en' ? 'en-US' : 'es-ES',
                      {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      }
                    )}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={isDark ? '#9ca3af' : '#9ca3af'} />
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
                  themeVariant={isDark ? 'dark' : 'light'}
                  textColor={Platform.OS === 'ios' ? (isDark ? '#e5e7eb' : '#111827') : undefined}
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

          {/* HORARIO */}
          <View style={styles.section}>
            <Text style={[styles.label, isDark && { color: '#e5e7eb' }]}>{t('habitForm.timeLabel')}</Text>

            <Pressable
              style={[styles.box, isDark && { backgroundColor: '#020617', borderColor: '#1e293b' }]}
              onPress={() => setTimePickerVisible(true)}
            >
              <Text style={[styles.boxLabel, isDark && { color: '#e5e7eb' }]}>{t('habitForm.timeLabel')}</Text>
              <View style={styles.boxRight}>
                <Text style={[styles.boxValue, isDark && { color: '#e5e7eb' }]}>
                  {time
                    ? formatTimeFromDate(time, { language, timeFormat })
                    : 'Select the time'}
                </Text>
                <Ionicons name="time-outline" size={18} color={isDark ? '#9ca3af' : '#9ca3af'} />
              </View>
            </Pressable>

            {timePickerVisible && (
              <View style={styles.picker}>
                <DateTimePicker
                  value={time || new Date()}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
                  locale={
                    Platform.OS === 'ios'
                      ? language === 'en'
                        ? 'en-US'
                        : 'es-ES'
                      : undefined
                  }
                  themeVariant={isDark ? 'dark' : 'light'}
                  textColor={Platform.OS === 'ios' ? (isDark ? '#e5e7eb' : '#111827') : undefined}
                  onChange={(_, date) => {
                    if (!date) {
                      if (Platform.OS === 'android') setTimePickerVisible(false);
                      return;
                    }
                    setTime(date);
                    if (Platform.OS === 'android') setTimePickerVisible(false);
                  }}
                />
              </View>
            )}

            {/* DURACIÓN */}
            <View style={styles.durationSection}>
              <Text style={[styles.label, isDark && { color: '#e5e7eb' }]}>{t('habitForm.durationLabel')}</Text>
              <View style={[styles.durationDropdownContainer, isDark && { backgroundColor: '#020617', borderColor: '#1e293b' }]}>
                <Picker
                  selectedValue={durationPickerValue}
                  onValueChange={(value) => {
                    setDurationPickerValue(value);
                    if (value === '') {
                      setDurationMinutes(null);
                    } else if (value === 'custom') {
                      // mantener el valor actual o dejarlo en null hasta que el usuario escriba
                    } else {
                      const n = parseInt(value, 10);
                      if (!Number.isNaN(n)) {
                        setDurationMinutes(n);
                      }
                    }
                  }}
                  style={isDark ? { color: '#ffffff' } : undefined}
                  itemStyle={Platform.OS === 'ios' && isDark ? { color: '#ffffff' } : undefined}
                  dropdownIconColor={isDark ? '#9ca3af' : '#6b7280'}
                  mode={Platform.OS === 'ios' ? 'dialog' : 'dropdown'}
                >
                  <Picker.Item
                    label={t('habitForm.durationSelectPlaceholder')}
                    value=""
                    color={
                      Platform.OS === 'ios'
                        ? isDark
                          ? '#ffffff'
                          : undefined
                        : isDark
                          ? '#111827'
                          : undefined
                    }
                  />
                  <Picker.Item
                    label="10 min"
                    value="10"
                    color={
                      Platform.OS === 'ios'
                        ? isDark
                          ? '#ffffff'
                          : undefined
                        : isDark
                          ? '#111827'
                          : undefined
                    }
                  />
                  <Picker.Item
                    label="15 min"
                    value="15"
                    color={
                      Platform.OS === 'ios'
                        ? isDark
                          ? '#ffffff'
                          : undefined
                        : isDark
                          ? '#111827'
                          : undefined
                    }
                  />
                  <Picker.Item
                    label="30 min"
                    value="30"
                    color={
                      Platform.OS === 'ios'
                        ? isDark
                          ? '#ffffff'
                          : undefined
                        : isDark
                          ? '#111827'
                          : undefined
                    }
                  />
                  <Picker.Item
                    label="60 min"
                    value="60"
                    color={
                      Platform.OS === 'ios'
                        ? isDark
                          ? '#ffffff'
                          : undefined
                        : isDark
                          ? '#111827'
                          : undefined
                    }
                  />
                  <Picker.Item
                    label={t('habitForm.durationCustom')}
                    value="custom"
                    color={
                      Platform.OS === 'ios'
                        ? isDark
                          ? '#ffffff'
                          : undefined
                        : isDark
                          ? '#111827'
                          : undefined
                    }
                  />
                </Picker>
              </View>

              {durationPickerValue === '' && (
                <Text style={[styles.sublabel, { marginTop: 8 }, isDark && { color: '#9ca3af' }]}>
                  {t('habitForm.durationDefaultHint')}
                </Text>
              )}

              {time && (
                <Text style={[styles.sublabel, { marginTop: 8 }, isDark && { color: '#9ca3af' }]}>
                  {(() => {
                    const startH = String(time.getHours()).padStart(2, '0');
                    const startM = String(time.getMinutes()).padStart(2, '0');
                    const startStr = `${startH}:${startM}`;
                    const effectiveDuration =
                      typeof durationMinutes === 'number' && durationMinutes > 0
                        ? durationMinutes
                        : 60;
                    const startTotal = time.getHours() * 60 + time.getMinutes();
                    const total = startTotal + effectiveDuration;
                    const endH = String(Math.floor(total / 60) % 24).padStart(2, '0');
                    const endM = String(total % 60).padStart(2, '0');
                    const endStr = `${endH}:${endM}`;
                    return `${startStr} - ${endStr}`;
                  })()}
                </Text>
              )}

              {durationPickerValue === 'custom' && (
                <View style={styles.durationCustomWrapper}>
                  <Text style={[styles.durationCustomLabel, isDark && { color: '#e5e7eb' }]}>
                      {t('habitForm.durationCustom')}
                    </Text>
                  <TextInput
                    style={[styles.durationInput, isDark && styles.inputDark]}
                    keyboardType="numeric"
                    placeholder={t('habitForm.durationCustomPlaceholder')}
                    placeholderTextColor={isDark ? '#ffffff' : '#9ca3af'}
                    value={
                      typeof durationMinutes === 'number' &&
                      ![10, 15, 30, 60].includes(durationMinutes)
                        ? String(durationMinutes)
                        : ''
                    }
                    onChangeText={(v) => {
                      const n = parseInt(v, 10);
                      if (Number.isNaN(n)) {
                        setDurationMinutes(null);
                      } else {
                        setDurationMinutes(n);
                      }
                    }}
                  />
                </View>
              )}
            </View>

          </View>

          {/* FRECUENCIA */}
          <View style={[styles.section, styles.frequencySection]}>
            <Text style={[styles.label, styles.frequencyLabel, isDark && { color: '#e5e7eb' }]}>
              {t('habitForm.frequencyLabel')}
            </Text>

            <View style={[styles.freqGrid, styles.freqGridCentered]}>
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
                <Text style={[styles.sublabel, styles.frequencySublabel, isDark && { color: '#9ca3af' }]}>
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
                        {d?.[language] || d.es}
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
              <Text style={[styles.label, isDark && { color: '#e5e7eb' }]}>
                {field.type === 'market' ? '🛒' : field.type === 'checklist' ? '✅' : '✏️'}{' '}
                {field.label}
              </Text>
              {renderField(field)}
            </View>
          ))}

          {/* COLOR */}
          <View style={styles.section}>
            <Text style={[styles.label, styles.colorLabel, isDark && { color: '#e5e7eb' }]}>{t('habitForm.colorLabel') || 'Color'}</Text>
            <View style={{ marginTop: 8 }}>
              <View style={styles.colorGrid}>
                {COLOR_OPTIONS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setSelectedColor(c)}
                    style={[
                      styles.colorSwatch,
                      selectedColor === c && styles.colorSwatchSelected,
                      { backgroundColor: c },
                    ]}
                  >
                    {selectedColor === c && (
                      <Ionicons name="checkmark" size={14} color={getContrastColorLocal(c)} />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
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
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    marginTop: 8,
  },
  colorLabel: {
    width: '100%',
    textAlign: 'center',
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: '#111827',
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

  durationDropdownContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    backgroundColor: '#f9fafb',
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
  frequencySection: {
    alignItems: 'center',
  },
  frequencyLabel: {
    textAlign: 'center',
  },
  frequencySublabel: {
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  freqGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  freqGridCentered: {
    justifyContent: 'center',
    alignSelf: 'stretch',
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
  inputDark: {
    backgroundColor: '#071127',
    borderWidth: 1,
    borderColor: '#273142',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#e5e7eb',
  },
  durationCustomWrapper: {
    marginTop: 8,
  },
  durationCustomLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 6,
  },
  durationInput: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 10,
    color: '#111',
  },
  marketInput: {
    borderColor: '#111827',
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
  marketHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  marketHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  marketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  marketCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  marketCardDark: {
    backgroundColor: '#071127',
    borderColor: '#273142',
  },
  marketCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  marketCardIndex: {
    fontWeight: '700',
    color: '#111827',
  },
  marketNum: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  marketNumTxt: {
    color: '#fff',
    fontSize: 15,
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