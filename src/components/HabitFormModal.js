import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import { parseMoneyLike } from '../utils/parseMoneyLike';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import MarketAddModal from './MarketAddModal';
import VitaminsAddModal from './VitaminsAddModal';
import { useI18n } from '../utils/i18n';
import { useSettings } from '../utils/settingsContext';
import { formatTimeFromDate } from '../utils/timeFormat';
import { translateHabitCategory } from '../utils/habitCategories';
import { normalizeMarketProductName } from '../utils/marketProductName';

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

const SAVINGS_FREQUENCIES = [
  { key: 'daily', icon: 'today' },
  { key: 'weekly', icon: 'calendar' },
  { key: 'monthly', icon: 'calendar-outline' },
];

// Opciones de color para los hábitos
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

function isSavingsHabit(habit) {
  const titleLower = String(habit?.title || habit?.name || '').toLowerCase();
  // Be permissive: titles come from Supabase translations.
  return (
    titleLower.includes('ahorrar dinero') ||
    titleLower.includes('ahorrar') ||
    titleLower.includes('ahorro') ||
    titleLower.includes('save money') ||
    titleLower.includes('saving')
  );
}

function isWaterHabit(habit) {
  const type = normalizeTemplateType(habit?.type);
  if (type === 'water') return true;
  const titleLower = String(habit?.title || habit?.name || '').toLowerCase();
  return (
    (titleLower.includes('beber') && titleLower.includes('agua')) ||
    titleLower.includes('agua') ||
    titleLower.includes('water') ||
    titleLower.includes('eau') ||
    titleLower.includes('água')
  );
}

function isOrganizeSpacesHabit(habit) {
  const type = normalizeTemplateType(habit?.type);
  if (type === 'spaces' || type === 'organizespaces' || type === 'organizeespacios') return true;
  const titleLower = String(habit?.title || habit?.name || '').toLowerCase();
  return (
    titleLower.includes('organizar espacios') ||
    titleLower.includes('espacios a organizar') ||
    titleLower.includes('spaces to organize') ||
    titleLower.includes('organize spaces') ||
    (titleLower.includes('organiser') && titleLower.includes('espaces'))
  );
}

function isStudyHabit(habit) {
  const type = normalizeTemplateType(habit?.type);
  if (type === 'study' || type === 'estudiar' || type === 'studying') return true;
  const titleLower = String(habit?.title || habit?.name || '').toLowerCase();
  return (
    titleLower.includes('estudiar') ||
    titleLower.includes('estudio') ||
    titleLower.includes('study') ||
    titleLower.includes('studying') ||
    titleLower.includes('étudier') ||
    titleLower.includes('etudier')
  );
}

function isCourseHabit(habit) {
  const type = normalizeTemplateType(habit?.type);
  if (type === 'course' || type === 'curso' || type === 'takeacourse') return true;
  const titleLower = String(habit?.title || habit?.name || '').toLowerCase();
  return (
    titleLower.includes('tomar un curso') ||
    titleLower.includes('tomar curso') ||
    titleLower.includes('curso') ||
    titleLower.includes('take a course') ||
    titleLower.includes('course')
  );
}

function isResearchHabit(habit) {
  const type = normalizeTemplateType(habit?.type);
  if (type === 'research' || type === 'investigar' || type === 'investigate') return true;
  const titleLower = String(habit?.title || habit?.name || '').toLowerCase();
  return (
    titleLower.includes('investigar') ||
    titleLower.includes('investigación') ||
    titleLower.includes('investigacion') ||
    titleLower.includes('research') ||
    titleLower.includes('investigate')
  );
}

function isPodcastHabit(habit) {
  const type = normalizeTemplateType(habit?.type);
  if (type === 'podcast' || type === 'listenpodcast' || type === 'escucharpodcast') return true;
  const titleLower = String(habit?.title || habit?.name || '').toLowerCase();
  return (
    titleLower.includes('podcast') ||
    (titleLower.includes('escuchar') && titleLower.includes('podcast')) ||
    titleLower.includes('listen')
  );
}

function isLanguagePracticeHabit(habit) {
  const type = normalizeTemplateType(habit?.type);
  if (type === 'language' || type === 'languagepractice' || type === 'idiomas' || type === 'practicaridioma') return true;
  const titleLower = String(habit?.title || habit?.name || '').toLowerCase();
  return (
    titleLower.includes('practicar idioma') ||
    titleLower.includes('practicar idiomas') ||
    titleLower.includes('idioma') ||
    titleLower.includes('language practice')
  );
}

function isSkincareHabit(habit) {
  const type = normalizeTemplateType(habit?.type);
  if (type === 'skincare' || type === 'skincaret' || type === 'skin' || type === 'cuidarpiel' || type === 'cuidarmipiel') return true;
  const titleLower = String(habit?.title || habit?.name || '').toLowerCase();
  return (
    titleLower.includes('cuidar mi piel') ||
    (titleLower.includes('cuidar') && titleLower.includes('piel')) ||
    titleLower.includes('cuidado de la piel') ||
    titleLower.includes('skin care') ||
    titleLower.includes('skincare')
  );
}

function isCreativeHobbyHabit(habit) {
  const type = normalizeTemplateType(habit?.type);
  if (
    type === 'creativehobby' ||
    type === 'hobbycreativo' ||
    type === 'creative_hobby' ||
    type === 'hobby_creativo' ||
    type === 'hobbycriativo' || // portugués
    type === 'hobby_criativo' || // portugués
    type === 'hobbycréatif' || // francés
    type === 'hobby_créatif' // francés
  ) {
    return true;
  }
  const titleLower = String(habit?.title || habit?.name || '').toLowerCase();
  return (
    titleLower.includes('hobby creativo') ||
    titleLower.includes('hobbies creativos') ||
    titleLower.includes('creative hobby') ||
    titleLower.includes('hobby criativo') || // portugués
    titleLower.includes('hobbies criativos') || // portugués
    titleLower.includes('hobby créatif') || // francés
    titleLower.includes('hobbies créatifs') // francés
  );
}

function isFamilyHabit(habit) {
  const type = normalizeTemplateType(habit?.type);
  if (type === 'family' || type === 'familytime') return true;
  const titleLower = String(habit?.title || habit?.name || '').toLowerCase();
  return (
    titleLower.includes('pasar tiempo en familia') ||
    (titleLower.includes('tiempo') && titleLower.includes('familia')) ||
    titleLower.includes('family time')
  );
}

function isGymHabit(habit) {
  const type = normalizeTemplateType(habit?.type);
  if (type === 'gym' || type === 'gimnasio') return true;
  const titleLower = String(habit?.title || habit?.name || '').toLowerCase();
  return titleLower.includes('ir al gimnasio') || titleLower.includes('gimnasio') || titleLower.includes('gym');
}

function isInboxZeroHabit(habit) {
  const type = normalizeTemplateType(habit?.type);
  if (type === 'inboxzero' || type === 'inbox_zero') return true;
  const titleLower = String(habit?.title || habit?.name || '').toLowerCase();
  return titleLower.includes('inboxzero') || titleLower.includes('inbox zero');
}

function isMarketListHabit(habit) {
  const type = normalizeTemplateType(habit?.type);
  if (type === 'market' || type === 'shoppinglist' || type === 'mercado') return true;
  const titleLower = String(habit?.title || habit?.name || '').toLowerCase();
  return (
    titleLower.includes('lista de mercado') ||
    titleLower.includes('lista del mercado') ||
    titleLower.includes('lista de compras') ||
    titleLower.includes('shopping list') ||
    titleLower.includes('mercado')
  );
}

function isPlanningDayHabit(habit) {
  const type = normalizeTemplateType(habit?.type);
  if (type === 'planningday' || type === 'planning_day') return true;
  const titleLower = String(habit?.title || habit?.name || '').toLowerCase();
  return (
    titleLower.includes('planer el día') ||
    titleLower.includes('planer el dia') ||
    titleLower.includes('planear el día') ||
    titleLower.includes('planear el dia') ||
    titleLower.includes('planificar el día') ||
    titleLower.includes('planning day')
  );
}

function isSunHabit(habit) {
  const type = normalizeTemplateType(habit?.type);
  if (type === 'sun' || type === 'sunbath') return true;
  const titleLower = String(habit?.title || habit?.name || '').toLowerCase();
  return titleLower.includes('tomar el sol') || (titleLower.includes('tomar') && titleLower.includes('sol'));
}

function dayKeyFromDate(d) {
  const idx = d instanceof Date ? d.getDay() : new Date().getDay();
  // JS: 0=Sun..6=Sat
  if (idx === 0) return 'sun';
  if (idx === 1) return 'mon';
  if (idx === 2) return 'tue';
  if (idx === 3) return 'wed';
  if (idx === 4) return 'thu';
  if (idx === 5) return 'fri';
  return 'sat';
}

function formatMarketValue(value, currencySymbol) {
  const n = parseMoneyLike(value);
  if (n === null) return `${currencySymbol}${String(value ?? 0)}`;
  // keep it simple; avoid locale deps
  return `${currencySymbol}${n}`;
}

function startOfTodayLocal() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function clampToToday(date) {
  const today = startOfTodayLocal();
  const d = date instanceof Date ? date : new Date(date);
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return today;
  return d < today ? today : d;
}

// Utilidad para detectar si el hábito es de cumpleaños
function isBirthdayHabit(habit) {
  const type = (habit?.type || '').toString().toLowerCase();
  if (type === 'birthday') return true;
  const title = (habit?.title || habit?.name || '').toString().toLowerCase();
  return title.includes('cumple') || title.includes('birthday') || title.includes('anniversaire');
}

// Utilidad para normalizar el tipo de plantilla
function normalizeTemplateType(type) {
  return String(type || '')
    .trim()
    .toLowerCase()
    .replace(/\s+|_|-/g, '');
}

// Utilidad para obtener color de contraste para un fondo dado
function getContrastColorLocal(hex) {
  try {
    if (!hex || typeof hex !== 'string') return '#ffffff';
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map((ch) => ch + ch).join('');
    const r = parseInt(c.substr(0, 2), 16);
    const g = parseInt(c.substr(2, 2), 16);
    const b = parseInt(c.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.35 ? '#111827' : '#ffffff';
  } catch {
    return '#ffffff';
  }
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

  const isBirthdayTemplate = useMemo(() => isBirthdayHabit(habit), [habit]);
  const isSavingsTemplate = useMemo(() => isSavingsHabit(habit), [habit]);
  const isWaterTemplate = useMemo(() => isWaterHabit(habit), [habit]);
  const isOrganizeSpacesTemplate = useMemo(() => isOrganizeSpacesHabit(habit), [habit]);
  const isLanguagePracticeTemplate = useMemo(() => isLanguagePracticeHabit(habit), [habit]);
  const isSkincareTemplate = useMemo(() => isSkincareHabit(habit), [habit]);
  const isCreativeHobbyTemplate = useMemo(() => isCreativeHobbyHabit(habit), [habit]);
  const isStudyTemplate = useMemo(
    () => isStudyHabit(habit) && !isLanguagePracticeHabit(habit),
    [habit]
  );
  const isCourseTemplate = useMemo(() => isCourseHabit(habit), [habit]);
  const isResearchTemplate = useMemo(() => isResearchHabit(habit), [habit]);
  const isPodcastTemplate = useMemo(() => isPodcastHabit(habit), [habit]);

  const isBannerLockedTemplate = useMemo(
    () =>
      isWaterTemplate ||
      isStudyTemplate ||
      isFamilyHabit(habit) ||
      isGymHabit(habit) ||
      isInboxZeroHabit(habit) ||
      isMarketListHabit(habit) ||
      isPlanningDayHabit(habit) ||
      isSunHabit(habit),
    [
      habit,
      isStudyTemplate,
      isWaterTemplate,
    ]
  );

  // Special: For 'Spend Time with family', remove color selection in modal
  const isFamilyTimeHabit = useMemo(() => {
    const titleLower = String(habit?.title || habit?.name || '').toLowerCase();
    return titleLower.includes('spend time with family') || isFamilyHabit(habit);
  }, [habit]);

  const baseDate = useMemo(() => {
    if (selectedDate instanceof Date) return clampToToday(selectedDate);
    if (typeof selectedDate === 'string') {
      const [y, m, d] = selectedDate.split('-').map((n) => parseInt(n, 10));
      if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
        return clampToToday(new Date(y, m - 1, d));
      }
    }
    return clampToToday(new Date());
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

  const [selectedColor, setSelectedColor] = useState('#A8D8F0');
  const [headerColorPreviewEnabled, setHeaderColorPreviewEnabled] = useState(false);

  const [marketAddVisible, setMarketAddVisible] = useState(false);
  const [marketAddFieldKey, setMarketAddFieldKey] = useState(null);
  const [vitaminsAddVisible, setVitaminsAddVisible] = useState(false);
  const [vitaminsAddFieldKey, setVitaminsAddFieldKey] = useState(null);

  const [spacesDropdownOpen, setSpacesDropdownOpen] = useState(false);
  const [studyDropdownOpen, setStudyDropdownOpen] = useState(false);
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [researchDropdownOpen, setResearchDropdownOpen] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [creativeHobbyDropdownOpen, setCreativeHobbyDropdownOpen] = useState(false);

  const pastDateWarnedRef = useRef(false);

  const headerBg = useMemo(() => {
    if (!headerColorPreviewEnabled) return isDark ? '#020617' : '#ffffff';
    return selectedColor;
  }, [headerColorPreviewEnabled, isDark, selectedColor]);

  const headerFg = useMemo(() => {
    if (!headerColorPreviewEnabled) return isDark ? '#e5e7eb' : '#111827';
    return getContrastColorLocal(selectedColor);
  }, [headerColorPreviewEnabled, isDark, selectedColor]);

  const headerSubFg = useMemo(() => {
    if (!headerColorPreviewEnabled) return isDark ? '#9ca3af' : '#6b7280';
    return headerFg === '#ffffff' ? 'rgba(255,255,255,0.88)' : 'rgba(17,24,39,0.78)';
  }, [headerColorPreviewEnabled, headerFg, isDark]);

  const headerBorder = useMemo(() => {
    if (!headerColorPreviewEnabled) return isDark ? '#0f172a' : '#e5e7eb';
    return headerFg === '#ffffff' ? 'rgba(255,255,255,0.22)' : 'rgba(15,23,42,0.10)';
  }, [headerColorPreviewEnabled, headerFg, isDark]);

  useEffect(() => {
    const today = startOfTodayLocal();
    if (editingActivity && initialSchedule) {
      const rawStart = initialSchedule.startDate || baseDate;
      const nextStart = clampToToday(rawStart);

      if (!pastDateWarnedRef.current) {
        const rawStartDate = rawStart instanceof Date ? rawStart : new Date(rawStart);
        if (rawStartDate < today) {
          pastDateWarnedRef.current = true;
          Alert.alert(
            language === 'es' ? 'Fecha en el pasado' : 'Past date',
            language === 'es'
              ? 'No puedes agendar hábitos en fechas pasadas. Se ajustó automáticamente a hoy.'
              : 'You can’t schedule habits in past dates. It was automatically adjusted to today.'
          );
        }
      }

      const rawEnd = initialSchedule.endDate || initialSchedule.startDate || baseDate;
      const nextEnd = clampToToday(rawEnd);

      setStartDate(nextStart);
      setEndDate(nextEnd < nextStart ? nextStart : nextEnd);
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
      if (initialSchedule.allDay) {
        // Duración removida: tratamos allDay como sin hora.
        setTime(null);
      }

      if (isBirthdayTemplate) {
        setHasEndDate(false);
        setEndDate(initialSchedule.startDate || baseDate);
      }
    } else {
      const next = clampToToday(baseDate);

      if (!pastDateWarnedRef.current && baseDate < today) {
        pastDateWarnedRef.current = true;
        Alert.alert(
          language === 'es' ? 'Fecha en el pasado' : 'Past date',
          language === 'es'
            ? 'No puedes agendar hábitos en fechas pasadas. Se ajustó automáticamente a hoy.'
            : 'You can’t schedule habits in past dates. It was automatically adjusted to today.'
        );
      }

      setStartDate(next);
      setEndDate(next);
      setHasEndDate(false);
      if (isBirthdayTemplate) {
        // Cumpleaños: sin horario + todo el día + anual por defecto
        setFrequency('yearly');
        setDaysOfWeek([]);
        setTime(null);
      } else {
        setFrequency('once');
        setDaysOfWeek([]);
        // Por defecto, usar la hora actual del dispositivo
        setTime(new Date());
      }
    }
    // Notes/description section removed.
    setFormData(editingActivity?.data || {});
    // Inicializar color desde la actividad editada o desde la plantilla
    const initialColor =
      editingActivity?.data?.color ||
      habit?.color ||
      (isBirthdayTemplate ? '#F5B3C1' : '#38BDF8');
    setSelectedColor(initialColor);
    setHeaderColorPreviewEnabled(!isBirthdayTemplate && !!editingActivity?.data?.color);
    setActivePicker(null);
  }, [habit, baseDate, editingActivity, initialSchedule, isBirthdayTemplate]);

  useEffect(() => {
    if (!isSavingsTemplate) return;
    // Savings habit: simplify UX (no period/time) but keep valid internal defaults.
    setHasEndDate(false);
    setEndDate((prev) => prev || baseDate);
    setTime(null);
    setTimePickerVisible(false);
    setActivePicker(null);
  }, [baseDate, isSavingsTemplate]);

  useEffect(() => {
    if (!isWaterTemplate) return;
    // Water habit: no time selector; daily goal instead.
    setTime(null);
    setTimePickerVisible(false);
  }, [isWaterTemplate]);

  useEffect(() => {
    if (!isStudyTemplate) return;
    // Study habit: no time-of-day selector; user chooses study duration.
    setTime(null);
    setTimePickerVisible(false);
    setFormData((prev) => ({
      ...prev,
      studyDurationMinutes: prev?.studyDurationMinutes ?? '30',
    }));
  }, [isStudyTemplate]);

  useEffect(() => {
    if (!isCourseTemplate) return;
    setTime(null);
    setTimePickerVisible(false);
    setFormData((prev) => ({
      ...prev,
      courseDurationMinutes: prev?.courseDurationMinutes ?? '30',
    }));
  }, [isCourseTemplate]);

  useEffect(() => {
    if (!isResearchTemplate) return;
    setTime(null);
    setTimePickerVisible(false);
    setFormData((prev) => ({
      ...prev,
      researchDurationMinutes: prev?.researchDurationMinutes ?? '30',
    }));
  }, [isResearchTemplate]);

  useEffect(() => {
    if (!isLanguagePracticeTemplate) return;
    setTime(null);
    setTimePickerVisible(false);
    setFormData((prev) => ({
      ...prev,
      languagePracticeDurationMinutes: prev?.languagePracticeDurationMinutes ?? '30',
    }));
  }, [isLanguagePracticeTemplate]);

  useEffect(() => {
    if (!isBirthdayTemplate) return;
    // Birthday habit: always annual, no time, no end date.
    setFrequency('yearly');
    setDaysOfWeek([]);
    setTime(null);
    setTimePickerVisible(false);
    setHasEndDate(false);
  }, [isBirthdayTemplate]);

  useEffect(() => {
    if (!isWaterTemplate) return;
    setFormData((prev) => ({
      ...prev,
      waterMlTarget: prev?.waterMlTarget ?? '2000',
    }));
  }, [isWaterTemplate]);

  useEffect(() => {
    if (!isSavingsTemplate) return;
    // Savings habit: keep schedule valid without asking weekly day selection.
    if (frequency === 'weekly' && (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0)) {
      setDaysOfWeek([dayKeyFromDate(startDate)]);
    }
  }, [daysOfWeek, frequency, isSavingsTemplate, startDate]);


  const config = useMemo(() => {
    if (!habit?.config) return null;
    if (typeof habit.config === 'object') return habit.config;
    try {
      return JSON.parse(habit.config);
    } catch {
      return null;
    }
  }, [habit]);

  const birthdayTextField = useMemo(() => {
    if (!isBirthdayTemplate) return null;
    const fields = config?.fields;
    if (!Array.isArray(fields) || fields.length === 0) return null;
    const textField = fields.find((f) => String(f?.type || '').toLowerCase() === 'text');
    return textField || null;
  }, [config, isBirthdayTemplate]);

  const spacesChecklistField = useMemo(() => {
    if (!isOrganizeSpacesTemplate) return null;
    const fields = config?.fields;
    if (!Array.isArray(fields) || fields.length === 0) return null;

    const checklistFields = fields.filter(
      (f) => String(f?.type || '').toLowerCase() === 'checklist'
    );
    if (checklistFields.length === 0) return null;

    const preferred = checklistFields.find((f) => {
      const lbl = String(f?.label || '').toLowerCase();
      return lbl.includes('espacios') || lbl.includes('spaces') || lbl.includes('espaces');
    });

    return preferred || checklistFields[0];
  }, [config, isOrganizeSpacesTemplate]);

  const SPACE_OPTIONS = useMemo(
    () => [
      { label: 'Sala', emoji: '🛋️' },
      { label: 'Comedor', emoji: '🍽️' },
      { label: 'Cocina', emoji: '🍳' },
      { label: 'Habitaciones / Dormitorios', emoji: '🛏️' },
      { label: 'Baño', emoji: '🚿' },
      { label: 'Pasillo', emoji: '🚪' },
      { label: 'Entrada / Recibidor', emoji: '🔑' },
      { label: 'Patio', emoji: '🏞️' },
      { label: 'Jardín', emoji: '🌿' },
      { label: 'Balcón', emoji: '🌇' },
      { label: 'Terraza', emoji: '🌞' },
      { label: 'Garaje / Parqueadero', emoji: '🚗' },
      { label: 'Entrada exterior', emoji: '🏛️' },
      { label: 'Estudio / Oficina', emoji: '💻' },
      { label: 'Sala de TV', emoji: '📺' },
      { label: 'Sala de juegos', emoji: '🎮' },
      { label: 'Biblioteca', emoji: '📚' },
      { label: 'Gimnasio en casa', emoji: '🏋️' },
    ],
    []
  );

  const STUDY_SUBJECT_OPTIONS = useMemo(() => {
    const opts = t('studySubjectOptions');
    if (Array.isArray(opts) && opts.length > 0) return opts;
    // fallback to Spanish if translation missing
    return [
      'Matemáticas',
      'Lenguaje / Español',
      'Inglés',
      'Ciencias',
      'Historia',
      'Geografía',
      'Filosofía',
      'Otros',
    ];
  }, [language, t]);

  const STUDY_SUBJECT_EMOJI = useMemo(
    () => ({
      'Matemáticas': '🧮',
      'Lenguaje / Español': '📝',
      'Inglés': '🗣️',
      'Ciencias': '🔬',
      'Historia': '📜',
      'Geografía': '🌍',
      'Filosofía': '🧠',
      'Otros': '📚',
    }),
    []
  );

  const STUDY_DURATION_OPTIONS = useMemo(() => [15, 30, 45, 60, 90, 120], []);

  const CREATIVE_HOBBY_OPTIONS = useMemo(() => {
    if (language === 'fr' && t('creativeHobbyOptions')) return t('creativeHobbyOptions');
    if (language === 'pt' && t('creativeHobbyOptions')) return t('creativeHobbyOptions');
    if (language === 'en' && t('creativeHobbyOptions')) return t('creativeHobbyOptions');
    if (language === 'es' && t('creativeHobbyOptions')) return t('creativeHobbyOptions');
    // fallback español
    return [
      'Ilustración digital',
      'Escritura de cuentos cortos',
      'Bordado creativo',
      'Creación de velas artesanales',
      'Fotografía estética',
      'Producción musical básica',
      'Journaling creativo (diarios visuales)',
      'Macramé decorativo',
      'Repostería creativa',
      'Creación de contenido creativo (videos, reels)',
      'Otros',
    ];
  }, [language, t]);

  const CREATIVE_HOBBY_EMOJI = useMemo(
    () => ({
      'Ilustración digital': '🎨',
      'Escritura de cuentos cortos': '✍️',
      'Bordado creativo': '🧵',
      'Creación de velas artesanales': '🕯️',
      'Fotografía estética': '📸',
      'Producción musical básica': '🎶',
      'Journaling creativo (diarios visuales)': '📖',
      'Macramé decorativo': '🧶',
      'Repostería creativa': '🍰',
      'Creación de contenido creativo (videos, reels)': '🎥',
      'Otros': '✨',
    }),
    []
  );

  const LANGUAGE_OPTIONS = useMemo(
    () => [
      'Inglés',
      'Francés',
      'Portugués',
      'Italiano',
      'Alemán',
      'Japonés',
      'Coreano',
      'Chino',
      'Otros',
    ],
    []
  );

  const LANGUAGE_EMOJI = useMemo(
    () => ({
      'Inglés': '🗣️',
      'Francés': '🥐',
      'Portugués': '🌎',
      'Italiano': '🍝',
      'Alemán': '🧠',
      'Japonés': '🗾',
      'Coreano': '🎧',
      'Chino': '🀄',
      'Otros': '📚',
    }),
    []
  );

  const COURSE_TOPIC_OPTIONS = useMemo(
    () => [
      'Programación',
      'Diseño',
      'Marketing',
      'Finanzas',
      'Idiomas',
      'Negocios',
      'Productividad',
      'Salud',
      'Otros',
    ],
    []
  );

  const COURSE_TOPIC_EMOJI = useMemo(
    () => ({
      'Programación': '💻',
      'Diseño': '🎨',
      'Marketing': '📣',
      'Finanzas': '💰',
      'Idiomas': '🗣️',
      'Negocios': '🧾',
      'Productividad': '✅',
      'Salud': '🧘',
      'Otros': '📚',
    }),
    []
  );

  const RESEARCH_TOPIC_OPTIONS = useMemo(
    () => [
      'Tecnología',
      'Ciencia',
      'Historia',
      'Finanzas',
      'Salud',
      'Noticias',
      'Arte',
      'Otros',
    ],
    []
  );

  const RESEARCH_TOPIC_EMOJI = useMemo(
    () => ({
      'Tecnología': '💡',
      'Ciencia': '🔬',
      'Historia': '📜',
      'Finanzas': '💰',
      'Salud': '🧬',
      'Noticias': '📰',
      'Arte': '🎭',
      'Otros': '🔎',
    }),
    []
  );

  function toggleDay(day) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function updateField(key, value) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function toggleSpaceOption(label) {
    const listKey = spacesChecklistField?.key || 'checklist';
    const current = Array.isArray(formData?.[listKey]) ? formData[listKey] : [];

    const getItemLabel = (it) => {
      if (typeof it === 'string') return it;
      return it?.label ?? it?.name ?? it?.title ?? '';
    };

    const exists = current.some((it) => String(getItemLabel(it)) === String(label));
    if (exists) {
      updateField(
        listKey,
        current.filter((it) => String(getItemLabel(it)) !== String(label))
      );
      return;
    }

    updateField(listKey, [...current, { label: String(label), checked: false }]);
  }

  function selectAllSpaces() {
    const listKey = spacesChecklistField?.key || 'checklist';
    updateField(
      listKey,
      SPACE_OPTIONS.map((opt) => ({ label: String(opt.label), checked: false }))
    );
  }

  function clearSpaces() {
    const listKey = spacesChecklistField?.key || 'checklist';
    updateField(listKey, []);
  }

  function renderField(field) {
    const value = formData[field.key];

    switch (field.type) {
      case 'text':
      case 'number':
      {
        let placeholder = isBirthdayTemplate && birthdayTextField && field.key === birthdayTextField.key
          ? (t('specialHabits.birthday.placeholder') || 'Nombre de la persona')
          : field.label;
        if (typeof placeholder !== 'string') placeholder = String(placeholder);
        // Si la traducción devuelve un objeto, forzar a string
        if (typeof t(field.label) !== 'string') placeholder = String(t(field.label));
        return (
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            keyboardType={field.type === 'number' ? 'numeric' : 'default'}
            value={value || ''}
            onChangeText={(v) => updateField(field.key, v)}
          />
        );
      }

      case 'market':
        const items = value || [];
        return (
          <>
            {items.map((item, i) => {
              let productPlaceholder = t('habitForm.marketProductPlaceholder');
              if (typeof productPlaceholder !== 'string') productPlaceholder = String(productPlaceholder);
              let qtyPlaceholder = t('habitForm.marketQtyPlaceholder');
              if (typeof qtyPlaceholder !== 'string') qtyPlaceholder = String(qtyPlaceholder);
              let pricePlaceholder = t('habitForm.marketPricePlaceholder');
              if (typeof pricePlaceholder !== 'string') pricePlaceholder = String(pricePlaceholder);
              return (
                <View key={i} style={[styles.marketCard, isDark && styles.marketCardDark]}>
                  <View style={styles.marketCardHeader}>
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
                    placeholder={productPlaceholder}
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
                      placeholder={qtyPlaceholder}
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
                      placeholder={pricePlaceholder}
                      placeholderTextColor={isDark ? '#94a3af' : '#9ca3af'}
                    />
                  </View>
                </View>
              );
            })}

            <Pressable
              style={[styles.addBtn, { marginTop: 10 }]}
              onPress={() => {
                setMarketAddFieldKey(field.key);
                setMarketAddVisible(true);
              }}
            >
              <Ionicons name="add-circle" size={20} color="#38BDF8" />
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
              <Text style={{ color: '#22c55e', fontWeight: '700', fontSize: 16 }}>{t('vitamins.addButton')}</Text>
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
    const today = startOfTodayLocal();
    const safeStart = startDate instanceof Date ? startDate : new Date(startDate);
    const safeEnd = endDate instanceof Date ? endDate : new Date(endDate);

    if (safeStart < today) {
      Alert.alert(
        language === 'es' ? 'Fecha inválida' : 'Invalid date',
        language === 'es'
          ? 'Solo puedes agendar hábitos para hoy o una fecha futura.'
          : 'You can only schedule habits for today or a future date.'
      );
      return;
    }

    if (hasEndDate && safeEnd < safeStart) {
      Alert.alert(
        language === 'es' ? 'Fecha inválida' : 'Invalid date',
        language === 'es'
          ? 'La fecha de fin no puede ser anterior a la fecha de inicio.'
          : 'End date cannot be before start date.'
      );
      return;
    }

    if (isSavingsTemplate) {
      const target = parseMoneyLike(formData?.savingsTargetAmount);
      if (target === null || target <= 0) {
        Alert.alert(
          t('habitForm.savingsGoalErrorTitle') || 'Meta requerida',
          t('habitForm.savingsGoalErrorMessage') || 'Ingresa cuánto dinero quieres ahorrar.'
        );
        return;
      }
    }

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

    const effectiveTimeString = timeString;

    const formatLocalYMD = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const dataToSave = { ...formData };
    if (isBirthdayTemplate) {
      // Birthday card uses a fixed banner background in Calendar.
      delete dataToSave.color;
      // Guardar el año base si no existe o si cambia la edad
      const currentYear = new Date().getFullYear();
      if (!dataToSave.birthdayBaseYear || String(dataToSave.birthdayAge) !== String(formData.birthdayAge)) {
        dataToSave.birthdayBaseYear = currentYear;
      }
    } else if (isBannerLockedTemplate) {
      // Banner-backed cards use fixed backgrounds; ignore custom colors.
      delete dataToSave.color;
    } else {
      dataToSave.color = selectedColor;
    }

    const resolvedFrequency = isBirthdayTemplate ? 'yearly' : frequency;
    const resolvedDaysOfWeek = isBirthdayTemplate
      ? []
      : resolvedFrequency === 'weekly'
        ? daysOfWeek
        : [];
    const resolvedAllDay = isBirthdayTemplate ? true : false;
    const resolvedTime = isBirthdayTemplate ? null : effectiveTimeString;
    const resolvedEndDate = isBirthdayTemplate
      ? null
      : hasEndDate
        ? formatLocalYMD(endDate)
        : null;

    onSave({
      habit,
      data: {
        ...dataToSave,
      },
      editingActivityId: editingActivity?.id || null,
      schedule: {
        // Use local date (not UTC) to avoid shifting the scheduled day on some devices/timezones.
        startDate: formatLocalYMD(startDate),
        endDate: resolvedEndDate,
        frequency: resolvedFrequency,
        daysOfWeek: resolvedDaysOfWeek,
        allDay: resolvedAllDay,
        time: resolvedTime,
        durationMinutes: (() => {
          const pick = (v) => {
            const n = parseInt(String(v ?? ''), 10);
            return Number.isFinite(n) && n > 0 ? n : null;
          };
          if (isStudyTemplate) return pick(formData?.studyDurationMinutes);
          if (isCourseTemplate) return pick(formData?.courseDurationMinutes);
          if (isResearchTemplate) return pick(formData?.researchDurationMinutes);
          if (isLanguagePracticeTemplate) return pick(formData?.languagePracticeDurationMinutes);
          return null;
        })(),
        endTime: null,
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
        <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: headerBorder }]}>
          <View style={styles.headerLeft}>
              {onChangeHabit && (
                <Pressable onPress={onChangeHabit} style={{ marginRight: 8 }}>
                  <Ionicons
                    name="arrow-back"
                    size={20}
                    color={headerColorPreviewEnabled ? headerFg : '#2563eb'}
                  />
                </Pressable>
              )}
              {/* Quitar imagen de fondo solo para practicar idioma */}
              {!isLanguagePracticeTemplate && (
                <Image source={{ uri: habit.icon }} style={styles.icon} />
              )}
              <View>
                <Text
                  style={[styles.title, { color: headerFg }]} 
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {habit.title}
                </Text>
                {habit.category && (
                      <Text style={[styles.category, { color: headerSubFg }]}>
                        {translateHabitCategory(habit.category, language)}
                      </Text>
                    )}
              </View>
            </View>
          <View style={styles.headerRight}>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={28} color={headerFg} />
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

            {!isBirthdayTemplate && (
              <>
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
              </>
            )}

            {activePicker && (
              <View style={styles.picker}>
                <DateTimePicker
                  value={activePicker === 'start' ? startDate : endDate}
                  mode="date"
                  minimumDate={
                    activePicker === 'end'
                      ? (startDate < startOfTodayLocal() ? startOfTodayLocal() : startDate)
                      : startOfTodayLocal()
                  }
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
                      next = clampToToday(next);
                      setStartDate(next);
                      if (next > endDate) setEndDate(next);
                    } else {
                      next = clampToToday(next);
                      setEndDate(next);
                    }
                    if (Platform.OS === 'android') setActivePicker(null);
                  }}
                />
              </View>
            )}
          </View>

          {isBirthdayTemplate && birthdayTextField ? (
            <View style={styles.section}>
              <Text style={[styles.label, isDark && { color: '#e5e7eb' }]}>
                {birthdayTextField.label}
              </Text>
              {renderField(birthdayTextField)}
            </View>
          ) : null}

          {isWaterTemplate ? (
            <View style={styles.section}>
              <Text style={[styles.label, isDark && { color: '#e5e7eb' }]}>
                {t('habitForm.waterTargetLabel', { lng: 'es' }) || '¿Cuánta agua tomarás al día? (ml)'}
              </Text>
              <Text style={[styles.sublabel, isDark && { color: '#9ca3af' }]}>
                {t('habitForm.waterTargetInfo', { lng: 'es' }) || 'Una persona adulta necesita entre 2 y 3 litros (2000-3000 ml) de agua al día'}
              </Text>

              {(() => {
                const OPTIONS = [1000, 2000, 3000, 4000, 5000];
                const current = parseInt(String(formData?.waterMlTarget ?? '2000'), 10);
                const currentIdx = Math.max(0, OPTIONS.indexOf(Number.isFinite(current) ? current : 2000));
                const activeIdx = currentIdx >= 0 ? currentIdx : 1;
                const pct = OPTIONS.length <= 1 ? 0 : (activeIdx / (OPTIONS.length - 1)) * 100;

                return (
                  <>
                    <View style={[styles.waterBarTrack, isDark && styles.waterBarTrackDark]}>
                      <View
                        style={[
                          styles.waterBarFill,
                          { width: `${pct}%`, backgroundColor: selectedColor || '#38BDF8' },
                        ]}
                      />
                      <View style={styles.waterBarDotsRow}>
                        {OPTIONS.map((v, idx) => {
                          const isActive = idx <= activeIdx;
                          const isKnob = idx === activeIdx;
                          return (
                            <Pressable
                              key={v}
                              onPress={() => updateField('waterMlTarget', String(v))}
                              style={[
                                styles.waterBarDot,
                                isDark && styles.waterBarDotDark,
                                isActive && { borderColor: selectedColor || '#38BDF8' },
                                isKnob && [styles.waterBarKnob, { backgroundColor: selectedColor || '#38BDF8' }],
                              ]}
                              hitSlop={10}
                            />
                          );
                        })}
                      </View>
                    </View>

                    <View style={styles.waterOptionsRow}>
                      {OPTIONS.map((v) => {
                        const isSelected = String(formData?.waterMlTarget ?? '2000') === String(v);
                        return (
                          <Pressable
                            key={v}
                            onPress={() => updateField('waterMlTarget', String(v))}
                            style={[
                              styles.waterOptionPill,
                              isDark && styles.waterOptionPillDark,
                              isSelected && [styles.waterOptionPillSelected, { borderColor: selectedColor || '#38BDF8' }],
                            ]}
                          >
                            <Text
                              style={[
                                styles.waterOptionText,
                                isDark && { color: '#e5e7eb' },
                                isSelected && { color: selectedColor || '#38BDF8' },
                              ]}
                            >
                              {v}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </>
                );
              })()}
            </View>
          ) : null}

          {isOrganizeSpacesTemplate ? (
            <View style={styles.section}>
              <Text style={[styles.label, isDark && { color: '#e5e7eb' }]}>
                {language === 'es'
                  ? 'Selecciona los espacios'
                  : language === 'pt'
                    ? 'Selecione os espaços'
                    : language === 'fr'
                      ? 'Sélectionnez les espaces'
                      : 'Select the spaces'}
              </Text>
              <Text style={[styles.sublabel, isDark && { color: '#9ca3af' }]}>
                {language === 'es'
                  ? 'Esto creará tu lista de espacios a organizar.'
                  : language === 'pt'
                    ? 'Isso criará sua lista de espaços para organizar.'
                    : language === 'fr'
                      ? "Cela créera votre liste d'espaces à organiser."
                      : 'This will create your spaces-to-organize list.'}
              </Text>

              {(() => {
                const listKey = spacesChecklistField?.key || 'checklist';
                const current = Array.isArray(formData?.[listKey]) ? formData[listKey] : [];
                const selectedLabels = current
                  .map((it) => (typeof it === 'string' ? it : it?.label))
                  .filter(Boolean);
                const selectedCount = selectedLabels.length;

                const selectedSummary =
                  selectedCount === 0
                    ? (language === 'es'
                        ? 'Ninguno seleccionado'
                        : language === 'pt'
                          ? 'Nenhum selecionado'
                          : language === 'fr'
                            ? 'Aucun s\u00e9lectionn\u00e9'
                            : 'None selected')
                    : (language === 'es'
                        ? `${selectedCount} seleccionados`
                        : language === 'pt'
                          ? `${selectedCount} selecionados`
                          : language === 'fr'
                            ? `${selectedCount} s\u00e9lectionn\u00e9s`
                            : `${selectedCount} selected`);

                return (
                  <View style={{ marginTop: 10 }}>
                    <Pressable
                      onPress={() => setSpacesDropdownOpen((v) => !v)}
                      style={[
                        styles.spacesDropdownHeader,
                        isDark && styles.spacesDropdownHeaderDark,
                      ]}
                    >
                      <View style={styles.spacesDropdownHeaderLeft}>
                        <Ionicons
                          name="home-outline"
                          size={18}
                          color={isDark ? '#e5e7eb' : '#111827'}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.spacesDropdownTitle, isDark && { color: '#e5e7eb' }]}>
                            {language === 'es'
                              ? 'Espacios'
                              : language === 'pt'
                                ? 'Espa\u00e7os'
                                : language === 'fr'
                                  ? 'Espaces'
                                  : 'Spaces'}
                          </Text>
                          <Text style={[styles.spacesDropdownSubtitle, isDark && { color: '#9ca3af' }]}>
                            {selectedSummary}
                          </Text>
                        </View>
                      </View>

                      <Ionicons
                        name={spacesDropdownOpen ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={isDark ? '#e5e7eb' : '#111827'}
                      />
                    </Pressable>

                    {spacesDropdownOpen ? (
                      <View style={styles.spacesDropdownBody}>
                        <View style={styles.spacesActionsRow}>
                          <Pressable
                            onPress={selectAllSpaces}
                            style={[styles.spacesActionBtn, isDark && styles.spacesActionBtnDark]}
                          >
                            <Ionicons
                              name="checkbox-outline"
                              size={18}
                              color={isDark ? '#e5e7eb' : '#111827'}
                            />
                            <Text style={[styles.spacesActionText, isDark && { color: '#e5e7eb' }]}>
                              {language === 'es'
                                ? 'Seleccionar todo'
                                : language === 'pt'
                                  ? 'Selecionar tudo'
                                  : language === 'fr'
                                    ? 'Tout s\u00e9lectionner'
                                    : 'Select all'}
                            </Text>
                          </Pressable>

                          <Pressable
                            onPress={clearSpaces}
                            style={[styles.spacesActionBtn, isDark && styles.spacesActionBtnDark]}
                          >
                            <Ionicons
                              name="close-circle-outline"
                              size={18}
                              color={isDark ? '#e5e7eb' : '#111827'}
                            />
                            <Text style={[styles.spacesActionText, isDark && { color: '#e5e7eb' }]}>
                              {language === 'es'
                                ? 'Limpiar'
                                : language === 'pt'
                                  ? 'Limpar'
                                  : language === 'fr'
                                    ? 'Effacer'
                                    : 'Clear'}
                            </Text>
                          </Pressable>
                        </View>

                        <View style={styles.spacesGrid}>
                          {SPACE_OPTIONS.map((opt) => {
                            const isSelected = selectedLabels.some(
                              (lbl) => String(lbl) === String(opt.label)
                            );

                            return (
                              <Pressable
                                key={opt.label}
                                onPress={() => toggleSpaceOption(opt.label)}
                                style={[
                                  styles.spacePill,
                                  isDark && styles.spacePillDark,
                                  isSelected && [
                                    styles.spacePillSelected,
                                    { borderColor: selectedColor || '#38BDF8' },
                                  ],
                                ]}
                              >
                                <Ionicons
                                  name={isSelected ? 'checkbox' : 'square-outline'}
                                  size={18}
                                  color={
                                    isSelected
                                      ? (selectedColor || '#38BDF8')
                                      : (isDark ? '#94a3af' : '#9ca3af')
                                  }
                                />
                                <Text
                                  style={[
                                    styles.spacePillText,
                                    isDark && { color: '#e5e7eb' },
                                    isSelected && { color: selectedColor || '#38BDF8' },
                                  ]}
                                >
                                  {`${opt.emoji} ${opt.label}`}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    ) : null}
                  </View>
                );
              })()}
            </View>
          ) : null}

          {isStudyTemplate ? (
            <>
              <View style={styles.section}>
                {(() => {

                  const selectedIdx = Number.isFinite(formData?.studySubject) ? formData.studySubject : null;
                  const selectedOther = String(formData?.studySubjectOther ?? '').trim();

                  const withEmoji = (label) => {
                    const clean = String(label ?? '').trim();
                    if (!clean) return '';
                    const emoji = STUDY_SUBJECT_EMOJI[clean];
                    if (!emoji) return clean;
                    if (clean.startsWith(emoji)) return clean;
                    return `${emoji} ${clean}`;
                  };

                  let selectedLabel = null;
                  if (selectedIdx !== null && STUDY_SUBJECT_OPTIONS[selectedIdx]) {
                    selectedLabel = STUDY_SUBJECT_OPTIONS[selectedIdx];
                  }

                  const selectedDisplay =
                    selectedLabel === 'Otros' && selectedOther
                      ? `${withEmoji('Otros')}: ${selectedOther}`
                      : withEmoji(selectedLabel);

                  const summary = selectedLabel
                    ? selectedDisplay
                    : (language === 'es'
                        ? 'Selecciona una opción'
                        : language === 'pt'
                          ? 'Selecione uma opção'
                          : language === 'fr'
                            ? 'Sélectionnez une option'
                            : 'Select an option');

                  return (
                    <View style={{ marginTop: 2 }}>
                      <Pressable
                        onPress={() => setStudyDropdownOpen((v) => !v)}
                        style={[
                          styles.spacesDropdownHeader,
                          isDark && styles.spacesDropdownHeaderDark,
                        ]}
                      >
                        <View style={styles.spacesDropdownHeaderLeft}>
                          <Ionicons
                            name="book-outline"
                            size={18}
                            color={isDark ? '#e5e7eb' : '#111827'}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.spacesDropdownTitle, isDark && { color: '#e5e7eb' }]}>
                              {language === 'es'
                                ? '¿Qué te gustaría estudiar hoy?'
                                : language === 'pt'
                                  ? 'O que você gostaria de estudar hoje?'
                                  : language === 'fr'
                                    ? "Qu’aimeriez-vous étudier aujourd’hui ?"
                                    : 'What would you like to study today?'}
                            </Text>
                            <Text style={[styles.spacesDropdownSubtitle, isDark && { color: '#9ca3af' }]}>
                              {summary}
                            </Text>
                          </View>
                        </View>

                        <Ionicons
                          name={studyDropdownOpen ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color={isDark ? '#e5e7eb' : '#111827'}
                        />
                      </Pressable>

                      {studyDropdownOpen ? (
                        <View style={styles.spacesDropdownBody}>
                          <View style={styles.waterOptionsRow}>
                            {STUDY_SUBJECT_OPTIONS.map((opt, idx) => {
                              const isSelected = Number(formData?.studySubject) === idx;
                              return (
                                <Pressable
                                  key={opt}
                                  onPress={() => {
                                    updateField('studySubject', idx);
                                    if (opt !== 'Otros') updateField('studySubjectOther', '');
                                    setStudyDropdownOpen(false);
                                  }}
                                  style={[
                                    styles.waterOptionPill,
                                    isDark && styles.waterOptionPillDark,
                                    isSelected && [
                                      styles.waterOptionPillSelected,
                                      { borderColor: selectedColor || '#38BDF8' },
                                    ],
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.waterOptionText,
                                      isDark && { color: '#e5e7eb' },
                                      isSelected && { color: selectedColor || '#38BDF8' },
                                    ]}
                                  >
                                    {withEmoji(opt)}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>

                          {(() => {
                            const idx = Number(formData?.studySubject);
                            return STUDY_SUBJECT_OPTIONS[idx] === 'Otros';
                          })() ? (
                            <View style={{ marginTop: 10 }}>
                              <TextInput
                                value={String(formData?.studySubjectOther ?? '')}
                                onChangeText={(v) => updateField('studySubjectOther', v)}
                                placeholder={language === 'es' ? 'Escribe el tema...' : 'Type the topic...'}
                                placeholderTextColor={isDark ? '#94a3af' : '#9ca3af'}
                                style={[
                                  styles.input,
                                  isDark && {
                                    backgroundColor: '#020617',
                                    borderColor: '#1e293b',
                                    color: '#e5e7eb',
                                  },
                                ]}
                              />
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  );
                })()}
              </View>

              <View style={styles.section}>
                <Text style={[styles.label, isDark && { color: '#e5e7eb' }]}>
                  {language === 'es'
                    ? '¿Cuánto tiempo dedicarás al estudiar?'
                    : language === 'pt'
                      ? 'Quanto tempo você vai dedicar a estudar?'
                      : language === 'fr'
                        ? 'Combien de temps allez-vous étudier ?'
                        : 'How much time will you dedicate to studying?'}
                </Text>
                <View style={[styles.waterOptionsRow, { marginTop: 10 }]}>
                  {STUDY_DURATION_OPTIONS.map((mins) => {
                    const isSelected = String(formData?.studyDurationMinutes ?? '30') === String(mins);
                    return (
                      <Pressable
                        key={mins}
                        onPress={() => updateField('studyDurationMinutes', String(mins))}
                        style={[
                          styles.waterOptionPill,
                          isDark && styles.waterOptionPillDark,
                          isSelected && [
                            styles.waterOptionPillSelected,
                            { borderColor: selectedColor || '#38BDF8' },
                          ],
                        ]}
                      >
                        <Text
                          style={[
                            styles.waterOptionText,
                            isDark && { color: '#e5e7eb' },
                            isSelected && { color: selectedColor || '#38BDF8' },
                          ]}
                        >
                          {mins} min
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </>
          ) : null}

          {isCourseTemplate ? (
            <>
              <View style={styles.section}>
                {(() => {
                  const selected = String(formData?.courseTopic ?? '').trim();
                  const selectedOther = String(formData?.courseTopicOther ?? '').trim();

                  const withEmoji = (label) => {
                    const clean = String(label ?? '').trim();
                    if (!clean) return '';
                    const emoji = COURSE_TOPIC_EMOJI[clean];
                    if (!emoji) return clean;
                    if (clean.startsWith(emoji)) return clean;
                    return `${emoji} ${clean}`;
                  };

                  const selectedDisplay =
                    selected === 'Otros' && selectedOther
                      ? `${withEmoji('Otros')}: ${selectedOther}`
                      : withEmoji(selected);

                  const summary = selected
                    ? selectedDisplay
                    : (language === 'es'
                        ? 'Selecciona una opción'
                        : language === 'pt'
                          ? 'Selecione uma opção'
                          : language === 'fr'
                            ? 'Sélectionnez une option'
                            : 'Select an option');

                  return (
                    <View style={{ marginTop: 2 }}>
                      <Pressable
                        onPress={() => setCourseDropdownOpen((v) => !v)}
                        style={[
                          styles.spacesDropdownHeader,
                          isDark && styles.spacesDropdownHeaderDark,
                        ]}
                      >
                        <View style={styles.spacesDropdownHeaderLeft}>
                          <Ionicons
                            name="school-outline"
                            size={18}
                            color={isDark ? '#e5e7eb' : '#111827'}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.spacesDropdownTitle, isDark && { color: '#e5e7eb' }]}>
                              {language === 'es'
                                ? '¿Qué curso tomarás hoy?'
                                : language === 'pt'
                                  ? 'Qual curso você fará hoje?'
                                  : language === 'fr'
                                    ? "Quel cours allez-vous suivre aujourd’hui ?"
                                    : 'Which course will you take today?'}
                            </Text>
                            <Text style={[styles.spacesDropdownSubtitle, isDark && { color: '#9ca3af' }]}>
                              {summary}
                            </Text>
                          </View>
                        </View>

                        <Ionicons
                          name={courseDropdownOpen ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color={isDark ? '#e5e7eb' : '#111827'}
                        />
                      </Pressable>

                      {courseDropdownOpen ? (
                        <View style={styles.spacesDropdownBody}>
                          <View style={styles.waterOptionsRow}>
                            {COURSE_TOPIC_OPTIONS.map((opt) => {
                              const isSelected = String(formData?.courseTopic ?? '') === String(opt);
                              return (
                                <Pressable
                                  key={opt}
                                  onPress={() => {
                                    updateField('courseTopic', String(opt));
                                    if (String(opt) !== 'Otros') updateField('courseTopicOther', '');
                                    setCourseDropdownOpen(false);
                                  }}
                                  style={[
                                    styles.waterOptionPill,
                                    isDark && styles.waterOptionPillDark,
                                    isSelected && [
                                      styles.waterOptionPillSelected,
                                      { borderColor: selectedColor || '#38BDF8' },
                                    ],
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.waterOptionText,
                                      isDark && { color: '#e5e7eb' },
                                      isSelected && { color: selectedColor || '#38BDF8' },
                                    ]}
                                  >
                                    {withEmoji(opt)}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>

                          {String(formData?.courseTopic ?? '') === 'Otros' ? (
                            <View style={{ marginTop: 10 }}>
                              <TextInput
                                value={String(formData?.courseTopicOther ?? '')}
                                onChangeText={(v) => updateField('courseTopicOther', v)}
                                placeholder={language === 'es' ? 'Escribe el curso...' : 'Type the course...'}
                                placeholderTextColor={isDark ? '#94a3af' : '#9ca3af'}
                                style={[
                                  styles.input,
                                  isDark && {
                                    backgroundColor: '#020617',
                                    borderColor: '#1e293b',
                                    color: '#e5e7eb',
                                  },
                                ]}
                              />
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  );
                })()}
              </View>

              <View style={styles.section}>
                <Text style={[styles.label, isDark && { color: '#e5e7eb' }]}>
                  {language === 'es'
                    ? '¿Cuánto tiempo dedicarás al curso?'
                    : language === 'pt'
                      ? 'Quanto tempo você vai dedicar ao curso?'
                      : language === 'fr'
                        ? 'Combien de temps allez-vous consacrer au cours ?'
                        : 'How much time will you dedicate to the course?'}
                </Text>
                <View style={[styles.waterOptionsRow, { marginTop: 10 }]}>
                  {STUDY_DURATION_OPTIONS.map((mins) => {
                    const isSelected = String(formData?.courseDurationMinutes ?? '30') === String(mins);
                    return (
                      <Pressable
                        key={mins}
                        onPress={() => updateField('courseDurationMinutes', String(mins))}
                        style={[
                          styles.waterOptionPill,
                          isDark && styles.waterOptionPillDark,
                          isSelected && [
                            styles.waterOptionPillSelected,
                            { borderColor: selectedColor || '#38BDF8' },
                          ],
                        ]}
                      >
                        <Text
                          style={[
                            styles.waterOptionText,
                            isDark && { color: '#e5e7eb' },
                            isSelected && { color: selectedColor || '#38BDF8' },
                          ]}
                        >
                          {mins} min
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </>
          ) : null}

          {isCreativeHobbyTemplate ? (
            <View style={styles.section}>
              {(() => {
                const selectedIdx = Number.isFinite(formData?.creativeHobbyOption) ? formData.creativeHobbyOption : null;
                const selectedOther = String(formData?.creativeHobbyOther ?? '').trim();

                const withEmoji = (label) => {
                  const clean = String(label ?? '').trim();
                  if (!clean) return '';
                  const emoji = CREATIVE_HOBBY_EMOJI[clean];
                  if (!emoji) return clean;
                  if (clean.startsWith(emoji)) return clean;
                  return `${emoji} ${clean}`;
                };

                let selectedLabel = null;
                if (selectedIdx !== null && CREATIVE_HOBBY_OPTIONS[selectedIdx]) {
                  selectedLabel = CREATIVE_HOBBY_OPTIONS[selectedIdx];
                }

                const selectedDisplay =
                  selectedLabel === 'Otros' && selectedOther
                    ? `${withEmoji('Otros')}: ${selectedOther}`
                    : withEmoji(selectedLabel);

                const summary = selectedLabel
                  ? selectedDisplay
                  : (language === 'es'
                      ? 'Selecciona una opción'
                      : language === 'pt'
                        ? 'Selecione uma opção'
                        : language === 'fr'
                          ? 'Sélectionnez une option'
                          : 'Select an option');

                return (
                  <View style={{ marginTop: 2 }}>
                    <Pressable
                      onPress={() => setCreativeHobbyDropdownOpen((v) => !v)}
                      style={[
                        styles.spacesDropdownHeader,
                        isDark && styles.spacesDropdownHeaderDark,
                      ]}
                    >
                      <View style={styles.spacesDropdownHeaderLeft}>
                        <Ionicons
                          name="color-palette-outline"
                          size={18}
                          color={isDark ? '#e5e7eb' : '#111827'}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.spacesDropdownTitle, isDark && { color: '#e5e7eb' }]}>
                            {language === 'es'
                              ? '¿Qué hobby quieres hacer hoy?'
                              : language === 'pt'
                                ? 'Qual hobby criativo você quer fazer hoje?'
                                : language === 'fr'
                                  ? 'Quel hobby créatif voulez-vous faire aujourd’hui ?'
                                  : 'What creative hobby do you want to do today?'}
                          </Text>
                          <Text style={[styles.spacesDropdownSubtitle, isDark && { color: '#9ca3af' }]}>
                            {summary}
                          </Text>
                        </View>
                      </View>

                      <Ionicons
                        name={creativeHobbyDropdownOpen ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={isDark ? '#e5e7eb' : '#111827'}
                      />
                    </Pressable>

                    {creativeHobbyDropdownOpen ? (
                      <View style={styles.spacesDropdownBody}>
                        <View style={[styles.waterOptionsRow, { justifyContent: 'center', flexWrap: 'wrap' }]}> 
                          {CREATIVE_HOBBY_OPTIONS.map((opt, idx) => {
                            const isSelected = Number(formData?.creativeHobbyOption) === idx;
                            return (
                              <Pressable
                                key={opt}
                                onPress={() => {
                                  updateField('creativeHobbyOption', idx);
                                  if (opt !== 'Otros') updateField('creativeHobbyOther', '');
                                }}
                                style={[
                                  styles.waterOptionPill,
                                  isDark && styles.waterOptionPillDark,
                                  isSelected && [
                                    styles.waterOptionPillSelected,
                                    { borderColor: selectedColor || '#38BDF8' },
                                  ],
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.waterOptionText,
                                    isDark && { color: '#e5e7eb' },
                                    isSelected && { color: selectedColor || '#38BDF8' },
                                    { textAlign: 'center', minWidth: 120 },
                                  ]}
                                >
                                  {withEmoji(opt)}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>

                        {(() => {
                          const idx = Number(formData?.creativeHobbyOption);
                          return CREATIVE_HOBBY_OPTIONS[idx] === 'Otros';
                        })() ? (
                          <View style={{ marginTop: 10 }}>
                            <TextInput
                              value={String(formData?.creativeHobbyOther ?? '')}
                              onChangeText={(v) => updateField('creativeHobbyOther', v)}
                              placeholder={language === 'es' ? 'Escribe cuál...' : 'Type which one...'}
                              placeholderTextColor={isDark ? '#94a3af' : '#9ca3af'}
                              style={[
                                styles.input,
                                isDark && {
                                  backgroundColor: '#020617',
                                  borderColor: '#1e293b',
                                  color: '#e5e7eb',
                                },
                              ]}
                            />
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                );
              })()}
            </View>
          ) : null}

          {isResearchTemplate ? (
            <>
              <View style={styles.section}>
                {(() => {
                  const selected = String(formData?.researchTopic ?? '').trim();
                  const selectedOther = String(formData?.researchTopicOther ?? '').trim();

                  const withEmoji = (label) => {
                    const clean = String(label ?? '').trim();
                    if (!clean) return '';
                    const emoji = RESEARCH_TOPIC_EMOJI[clean];
                    if (!emoji) return clean;
                    if (clean.startsWith(emoji)) return clean;
                    return `${emoji} ${clean}`;
                  };

                  const selectedDisplay =
                    selected === 'Otros' && selectedOther
                      ? `${withEmoji('Otros')}: ${selectedOther}`
                      : withEmoji(selected);

                  const summary = selected
                    ? selectedDisplay
                    : (language === 'es'
                        ? 'Selecciona una opción'
                        : language === 'pt'
                          ? 'Selecione uma opção'
                          : language === 'fr'
                            ? 'Sélectionnez une option'
                            : 'Select an option');

                  return (
                    <View style={{ marginTop: 2 }}>
                      <Pressable
                        onPress={() => setResearchDropdownOpen((v) => !v)}
                        style={[
                          styles.spacesDropdownHeader,
                          isDark && styles.spacesDropdownHeaderDark,
                        ]}
                      >
                        <View style={styles.spacesDropdownHeaderLeft}>
                          <Ionicons
                            name="search-outline"
                            size={18}
                            color={isDark ? '#e5e7eb' : '#111827'}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.spacesDropdownTitle, isDark && { color: '#e5e7eb' }]}>
                              {language === 'es'
                                ? '¿Qué te gustaría investigar hoy?'
                                : language === 'pt'
                                  ? 'O que você gostaria de pesquisar hoje?'
                                  : language === 'fr'
                                    ? "Qu’aimeriez-vous rechercher aujourd’hui ?"
                                    : 'What would you like to research today?'}
                            </Text>
                            <Text style={[styles.spacesDropdownSubtitle, isDark && { color: '#9ca3af' }]}>
                              {summary}
                            </Text>
                          </View>
                        </View>

                        <Ionicons
                          name={researchDropdownOpen ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color={isDark ? '#e5e7eb' : '#111827'}
                        />
                      </Pressable>

                      {researchDropdownOpen ? (
                        <View style={styles.spacesDropdownBody}>
                          <View style={styles.waterOptionsRow}>
                            {RESEARCH_TOPIC_OPTIONS.map((opt) => {
                              const isSelected = String(formData?.researchTopic ?? '') === String(opt);
                              return (
                                <Pressable
                                  key={opt}
                                  onPress={() => {
                                    updateField('researchTopic', String(opt));
                                    if (String(opt) !== 'Otros') updateField('researchTopicOther', '');
                                    setResearchDropdownOpen(false);
                                  }}
                                  style={[
                                    styles.waterOptionPill,
                                    isDark && styles.waterOptionPillDark,
                                    isSelected && [
                                      styles.waterOptionPillSelected,
                                      { borderColor: selectedColor || '#38BDF8' },
                                    ],
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.waterOptionText,
                                      isDark && { color: '#e5e7eb' },
                                      isSelected && { color: selectedColor || '#38BDF8' },
                                    ]}
                                  >
                                    {withEmoji(opt)}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>

                          {String(formData?.researchTopic ?? '') === 'Otros' ? (
                            <View style={{ marginTop: 10 }}>
                              <TextInput
                                value={String(formData?.researchTopicOther ?? '')}
                                onChangeText={(v) => updateField('researchTopicOther', v)}
                                placeholder={language === 'es' ? 'Escribe el tema...' : 'Type the topic...'}
                                placeholderTextColor={isDark ? '#94a3af' : '#9ca3af'}
                                style={[
                                  styles.input,
                                  isDark && {
                                    backgroundColor: '#020617',
                                    borderColor: '#1e293b',
                                    color: '#e5e7eb',
                                  },
                                ]}
                              />
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  );
                })()}
              </View>

              <View style={styles.section}>
                <Text style={[styles.label, isDark && { color: '#e5e7eb' }]}>
                  {language === 'es'
                    ? '¿Cuánto tiempo dedicarás a investigar?'
                    : language === 'pt'
                      ? 'Quanto tempo você vai dedicar a pesquisar?'
                      : language === 'fr'
                        ? 'Combien de temps allez-vous consacrer à la recherche ?'
                        : 'How much time will you dedicate to researching?'}
                </Text>
                <View style={[styles.waterOptionsRow, { marginTop: 10 }]}>
                  {STUDY_DURATION_OPTIONS.map((mins) => {
                    const isSelected = String(formData?.researchDurationMinutes ?? '30') === String(mins);
                    return (
                      <Pressable
                        key={mins}
                        onPress={() => updateField('researchDurationMinutes', String(mins))}
                        style={[
                          styles.waterOptionPill,
                          isDark && styles.waterOptionPillDark,
                          isSelected && [
                            styles.waterOptionPillSelected,
                            { borderColor: selectedColor || '#38BDF8' },
                          ],
                        ]}
                      >
                        <Text
                          style={[
                            styles.waterOptionText,
                            isDark && { color: '#e5e7eb' },
                            isSelected && { color: selectedColor || '#38BDF8' },
                          ]}
                        >
                          {mins} min
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </>
          ) : null}

          {isPodcastTemplate ? (
            <View style={styles.section}>
              <Text style={[styles.label, isDark && { color: '#e5e7eb' }]}>
                {language === 'es'
                  ? '¿Qué podcast deseas escuchar?'
                  : language === 'pt'
                    ? 'Qual podcast você quer ouvir?'
                    : language === 'fr'
                      ? 'Quel podcast voulez-vous écouter ?'
                      : 'Which podcast do you want to listen to?'}
              </Text>
              <TextInput
                value={String(formData?.podcastName ?? '')}
                onChangeText={(v) => updateField('podcastName', v)}
                placeholder={language === 'es' ? 'Ej: The Diary of a CEO' : 'e.g. The Diary of a CEO'}
                placeholderTextColor={isDark ? '#94a3af' : '#9ca3af'}
                style={[
                  styles.input,
                  isDark && {
                    backgroundColor: '#020617',
                    borderColor: '#1e293b',
                    color: '#e5e7eb',
                  },
                ]}
              />
            </View>
          ) : null}

          {isLanguagePracticeTemplate ? (
            <>
              <View style={styles.section}>
                {(() => {

                  const selectedIdx = Number.isFinite(formData?.languagePracticeLanguage) ? formData.languagePracticeLanguage : null;
                  const other = String(formData?.languagePracticeOther ?? '').trim();

                  const withEmoji = (label) => {
                    const clean = String(label ?? '').trim();
                    if (!clean) return '';
                    const emoji = LANGUAGE_EMOJI[clean];
                    if (!emoji) return clean;
                    if (clean.startsWith(emoji)) return clean;
                    return `${emoji} ${clean}`;
                  };

                  let selectedLabel = null;
                  if (selectedIdx !== null && LANGUAGE_OPTIONS[selectedIdx]) {
                    selectedLabel = LANGUAGE_OPTIONS[selectedIdx];
                  }

                  const selectedDisplay =
                    selectedLabel === 'Otros' && other
                      ? `${withEmoji('Otros')}: ${other}`
                      : withEmoji(selectedLabel);

                  const summary = selectedLabel
                    ? selectedDisplay
                    : (language === 'es'
                        ? 'Selecciona un idioma'
                        : language === 'pt'
                          ? 'Selecione um idioma'
                          : language === 'fr'
                            ? 'Sélectionnez une langue'
                            : 'Select a language');

                  return (
                    <View style={{ marginTop: 2 }}>
                      <Pressable
                        onPress={() => setLanguageDropdownOpen((v) => !v)}
                        style={[
                          styles.spacesDropdownHeader,
                          isDark && styles.spacesDropdownHeaderDark,
                        ]}
                      >
                        <View style={styles.spacesDropdownHeaderLeft}>
                          <Ionicons
                            name="language-outline"
                            size={18}
                            color={isDark ? '#e5e7eb' : '#111827'}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.spacesDropdownTitle, isDark && { color: '#e5e7eb' }]}>
                              {language === 'es'
                                ? '¿Qué idioma practicarás hoy?'
                                : language === 'pt'
                                  ? 'Que idioma você vai praticar hoje?'
                                  : language === 'fr'
                                    ? "Quelle langue allez-vous pratiquer aujourd’hui ?"
                                    : 'Which language will you practice today?'}
                            </Text>
                            <Text style={[styles.spacesDropdownSubtitle, isDark && { color: '#9ca3af' }]}>
                              {summary}
                            </Text>
                          </View>
                        </View>

                        <Ionicons
                          name={languageDropdownOpen ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color={isDark ? '#e5e7eb' : '#111827'}
                        />
                      </Pressable>

                      {languageDropdownOpen ? (
                        <View style={styles.spacesDropdownBody}>
                          <View style={styles.waterOptionsRow}>
                            {LANGUAGE_OPTIONS.map((opt, idx) => {
                              const isSelected = Number(formData?.languagePracticeLanguage) === idx;
                              return (
                                <Pressable
                                  key={opt}
                                  onPress={() => {
                                    updateField('languagePracticeLanguage', idx);
                                    if (opt !== 'Otros') updateField('languagePracticeOther', '');
                                    setLanguageDropdownOpen(false);
                                  }}
                                  style={[
                                    styles.waterOptionPill,
                                    isDark && styles.waterOptionPillDark,
                                    isSelected && [
                                      styles.waterOptionPillSelected,
                                      { borderColor: selectedColor || '#38BDF8' },
                                    ],
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.waterOptionText,
                                      isDark && { color: '#e5e7eb' },
                                      isSelected && { color: selectedColor || '#38BDF8' },
                                    ]}
                                  >
                                    {withEmoji(opt)}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>

                          {(() => {
                            const idx = Number(formData?.languagePracticeLanguage);
                            return LANGUAGE_OPTIONS[idx] === 'Otros';
                          })() ? (
                            <View style={{ marginTop: 10 }}>
                              <TextInput
                                value={String(formData?.languagePracticeOther ?? '')}
                                onChangeText={(v) => updateField('languagePracticeOther', v)}
                                placeholder={language === 'es' ? 'Escribe el idioma...' : 'Type the language...'}
                                placeholderTextColor={isDark ? '#94a3af' : '#9ca3af'}
                                style={[
                                  styles.input,
                                  isDark && {
                                    backgroundColor: '#020617',
                                    borderColor: '#1e293b',
                                    color: '#e5e7eb',
                                  },
                                ]}
                              />
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  );
                })()}
              </View>

              <View style={styles.section}>
                <Text style={[styles.label, isDark && { color: '#e5e7eb' }]}>
                  {language === 'es'
                    ? '¿Cuánto tiempo practicarás?'
                    : language === 'pt'
                      ? 'Quanto tempo você vai praticar?'
                      : language === 'fr'
                        ? 'Combien de temps allez-vous pratiquer ?'
                        : 'How long will you practice?'}
                </Text>
                <View style={[styles.waterOptionsRow, { marginTop: 10 }]}>
                  {STUDY_DURATION_OPTIONS.map((mins) => {
                    const isSelected = String(formData?.languagePracticeDurationMinutes ?? '30') === String(mins);
                    return (
                      <Pressable
                        key={mins}
                        onPress={() => updateField('languagePracticeDurationMinutes', String(mins))}
                        style={[
                          styles.waterOptionPill,
                          isDark && styles.waterOptionPillDark,
                          isSelected && [
                            styles.waterOptionPillSelected,
                            { borderColor: selectedColor || '#38BDF8' },
                          ],
                        ]}
                      >
                        <Text
                          style={[
                            styles.waterOptionText,
                            isDark && { color: '#e5e7eb' },
                            isSelected && { color: selectedColor || '#38BDF8' },
                          ]}
                        >
                          {mins} min
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </>
          ) : null}

          {/* HORARIO */}
          {!isBirthdayTemplate && !isSavingsTemplate && !isWaterTemplate && !isStudyTemplate && !isCourseTemplate && !isResearchTemplate && !isPodcastTemplate && !isLanguagePracticeTemplate ? (
            <View style={styles.section}>
              <Text style={[styles.label, isDark && { color: '#e5e7eb' }]}>{t('habitForm.timeLabel')}</Text>

              <Pressable
                style={[styles.box, isDark && { backgroundColor: '#020617', borderColor: '#1e293b' }]}
                onPress={() => setTimePickerVisible(true)}
              >
                <Text style={[styles.boxLabel, isDark && { color: '#e5e7eb' }]}>{t('habitForm.timeLabel')}</Text>
                <View style={styles.boxRight}>
                  <Text style={[styles.boxValue, isDark && { color: '#e5e7eb' }]}>
                    {time ? formatTimeFromDate(time, { language, timeFormat }) : 'Select the time'}
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
            </View>
          ) : null}

          {isSavingsTemplate ? (
            <View style={styles.section}>
              <Text style={[styles.label, isDark && { color: '#e5e7eb' }]}> 
                {t('specialHabits.savings.question')}
              </Text>
              <TextInput
                value={String(formData?.savingsTargetAmount ?? '')}
                onChangeText={(v) => updateField('savingsTargetAmount', v)}
                keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                placeholder={t('specialHabits.savings.placeholder')}
                placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
                style={[
                  styles.input,
                  isDark && { backgroundColor: '#020617', borderColor: '#1e293b', color: '#e5e7eb' },
                ]}
              />

              <Text style={[styles.label, { marginTop: 12 }, isDark && { color: '#e5e7eb' }]}> 
                {t('habitForm.savingsSavedLabel') || 'Meta ahorrada'}
              </Text>
              <Text
                style={[
                  styles.sublabel,
                  { marginTop: 0, fontSize: 13, fontWeight: '500' },
                  isDark && { color: '#9ca3af' },
                ]}
              >
                {t('habitForm.savingsSavedHelp') || 'Lo que llevas ahorrado hasta ahora (tu progreso).'}
              </Text>
              <TextInput
                value={String(formData?.savingsSavedAmount ?? '')}
                onChangeText={(v) => updateField('savingsSavedAmount', v)}
                keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                placeholder={t('habitForm.savingsSavedPlaceholder') || 'Ej: 0'}
                placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
                style={[
                  styles.input,
                  isDark && { backgroundColor: '#020617', borderColor: '#1e293b', color: '#e5e7eb' },
                ]}
              />
            </View>
          ) : null}



          {/* Frecuencia: solo anual seleccionable para cumpleaños */}
          <View style={[styles.freqGrid, styles.freqGridCentered]}>
            {(isSavingsTemplate ? SAVINGS_FREQUENCIES : FREQUENCIES).map((f) => {
              const isAnnual = f.key === 'yearly';
              const isDisabled = isBirthdayTemplate && !isAnnual;
              return (
                <Pressable
                  key={f.key}
                  style={[
                    styles.freqBtn,
                    frequency === f.key && styles.freqBtnActive,
                    isDisabled && { opacity: 0.4 },
                  ]}
                  onPress={() => {
                    if (!isDisabled) setFrequency(f.key);
                  }}
                  disabled={isDisabled}
                >
                  <Ionicons
                    name={f.icon}
                    size={20}
                    color={frequency === f.key ? '#fff' : '#38BDF8'}
                  />
                  <Text style={[styles.freqTxt, frequency === f.key && styles.freqTxtActive]}>
                    {t(`habitForm.frequency${f.key.charAt(0).toUpperCase() + f.key.slice(1)}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Days of week selection for weekly frequency */}
          {frequency === 'weekly' && !isBirthdayTemplate && !isSavingsTemplate && (
            <View style={{ alignItems: 'center', marginTop: 10 }}>
              <Text style={[styles.label, { marginBottom: 8 }, isDark && { color: '#e5e7eb' }]}>Selecciona los días de la semana</Text>
              <View style={styles.daysRow}>
                {WEEK_DAYS.map((day) => {
                  const isSelected = daysOfWeek.includes(day.key);
                  let label = day.es;
                  if (language === 'en') label = day.en;
                  else if (language === 'pt') label = day.pt;
                  else if (language === 'fr') label = day.fr;
                  return (
                    <Pressable
                      key={day.key}
                      onPress={() => toggleDay(day.key)}
                      style={[
                        styles.dayBtn,
                        isSelected && styles.dayBtnActive,
                        { marginHorizontal: 2 },
                      ]}
                    >
                      <Text style={[
                        styles.dayTxt,
                        isSelected && { color: '#fff' },
                        isDark && !isSelected && { color: '#e5e7eb' },
                      ]}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}



          {/* Campo de edad para cumpleaños */}
          {isBirthdayTemplate && (() => {
            // Buscar el campo de nombre de la persona (¿Quién cumplirá años?)
            let nombre = '';
            const config = habit?.config ? (typeof habit.config === 'object' ? habit.config : JSON.parse(habit.config)) : null;
            if (config && Array.isArray(config.fields)) {
              const textField = config.fields.find(f => String(f?.type).toLowerCase() === 'text');
              if (textField && formData && formData[textField.key]) {
                nombre = String(formData[textField.key]);
              }
            }
            return (
              <View style={styles.section}>
                <Text style={[styles.label, isDark && { color: '#e5e7eb' }]}>¿Cuántos años cumplirá {nombre || 'esta persona'} en {new Date().getFullYear()}?</Text>
                <TextInput
                  style={[styles.input, isDark && styles.inputDark]}
                  keyboardType="numeric"
                  value={formData.birthdayAge ? String(formData.birthdayAge) : ''}
                  onChangeText={(v) => {
                    const n = parseInt(v, 10);
                    updateField('birthdayAge', isNaN(n) ? '' : String(n));
                  }}
                  placeholder="Edad que cumplirá este año"
                  placeholderTextColor={isDark ? '#94a3af' : '#9ca3af'}
                />

              </View>
            );
          })()}

          {/* CAMPOS PERSONALIZADOS */}
          {!isBirthdayTemplate &&
            !isWaterTemplate &&
            !isStudyTemplate &&
            !isCourseTemplate &&
            !isResearchTemplate &&
            !isPodcastTemplate &&
            !isLanguagePracticeTemplate &&
            config?.fields
              ?.filter((field) => {
                if (
                  isOrganizeSpacesTemplate &&
                  String(field?.type || '').toLowerCase() === 'checklist'
                ) {
                  return false;
                }

                // Remove the skincare prompt section (e.g. "¿Con qué cuidarás tu piel hoy?")
                // by hiding the template's free-text question field.
                if (
                  isSkincareTemplate &&
                  String(field?.type || '').toLowerCase() === 'text'
                ) {
                  return false;
                }

                // Creative hobby: replace the free-text question with a dropdown.
                if (
                  isCreativeHobbyTemplate &&
                  String(field?.type || '').toLowerCase() === 'text'
                ) {
                  return false;
                }
                return true;
              })
              .map((field) => (
                <View key={field.key} style={styles.section}>
                  {renderField(field)}
                </View>
              ))}

          {/* COLOR */}
          {!isBirthdayTemplate && !isBannerLockedTemplate && !isSavingsTemplate && (
            <View style={styles.section}>
              <Text style={[styles.label, styles.colorLabel, isDark && { color: '#e5e7eb' }]}>{t('habitForm.colorLabel') || 'Color'}</Text>
              <View style={{ marginTop: 8 }}>
                <View style={styles.colorGrid}>
                  {COLOR_OPTIONS.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => {
                        setSelectedColor(c);
                        setHeaderColorPreviewEnabled(true);
                      }}
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
          )}

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
    width: 72,
    height: 72,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
    maxWidth: 220,
    lineHeight: 22,
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

  // Water target selector
  waterBarTrack: {
    height: 26,
    borderRadius: 999,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 8,
    overflow: 'hidden',
  },
  waterBarTrackDark: {
    backgroundColor: '#0b1120',
    borderColor: '#1e293b',
  },
  waterBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
    opacity: 0.35,
  },
  waterBarDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  waterBarDot: {
    width: 14,
    height: 14,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  waterBarDotDark: {
    backgroundColor: '#020617',
    borderColor: '#334155',
  },
  waterBarKnob: {
    width: 18,
    height: 18,
    borderWidth: 0,
  },
  waterOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  waterOptionPill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  waterOptionPillDark: {
    backgroundColor: '#071127',
    borderColor: '#273142',
  },
  waterOptionPillSelected: {
    borderWidth: 2,
  },
  waterOptionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },

  // Organize spaces selector
  spacesDropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  spacesDropdownHeaderDark: {
    backgroundColor: '#071127',
    borderColor: '#273142',
  },
  spacesDropdownHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  spacesDropdownTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
  },
  spacesDropdownSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
  },
  spacesDropdownBody: {
    marginTop: 10,
  },
  spacesActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  spacesActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  spacesActionBtnDark: {
    backgroundColor: '#071127',
    borderColor: '#273142',
  },
  spacesActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  spacesGrid: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  spacePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  spacePillDark: {
    backgroundColor: '#071127',
    borderColor: '#273142',
  },
  spacePillSelected: {
    borderWidth: 2,
  },
  spacePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
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