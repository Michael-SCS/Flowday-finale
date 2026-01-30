// ...existing code...
// Mover la definición de creativeHobbyMeta justo después de habitTypeForCard en el cuerpo principal de Calendar
import 'react-native-get-random-values';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Animated,
  Image,
  ImageBackground,
  FlatList,
  Alert,
  Modal,
  LayoutAnimation,
  InteractionManager,
  Platform,
  UIManager,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CalendarProvider,
  ExpandableCalendar,
  LocaleConfig,
} from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable, ScrollView } from 'react-native-gesture-handler';
import { ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { loadHabitTemplates } from '../utils/habitCache';
import HabitFormModal from './HabitFormModal';
import ChecklistTable from './ChecklistTable';
import MarketTable from './MarketTable';
import MarketAddModal from './MarketAddModal';
import VitaminsTable from './VitaminsTable';
import VitaminsAddModal from './VitaminsAddModal';
import { v4 as uuidv4 } from 'uuid';
import { useSettings, getAccentColor } from '../utils/settingsContext';
import { useI18n } from '../utils/i18n';
import { translateHabitCategory } from '../utils/habitCategories';
import {
  loadActivities as loadUserActivities,
  saveActivities as saveUserActivities,
} from '../utils/localActivities';
import { rescheduleHabitNotification } from '../utils/notifications';
import { formatTimeFromHHmm } from '../utils/timeFormat';
import { getDismissedMoodBannerDate, getMoodForDate, setDismissedMoodBannerDate } from '../utils/moodTracker';
import { pickMoodMessage } from '../utils/moodMessages';
import MoodMessageBanner from './MoodMessageBanner';

// Función para obtener la fecha local correctamente
function getTodayLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getContrastColor(hex) {
  try {
    const c = String(hex || '').replace('#', '');
    if (c.length < 6) return '#111827';

    const r = parseInt(c.substr(0, 2), 16);
    const g = parseInt(c.substr(2, 2), 16);
    const b = parseInt(c.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    // Lower threshold so more colors get a dark foreground for better readability
    return luminance > 0.35 ? '#111827' : '#ffffff';
  } catch {
    return '#111827';
  }
}

function parseMoneyLike(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value)
    .trim()
    .replace(/[^0-9,.-]/g, '')
    .replace(',', '.');
  if (!normalized) return null;
  const num = parseFloat(normalized);
  return Number.isFinite(num) ? num : null;
}

function parseMlLike(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim().replace(/[^0-9-]/g, '');
  if (!normalized) return null;
  const num = parseInt(normalized, 10);
  return Number.isFinite(num) ? num : null;
}

function looksLikeSavingsTitle(text) {
  const t = String(text || '').toLowerCase();
  return (
    t.includes('ahorrar') ||
    t.includes('ahorro') ||
    t.includes('savings') ||
    t.includes('save money') ||
    t.includes('economizar') ||
    t.includes('économ')
  );
}

function looksLikeWaterTitle(text) {
  const t = String(text || '').toLowerCase();
  return (
    (t.includes('beber') && t.includes('agua')) ||
    t.includes('agua') ||
    t.includes('water') ||
    t.includes('eau') ||
    t.includes('água') ||
    t.includes('agua')
  );
}

function looksLikeStudyTitle(text) {
  const t = String(text || '').toLowerCase();
  return (
    t.includes('estudiar') ||
    t.includes('estudio') ||
    t.includes('study') ||
    t.includes('studying') ||
    t.includes('étudier') ||
    t.includes('etudier')
  );
}

function looksLikeCourseTitle(text) {
  const t = String(text || '').toLowerCase();
  return (
    t.includes('tomar un curso') ||
    t.includes('tomar curso') ||
    t.includes('curso') ||
    t.includes('take a course') ||
    t.includes('course')
  );
}

function looksLikeResearchTitle(text) {
  const t = String(text || '').toLowerCase();
  return (
    t.includes('investigar') ||
    t.includes('investigación') ||
    t.includes('investigacion') ||
    t.includes('research') ||
    t.includes('investigate')
  );
}

function looksLikePodcastTitle(text) {
  const t = String(text || '').toLowerCase();
  return (
    t.includes('escuchar podcast') ||
    t.includes('podcast') ||
    (t.includes('escuchar') && t.includes('podcast'))
  );
}

function looksLikeLanguagePracticeTitle(text) {
  const t = String(text || '').toLowerCase();
  return (
    t.includes('practicar idioma') ||
    t.includes('language practice') ||
    (t.includes('practicar') && t.includes('idioma'))
  );
}

function looksLikeFamilyTitle(text) {
  const t = String(text || '').toLowerCase();
  return (
    t.includes('pasar tiempo en familia') ||
    (t.includes('tiempo') && t.includes('familia')) ||
    t.includes('family time') ||
    (t.includes('time') && t.includes('family'))
  );
}

function looksLikeGymTitle(text) {
  const t = String(text || '').toLowerCase();
  return t.includes('ir al gimnasio') || t.includes('gimnasio') || t.includes('gym');
}

function looksLikeInboxZeroTitle(text) {
  const t = String(text || '').toLowerCase();
  return t.includes('inboxzero') || t.includes('inbox zero');
}

function looksLikeMarketListTitle(text) {
  const t = String(text || '').toLowerCase();
  return (
    t.includes('lista de mercado') ||
    t.includes('lista del mercado') ||
    t.includes('lista de compras') ||
    t.includes('shopping list') ||
    t.includes('mercado')
  );
}

function looksLikePlanningDayTitle(text) {
  const t = String(text || '').toLowerCase();
  return (
    t.includes('planer el día') ||
    t.includes('planer el dia') ||
    t.includes('planear el día') ||
    t.includes('planear el dia') ||
    t.includes('planificar el día') ||
    t.includes('planning day') ||
    t.includes('planifier la journée') || // francés
    t.includes('planejar o dia') || // portugués
    t.includes('plan the day') // inglés
  );
}

function looksLikeSunTitle(text) {
  const t = String(text || '').toLowerCase();
  return (
    t.includes('tomar el sol') ||
    t.includes('tomar sol') ||
    (t.includes('tomar') && t.includes('sol')) ||
    t.includes('sunbath') ||
    t.includes('sun bath') ||
    t.includes('get sunlight') ||
    t.includes('get sun') ||
    t.includes('prendre le soleil') || // francés
    t.includes('prendre soleil') ||
    (t.includes('prendre') && t.includes('soleil')) ||
    t.includes('pegar sol') || // portugués
    t.includes('sun') && t.includes('habit') // fallback for English
  );
}

function getWaterMotivation(progress, t) {
  const p = Number.isFinite(progress) ? progress : 0;
  if (p >= 1) return t('calendar.waterGoalReached');
  if (p >= 0.75) return t('calendar.waterAlmostThere');
  if (p >= 0.5) return t('calendar.waterDoingGreat');
  if (p > 0) return t('calendar.waterGoodStart');
  return t('calendar.waterStartGlass');
}

function getSavingsMotivation(progress, t) {
  const p = Number.isFinite(progress) ? progress : 0;
  if (p >= 1) return t('calendar.savingsGoalReached');
  if (p >= 0.75) return t('calendar.savingsAlmostThere');
  if (p >= 0.5) return t('calendar.savingsHalfway');
  if (p >= 0.25) return t('calendar.savingsGoodStart');
  if (p > 0) return t('calendar.savingsEveryBitCounts');
  return t('calendar.savingsStartToday');
}

const today = getTodayLocal();

/* =========================
   DATE HELPERS (GLOBAL)
========================= */

function timeStringToMinutes(timeStr) {
  if (!timeStr) return null;
  const [h, m] = String(timeStr).split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function minutesToTimeString(totalMinutes) {
  if (!Number.isFinite(totalMinutes)) return null;
  const mins = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  const h = String(Math.floor(mins / 60)).padStart(2, '0');
  const m = String(mins % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function buildSuggestedTimeMinutesAround(
  startMinutes,
  {
    stepMinutes = 30,
    minMinutes = 6 * 60,
    maxMinutes = 22 * 60,
    maxSuggestions = 4,
  } = {}
) {
  if (!Number.isFinite(startMinutes)) return [];
  const suggestions = [];

  for (let i = 1; suggestions.length < maxSuggestions && i <= 48; i += 1) {
    const forward = startMinutes + i * stepMinutes;
    const backward = startMinutes - i * stepMinutes;

    if (forward >= minMinutes && forward <= maxMinutes) {
      suggestions.push(forward);
      if (suggestions.length >= maxSuggestions) break;
    }
    if (backward >= minMinutes && backward <= maxMinutes) {
      suggestions.push(backward);
      if (suggestions.length >= maxSuggestions) break;
    }

    if (forward > maxMinutes && backward < minMinutes) break;
  }

  return suggestions;
}

function computeEndTimeString(startTimeString, durationMinutes) {
  const startMin = timeStringToMinutes(startTimeString);
  if (startMin == null) return null;
  const DEFAULT_DURATION_IF_EMPTY_MINUTES = 60;
  const duration =
    typeof durationMinutes === 'number' && durationMinutes > 0
      ? durationMinutes
      : DEFAULT_DURATION_IF_EMPTY_MINUTES;
  return minutesToTimeString(startMin + duration);
}

function suggestTimesForDay(existingActivities, candidate, editingActivityId) {
  const startMin = timeStringToMinutes(candidate?.time);
  if (startMin == null) return [];

  const DEFAULT_DURATION_IF_EMPTY_MINUTES = 60;

  const durationMinutes =
    typeof candidate.durationMinutes === 'number' && candidate.durationMinutes > 0
      ? candidate.durationMinutes
      : DEFAULT_DURATION_IF_EMPTY_MINUTES;

  const minuteCandidates = buildSuggestedTimeMinutesAround(startMin);
  const timeCandidates = minuteCandidates
    .map(minutesToTimeString)
    .filter(Boolean);

  const out = [];
  for (const tStr of timeCandidates) {
    const ok = !hasTimeConflictForDate(
      existingActivities || [],
      { time: tStr, durationMinutes },
      editingActivityId
    );
    if (ok) out.push(tStr);
    if (out.length >= 4) break;
  }
  return out;
}

function suggestTimesForSeries(activitiesByDate, datesToCreate, candidate) {
  const startMin = timeStringToMinutes(candidate?.time);
  if (startMin == null) return [];

  const DEFAULT_DURATION_IF_EMPTY_MINUTES = 60;

  const durationMinutes =
    typeof candidate.durationMinutes === 'number' && candidate.durationMinutes > 0
      ? candidate.durationMinutes
      : DEFAULT_DURATION_IF_EMPTY_MINUTES;

  const minuteCandidates = buildSuggestedTimeMinutesAround(startMin);
  const timeCandidates = minuteCandidates
    .map(minutesToTimeString)
    .filter(Boolean);

  const out = [];
  for (const tStr of timeCandidates) {
    const okAllDays = (datesToCreate || []).every((date) =>
      !hasTimeConflictForDate(
        (activitiesByDate && activitiesByDate[date]) || [],
        { time: tStr, durationMinutes },
        null
      )
    );
    if (okAllDays) out.push(tStr);
    if (out.length >= 4) break;
  }
  return out;
}

function hasTimeConflictForDate(existingActivities, candidate, editingActivityId) {
  const candidateStart = timeStringToMinutes(candidate.time);
  if (candidateStart == null) return false;

  const DEFAULT_DURATION_IF_EMPTY_MINUTES = 60;

  const candidateDuration =
    typeof candidate.durationMinutes === 'number' && candidate.durationMinutes > 0
      ? candidate.durationMinutes
      : DEFAULT_DURATION_IF_EMPTY_MINUTES;
  const candidateEnd = candidateStart + candidateDuration;

  for (const act of existingActivities) {
    if (editingActivityId && act.id === editingActivityId) continue;
    const otherStart = timeStringToMinutes(act.time);
    if (otherStart == null) continue;

    const otherDuration =
      typeof act.durationMinutes === 'number' && act.durationMinutes > 0
        ? act.durationMinutes
        : DEFAULT_DURATION_IF_EMPTY_MINUTES;
    const otherEnd = otherStart + otherDuration;

    if (candidateStart < otherEnd && candidateEnd > otherStart) return true;
  }

  return false;
}

function getTimeConflictsForDate(existingActivities, candidate, editingActivityId) {
  const candidateStart = timeStringToMinutes(candidate?.time);
  if (candidateStart == null) return [];

  const DEFAULT_DURATION_IF_EMPTY_MINUTES = 60;

  const candidateDuration =
    typeof candidate?.durationMinutes === 'number' && candidate.durationMinutes > 0
      ? candidate.durationMinutes
      : DEFAULT_DURATION_IF_EMPTY_MINUTES;
  const candidateEnd = candidateStart + candidateDuration;

  const conflicts = [];
  for (const act of existingActivities || []) {
    if (editingActivityId && act.id === editingActivityId) continue;
    const otherStart = timeStringToMinutes(act.time);
    if (otherStart == null) continue;

    const otherDuration =
      typeof act.durationMinutes === 'number' && act.durationMinutes > 0
        ? act.durationMinutes
        : DEFAULT_DURATION_IF_EMPTY_MINUTES;
    const otherEnd = otherStart + otherDuration;

    if (candidateStart < otherEnd && candidateEnd > otherStart) conflicts.push(act);
  }

  return conflicts;
}

function removeTimeConflictsFromDay(list, candidate, editingActivityId) {
  const conflicts = getTimeConflictsForDate(list || [], candidate, editingActivityId);
  if (!conflicts.length) return list || [];
  const conflictIds = new Set(conflicts.map((c) => c.id));
  return (list || []).filter((a) => !conflictIds.has(a.id));
}

function formatLocalDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseLocalDate(dateString) {
  if (!dateString) return new Date();
  if (dateString instanceof Date) return dateString;

  const [y, m, d] = String(dateString).split('-').map((n) => parseInt(n, 10));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return new Date();
  }

  // Construct as LOCAL date to avoid timezone shifting.
  return new Date(y, m - 1, d);
}
const DAY_MAP = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

function generateWeeklyDates(schedule) {
  const results = [];

  const start = parseLocalDate(schedule.startDate);
  const end = schedule.endDate
    ? parseLocalDate(schedule.endDate)
    : new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());

  schedule.daysOfWeek.forEach((dayKey) => {
    const targetDay = DAY_MAP[dayKey];

    let cursor = new Date(start);

    // mover al primer día correcto (en LOCAL)
    while (cursor.getDay() !== targetDay) {
      cursor.setDate(cursor.getDate() + 1);
    }

    // repetir semanalmente
    while (cursor <= end) {
      if (cursor >= start) {
        results.push(formatLocalDate(cursor));
      }
      cursor.setDate(cursor.getDate() + 7);
    }
  });

  return results.sort();
}
function formatDate(dateString, lang = 'es') {
  const [y, m, d] = dateString.split('-').map(Number);
  let locale;
  switch (lang) {
    case 'en':
      locale = 'en-US';
      break;
    case 'pt':
      locale = 'pt-BR';
      break;
    case 'fr':
      locale = 'fr-FR';
      break;
    default:
      locale = 'es-ES';
      break;
  }
  return new Date(y, m - 1, d).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/* =========================
  CONFIGURACIÓN CALENDARIO (ES/EN/PT/FR)
========================= */

LocaleConfig.locales.es = {
  monthNames: [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
  ],
  monthNamesShort: [
    'Ene','Feb','Mar','Abr','May','Jun',
    'Jul','Ago','Sep','Oct','Nov','Dic',
  ],
  dayNames: [
    'Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado',
  ],
  dayNamesShort: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],
  today: 'Hoy',
};

LocaleConfig.locales.en = {
  monthNames: [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ],
  monthNamesShort: [
    'Jan','Feb','Mar','Apr','May','Jun',
    'Jul','Aug','Sep','Oct','Nov','Dec',
  ],
  dayNames: [
    'Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday',
  ],
  dayNamesShort: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
  today: 'Today',
};

LocaleConfig.locales.pt = {
  monthNames: [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
  ],
  monthNamesShort: [
    'Jan','Fev','Mar','Abr','Mai','Jun',
    'Jul','Ago','Set','Out','Nov','Dez',
  ],
  dayNames: [
    'Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado',
  ],
  dayNamesShort: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
  today: 'Hoje',
};

LocaleConfig.locales.fr = {
  monthNames: [
    'Janvier','Février','Mars','Avril','Mai','Juin',
    'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
  ],
  monthNamesShort: [
    'Jan','Fév','Mar','Avr','Mai','Jun',
    'Jul','Aoû','Sep','Oct','Nov','Déc',
  ],
  dayNames: [
    'Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi',
  ],
  dayNamesShort: ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'],
  today: "Aujourd'hui",
};

LocaleConfig.defaultLocale = 'es';

/* =========================
   COMPONENTE
========================= */

export default function Calendar() {
  const {
    themeColor,
    themeMode,
    language,
    notificationsEnabled,
    timeFormat,
  } = useSettings();
  const { t } = useI18n();
  const accent = getAccentColor(themeColor);
  const isDark = themeMode === 'dark';
  const [marketAddVisible, setMarketAddVisible] = useState(false);
  const [marketAddContext, setMarketAddContext] = useState(null);
  const [vitaminsAddVisible, setVitaminsAddVisible] = useState(false);
  const [vitaminsAddContext, setVitaminsAddContext] = useState(null);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodMessage, setMoodMessage] = useState(null);
  const [dismissedMoodDate, setDismissedMoodDate] = useState(null);
  const [activities, setActivities] = useState({});
  const [habits, setHabits] = useState([]);
  const [habitsLoading, setHabitsLoading] = useState(true);

  const [calendarExpanded, setCalendarExpanded] = useState(false);

  const [showHabitModal, setShowHabitModal] = useState(false);
  const [isChangingHabit, setIsChangingHabit] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [editingActivity, setEditingActivity] = useState(null);
  const [expandedHabitCategory, setExpandedHabitCategory] = useState(null);

  const habitModalCategoryListRef = useRef(null);

  const refreshMoodForSelectedDate = useCallback(() => {
    let mounted = true;
    (async () => {
      const dismissed = await getDismissedMoodBannerDate();
      const entry = await getMoodForDate(selectedDate);
      if (!mounted) return;
      setDismissedMoodDate(dismissed);
      setSelectedMood(entry);

      const msg = entry?.score
        ? pickMoodMessage({
          score: entry.score,
          dateKey: selectedDate,
          isToday: selectedDate === today,
          t,
          now: new Date(),
        })
        : null;

      // If user dismissed for this date, hide it in Calendar.
      setMoodMessage(dismissed === selectedDate ? null : msg);
    })().catch(() => {
      if (!mounted) return;
      setSelectedMood(null);
      setMoodMessage(null);
    });

    return () => {
      mounted = false;
    };
  }, [selectedDate, t]);

  useEffect(() => {
    return refreshMoodForSelectedDate();
  }, [refreshMoodForSelectedDate]);





  const handleCalendarToggled = useCallback(
    (isOpen) => {
      setCalendarExpanded(!!isOpen);
    },
    []
  );





  useEffect(() => {
    if (selectedDate !== today) return;
    const id = setInterval(() => {
      // Rotate messages during the day.
      refreshMoodForSelectedDate();
    }, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [refreshMoodForSelectedDate, selectedDate]);

  const habitCategoriesData = useMemo(() => {
    const order = [];
    const grouped = {};

    for (const habit of habits || []) {
      const rawCategory = habit?.category || 'Sin categoría';
      if (!grouped[rawCategory]) {
        grouped[rawCategory] = [];
        order.push(rawCategory);
      }
      grouped[rawCategory].push(habit);
    }

    return order.map((category) => ({
      key: category,
      category,
      displayCategory: translateHabitCategory(category, language),
      habits: grouped[category] || [],
    }));
  }, [habits, language]);

  const categoryIconName = useCallback(
    (category) => (
      category === 'Cuida de ti' ? 'heart' :
        category === 'Actividad física' ? 'fitness' :
          category === 'Vive más sano' ? 'leaf' :
            category === 'Aprende' ? 'school' :
              category === 'Vida social' ? 'people' :
                // Categorías anteriores (compatibilidad)
                category === 'Hogar' ? 'home' :
                  category === 'Vida económica' ? 'wallet' :
                    category === 'Salud' ? 'fitness' :
                      category === 'Social' ? 'people' :
                        category === 'Productividad' ? 'briefcase' :
                          'sparkles'
    ),
    []
  );

  const scrollToHabitCategoryIndex = useCallback((index) => {
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        try {
          habitModalCategoryListRef.current?.scrollToIndex?.({
            index,
            animated: true,
            viewPosition: 0,
          });
        } catch (e) {
          // best-effort
        }
      });
    });
  }, []);

  const onToggleHabitCategory = useCallback(
    (category, index) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      const next = expandedHabitCategory === category ? null : category;
      setExpandedHabitCategory(next);

      if (next) {
        scrollToHabitCategoryIndex(index);
      }
    },
    [expandedHabitCategory, scrollToHabitCategoryIndex]
  );

  const onPickHabitFromModal = useCallback(
    (habit) => {
      setSelectedHabit(habit);
      if (!isChangingHabit) {
        setEditingActivity(null);
        setEditingSchedule(null);
      }
      setShowHabitModal(false);
      setTimeout(() => setShowFormModal(true), 150);
      setIsChangingHabit(false);
    },
    [isChangingHabit]
  );

  const HabitCategoryRow = useMemo(() => {
    return React.memo(function HabitCategoryRowInner({ item, index, isExpanded }) {
      return (
        <View style={styles.categorySection}>
          <Pressable
            style={styles.categoryHeader}
            onPress={() => onToggleHabitCategory(item.category, index)}
          >
            <View style={styles.categoryHeaderLeft}>
              <View style={[styles.categoryIconContainer, isDark && { backgroundColor: '#1f2937' }]}>
                <Ionicons
                  name={categoryIconName(item.category)}
                  size={20}
                  color={accent}
                />
              </View>
              <Text style={[styles.categoryTitle, isDark && { color: '#e5e7eb' }]}>
                {item.displayCategory}
              </Text>
            </View>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={isDark ? '#9ca3af' : '#6b7280'}
            />
          </Pressable>

          {isExpanded ? (
            <View style={styles.habitsGrid}>
              {item.habits.map((habit) => (
                <Pressable
                  key={habit.id}
                  style={[styles.habitItem, isDark && { backgroundColor: '#0b1120' }]}
                  onPress={() => onPickHabitFromModal(habit)}
                >
                  <View style={styles.habitCardContent}>
                    {habit.icon ? (
                      <Image
                        source={{ uri: habit.icon }}
                        style={styles.habitCardImage}
                        progressiveRenderingEnabled
                        fadeDuration={150}
                      />
                    ) : (
                      <View style={styles.habitImagePlaceholder}>
                        <Ionicons name="sparkles" size={22} color="#38BDF8" />
                      </View>
                    )}
                    <View style={styles.habitTextContainer}>
                      <Text
                        style={[styles.habitTitle, isDark && { color: '#e5e7eb' }]}
                        numberOfLines={2}
                      >
                        {habit.title}
                      </Text>
                      {habit.description ? (
                        <Text
                          style={[styles.habitDescription, isDark && { color: '#9ca3af' }]}
                          numberOfLines={3}
                        >
                          {habit.description}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      );
    }, (prev, next) => {
      // Only re-render when this row's expanded state changes, or when its data changes.
      return (
        prev.isExpanded === next.isExpanded &&
        prev.item === next.item
      );
    });
  }, [accent, categoryIconName, isDark, onPickHabitFromModal, onToggleHabitCategory]);

  const [marketModalVisible, setMarketModalVisible] = useState(false);
  const [marketModalData, setMarketModalData] = useState(null);
  const [vitaminsModalVisible, setVitaminsModalVisible] = useState(false);
  const [vitaminsModalData, setVitaminsModalData] = useState(null);
  const [savingsModalVisible, setSavingsModalVisible] = useState(false);
  const [savingsModalData, setSavingsModalData] = useState(null);
  const [savingsAddAmountText, setSavingsAddAmountText] = useState('');

  const [waterModalVisible, setWaterModalVisible] = useState(false);
  const [waterModalData, setWaterModalData] = useState(null);
  const [waterAddMlText, setWaterAddMlText] = useState('');

  const habitIconById = useMemo(() => {
    const map = new Map();
    (habits || []).forEach((h) => {
      if (h?.id && h?.icon) map.set(h.id, h.icon);
    });
    return map;
  }, [habits]);

  const savingsByHabitId = useMemo(() => {
    const map = new Map();

    for (const dateKey of Object.keys(activities || {})) {
      const dayActs = activities?.[dateKey] || [];
      for (const act of dayActs) {
        const habitId = act?.habit_id;
        if (!habitId) continue;

        let target = parseMoneyLike(act?.data?.savingsTargetAmount);
        let saved = parseMoneyLike(act?.data?.savingsSavedAmount);
        // Formatear con puntos de miles si es número válido
        if (Number.isFinite(target)) target = target.toLocaleString('es-ES');
        if (Number.isFinite(saved)) saved = saved.toLocaleString('es-ES');

        if (!Number.isFinite(target) || target <= 0) continue;

        const prev = map.get(habitId) || { target, saved: 0 };
        const nextTarget = Number.isFinite(prev.target) && prev.target > 0 ? prev.target : target;
        const nextSavedRaw = Math.max(prev.saved || 0, Number.isFinite(saved) ? saved : 0);
        const nextSaved = Math.min(nextSavedRaw, nextTarget);

        map.set(habitId, { target: nextTarget, saved: nextSaved });
      }
    }

    return map;
  }, [activities]);

  const themedCalendar = useMemo(() => {
    const base = {
      ...calendarTheme,
      selectedDayBackgroundColor: accent,
      todayTextColor: accent,
      dotColor: accent,
      indicatorColor: accent,
      selectedDotColor: '#ffffff',
    };

    if (!isDark) return base;

    return {
      ...base,
      calendarBackground: '#020617',
      dayTextColor: '#e5e7eb',
      textDisabledColor: '#4b5563',
      arrowColor: '#e5e7eb',
      monthTextColor: '#e5e7eb',
      todayBackgroundColor: '#1e293b',
      'stylesheet.calendar.header': {
        ...calendarTheme['stylesheet.calendar.header'],
        monthText: {
          ...calendarTheme['stylesheet.calendar.header'].monthText,
          color: '#e5e7eb',
        },
        dayHeader: {
          ...calendarTheme['stylesheet.calendar.header'].dayHeader,
          color: '#9ca3af',
        },
        week: {
          ...calendarTheme['stylesheet.calendar.header'].week,
        },
      },
      'stylesheet.day.basic': {
        ...calendarTheme['stylesheet.day.basic'],
        text: {
          ...calendarTheme['stylesheet.day.basic'].text,
          color: '#e5e7eb',
        },
        today: {
          ...calendarTheme['stylesheet.day.basic'].today,
          backgroundColor: '#1e293b',
        },
        todayText: {
          ...calendarTheme['stylesheet.day.basic'].todayText,
          color: accent,
        },
        selected: {
          ...calendarTheme['stylesheet.day.basic'].selected,
          backgroundColor: accent,
        },
        selectedText: {
          ...calendarTheme['stylesheet.day.basic'].selectedText,
          color: '#ffffff',
        },
        disabledText: {
          ...calendarTheme['stylesheet.day.basic'].disabledText,
          color: '#4b5563',
        },
      },
    };
  }, [isDark, accent]);
  const [checklistModalVisible, setChecklistModalVisible] = useState(false);
  const [checklistModalData, setChecklistModalData] = useState(null);
  const [congratsVisible, setCongratsVisible] = useState(false);
  const [congratsDate, setCongratsDate] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const swipeableRefs = React.useRef({});

  // Estado para funciones inteligentes
  // Busy Day modal permanently removed
  const [moveTasksModalVisible, setMoveTasksModalVisible] = useState(false);
  const [moveTasksDate, setMoveTasksDate] = useState(null);
  const [moveTasksSelection, setMoveTasksSelection] = useState({});
  const [weeklyPlannerVisible, setWeeklyPlannerVisible] = useState(false);
  const [weeklyPriorityText, setWeeklyPriorityText] = useState('');
  const [weeklyHardHabitId, setWeeklyHardHabitId] = useState(null);

  /* =========================
     LOAD DATA
  ========================= */

  useEffect(() => {
    loadActivities();
    loadHabits();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // When user creates a habit/activity elsewhere and comes back,
      // refresh immediately so the new habit appears without needing to restart.
      loadActivities();
      loadHabits();
    }, [language])
  );

  // Recargar hábitos cuando cambie el idioma de la app
  useEffect(() => {
    loadHabits();
  }, [language]);

  // Configurar idioma del calendario según el idioma de la app
  const localeKey = ['es', 'en', 'pt', 'fr'].includes(language)
    ? language
    : 'es';
  LocaleConfig.defaultLocale = localeKey;

  // Asegurar que la etiqueta "Hoy" del calendario
  // respete el idioma actual usando las traducciones
  if (LocaleConfig.locales[localeKey]) {
    LocaleConfig.locales[localeKey].today = t('calendar.todayButton');
  }

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);



  async function loadActivities() {
    try {
      const data = await loadUserActivities();
      if (data) {
        setActivities(data);
      } else {
        setActivities({});
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  }

  async function saveActivities(data) {
    try {
      // Optimistic UI: update state first so changes appear instantly.
      setActivities({ ...data });

      await saveUserActivities(data);
      console.log('💾 Guardado (por usuario):', Object.keys(data).length, 'fechas');
    } catch (error) {
      console.error('Error saving activities:', error);
    }
  }

  async function loadHabits() {
    try {
      setHabitsLoading(true);
      const data = await loadHabitTemplates(language);
      if (data && Array.isArray(data)) {
        setHabits(data);
      }
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setHabitsLoading(false);
    }
  }

  /* =========================
     SAVE HABIT
  ========================= */

  function handleSaveHabit(payload) {
    // Guardrail: do not allow scheduling in the past (yesterday or earlier)
    try {
      const todayKey = getTodayLocal();
      const startKey = payload?.schedule?.startDate;
      if (typeof startKey === 'string' && startKey < todayKey) {
        Alert.alert(
          t('calendar.invalidDateTitle'),
          t('calendar.invalidDateMessage')
        );
        return;
      }
    } catch {
      // no-op
    }

    // Si venimos desde una edición, actualizamos la actividad por ID (más robusto)
    if (payload?.editingActivityId) {
      const updated = { ...activities };
      const { habit, data, schedule } = payload;

      const targetId = payload.editingActivityId;

      // Encontrar la actividad original y su fecha dentro del estado actual
      let targetDateKey = null;
      let targetActivity = null;

      for (const dateKey of Object.keys(updated)) {
        const found = (updated[dateKey] || []).find((a) => a.id === targetId);
        if (found) {
          targetDateKey = dateKey;
          targetActivity = found;
          break;
        }
      }

      // Fallback: si por algún motivo no está indexada en el estado, intenta con la fecha actual
      if (!targetActivity) {
        const fallbackDate = editingActivity?.date || selectedDate;
        const found = (updated[fallbackDate] || []).find((a) => a.id === targetId);
        if (found) {
          targetDateKey = fallbackDate;
          targetActivity = found;
        }
      }

      if (!targetActivity || !targetDateKey) {
        Alert.alert(t('calendar.editErrorTitle'), t('calendar.editErrorMessage'));
        return;
      }

      // Si es una actividad única, solo editamos esta instancia
      if (!schedule || schedule.frequency === 'once') {
        const previousDateKey = targetDateKey;
        const nextDateKey = schedule?.startDate || targetDateKey;

        const candidate = schedule?.time
          ? { time: schedule.time, durationMinutes: schedule.durationMinutes }
          : null;

        if (payload?.replaceTimeConflicts && candidate) {
          updated[nextDateKey] = removeTimeConflictsFromDay(
            updated[nextDateKey] || [],
            candidate,
            targetId
          );
        }

        // Eliminada validación de conflicto de horario: ahora se permite cualquier horario

        const nextActivity = {
          ...targetActivity,
          habit_id: habit.id,
          title: habit.title,
          icon: habit.icon,
          date: nextDateKey,
          allDay:
            typeof schedule?.allDay === 'boolean'
              ? schedule.allDay
              : targetActivity.allDay ?? false,
          time: schedule?.time ?? targetActivity.time ?? null,
          durationMinutes:
            typeof schedule?.durationMinutes === 'number'
              ? schedule.durationMinutes
              : targetActivity.durationMinutes ?? null,
          endTime: schedule?.endTime ?? targetActivity.endTime ?? null,
          data: data || {},
        };

        if (nextDateKey !== previousDateKey) {
          // Remove from previous day
          if (updated[previousDateKey]) {
            updated[previousDateKey] = (updated[previousDateKey] || []).filter(
              (act) => act.id !== targetId
            );
            if (updated[previousDateKey].length === 0) delete updated[previousDateKey];
          }

          // Add to new day
          updated[nextDateKey] = [...(updated[nextDateKey] || []), nextActivity];
        } else {
          // Update in place
          if (!updated[previousDateKey]) updated[previousDateKey] = [];
          updated[previousDateKey] = (updated[previousDateKey] || []).map((act) => {
            if (act.id !== targetId) return act;
            return nextActivity;
          });
        }

        saveActivities(updated);

        if (nextActivity && nextActivity.time) {
          // Usar idioma del usuario o del hábito
          const lang = habit.language || language || 'en';
          const prevId = nextActivity.notificationId || null;
          rescheduleHabitNotification({
            date: nextDateKey,
            time: nextActivity.time,
            habitTitle: nextActivity.title,
            language: lang,
            notificationsEnabled,
            previousNotificationId: prevId,
          }).then((notificationId) => {
            // Guardar notificationId en la actividad
            nextActivity.notificationId = notificationId;
            saveActivities({ ...updated });
          });
        }

        setEditingActivity(null);
        setShowFormModal(false);
        return;
      }

      // Si tiene una frecuencia (diaria, semanal, etc.),
      // actualizamos TODA la serie de ese hábito
      const oldHabitId = targetActivity.habit_id;

      Object.keys(updated).forEach((dateKey) => {
        const dayActs = updated[dateKey] || [];
        const filtered = dayActs.filter((act) => act.habit_id !== oldHabitId);
        if (filtered.length > 0) {
          updated[dateKey] = filtered;
        } else {
          delete updated[dateKey];
        }
      });

      // Re-generamos la serie con el nuevo horario
      let datesToCreate = [];

      if (schedule.frequency === 'once') {
        datesToCreate = [schedule.startDate];
      }

      if (schedule.frequency === 'daily') {
        const start = parseLocalDate(schedule.startDate);
        const end = schedule.endDate
          ? parseLocalDate(schedule.endDate)
          : new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          datesToCreate.push(formatLocalDate(d));
        }
      }

      if (schedule.frequency === 'weekly') {
        datesToCreate = generateWeeklyDates(schedule);
      }

      if (schedule.frequency === 'monthly') {
        const start = parseLocalDate(schedule.startDate);
        const end = schedule.endDate
          ? parseLocalDate(schedule.endDate)
          : new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());

        let d = new Date(start);
        while (d <= end) {
          datesToCreate.push(formatLocalDate(d));
          d.setMonth(d.getMonth() + 1);
        }
      }

      if (schedule.frequency === 'yearly') {
        const start = parseLocalDate(schedule.startDate);
        const end = schedule.endDate
          ? parseLocalDate(schedule.endDate)
          : new Date(start.getFullYear() + 5, start.getMonth(), start.getDate());

        let d = new Date(start);
        while (d <= end) {
          datesToCreate.push(formatLocalDate(d));
          d.setFullYear(d.getFullYear() + 1);
        }
      }

      // Seguridad extra: nunca pasar de la fecha de fin
      if (schedule.endDate) {
        datesToCreate = datesToCreate.filter((d) => d <= schedule.endDate);
      }

      if (payload?.replaceTimeConflicts && schedule.time) {
        const candidate = {
          time: schedule.time,
          durationMinutes: schedule.durationMinutes,
        };
        datesToCreate.forEach((date) => {
          if (!updated[date]) return;
          updated[date] = removeTimeConflictsFromDay(updated[date], candidate, null);
        });
      }

      if (schedule.time && !payload?.allowTimeConflict) {
        const candidate = {
          time: schedule.time,
          durationMinutes: schedule.durationMinutes,
        };

        let firstConflict = null;
        for (const date of datesToCreate) {
          const conflicts = getTimeConflictsForDate(updated[date] || [], candidate, null);
          if (conflicts.length) {
            firstConflict = { date, act: conflicts[0] };
            break;
          }
        }

        // Eliminada alerta de conflicto de horario para hábitos en serie: ahora se permite cualquier horario
      }

      // Determinar solo la PRÓXIMA fecha futura para programar recordatorio,
      // evitando inundar al usuario con una notificación por cada día de la serie.
      let nextReminderDate = null;
      if (schedule.time && datesToCreate.length > 0) {
        const now = new Date();
        const [h, m] = String(schedule.time).split(':').map(Number);

        const orderedDates = [...datesToCreate].sort();
        for (const dStr of orderedDates) {
          const [year, month, day] = dStr.split('-').map(Number);
          if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
            continue;
          }
          const target = new Date(year, month - 1, day, h, m, 0, 0);
          const triggerTime = new Date(target.getTime() - 30 * 60 * 1000);

          if (target.getTime() > now.getTime() && triggerTime.getTime() > now.getTime()) {
            nextReminderDate = dStr;
            break;
          }
        }
      }

      datesToCreate.forEach((date) => {
        if (!updated[date]) updated[date] = [];

        const newActivity = {
          id: uuidv4(),
          habit_id: habit.id,
          title: habit.title,
          icon: habit.icon,
          allDay: !!schedule.allDay,
          time: schedule.time || null,
          durationMinutes:
            typeof schedule.durationMinutes === 'number'
              ? schedule.durationMinutes
              : null,
          endTime: schedule.endTime || null,
          data: data || {},
          date,
          completed: false,
        };

        updated[date] = [...updated[date], newActivity];

        // Solo programamos notificación para la siguiente ocurrencia futura
        if (newActivity.time && nextReminderDate && date === nextReminderDate) {
          const lang = habit.language || language || 'en';
          const prevId = newActivity.notificationId || null;
          rescheduleHabitNotification({
            date,
            time: newActivity.time,
            habitTitle: newActivity.title,
            language: lang,
            notificationsEnabled,
            previousNotificationId: prevId,
          }).then((notificationId) => {
            newActivity.notificationId = notificationId;
            saveActivities({ ...updated });
          });
        }
      });

      saveActivities(updated);
      setEditingActivity(null);
      setShowFormModal(false);
      return;
    }

    const updated = { ...activities };
    const { schedule, habit, data, allowDuplicate } = payload;

    let datesToCreate = [];

    if (schedule.frequency === 'once') {
      datesToCreate = [schedule.startDate];
    }

    if (schedule.frequency === 'daily') {
      const start = parseLocalDate(schedule.startDate);
      const end = schedule.endDate
        ? parseLocalDate(schedule.endDate)
        : new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        datesToCreate.push(formatLocalDate(d));
      }
    }

    if (schedule.frequency === 'weekly') {
      datesToCreate = generateWeeklyDates(schedule);
    }

    if (schedule.frequency === 'monthly') {
      const start = parseLocalDate(schedule.startDate);
      const end = schedule.endDate
        ? parseLocalDate(schedule.endDate)
        : new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());

      let d = new Date(start);
      while (d <= end) {
        datesToCreate.push(formatLocalDate(d));
        d.setMonth(d.getMonth() + 1);
      }
    }

    if (schedule.frequency === 'yearly') {
      const start = parseLocalDate(schedule.startDate);
      const end = schedule.endDate
        ? parseLocalDate(schedule.endDate)
        : new Date(start.getFullYear() + 5, start.getMonth(), start.getDate());

      let d = new Date(start);
      while (d <= end) {
        datesToCreate.push(formatLocalDate(d));
        d.setFullYear(d.getFullYear() + 1);
      }
    }

    // Seguridad extra: nunca pasar de la fecha de fin
    if (schedule.endDate) {
      datesToCreate = datesToCreate.filter((d) => d <= schedule.endDate);
    }

    if (payload?.replaceTimeConflicts && schedule.time) {
      const candidate = {
        time: schedule.time,
        durationMinutes: schedule.durationMinutes,
      };
      datesToCreate.forEach((date) => {
        if (!updated[date]) return;
        updated[date] = removeTimeConflictsFromDay(updated[date], candidate, null);
      });
    }

    if (schedule.time && !payload?.allowTimeConflict) {
      const candidate = {
        time: schedule.time,
        durationMinutes: schedule.durationMinutes,
      };

      let firstConflict = null;
      for (const date of datesToCreate) {
        const conflicts = getTimeConflictsForDate(updated[date] || [], candidate, null);
        if (conflicts.length) {
          firstConflict = { date, act: conflicts[0] };
          break;
        }
      }

      
    }

    // Determinar solo la PRÓXIMA fecha futura para programar recordatorio
    let nextReminderDate = null;
    if (schedule.time && datesToCreate.length > 0) {
      const now = new Date();
      const [h, m] = String(schedule.time).split(':').map(Number);

      const orderedDates = [...datesToCreate].sort();
      for (const dStr of orderedDates) {
        const [year, month, day] = dStr.split('-').map(Number);
        if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
          continue;
        }
        const target = new Date(year, month - 1, day, h, m, 0, 0);
        const triggerTime = new Date(target.getTime() - 30 * 60 * 1000);

        if (target.getTime() > now.getTime() && triggerTime.getTime() > now.getTime()) {
          nextReminderDate = dStr;
          break;
        }
      }
    }

    // Evitar duplicar el mismo evento en el mismo día, salvo confirmación
    if (!allowDuplicate) {
      const hasDuplicateSameDay = datesToCreate.some((date) => {
        const dayActs = updated[date] || [];
        const candidateTime = schedule?.time ?? null;
        return dayActs.some(
          (act) => act.habit_id === habit.id && (act.time ?? null) === candidateTime
        );
      });

      if (hasDuplicateSameDay) {
        Alert.alert(
          t('calendar.duplicateActivityTitle'),
          t('calendar.duplicateActivityMessage'),
          [
            {
              text: t('calendar.duplicateCancel'),
              style: 'cancel',
            },
            {
              text: t('calendar.duplicateConfirm'),
              onPress: () =>
                handleSaveHabit({
                  ...payload,
                  allowDuplicate: true,
                }),
            },
          ],
          { cancelable: true }
        );
        return;
      }
    }

    datesToCreate.forEach((date) => {
      if (!updated[date]) updated[date] = [];

      const newActivity = {
        id: uuidv4(),
        habit_id: habit.id,
        title: habit.title,
        icon: habit.icon,
        allDay: !!schedule.allDay,
        time: schedule.time || null,
        durationMinutes:
          typeof schedule.durationMinutes === 'number'
            ? schedule.durationMinutes
            : null,
        endTime: schedule.endTime || null,
        data: data || {},
        date,
        completed: false,
      };

      updated[date] = [...updated[date], newActivity];

      // Solo programamos notificación para la siguiente ocurrencia futura
      if (newActivity.time && nextReminderDate && date === nextReminderDate) {
        const lang = habit.language || language || 'en';
        const prevId = newActivity.notificationId || null;
        rescheduleHabitNotification({
          date,
          time: newActivity.time,
          habitTitle: newActivity.title,
          language: lang,
          notificationsEnabled,
          previousNotificationId: prevId,
        }).then((notificationId) => {
          newActivity.notificationId = notificationId;
          saveActivities({ ...updated });
        });
      }
    });

    saveActivities(updated);
    setShowFormModal(false);
  }
  /* =========================
     CHECKLIST
  ========================= */

  function toggleChecklistItem(activity, listType, index) {
    const updated = { ...activities };

    updated[activity.date] = updated[activity.date].map((act) => {
      if (act.id !== activity.id) return act;

      const data = { ...act.data };
      const originalList = data[listType] || [];

      // Normalizamos: si vienen strings (p.ej. checklist de espacios),
      // los convertimos a objetos con label/checked; si ya son objetos (mercado),
      // los dejamos igual.
      const list = originalList.map((item) => {
        if (typeof item === 'string') {
          return { label: item, checked: false };
        }
        return item;
      });

      if (list[index]) {
        list[index] = {
          ...list[index],
          checked: !list[index].checked,
        };
      }

      return {
        ...act,
        data: {
          ...data,
          [listType]: list,
        },
      };
    });

    saveActivities(updated);
  }

  function finalizeSavingsHabit(habitId, cutoffDate) {
    if (!habitId) return;
    const updated = { ...activities };

    Object.keys(updated).forEach((dateKey) => {
      if (cutoffDate && String(dateKey) > String(cutoffDate)) {
        updated[dateKey] = (updated[dateKey] || []).filter(
          (act) => act?.habit_id !== habitId
        );
      }
    });

    saveActivities(updated);
  }

  function addSavingsAmount(activity, addAmount) {
    const inc = Number(addAmount);
    if (!Number.isFinite(inc) || inc <= 0) {
      Alert.alert(
        language === 'es' ? 'Monto inválido' : 'Invalid amount',
        language === 'es'
          ? 'Ingresa un monto mayor que 0.'
          : 'Enter an amount greater than 0.'
      );
      return;
    }

    const habitId = activity?.habit_id;
    const cutoffDate = activity?.date;
    if (!habitId || !cutoffDate) return;

    const totals = savingsByHabitId.get(habitId);
    const target = Number.isFinite(totals?.target)
      ? totals.target
      : parseMoneyLike(activity?.data?.savingsTargetAmount);
    const currentSaved = Number.isFinite(totals?.saved)
      ? totals.saved
      : (parseMoneyLike(activity?.data?.savingsSavedAmount) || 0);

    if (!Number.isFinite(target) || target <= 0) {
      Alert.alert(
        language === 'es' ? 'Falta la meta' : 'Missing goal',
        language === 'es'
          ? 'Primero define una meta para este hábito.'
          : 'Please set a goal for this habit first.'
      );
      return;
    }

    let nextSaved = currentSaved + inc;
    if (nextSaved < 0) nextSaved = 0;
    nextSaved = Math.min(nextSaved, target);

    const reachedGoal = nextSaved >= target;

    const updated = { ...activities };

    // Sync saved amount to ALL cards of the same habit so progress carries day to day.
    Object.keys(updated).forEach((dateKey) => {
      const dayActs = updated[dateKey] || [];
      updated[dateKey] = dayActs
        .map((act) => {
          if (act?.habit_id !== habitId) return act;
          const data = { ...(act.data || {}) };
          data.savingsTargetAmount = data.savingsTargetAmount ?? String(target);
          data.savingsSavedAmount = String(nextSaved);
          return { ...act, data };
        })
        // If goal reached, automatically stop showing future occurrences.
        .filter((act) => {
          if (!reachedGoal) return true;
          if (act?.habit_id !== habitId) return true;
          return String(dateKey) <= String(cutoffDate);
        });
    });

    saveActivities(updated);

    if (reachedGoal) {
      Alert.alert(
        language === 'es' ? '¡Meta alcanzada!' : 'Goal reached!',
        language === 'es'
          ? 'Completaste tu meta de ahorro. Este hábito se finalizó automáticamente.'
          : 'You completed your savings goal. This habit was finalized automatically.'
      );
    }
  }

  function addWaterMl(activity, addMl) {
    const inc = Number(addMl);
    if (!Number.isFinite(inc) || inc <= 0) {
      Alert.alert(
        language === 'es' ? 'Cantidad inválida' : 'Invalid amount',
        language === 'es'
          ? 'Ingresa una cantidad de ML mayor que 0.'
          : 'Enter an amount of ml greater than 0.'
      );
      return;
    }

    const dateKey = activity?.date;
    const activityId = activity?.id;
    if (!dateKey || !activityId) return;

    const DEFAULT_TARGET_ML = 2000;

    const dayActivities = activities?.[dateKey] || [];
    const current = dayActivities.find((a) => a.id === activityId);
    if (!current) return;

    const targetRaw = parseMlLike(current?.data?.waterMlTarget);
    const target = Number.isFinite(targetRaw) && targetRaw > 0 ? targetRaw : DEFAULT_TARGET_ML;
    const consumedRaw = parseMlLike(current?.data?.waterMlConsumed);
    const consumed = Number.isFinite(consumedRaw) && consumedRaw > 0 ? consumedRaw : 0;

    let nextConsumed = consumed + Math.round(inc);
    if (!Number.isFinite(nextConsumed) || nextConsumed < 0) nextConsumed = 0;

    const reachedGoal = nextConsumed >= target;

    const updated = { ...activities };
    updated[dateKey] = dayActivities.map((act) => {
      if (act.id !== activityId) return act;
      const data = { ...(act.data || {}) };
      data.waterMlTarget = data.waterMlTarget ?? String(target);
      data.waterMlConsumed = String(nextConsumed);
      return {
        ...act,
        data,
        completed: reachedGoal ? true : act.completed,
      };
    });

    saveActivities(updated);
  }

  function addMarketItem(activity, listType, item) {
    // Add to ALL cards of the same habit/style (same habit_id), so the list stays in sync.
    // Keep `checked` independent per-day by only appending the new item.
    const normalizeName = (name) =>
      String(name ?? '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();

    const incomingNameRaw = String(item?.product ?? item?.name ?? item?.label ?? '').trim();
    const incomingKey = normalizeName(incomingNameRaw);
    if (!incomingKey) return;

    const updated = { ...activities };

    Object.keys(updated).forEach((dateKey) => {
      const dayActs = updated[dateKey] || [];
      updated[dateKey] = dayActs.map((act) => {
        if (act?.habit_id !== activity?.habit_id) return act;

        const data = { ...(act.data || {}) };
        const originalList = Array.isArray(data[listType]) ? data[listType] : [];

        const hasDuplicate = originalList.some((it) => {
          const n = normalizeName(it?.product ?? it?.name ?? it?.label ?? '');
          return !!n && n === incomingKey;
        });

        if (hasDuplicate) {
          return act;
        }

        const list = [...originalList, { ...item, checked: false }];

        return {
          ...act,
          data: {
            ...data,
            [listType]: list,
          },
        };
      });
    });

    saveActivities(updated);
  }

  function addVitaminsItem(activity, listType, item) {
    const normalizeName = (name) =>
      String(name ?? '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();

    const incomingNameRaw = String(item?.name ?? item?.label ?? item?.product ?? '').trim();
    const incomingKey = normalizeName(incomingNameRaw);
    if (!incomingKey) return;

    const updated = { ...activities };

    Object.keys(updated).forEach((dateKey) => {
      const dayActs = updated[dateKey] || [];
      updated[dateKey] = dayActs.map((act) => {
        if (act?.habit_id !== activity?.habit_id) return act;

        const data = { ...(act.data || {}) };
        const originalList = Array.isArray(data[listType]) ? data[listType] : [];

        const hasDuplicate = originalList.some((it) => {
          const n = normalizeName(it?.name ?? it?.label ?? it?.product ?? '');
          return !!n && n === incomingKey;
        });

        if (hasDuplicate) return act;

        const list = [...originalList, { ...item, name: incomingNameRaw, checked: false }];

        return {
          ...act,
          data: {
            ...data,
            [listType]: list,
          },
        };
      });
    });

    saveActivities(updated);
  }

  function toggleCompleted(activity) {
    const dateKey = activity.date;
    const dayActivitiesBefore = activities[dateKey] || [];
    const totalBefore = dayActivitiesBefore.length;
    const completedBefore = dayActivitiesBefore.filter((a) => a.completed).length;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const updated = { ...activities };

    if (!updated[dateKey]) return;

    updated[dateKey] = updated[dateKey].map((act) => {
      if (act.id !== activity.id) return act;
      return {
        ...act,
        completed: !act.completed,
      };
    });

    const dayActivitiesAfter = updated[dateKey] || [];
    const completedAfter = dayActivitiesAfter.filter((a) => a.completed).length;

    if (
      totalBefore > 0 &&
      completedAfter === dayActivitiesAfter.length &&
      completedBefore < totalBefore
    ) {
      setCongratsVisible(true);
    }

    saveActivities(updated);
  }

  function maybeCompleteMarketActivity(modalData) {
    const dateKey = modalData?.activity?.date;
    const activityId = modalData?.activity?.id;
    const marketKey = modalData?.marketKey;

    if (!dateKey || !activityId || !marketKey) return;

    const dayActivities = activities[dateKey] || [];
    const current = dayActivities.find((a) => a.id === activityId);
    const items = current?.data?.[marketKey];

    if (!Array.isArray(items) || items.length === 0) return;

    const allChecked = items.every((it) => !!it && it.checked === true);
    if (!allChecked) return;
    if (current?.completed) return;

    const updated = { ...activities };
    updated[dateKey] = dayActivities.map((act) => {
      if (act.id !== activityId) return act;
      return { ...act, completed: true };
    });

    saveActivities(updated);
  }

  function closeMarketModal() {
    if (marketModalData) {
      maybeCompleteMarketActivity(marketModalData);
    }
    setMarketModalVisible(false);
    setMarketModalData(null);
  }

  /* =========================
     DELETE / EDIT
  ========================= */

  function confirmDelete(activity) {
    Alert.alert(
      t('calendar.deleteActivityTitle'),
      t('calendar.deleteActivityMessage'),
      [
        {
          text: t('calendar.deleteOnlyThis'),
          onPress: () => deleteOne(activity),
        },
        {
          text: t('calendar.deleteThisAndNext'),
          onPress: () => deleteFromHere(activity),
        },
        { text: t('calendar.cancel'), style: 'cancel' },
      ],
      { cancelable: true }
    );
  }

  function deleteOne(activity) {
    console.log('🔍 Intentando borrar:', {
      id: activity.id,
      date: activity.date,
      title: activity.title
    });

    const updated = { ...activities };

    if (updated[activity.date]) {
      const before = updated[activity.date].length;
      const beforeIds = updated[activity.date].map(a => a.id);

      console.log('📋 IDs antes:', beforeIds);
      console.log('🎯 ID a borrar:', activity.id);

      updated[activity.date] = updated[activity.date].filter(
        (act) => {
          const keep = act.id !== activity.id;
          console.log(`  Comparando ${act.id} !== ${activity.id} = ${keep}`);
          return keep;
        }
      );

      const after = updated[activity.date].length;

      console.log(`✅ Borrado: ${before} -> ${after} actividades en ${activity.date}`);

      // Limpia el día si no quedan actividades
      if (updated[activity.date].length === 0) {
        delete updated[activity.date];
      }

      // Cierra el swipeable
      if (swipeableRefs.current[activity.id]) {
        swipeableRefs.current[activity.id].close();
      }

      saveActivities(updated);
    } else {
      console.log('❌ Fecha no encontrada:', activity.date);
    }
  }

  function deleteFromHere(activity) {
    console.log('🔍 Borrado masivo:', {
      habit_id: activity.habit_id,
      desde: activity.date,
      title: activity.title
    });

    console.log('🔍 Activity completo:', JSON.stringify(activity, null, 2));

    const updated = { ...activities };
    let totalDeleted = 0;

    // 1) Elimina también la actividad del día actual ("esta")
    if (updated[activity.date]) {
      const beforeToday = updated[activity.date].length;
      console.log(`📅 Procesando día seleccionado ${activity.date}:`);
      updated[activity.date].forEach(a => {
        console.log(`  - ${a.title} (id: ${a.id}, habit_id: ${a.habit_id})`);
      });

      updated[activity.date] = updated[activity.date].filter(act => {
        const isSame = act.id === activity.id || act.habit_id === activity.habit_id;
        const keep = !isSame;
        if (!keep) {
          totalDeleted++;
          console.log(`  🗑️ Borrando en fecha actual: ${act.title}`);
        }
        return keep;
      });

      const afterToday = updated[activity.date].length;
      console.log(`   Resultado día actual: ${beforeToday} -> ${afterToday}`);

      if (updated[activity.date].length === 0) {
        delete updated[activity.date];
      }
    }

    // 2) Itera sobre todas las fechas posteriores para borrar "las siguientes"
    Object.keys(updated).forEach((date) => {
      // Solo elimina en fechas posteriores a la seleccionada
      if (date > activity.date) {
        const before = updated[date].length;

        console.log(`📅 Procesando ${date}:`);
        updated[date].forEach(a => {
          console.log(`  - ${a.title} (habit_id: ${a.habit_id})`);
        });

        // Filtra las actividades con el mismo habit_id
        updated[date] = updated[date].filter(
          (act) => {
            const keep = act.habit_id !== activity.habit_id;
            if (!keep) {
              totalDeleted++;
              console.log(`  🗑️ Borrando: ${act.title}`);
            }
            return keep;
          }
        );

        const after = updated[date].length;
        console.log(`   Resultado: ${before} -> ${after}`);

        // Limpia el día si no quedan actividades
        if (updated[date].length === 0) {
          delete updated[date];
        }
      }
    });

    // Cierra todos los swipeables
    Object.values(swipeableRefs.current).forEach(ref => {
      if (ref) ref.close();
    });

    console.log(`✅ Eliminación masiva completada. Total borrados: ${totalDeleted}`);
    saveActivities(updated);
  }

  function editActivity(activity) {
    // Buscamos el template original del hábito
    const habitTemplate = habits.find((h) => h.id === activity.habit_id);

    // Inferimos un horario aproximado a partir de todas las ocurrencias de este hábito
    const allDates = [];
    Object.keys(activities).forEach((dateStr) => {
      (activities[dateStr] || []).forEach((act) => {
        if (act.habit_id === activity.habit_id) {
          allDates.push(parseLocalDate(dateStr));
        }
      });
    });

    let inferredSchedule = null;
    if (allDates.length > 0) {
      allDates.sort((a, b) => a - b);
      const earliest = allDates[0];
      const latest = allDates[allDates.length - 1];

      const diffs = [];
      for (let i = 0; i < allDates.length - 1; i++) {
        const msDiff = allDates[i + 1] - allDates[i];
        const daysDiff = Math.round(msDiff / (1000 * 60 * 60 * 24));
        diffs.push(daysDiff);
      }

      let frequency = 'once';
      let daysOfWeek = [];

      if (diffs.length > 0 && diffs.every((d) => d === 1)) {
        frequency = 'daily';
      } else if (diffs.length > 0 && diffs.every((d) => d % 7 === 0)) {
        frequency = 'weekly';
        const daySet = new Set(
          allDates.map((d) => {
            const weekday = d.getDay(); // 0-6 (Domingo-Sábado)
            return Object.keys(DAY_MAP).find((key) => DAY_MAP[key] === weekday);
          })
        );
        daysOfWeek = Array.from(daySet);
      } else if (
        diffs.length > 0 &&
        diffs.every((d) => d >= 28 && d <= 31)
      ) {
        frequency = 'monthly';
      } else if (
        diffs.length > 0 &&
        diffs.every((d) => d >= 365 && d <= 366)
      ) {
        frequency = 'yearly';
      }

      inferredSchedule = {
        startDate: earliest,
        endDate: allDates.length > 1 ? latest : null,
        frequency,
        daysOfWeek,
      };
    }

    const scheduleWithTime = inferredSchedule
      ? {
          ...inferredSchedule,
          allDay: !!activity.allDay,
          time: activity.time || null,
          durationMinutes: activity.durationMinutes || null,
          endTime: activity.endTime || null,
        }
      : {
          startDate: parseLocalDate(activity.date),
          endDate: null,
          frequency: 'once',
          daysOfWeek: [],
          allDay: !!activity.allDay,
          time: activity.time || null,
          durationMinutes: activity.durationMinutes || null,
          endTime: activity.endTime || null,
        };

    setEditingSchedule(scheduleWithTime);
    setEditingActivity(activity);
    setSelectedHabit(habitTemplate || activity);
    setShowFormModal(true);
  }

  /* =========================
     CHECKLIST / MARKET HELPERS
  ========================= */

  function getHabitTemplateForActivity(activity) {
    if (!activity) return null;
    const targetId = activity.habit_id;
    if (targetId == null) return null;
    return habits.find((h) => String(h?.id) === String(targetId)) || null;
  }

  // Devuelve el título a mostrar según el idioma actual de la app.
  // Si la actividad viene de una plantilla de hábito, usamos el título
  // traducido de la plantilla; si no, usamos el título guardado.
  function getDisplayTitle(activity) {
    if (!activity) return '';
    const habitTemplate = getHabitTemplateForActivity(activity);

    const templateTitle =
      typeof habitTemplate?.title === 'string' ? habitTemplate.title.trim() : '';
    if (templateTitle) return templateTitle;

    const raw =
      activity.title ??
      activity.name ??
      activity.label ??
      activity.habitTitle ??
      activity.habit_title ??
      activity.habit?.title ??
      '';

    const fallback = typeof raw === 'string' ? raw.trim() : String(raw || '').trim();
    if (fallback) return fallback;

    return language === 'es' ? 'Hábito' : 'Habit';
  }

  function parseHabitConfig(habit) {
    if (!habit?.config) return null;
    if (typeof habit.config === 'object') return habit.config;
    try {
      return JSON.parse(habit.config);
    } catch {
      return null;
    }
  }

  function getMarketFieldMeta(activity) {
    const habitTemplate = getHabitTemplateForActivity(activity);
    const config = parseHabitConfig(habitTemplate);
    const field = config?.fields?.find((f) => f.type === 'market');

    if (!field) {
      return { key: null, label: null };
    }

    return {
      key: field.key || 'market',
      label: field.label || 'Lista de mercado',
    };
  }

  function getChecklistFieldMeta(activity) {
    const habitTemplate = getHabitTemplateForActivity(activity);
    const config = parseHabitConfig(habitTemplate);
    const field = config?.fields?.find((f) => f.type === 'checklist');

    if (!field) {
      return { key: null, label: null };
    }

    return {
      key: field.key,
      label: field.label || 'Checklist',
    };
  }

  function getTextFieldMeta(activity) {
    const habitTemplate = getHabitTemplateForActivity(activity);
    const config = parseHabitConfig(habitTemplate);
    const field = config?.fields?.find((f) => f.type === 'text');

    if (!field) {
      return { key: null, label: null };
    }

    return {
      key: field.key,
      label: field.label || '',
    };
  }

  function getVitaminsFieldMeta(activity) {
    const habitTemplate = getHabitTemplateForActivity(activity);
    const config = parseHabitConfig(habitTemplate);
    const field = config?.fields?.find((f) => f.type === 'vitamins');

    if (!field) {
      return { key: null, label: null };
    }

    return {
      key: field.key || 'vitamins',
      label: field.label || 'Vitaminas',
    };
  }

  // Detectar día sobrecargado (muchas actividades)
  // Busy Day modal logic removed

  function toggleMoveTaskSelection(activityId) {
    setMoveTasksSelection((prev) => ({
      ...prev,
      [activityId]: !prev[activityId],
    }));
  }

  function confirmMoveSelectedTasks() {
    if (!moveTasksDate) {
      setMoveTasksModalVisible(false);
      return;
    }

    const currentDayActs = activities[moveTasksDate] || [];
    const toMove = currentDayActs.filter((a) => moveTasksSelection[a.id]);
    if (toMove.length === 0) {
      setMoveTasksModalVisible(false);
      return;
    }

    const [y, m, d] = moveTasksDate.split('-').map(Number);
    const base = new Date(y, m - 1, d);
    const next = new Date(base.getTime());
    next.setDate(base.getDate() + 1);
    const nextKey = formatLocalDate(next);

    const updated = { ...activities };
    updated[moveTasksDate] = currentDayActs.filter((a) => !moveTasksSelection[a.id]);
    if (updated[moveTasksDate].length === 0) {
      delete updated[moveTasksDate];
    }

    if (!updated[nextKey]) updated[nextKey] = [];
    toMove.forEach((act) => {
      updated[nextKey] = [...updated[nextKey], { ...act, date: nextKey }];
    });

    saveActivities(updated);
    setMoveTasksModalVisible(false);
    setMoveTasksDate(null);
    setMoveTasksSelection({});
  }

  // =========================
  // PLANIFICACIÓN SEMANAL GUIADA (MVP)
  // =========================

  function getUpcomingWeekDates(fromDateStr) {
    const [y, m, d] = fromDateStr.split('-').map(Number);
    const base = new Date(y, m - 1, d);
    const result = [];
    for (let i = 1; i <= 7; i += 1) {
      const d2 = new Date(base.getTime());
      d2.setDate(base.getDate() + i);
      result.push(formatLocalDate(d2));
    }
    return result;
  }

  function autoPlanWeek() {
    const hardHabitId = weeklyHardHabitId;
    if (!hardHabitId) {
      setWeeklyPlannerVisible(false);
      return;
    }

    const weekDates = getUpcomingWeekDates(selectedDate);
    const updated = { ...activities };

    // Map con carga actual por día
    const loadByDate = {};
    weekDates.forEach((d) => {
      loadByDate[d] = (updated[d] || []).length;
    });

    // Plan inteligente: crear hasta 3 ocurrencias del hábito, preferencia por días más libres
    const occurrencesToCreate = 3;
    const candidates = weekDates.map((d) => ({ date: d, load: loadByDate[d] }));
    // Orden inicial por carga ascendente
    candidates.sort((a, b) => a.load - b.load);

    const picked = [];
    const habitTemplate = habits.find((h) => h.id === hardHabitId);
    if (!habitTemplate) {
      setWeeklyPlannerVisible(false);
      return;
    }

    for (let i = 0; i < occurrencesToCreate; i += 1) {
      // Buscar el candidato con menor carga que no sea vecino de una fecha ya elegida
      let foundIndex = candidates.findIndex((c) => {
        // evitar días ya elegidos
        if (picked.includes(c.date)) return false;
        // evitar consecutivos con los ya elegidos cuando sea posible
        for (const p of picked) {
          const pd = parseLocalDate(p);
          const cd = parseLocalDate(c.date);
          if (Math.abs((cd - pd) / (1000 * 60 * 60 * 24)) <= 1) return false;
        }
        return true;
      });

      // Si ninguno cumple la condición non-consecutive, tomamos el menor por carga
      if (foundIndex === -1) {
        foundIndex = candidates.findIndex((c) => !picked.includes(c.date));
      }

      if (foundIndex === -1) break;

      const target = candidates[foundIndex];

      if (!updated[target.date]) updated[target.date] = [];

      const newActivity = {
        id: uuidv4(),
        habit_id: habitTemplate.id,
        title: habitTemplate.title,
        icon: habitTemplate.icon,
        description: weeklyPriorityText || habitTemplate.description || null,
        allDay: false,
        time: null,
        durationMinutes: null,
        endTime: null,
        data: {},
        date: target.date,
        completed: false,
      };

      updated[target.date] = [...updated[target.date], newActivity];
      // Marcar como elegida y aumentar la carga para próximas iteraciones
      picked.push(target.date);
      candidates[foundIndex].load += 1;
      // reordenar candidatos por carga
      candidates.sort((a, b) => a.load - b.load);
    }

    saveActivities(updated);
    setWeeklyPlannerVisible(false);
    setWeeklyPriorityText('');
    setWeeklyHardHabitId(null);
  }

  /* =========================
     UI
  ========================= */

  const {
    markedDates,
    selectedDayActs,
    selectedTotal,
    selectedCompleted,
    selectedAllCompleted,
  } = useMemo(() => {
    const acc = {};

    for (const d of Object.keys(activities)) {
      const dayActs = activities[d] || [];
      const total = dayActs.length;
      if (total <= 0) continue;

      let completed = 0;
      for (const a of dayActs) {
        if (a?.completed) completed += 1;
      }

      const allCompleted = completed === total;

      if (allCompleted) {
        acc[d] = {
          marked: true,
          dotColor: '#22c55e',
          customStyles: {
            container: {
              backgroundColor: '#dcfce7',
              borderRadius: 16,
            },
            text: {
              color: '#166534',
              fontWeight: '700',
            },
          },
        };
      } else {
        const dayColor = (dayActs.find((a) => a?.data?.color) || {})?.data?.color || accent;
        acc[d] = {
          marked: true,
          dotColor: dayColor,
        };
      }
    }

    const dayActs = activities[selectedDate] || [];
    const total = dayActs.length;
    let completed = 0;
    for (const a of dayActs) {
      if (a?.completed) completed += 1;
    }
    const allCompleted = total > 0 && completed === total;

    acc[selectedDate] = {
      ...(acc[selectedDate] || {}),
      customStyles: allCompleted
        ? {
            container: {
              backgroundColor: '#22c55e',
              borderRadius: 16,
              borderWidth: 2,
              borderColor: '#16a34a',
            },
            text: {
              color: '#f0fdf4',
              fontWeight: '800',
            },
          }
        : {
            container: {
              backgroundColor: accent,
              borderRadius: 16,
            },
            text: {
              color: '#ffffff',
              fontWeight: '800',
            },
          },
    };

    return {
      markedDates: acc,
      selectedDayActs: dayActs,
      selectedTotal: total,
      selectedCompleted: completed,
      selectedAllCompleted: allCompleted,
    };
  }, [activities, accent, selectedDate]);

  const selectedDayActsSorted = useMemo(() => {
    if (!selectedDayActs?.length) return [];
    // Crear un Map de hábitos por id para acceso rápido
    const habitsById = new Map((habits || []).map(h => [String(h.id), h]));
    // Identificar el hábito de ahorrar dinero
    const isSavingsHabit = (act) => {
      if (act?.type && String(act.type).toLowerCase() === 'savings') return true;
      if (act?.title && looksLikeSavingsTitle(act.title)) return true;
      if (act?.habit_id && habitsById.has(String(act.habit_id))) {
        const h = habitsById.get(String(act.habit_id));
        if (h?.type && String(h.type).toLowerCase() === 'savings') return true;
        if (h?.title && looksLikeSavingsTitle(h.title)) return true;
      }
      return false;
    };
    const acts = [...selectedDayActs];
    acts.sort((a, b) => {
      // Savings primero
      const aSavings = isSavingsHabit(a);
      const bSavings = isSavingsHabit(b);
      if (aSavings && !bSavings) return -1;
      if (!aSavings && bSavings) return 1;
      // Luego por allDay y hora
      const aAllDay = !!a?.allDay;
      const bAllDay = !!b?.allDay;
      if (aAllDay && !bAllDay) return -1;
      if (!aAllDay && bAllDay) return 1;
      const aMin = timeStringToMinutes(a?.time) ?? Number.POSITIVE_INFINITY;
      const bMin = timeStringToMinutes(b?.time) ?? Number.POSITIVE_INFINITY;
      return aMin - bMin;
    });
    return acts;
  }, [selectedDayActs, habits]);

  return (
    <SafeAreaView style={[styles.safe, isDark && { backgroundColor: '#020617' }]}>
      <CalendarProvider
        date={selectedDate}
        onDateChanged={setSelectedDate}
        showTodayButton
        todayButtonText={t('calendar.todayButton')}
      >
        <View
          style={[
            styles.calendarWrapper,
          ]}
        >
          <ExpandableCalendar
            key={`${language}-${themeColor}-${themeMode}`}
            firstDay={1}
            markedDates={markedDates}
            markingType="custom"
            theme={themedCalendar}
            onCalendarToggled={handleCalendarToggled}
          />




        </View>

        <View style={[styles.content, isDark && { backgroundColor: '#020617' }]}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {moodMessage ? (
              <View style={{ marginBottom: 12 }}>
                <MoodMessageBanner
                  title={t('mood.bannerTitle')}
                  message={moodMessage}
                  emoji={selectedMood?.emoji}
                  accent={accent}
                  isDark={isDark}
                  onClose={async () => {
                    try {
                      await setDismissedMoodBannerDate(selectedDate);
                      setDismissedMoodDate(selectedDate);
                      setMoodMessage(null);
                    } catch {
                      // best-effort
                      setMoodMessage(null);
                    }
                  }}
                />
              </View>
            ) : null}
            {selectedDayActsSorted.length ? (
              selectedDayActsSorted.map((activity) => {
                // IMPORTANTE: Agregamos la fecha al objeto activity
                const activityWithDate = {
                  ...activity,
                  date: selectedDate,
                };

                const { key: marketKey, label: marketLabel } =
                  getMarketFieldMeta(activityWithDate);
                const { key: checklistKey, label: checklistLabel } =
                  getChecklistFieldMeta(activityWithDate);
                const { key: vitaminsKey, label: vitaminsLabel } =
                  getVitaminsFieldMeta(activityWithDate);
                const { key: textKey, label: textLabel } =
                  getTextFieldMeta(activityWithDate);

                const hasMarket =
                  !!(
                    marketKey &&
                    activityWithDate.data?.[marketKey] &&
                    Array.isArray(activityWithDate.data[marketKey]) &&
                    activityWithDate.data[marketKey].length > 0
                  );

                const hasChecklist =
                  !!(
                    checklistKey &&
                    activityWithDate.data?.[checklistKey] &&
                    Array.isArray(activityWithDate.data[checklistKey]) &&
                    activityWithDate.data[checklistKey].length > 0
                  );

                const hasVitamins =
                  !!(
                    vitaminsKey &&
                    activityWithDate.data?.[vitaminsKey] &&
                    Array.isArray(activityWithDate.data[vitaminsKey]) &&
                    activityWithDate.data[vitaminsKey].length > 0
                  );

                const displayTitle = getDisplayTitle(activityWithDate);

                const habitTemplateForCard = getHabitTemplateForActivity(activityWithDate);
                const habitTypeForCard = String(habitTemplateForCard?.type || '').toLowerCase();

                // Meta para hobby creativo
                const looksLikeCreativeHobbyTitle = (text) => {
                  const t = String(text || '').toLowerCase();
                  return (
                    t.includes('hobby creativo') ||
                    t.includes('creative hobby') ||
                    t.includes('creatividad') ||
                    t.includes('artesanía') ||
                    t.includes('manualidad')
                  );
                };
                const isCreativeHobbyHabit =
                  habitTypeForCard === 'creative_hobby' ||
                  looksLikeCreativeHobbyTitle(habitTemplateForCard?.title || habitTemplateForCard?.Title) ||
                  looksLikeCreativeHobbyTitle(displayTitle);
                const creativeHobbyMeta = (() => {
                  if (!isCreativeHobbyHabit) return null;
                  const idx = Number.isFinite(activityWithDate?.data?.creativeHobbyOption) ? activityWithDate.data.creativeHobbyOption : -1;
                  const hobbyOther = String(activityWithDate?.data?.creativeHobbyOther ?? '').trim();
                  const options = t('creativeHobbyOptions') || [];
                  let subjectText = null;
                  if (idx !== -1 && options[idx]) {
                    if (options[idx] === 'Otros' || options[idx] === 'Others' || options[idx].toLowerCase().includes('otro') || options[idx].toLowerCase().includes('other')) {
                      subjectText = hobbyOther ? `${options[idx]}: ${hobbyOther}` : options[idx];
                    } else {
                      subjectText = options[idx];
                    }
                  } else if (hobbyOther) {
                    subjectText = hobbyOther;
                  }
                  return { subjectText, idx };
                })();
                const savingsTotals = activityWithDate?.habit_id
                  ? savingsByHabitId.get(activityWithDate.habit_id)
                  : null;
                const savingsTargetAmount = Number.isFinite(savingsTotals?.target)
                  ? savingsTotals.target
                  : parseMoneyLike(activityWithDate.data?.savingsTargetAmount);
                const savingsSavedAmount = Number.isFinite(savingsTotals?.saved)
                  ? savingsTotals.saved
                  : (parseMoneyLike(activityWithDate.data?.savingsSavedAmount) || 0);
                const hasSavingsGoal = Number.isFinite(savingsTargetAmount) && savingsTargetAmount > 0;
                const savingsProgress = hasSavingsGoal
                  ? Math.max(0, Math.min(1, savingsSavedAmount / savingsTargetAmount))
                  : 0;
                const isSavingsHabit =
                  hasSavingsGoal ||
                  looksLikeSavingsTitle(habitTemplateForCard?.title || habitTemplateForCard?.Title) ||
                  looksLikeSavingsTitle(displayTitle);

                const isWaterHabit =
                  habitTypeForCard === 'water' ||
                  looksLikeWaterTitle(habitTemplateForCard?.title || habitTemplateForCard?.Title) ||
                  looksLikeWaterTitle(displayTitle);

                const isStudyHabit =
                  habitTypeForCard === 'study' ||
                  looksLikeStudyTitle(habitTemplateForCard?.title || habitTemplateForCard?.Title) ||
                  looksLikeStudyTitle(displayTitle);

                const isCourseHabit =
                  habitTypeForCard === 'course' ||
                  looksLikeCourseTitle(habitTemplateForCard?.title || habitTemplateForCard?.Title) ||
                  looksLikeCourseTitle(displayTitle);

                const isResearchHabit =
                  habitTypeForCard === 'research' ||
                  habitTypeForCard === 'investigate' ||
                  looksLikeResearchTitle(habitTemplateForCard?.title || habitTemplateForCard?.Title) ||
                  looksLikeResearchTitle(displayTitle);

                const isPodcastHabit =
                  habitTypeForCard === 'podcast' ||
                  looksLikePodcastTitle(habitTemplateForCard?.title || habitTemplateForCard?.Title) ||
                  looksLikePodcastTitle(displayTitle);

                const isLanguagePracticeHabit =
                  habitTypeForCard === 'language_practice' ||
                  habitTypeForCard === 'language' ||
                  looksLikeLanguagePracticeTitle(habitTemplateForCard?.title || habitTemplateForCard?.Title) ||
                  looksLikeLanguagePracticeTitle(displayTitle);

                const isFamilyHabit =
                  habitTypeForCard === 'family' ||
                  looksLikeFamilyTitle(habitTemplateForCard?.title || habitTemplateForCard?.Title) ||
                  looksLikeFamilyTitle(displayTitle);

                const isGymHabit =
                  habitTypeForCard === 'gym' ||
                  looksLikeGymTitle(habitTemplateForCard?.title || habitTemplateForCard?.Title) ||
                  looksLikeGymTitle(displayTitle);

                const isInboxZeroHabit =
                  habitTypeForCard === 'inboxzero' ||
                  habitTypeForCard === 'inbox_zero' ||
                  looksLikeInboxZeroTitle(habitTemplateForCard?.title || habitTemplateForCard?.Title) ||
                  looksLikeInboxZeroTitle(displayTitle);

                const isMarketListHabit =
                  habitTypeForCard === 'market' ||
                  habitTypeForCard === 'shopping' ||
                  hasMarket ||
                  looksLikeMarketListTitle(habitTemplateForCard?.title || habitTemplateForCard?.Title) ||
                  looksLikeMarketListTitle(displayTitle);

                const isPlanningDayHabit =
                  habitTypeForCard === 'planningday' ||
                  habitTypeForCard === 'planning_day' ||
                  looksLikePlanningDayTitle(habitTemplateForCard?.title || habitTemplateForCard?.Title) ||
                  looksLikePlanningDayTitle(displayTitle);

                const isSunHabit =
                  habitTypeForCard === 'sun' ||
                  habitTypeForCard === 'sunbath' ||
                  looksLikeSunTitle(habitTemplateForCard?.title || habitTemplateForCard?.Title) ||
                  looksLikeSunTitle(displayTitle);

                const isBirthdayHabit =
                  habitTypeForCard === 'birthday' ||
                  (() => {
                    const t = String(habitTemplateForCard?.title || habitTemplateForCard?.Title || displayTitle || '').toLowerCase();
                    return t.includes('cumple') || t.includes('birthday') || t.includes('anniversaire') || t.includes('anivers');
                  })();

                const waterTargetMlRaw = parseMlLike(activityWithDate?.data?.waterMlTarget);
                const waterTargetMl = Number.isFinite(waterTargetMlRaw) && waterTargetMlRaw > 0
                  ? waterTargetMlRaw
                  : 2000;
                const waterConsumedMlRaw = parseMlLike(activityWithDate?.data?.waterMlConsumed);
                const waterConsumedMl = Number.isFinite(waterConsumedMlRaw) && waterConsumedMlRaw > 0
                  ? waterConsumedMlRaw
                  : 0;
                const waterProgress = waterTargetMl > 0
                  ? Math.max(0, Math.min(1, waterConsumedMl / waterTargetMl))
                  : 0;
                const waterMotivation = isWaterHabit ? getWaterMotivation(waterProgress, t) : null;
                const savingsMotivation = hasSavingsGoal
                  ? getSavingsMotivation(savingsProgress, t)
                  : null;
                const currencySymbol = t('habitForm.marketPricePlaceholder') || '$';

                const studyMeta = (() => {
                  if (!isStudyHabit) return null;
                  const idx = Number.isFinite(activityWithDate?.data?.studySubject) ? activityWithDate.data.studySubject : -1;
                  const otherTopic = String(activityWithDate?.data?.studySubjectOther ?? '').trim();
                  const options = t('studySubjectOptions') || [];
                  let subject = null;
                  if (idx !== -1 && options[idx]) {
                    if (options[idx] === 'Otros' || options[idx] === 'Others' || options[idx].toLowerCase().includes('otro') || options[idx].toLowerCase().includes('other')) {
                      subject = otherTopic ? `${options[idx]}: ${otherTopic}` : options[idx];
                    } else {
                      subject = options[idx];
                    }
                  } else if (otherTopic) {
                    subject = otherTopic;
                  }
                  const minutes =
                    typeof activityWithDate?.durationMinutes === 'number' && activityWithDate.durationMinutes > 0
                      ? activityWithDate.durationMinutes
                      : (() => {
                        const n = parseInt(String(activityWithDate?.data?.studyDurationMinutes ?? ''), 10);
                        return Number.isFinite(n) && n > 0 ? n : null;
                      })();
                  if (!subject && !minutes) return null;
                  // Emoji map for all languages (index-based)
                  const EMOJIS = ['🧮','📝','🗣️','🔬','📜','🌍','🧠','📚'];
                  const emoji = idx !== -1 && EMOJIS[idx] ? EMOJIS[idx] : '📚';
                  return {
                    subjectText: subject ? `${emoji} ${subject}` : null,
                    minutes,
                  };
                })();

                const courseMeta = (() => {
                  if (!isCourseHabit) return null;

                  const topicRaw = String(activityWithDate?.data?.courseTopic ?? '').trim();
                  const other = String(activityWithDate?.data?.courseTopicOther ?? '').trim();
                  const topic = topicRaw === 'Otros' ? (other || 'Otros') : (topicRaw || null);

                  const minutes =
                    typeof activityWithDate?.durationMinutes === 'number' && activityWithDate.durationMinutes > 0
                      ? activityWithDate.durationMinutes
                      : (() => {
                        const n = parseInt(String(activityWithDate?.data?.courseDurationMinutes ?? ''), 10);
                        return Number.isFinite(n) && n > 0 ? n : null;
                      })();

                  if (!topic && !minutes) return null;

                  const EMOJI = {
                    'Programación': '💻',
                    'Diseño': '🎨',
                    'Marketing': '📣',
                    'Finanzas': '💰',
                    'Idiomas': '🗣️',
                    'Negocios': '🧾',
                    'Productividad': '✅',
                    'Salud': '🧘',
                    'Otros': '🎓',
                  };

                  const emojiKey = topicRaw === 'Otros' ? 'Otros' : topicRaw;
                  const emoji = EMOJI[emojiKey] || '🎓';

                  return {
                    subjectText: topic ? `${emoji} ${topic}` : null,
                    minutes,
                  };
                })();

                const researchMeta = (() => {
                  if (!isResearchHabit) return null;

                  const topicRaw = String(activityWithDate?.data?.researchTopic ?? '').trim();
                  const other = String(activityWithDate?.data?.researchTopicOther ?? '').trim();
                  const topic = topicRaw === 'Otros' ? (other || 'Otros') : (topicRaw || null);

                  const minutes =
                    typeof activityWithDate?.durationMinutes === 'number' && activityWithDate.durationMinutes > 0
                      ? activityWithDate.durationMinutes
                      : (() => {
                        const n = parseInt(String(activityWithDate?.data?.researchDurationMinutes ?? ''), 10);
                        return Number.isFinite(n) && n > 0 ? n : null;
                      })();

                  if (!topic && !minutes) return null;

                  const EMOJI = {
                    'Tecnología': '💡',
                    'Ciencia': '🔬',
                    'Historia': '📜',
                    'Finanzas': '💰',
                    'Salud': '🧬',
                    'Noticias': '📰',
                    'Arte': '🎭',
                    'Otros': '🔎',
                  };

                  const emojiKey = topicRaw === 'Otros' ? 'Otros' : topicRaw;
                  const emoji = EMOJI[emojiKey] || '🔎';

                  return {
                    subjectText: topic ? `${emoji} ${topic}` : null,
                    minutes,
                  };
                })();

                const podcastMeta = (() => {
                  if (!isPodcastHabit) return null;

                  const name = String(activityWithDate?.data?.podcastName ?? '').trim();
                  if (!name) return null;

                  return {
                    subjectText: `🎙️ ${name}`,
                    minutes: null,
                  };
                })();

                const languagePracticeMeta = (() => {
                  if (!isLanguagePracticeHabit) return null;
                  const idx = Number.isFinite(activityWithDate?.data?.languagePracticeLanguage) ? activityWithDate.data.languagePracticeLanguage : -1;
                  const other = String(activityWithDate?.data?.languagePracticeOther ?? '').trim();
                  // Opciones de idioma (igual que en el modal)
                  const LANGUAGE_OPTIONS = [
                    'Inglés',
                    'Francés',
                    'Portugués',
                    'Italiano',
                    'Alemán',
                    'Japonés',
                    'Coreano',
                    'Chino',
                    'Otros',
                  ];
                  let lang = null;
                  if (idx !== -1 && LANGUAGE_OPTIONS[idx]) {
                    lang = LANGUAGE_OPTIONS[idx] === 'Otros' ? (other || 'Otros') : LANGUAGE_OPTIONS[idx];
                  } else if (other) {
                    lang = other;
                  }
                  const minutes =
                    typeof activityWithDate?.durationMinutes === 'number' && activityWithDate.durationMinutes > 0
                      ? activityWithDate.durationMinutes
                      : (() => {
                        const n = parseInt(String(activityWithDate?.data?.languagePracticeDurationMinutes ?? ''), 10);
                        return Number.isFinite(n) && n > 0 ? n : null;
                      })();
                  if (!lang && !minutes) return null;
                  // Emoji para idioma
                  const EMOJI = '🗣️';
                  return {
                    subjectText: lang ? `${EMOJI} ${lang}` : null,
                    minutes,
                  };
                })();

                const timeRangeText = (() => {
                  if (activityWithDate.allDay) {
                    return t('calendar.allDayLabel') || t('habitForm.durationAllDay') || 'Todo el día';
                  }
                  if (!activityWithDate.time) return null;
                  const start = formatTimeFromHHmm(activityWithDate.time, {
                    language,
                    timeFormat,
                  });
                  if (activityWithDate.endTime && activityWithDate.endTime !== activityWithDate.time) {
                    const end = formatTimeFromHHmm(activityWithDate.endTime, {
                      language,
                      timeFormat,
                    });
                    return `${start} - ${end}`;
                  }
                  return start;
                })();

                let friendlySubtitle = null;
                const rawTextValue = textKey
                  ? activityWithDate.data?.[textKey]
                  : null;

                if (rawTextValue) {
                  const habitTemplateForSubtitle = getHabitTemplateForActivity(activityWithDate);
                  const habitType = String(habitTemplateForSubtitle?.type || '').toLowerCase();
                  const titleLower = String(displayTitle || activityWithDate.title || '').toLowerCase();
                  const answer = String(rawTextValue).trim();

                  const prefixKeyByType = {
                    birthday: 'specialHabits.birthday.subtitlePrefix',
                    study: 'specialHabits.study.subtitlePrefix',
                    book: 'specialHabits.book.subtitlePrefix',
                    call: 'specialHabits.call.subtitlePrefix',
                    skincare: 'specialHabits.skincare.subtitlePrefix',
                    water: 'specialHabits.water.subtitlePrefix',
                  };

                  const resolvedType = (() => {
                    if (prefixKeyByType[habitType]) return habitType;
                    if (titleLower.includes('cumple') || titleLower.includes('birthday') || titleLower.includes('anniversaire') || titleLower.includes('anivers')) return 'birthday';
                    if (titleLower.includes('estudiar') || titleLower.includes('study')) return 'study';
                    if ((titleLower.includes('leer') && titleLower.includes('libro')) || titleLower.includes('book') || titleLower.includes('read')) return 'book';
                    if (titleLower.includes('llamar') || titleLower.includes('call')) return 'call';
                    if ((titleLower.includes('cuidar') && titleLower.includes('piel')) || titleLower.includes('skin')) return 'skincare';
                    if ((titleLower.includes('beber') && titleLower.includes('agua')) || titleLower.includes('water') || titleLower.includes('eau') || titleLower.includes('água')) return 'water';
                    return null;
                  })();

                  if (resolvedType) {
                    const prefix = t(prefixKeyByType[resolvedType]);
                    if (resolvedType === 'birthday') {
                      const safePrefix =
                        prefix ||
                        (language === 'es'
                          ? '🎉 Hoy celebramos el cumpleaños de'
                          : '🎉 Today we celebrate the birthday of');

                      friendlySubtitle = (
                        <>
                          {String(safePrefix).trim()}{' '}
                          <Text style={{ fontWeight: '900' }}>{answer}</Text>
                        </>
                      );
                    } else {
                      friendlySubtitle = `${prefix} ${answer}`.trim();
                    }
                  } else if (textLabel) {
                    friendlySubtitle = `${textLabel} ${answer}`.trim();
                  } else {
                    friendlySubtitle = answer;
                  }
                }

                const bannerSource = !isBirthdayHabit
                  ? (
                      isSavingsHabit && hasSavingsGoal
                        ? require('../../assets/Banners/ahorrardinero.png')
                        : isWaterHabit
                          ? require('../../assets/Banners/agua.png')
                          : isStudyHabit
                            ? require('../../assets/Banners/estudiar.png')
                            : isFamilyHabit
                              ? require('../../assets/Banners/family.png')
                              : isGymHabit
                                ? require('../../assets/Banners/Gimnasio.png')
                                : isInboxZeroHabit
                                  ? require('../../assets/Banners/inboxzero.png')
                                  : isMarketListHabit
                                    ? require('../../assets/Banners/mercado.png')
                                    : isPlanningDayHabit
                                      ? require('../../assets/Banners/plannigDay.png')
                                      : isSunHabit
                                        ? require('../../assets/Banners/tomar-sol.png')
                                        : null
                    )
                  : null;

                const hasSpecialBanner = !!bannerSource;

                const isCompleted = !!activityWithDate.completed;
                const cardColor = activityWithDate?.data?.color || accent;
                const cardTextColor = (isBirthdayHabit || hasSpecialBanner) ? '#ffffff' : getContrastColor(cardColor);
                const titleTextColor = isCompleted
                  ? undefined
                  : cardTextColor;
                const subtitleTextColor = isCompleted
                  ? undefined
                  : cardTextColor;
                const descTextColor = isCompleted
                  ? undefined
                  : cardTextColor;

                return (
                  <Swipeable
                    key={activity.id}
                    ref={(ref) => {
                      if (ref) swipeableRefs.current[activity.id] = ref;
                    }}
                    renderRightActions={() => (
                      <View style={[styles.swipeActionsRight, { flexDirection: 'row' }]}>
                        <Pressable onPress={() => editActivity(activityWithDate)}>
                          <View style={styles.swipeEdit}>
                            <Ionicons name="create-outline" size={20} color="#fff" />
                            <Text style={styles.swipeText}>{t('calendar.edit')}</Text>
                          </View>
                        </Pressable>

                        <Pressable onPress={() => confirmDelete(activityWithDate)}>
                          <View style={styles.swipeDelete}>
                            <Ionicons name="trash-outline" size={20} color="#fff" />
                            <Text style={styles.swipeText}>{t('calendar.delete') || t('calendar.deleteActivityTitle') || 'Eliminar'}</Text>
                          </View>
                        </Pressable>
                      </View>
                    )}
                    overshootLeft={false}
                    overshootRight={false}
                  >
                    <Pressable
                      style={[
                        styles.card,
                        isBirthdayHabit && styles.birthdayCard,
                        hasSpecialBanner && styles.specialBannerCard,
                        !isBirthdayHabit && isCompleted && styles.cardCompleted,
                        !isCompleted && !isBirthdayHabit && !hasSpecialBanner && { backgroundColor: cardColor, borderColor: cardColor },
                      ]}
                      onPress={() => {
                        if (isSavingsHabit && hasSavingsGoal) {
                          setSavingsModalData({
                            activity: activityWithDate,
                            displayTitle,
                          });
                          setSavingsAddAmountText('');
                          setSavingsModalVisible(true);
                        } else if (isWaterHabit) {
                          setWaterModalData({
                            activity: activityWithDate,
                            displayTitle,
                          });
                          setWaterAddMlText('');
                          setWaterModalVisible(true);
                        } else if (hasMarket) {
                          setMarketModalData({
                            activity: activityWithDate,
                            marketKey,
                            marketLabel,
                          });
                          setMarketModalVisible(true);
                        } else if (hasVitamins) {
                          setVitaminsModalData({
                            activity: activityWithDate,
                            vitaminsKey,
                            vitaminsLabel,
                          });
                          setVitaminsModalVisible(true);
                        } else if (hasChecklist) {
                          setChecklistModalData({
                            activity: activityWithDate,
                            checklistKey,
                            checklistLabel,
                          });
                          setChecklistModalVisible(true);
                        }
                      }}
                    >
                      {isBirthdayHabit ? (
                        <>
                          <ImageBackground
                            source={require('../../assets/Banners/birthday.png')}
                            style={styles.birthdayBanner}
                            imageStyle={styles.birthdayBannerImage}
                            resizeMode="cover"
                          />
                          <View pointerEvents="none" style={styles.birthdayOverlay} />
                          {isCompleted ? (
                            <View pointerEvents="none" style={styles.birthdayCompletedOverlay} />
                          ) : null}
                        </>
                      ) : null}

                      {!isBirthdayHabit && bannerSource ? (
                        <>
                          <ImageBackground
                            source={bannerSource}
                            style={styles.specialBanner}
                            imageStyle={styles.specialBannerImage}
                            resizeMode="cover"
                          />
                          <View pointerEvents="none" style={styles.specialOverlay} />
                          {isCompleted ? (
                            <View pointerEvents="none" style={styles.specialCompletedOverlay} />
                          ) : null}
                        </>
                      ) : null}

                      {/* HEADER */}
                      <View style={styles.cardHeader}>
                        {((activity && activity.icon) || habitIconById.get(activity?.habit_id)) || !hasMarket ? (
                          <View style={styles.cardIconContainer}>
                            {((activity && activity.icon) || habitIconById.get(activity?.habit_id)) ? (
                              <Image
                                source={{ uri: (activity && activity.icon) || habitIconById.get(activity?.habit_id) }}
                                style={styles.cardIcon}
                              />
                            ) : (
                              <View style={styles.cardIconPlaceholder}>
                                <Ionicons name="sparkles" size={26} color={accent} />
                              </View>
                            )}
                          </View>
                        ) : null}
                        <View style={styles.cardHeaderText}>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text
                              style={[styles.cardTitle, isCompleted && styles.cardTitleCompleted, titleTextColor && { color: titleTextColor }]}
                            >
                              {displayTitle}
                            </Text>
                            {/* Descripción del hábito debajo del título */}
                            {habitTemplateForCard?.description ? (
                              <Text
                                style={[
                                  styles.habitDescription,
                                  { marginTop: 2 },
                                  isCompleted && styles.cardTitleCompleted,
                                  descTextColor && { color: descTextColor },
                                ]}
                              >
                                {habitTemplateForCard.description}
                              </Text>
                            ) : null}
                            {/* Eliminado el label 'Lista' para mercado, solo se muestra el chip */}

                            {isBirthdayHabit && (() => {
                              // Calcular edad y nombre
                              const baseAge = parseInt(activityWithDate?.data?.birthdayAge, 10);
                              let baseYear = parseInt(activityWithDate?.data?.birthdayBaseYear, 10);
                              const eventYear = new Date(activityWithDate?.date).getFullYear();
                              if (!Number.isFinite(baseYear)) {
                                if (Number.isFinite(baseAge) && activityWithDate?.data) {
                                  baseYear = eventYear;
                                }
                              }
                              const name = (() => {
                                const textFieldKey = (() => {
                                  const habitTemplate = getHabitTemplateForActivity(activityWithDate);
                                  const config = habitTemplate && habitTemplate.config ? (typeof habitTemplate.config === 'object' ? habitTemplate.config : JSON.parse(habitTemplate.config)) : null;
                                  if (!config || !Array.isArray(config.fields)) return null;
                                  const textField = config.fields.find(f => String(f?.type).toLowerCase() === 'text');
                                  return textField ? textField.key : null;
                                })();
                                if (textFieldKey && activityWithDate.data && activityWithDate.data[textFieldKey]) {
                                  return String(activityWithDate.data[textFieldKey]);
                                }
                                return '';
                              })();
                              if (!Number.isFinite(baseYear)) {
                                baseYear = eventYear;
                              }
                              let age = null;
                              if (Number.isFinite(baseAge) && Number.isFinite(baseYear)) {
                                age = baseAge + (eventYear - baseYear);
                              } else if (Number.isFinite(baseAge)) {
                                age = baseAge;
                              }

                              // Mensaje multilenguaje organizado
                              let msg = '';
                              if (language === 'en') {
                                msg = `🎉 Today we celebrate birthday #${Number.isFinite(age) && age > 0 ? age : '?'} of ${name || 'someone special'}`;
                              } else if (language === 'fr') {
                                const special = "quelqu'un de spécial";
                                msg = `🎉 Aujourd'hui, nous célébrons l'anniversaire n°${Number.isFinite(age) && age > 0 ? age : '?'} de ${name || special}`;
                              } else if (language === 'pt') {
                                msg = `🎉 Hoje celebramos o aniversário nº${Number.isFinite(age) && age > 0 ? age : '?'} de ${name || 'alguém especial'}`;
                              } else {
                                msg = `🎉 Hoy celebramos el cumpleaños #${Number.isFinite(age) && age > 0 ? age : '¿?'} de ${name || 'alguien especial'}`;
                              }
                              return (
                                <Text style={[styles.cardSubtitle, { fontWeight: 'normal', fontSize: 13, color: '#fff', marginTop: 2, textAlign: 'justify' }]}>{msg}</Text>
                              );
                            })()}


                              {habitTypeForCard === 'call' && (() => {
                                // Obtener el nombre ingresado en el modal
                                const name = (() => {
                                  const habitTemplate = getHabitTemplateForActivity(activityWithDate);
                                  const config = habitTemplate && habitTemplate.config ? (typeof habitTemplate.config === 'object' ? habitTemplate.config : JSON.parse(habitTemplate.config)) : null;
                                  if (!config || !Array.isArray(config.fields)) return '';
                                  const textField = config.fields.find(f => String(f?.type).toLowerCase() === 'text');
                                  if (textField && activityWithDate.data && activityWithDate.data[textField.key]) {
                                    return String(activityWithDate.data[textField.key]);
                                  }
                                  return '';
                                })();
                                if (!name) return null;
                                let msg = '';
                                if (language === 'en') {
                                  msg = `Remember to call ${name}`;
                                } else if (language === 'fr') {
                                  msg = `N'oublie pas d'appeler ${name}`;
                                } else if (language === 'pt') {
                                  msg = `Lembre-se de ligar para ${name}`;
                                } else {
                                  msg = `Recuerda llamar a ${name}`;
                                }
                                return (
                                  <Text style={[styles.cardSubtitle, { fontWeight: 'normal', fontSize: 13, color: '#000', marginTop: 2, textAlign: 'justify' }]}>{msg}</Text>
                                );
                              })()}

                            {studyMeta || courseMeta || researchMeta || podcastMeta || languagePracticeMeta ? (
                              <View style={styles.studyMetaRow}>
                                {(() => {
                                  const textColor = subtitleTextColor || '#ffffff';
                                  const chipStyle =
                                    String(textColor) === '#111827'
                                      ? styles.studyMetaChipOnLight
                                      : styles.studyMetaChipOnDark;


                                  const renderMeta = (meta, isLanguagePractice = false) => {
                                    if (!meta) return null;
                                    // Para practicar idioma, mostrar idioma y tiempo en chips separados, pero solo una vez cada uno
                                    if (isLanguagePractice) {
                                      return (
                                        <>
                                          {meta.subjectText ? (
                                            <View style={[styles.studyMetaChip, chipStyle]}>
                                              <Text style={[styles.studyMetaText, { color: textColor }]}> 
                                                {meta.subjectText}
                                              </Text>
                                            </View>
                                          ) : null}
                                          {meta.minutes ? (
                                            <View style={[styles.studyMetaChip, chipStyle]}>
                                              <Ionicons
                                                name="time-outline"
                                                size={14}
                                                color={textColor}
                                              />
                                              <Text style={[styles.studyMetaText, { color: textColor }]}> 
                                                {`${meta.minutes} min`}
                                              </Text>
                                            </View>
                                          ) : null}
                                        </>
                                      );
                                    }
                                    // Para los demás, solo mostrar una vez cada chip
                                    return (
                                      <>
                                        {meta.subjectText ? (
                                          <View style={[styles.studyMetaChip, chipStyle]}>
                                            <Text style={[styles.studyMetaText, { color: textColor }]}> 
                                              {meta.subjectText}
                                            </Text>
                                          </View>
                                        ) : null}
                                        {!isLanguagePractice && meta.minutes ? (
                                          <View style={[styles.studyMetaChip, chipStyle]}>
                                            <Ionicons
                                              name="time-outline"
                                              size={14}
                                              color={textColor}
                                            />
                                            <Text style={[styles.studyMetaText, { color: textColor }]}> 
                                              {`${meta.minutes} min`}
                                            </Text>
                                          </View>
                                        ) : null}
                                      </>
                                    );
                                  };

                                  // Si es languagePracticeMeta, solo mostrar ese y no los demás
                                  if (languagePracticeMeta) {
                                    return renderMeta(languagePracticeMeta, true);
                                  }
                                  // Si es creativeHobbyMeta, mostrar el chip igual que idioma
                                  if (creativeHobbyMeta) {
                                    return (
                                      <View style={styles.studyMetaRow}>
                                        <View style={[styles.studyMetaChip, chipStyle]}>
                                          <Text style={[styles.studyMetaText, { color: textColor }]}> 
                                            {creativeHobbyMeta.subjectText}
                                          </Text>
                                        </View>
                                      </View>
                                    );
                                  }
                                  return (
                                    <>
                                      {renderMeta(studyMeta)}
                                      {renderMeta(courseMeta)}
                                      {renderMeta(researchMeta)}
                                      {renderMeta(podcastMeta)}
                                    </>
                                  );
                                })()}
                              </View>
                            ) : null}


                            {isWaterHabit ? (
                              <>
                                <View style={styles.waterTopRow}>
                                  <Text
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                    style={[styles.waterInlineStats, isCompleted && styles.cardSubtitleCompleted, subtitleTextColor && { color: subtitleTextColor }]}
                                  >
                                    {`${waterConsumedMl} / ${waterTargetMl} ml`}
                                  </Text>
                                  <Ionicons
                                    name="add-circle-outline"
                                    size={18}
                                    color={isCompleted ? '#16a34a' : (subtitleTextColor || '#ffffff')}
                                    style={{ opacity: 0.9 }}
                                  />
                                </View>
                                <View style={styles.waterProgressRow}>
                                  <View style={[styles.waterProgressTrack, { backgroundColor: subtitleTextColor ? `${subtitleTextColor}33` : 'rgba(255,255,255,0.25)' }]}> 
                                    <View style={[styles.waterProgressFill, { width: `${Math.round(waterProgress * 100)}%`, backgroundColor: isCompleted ? '#ffffff' : (subtitleTextColor || '#ffffff') }]} />
                                  </View>
                                  <Text style={[styles.waterPercentText, isCompleted && styles.cardSubtitleCompleted, subtitleTextColor && { color: subtitleTextColor }]}> 
                                    {`${Math.round(waterProgress * 100)}%`}
                                  </Text>
                                </View>
                                {waterMotivation ? (
                                  <Text numberOfLines={2} ellipsizeMode="tail" style={[styles.waterMotivationText, isCompleted && styles.cardSubtitleCompleted, subtitleTextColor && { color: subtitleTextColor }]}> 
                                    {waterMotivation}
                                  </Text>
                                ) : null}
                              </>
                            ) : null}


                            {(hasVitamins || isMarketListHabit) ? (
                              <View style={styles.studyMetaRow}>
                                <View style={[styles.studyMetaChip, String(subtitleTextColor) === '#111827' ? styles.studyMetaChipOnLight : styles.studyMetaChipOnDark]}>
                                  <Text style={[styles.studyMetaText, { color: subtitleTextColor || '#fff' }]}> 
                                    {t('chipList') || 'Lista'}
                                  </Text>
                                </View>
                              </View>
                            ) : null}

                            {creativeHobbyMeta ? (
                              <View style={styles.studyMetaRow}>
                                <View style={[
                                  styles.studyMetaChip,
                                  { justifyContent: 'center', alignItems: 'center' },
                                  String(subtitleTextColor) === '#111827' ? styles.studyMetaChipOnLight : styles.studyMetaChipOnDark
                                ]}>
                                  <Text style={[
                                    styles.studyMetaText,
                                    { color: subtitleTextColor || '#fff', textAlign: 'center', width: '100%' }
                                  ]}>
                                    {(() => {
                                      const options = t('creativeHobbyOptions') || [];
                                      if (creativeHobbyMeta.idx !== undefined && creativeHobbyMeta.idx !== -1 && Array.isArray(options) && options[creativeHobbyMeta.idx]) {
                                        return options[creativeHobbyMeta.idx];
                                      }
                                      return creativeHobbyMeta.subjectText;
                                    })()}
                                  </Text>
                                </View>
                              </View>
                            ) : null}

                            {/* Chip for 'Leer un libro' habit */}
                            {(() => {
                              // Detect 'Leer un libro' habit by type or title
                              const isReadBookHabit =
                                habitTypeForCard === 'read_book' ||
                                (habitTemplateForCard?.title || '').toLowerCase().includes('leer un libro') ||
                                (habitTemplateForCard?.title || '').toLowerCase().includes('read a book') ||
                                (displayTitle || '').toLowerCase().includes('leer un libro') ||
                                (displayTitle || '').toLowerCase().includes('read a book');
                              if (!isReadBookHabit) return null;
                              // Try to get the book name from activityWithDate.data.bookName or similar
                              const bookName = activityWithDate?.data?.bookName || activityWithDate?.data?.book || '';
                              if (!bookName) return null;
                              return (
                                <View style={styles.studyMetaRow}>
                                  <View style={[
                                    styles.studyMetaChip,
                                    { justifyContent: 'center', alignItems: 'center' },
                                    String(subtitleTextColor) === '#111827' ? styles.studyMetaChipOnLight : styles.studyMetaChipOnDark
                                  ]}>
                                    <Text style={[
                                      styles.studyMetaText,
                                      { color: subtitleTextColor || '#fff', textAlign: 'center', width: '100%' }
                                    ]}>
                                      {bookName}
                                    </Text>
                                  </View>
                                </View>
                              );
                            })()}

                            {isSavingsHabit && hasSavingsGoal ? (
                              <>
                                <View style={styles.savingsTopRow}>
                                  <Text
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                    style={[
                                      styles.savingsInlineStats,
                                      isCompleted && styles.cardSubtitleCompleted,
                                      subtitleTextColor && { color: subtitleTextColor },
                                    ]}
                                  >
                                    {`${currencySymbol}${savingsSavedAmount.toFixed(2)} / ${currencySymbol}${savingsTargetAmount.toFixed(2)}`}
                                  </Text>

                                  <Ionicons
                                    name="add-circle-outline"
                                    size={18}
                                    color={isCompleted ? '#16a34a' : (subtitleTextColor || '#ffffff')}
                                    style={{ opacity: 0.9 }}
                                  />
                                </View>

                                <View style={styles.savingsProgressRow}>
                                  <View
                                    style={[
                                      styles.savingsProgressTrack,
                                      { backgroundColor: subtitleTextColor ? `${subtitleTextColor}33` : 'rgba(255,255,255,0.25)' },
                                    ]}
                                  >
                                    <View
                                      style={[
                                        styles.savingsProgressFill,
                                        {
                                          width: `${Math.round(savingsProgress * 100)}%`,
                                          backgroundColor: isCompleted
                                            ? '#ffffff'
                                            : (subtitleTextColor || '#ffffff'),
                                        },
                                      ]}
                                    />
                                  </View>
                                  <Text
                                    style={[
                                      styles.savingsPercentText,
                                      isCompleted && styles.cardSubtitleCompleted,
                                      subtitleTextColor && { color: subtitleTextColor },
                                    ]}
                                  >
                                    {`${Math.round(savingsProgress * 100)}%`}
                                  </Text>
                                </View>

                                {/* savingsMotivation message removed as requested */}
                              </>
                            ) : null}
                          </View>
                          <View style={styles.cardRightActions}>
                            <Pressable
                              onPress={() => toggleCompleted(activityWithDate)}
                              style={styles.completeBtn}
                            >
                              <Ionicons
                                name={
                                  isCompleted
                                    ? 'checkmark-circle'
                                    : 'checkmark-circle-outline'
                                }
                                size={22}
                                color={isCompleted ? '#16a34a' : '#6b7280'}
                              />
                            </Pressable>
                          {hasMarket ? null : null}
                          </View>
                        </View>
                      </View>

                    </Pressable>
                  </Swipeable>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="leaf-outline" size={48} color="#d1d5db" />
                </View>
                <Text style={styles.emptyTitle}>{t('calendar.emptyTitle')}</Text>
                <Text style={styles.emptySubtitle}>
                  {t('calendar.emptySubtitle')}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </CalendarProvider>

      {/* MODAL: Mover tareas a otro día (día sobrecargado) */}
      <Modal
        transparent
        visible={moveTasksModalVisible && !!moveTasksDate}
        animationType="slide"
        onRequestClose={() => setMoveTasksModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setMoveTasksModalVisible(false)}
          />
          <Pressable
            style={styles.modal}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <View style={styles.modalTitleContainer}>
                <Ionicons name="swap-vertical" size={24} color={accent} />
                <Text style={styles.modalTitle}>{t('calendar.overloadDialogTitle')}</Text>
              </View>
              <Pressable
                onPress={() => setMoveTasksModalVisible(false)}
                style={styles.modalClose}
              >
                <Ionicons name="close-circle" size={28} color="#6b7280" />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: '80%' }}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
                <Text style={{ fontSize: 15, color: '#4b5563', marginBottom: 12 }}>
                  {t('calendar.overloadDialogMessage')}
                </Text>
                {(activities[moveTasksDate] || []).map((act) => (
                  <Pressable
                    key={act.id}
                    onPress={() => toggleMoveTaskSelection(act.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 8,
                    }}
                  >
                    <Ionicons
                      name={moveTasksSelection[act.id] ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={moveTasksSelection[act.id] ? accent : '#9ca3af'}
                    />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={{ fontSize: 15, color: '#111827' }}>
                        {getDisplayTitle({ ...act, date: moveTasksDate })}
                      </Text>
                      {(() => {
                        const moveTimeText = (() => {
                          if (act.allDay) {
                            return (
                              t('calendar.allDayLabel') ||
                              t('habitForm.durationAllDay') ||
                              'Todo el día'
                            );
                          }
                          if (!act.time) return null;
                          const start = formatTimeFromHHmm(act.time, { language, timeFormat });
                          if (act.endTime && act.endTime !== act.time) {
                            const end = formatTimeFromHHmm(act.endTime, { language, timeFormat });
                            return `${start} - ${end}`;
                          }
                          return start;
                        })();

                        if (!moveTimeText) return null;

                        return (
                          <Text style={{ fontSize: 13, color: '#6b7280' }}>
                            {moveTimeText}
                          </Text>
                        );
                      })()}
                    </View>
                  </Pressable>
                ))}

                <Pressable
                  style={{
                    marginTop: 16,
                    paddingVertical: 12,
                    borderRadius: 9999,
                    backgroundColor: accent,
                    alignItems: 'center',
                  }}
                  onPress={confirmMoveSelectedTasks}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '600' }}>
                    {t('calendar.overloadDialogPrimary')}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </View>
      </Modal>

      {/* Busy Day modal permanently removed */}

      {/* MODAL: Planificación semanal guiada (domingo) */}
      <Modal
        transparent
        visible={weeklyPlannerVisible}
        animationType="slide"
        onRequestClose={() => setWeeklyPlannerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setWeeklyPlannerVisible(false)}
          />
          <Pressable
            style={styles.modal}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <View style={styles.modalTitleContainer}>
                <Ionicons name="sparkles" size={24} color={accent} />
                <Text style={styles.modalTitle}>
                  {t('calendar.weeklyPlannerModalTitle')}
                </Text>
              </View>
              <Pressable
                onPress={() => setWeeklyPlannerVisible(false)}
                style={styles.modalClose}
              >
                <Ionicons name="close-circle" size={28} color="#6b7280" />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: '80%' }}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: isDark ? '#e5e7eb' : '#111827' }}>
                  {t('calendar.weeklyPlannerPriorityLabel')}
                </Text>
                <TextInput
                  style={{
                    marginTop: 8,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: isDark ? '#1e293b' : '#e5e7eb',
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    minHeight: 80,
                    textAlignVertical: 'top',
                    backgroundColor: isDark ? '#020617' : '#f9fafb',
                    color: isDark ? '#e5e7eb' : '#111827',
                  }}
                  multiline
                  placeholder={t('calendar.weeklyPlannerPriorityLabel')}
                  placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                  value={weeklyPriorityText}
                  onChangeText={setWeeklyPriorityText}
                />

                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: '#111827',
                    marginTop: 20,
                    marginBottom: 8,
                  }}
                >
                  {t('calendar.weeklyPlannerHardHabitLabel')}
                </Text>

                {(habits || []).map((habit) => (
                  <Pressable
                    key={habit.id}
                    onPress={() => setWeeklyHardHabitId(habit.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 8,
                    }}
                  >
                    <Ionicons
                      name={
                        weeklyHardHabitId === habit.id
                          ? 'radio-button-on'
                          : 'radio-button-off'
                      }
                      size={22}
                      color={weeklyHardHabitId === habit.id ? accent : '#9ca3af'}
                    />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={{ fontSize: 15, color: isDark ? '#e5e7eb' : '#111827' }}>
                        {habit.title}
                      </Text>
                      {habit.description ? (
                        <Text
                          style={{ fontSize: 13, color: isDark ? '#9ca3af' : '#6b7280' }}
                          numberOfLines={2}
                        >
                          {habit.description}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                ))}

                <Pressable
                  style={{
                    marginTop: 20,
                    paddingVertical: 12,
                    borderRadius: 9999,
                    backgroundColor: accent,
                    alignItems: 'center',
                  }}
                  onPress={autoPlanWeek}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '600' }}>
                    {t('calendar.weeklyPlannerConfirm')}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </View>
      </Modal>

      {/* SAVINGS PROGRESS MODAL */}
      <Modal
        transparent
        visible={savingsModalVisible && !!savingsModalData}
        animationType="slide"
        onRequestClose={() => setSavingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSavingsModalVisible(false)}
          />
          <Pressable
            style={[styles.modal, isDark && { backgroundColor: '#020617' }]}
            onPress={(e) => e.stopPropagation()}
          >
            {savingsModalData && (
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
              >
                <View style={[styles.modalHeader, isDark && { borderBottomColor: '#0f172a' }]}>
                  <View style={[styles.modalHandle, isDark && { backgroundColor: '#0f172a' }]} />
                  <View style={styles.modalTitleContainer}>
                    <Ionicons name="wallet" size={24} color={accent} />
                    <Text style={[styles.modalTitle, isDark && { color: '#e5e7eb' }]}>
                      {savingsModalData.displayTitle || (language === 'es' ? 'Ahorro' : 'Savings')}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setSavingsModalVisible(false)}
                    style={styles.modalClose}
                  >
                    <Ionicons
                      name="close-circle"
                      size={28}
                      color={isDark ? '#9ca3af' : '#6b7280'}
                    />
                  </Pressable>
                </View>

                {(() => {
                  const act = savingsModalData.activity;
                  const currencySymbol = t('habitForm.marketPricePlaceholder') || '$';
                  const totals = act?.habit_id ? savingsByHabitId.get(act.habit_id) : null;
                  const target = Number.isFinite(totals?.target)
                    ? totals.target
                    : parseMoneyLike(act?.data?.savingsTargetAmount);
                  const saved = Number.isFinite(totals?.saved)
                    ? totals.saved
                    : (parseMoneyLike(act?.data?.savingsSavedAmount) || 0);
                  const hasGoal = Number.isFinite(target) && target > 0;
                  const progress = hasGoal ? Math.max(0, Math.min(1, saved / target)) : 0;
                  const motivation = hasGoal ? getSavingsMotivation(progress, t) : null;

                  return (
                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28 }}
                    >
                      {hasGoal ? (
                        <>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#e5e7eb' : '#111827' }}>
                            {language === 'es' ? 'Progreso' : 'Progress'}
                          </Text>
                          <Text style={{ marginTop: 6, fontSize: 13, color: isDark ? '#9ca3af' : '#6b7280' }}>
                            {`${Math.round(progress * 100)}% · ${currencySymbol}${saved.toFixed(2)} / ${currencySymbol}${target.toFixed(2)}`}
                          </Text>
                          <View
                            style={{
                              marginTop: 10,
                              height: 10,
                              borderRadius: 9999,
                              backgroundColor: isDark ? '#0b1120' : '#e5e7eb',
                              overflow: 'hidden',
                              borderWidth: 1,
                              borderColor: isDark ? '#1e293b' : '#d1d5db',
                            }}
                          >
                            <View
                              style={{
                                width: `${Math.round(progress * 100)}%`,
                                height: '100%',
                                backgroundColor: accent,
                              }}
                            />
                          </View>
                          {motivation ? (
                            <Text style={{ marginTop: 10, fontSize: 13, fontWeight: '600', color: isDark ? '#e5e7eb' : '#111827' }}>
                              {motivation}
                            </Text>
                          ) : null}
                        </>
                      ) : null}

                      <Text
                        style={{
                          marginTop: 16,
                          fontSize: 14,
                          fontWeight: '700',
                          color: isDark ? '#e5e7eb' : '#111827',
                        }}
                      >
                        {t('calendar.addSavings')}
                      </Text>
                      <TextInput
                        value={savingsAddAmountText}
                        onChangeText={setSavingsAddAmountText}
                        placeholder={t('calendar.addSavingsPlaceholder')}
                        placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                        keyboardType="numeric"
                        style={{
                          marginTop: 10,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: isDark ? '#1e293b' : '#e5e7eb',
                          paddingHorizontal: 12,
                          paddingVertical: 12,
                          backgroundColor: isDark ? '#0b1120' : '#f9fafb',
                          color: isDark ? '#e5e7eb' : '#111827',
                        }}
                      />

                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                        <Pressable
                          onPress={() => setSavingsModalVisible(false)}
                          style={{
                            flex: 1,
                            paddingVertical: 12,
                            borderRadius: 9999,
                            borderWidth: 1,
                            borderColor: isDark ? '#334155' : '#d1d5db',
                            alignItems: 'center',
                            backgroundColor: 'transparent',
                          }}
                        >
                          <Text style={{ fontWeight: '700', color: isDark ? '#e5e7eb' : '#111827' }}>
                            {t('cancel')}
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={() => {
                            const inc = parseMoneyLike(savingsAddAmountText);
                            if (!savingsModalData?.activity) return;
                            addSavingsAmount(savingsModalData.activity, inc);
                            setSavingsModalVisible(false);
                          }}
                          style={{
                            flex: 1,
                            paddingVertical: 12,
                            borderRadius: 9999,
                            borderWidth: 1,
                            borderColor: accent,
                            alignItems: 'center',
                            backgroundColor: 'transparent',
                          }}
                        >
                          <Text style={{ fontWeight: '800', color: accent }}>
                              {t('calendar.saveSavings')}
                          </Text>
                        </Pressable>
                      </View>

                      <Pressable
                        onPress={() => {
                          const act = savingsModalData?.activity;
                          if (!act?.habit_id || !act?.date) return;
                          Alert.alert(
                            t('calendar.endHabitTitle'),
                            t('calendar.endHabitMessage'),
                            [
                              {
                                text: t('cancel'),
                                style: 'cancel',
                              },
                              {
                                text: t('calendar.endHabitConfirm'),
                                style: 'destructive',
                                onPress: () => {
                                  finalizeSavingsHabit(act.habit_id, act.date);
                                  setSavingsModalVisible(false);
                                },
                              },
                            ]
                          );
                        }}
                        style={{
                          marginTop: 12,
                          paddingVertical: 12,
                          borderRadius: 9999,
                          borderWidth: 1,
                          borderColor: isDark ? '#334155' : '#d1d5db',
                          alignItems: 'center',
                          backgroundColor: 'transparent',
                        }}
                      >
                        <Text style={{ fontWeight: '800', color: isDark ? '#e5e7eb' : '#111827' }}>
                          {t('calendar.endHabitConfirm')}
                        </Text>
                      </Pressable>

                      <View style={{ height: 12 }} />
                    </ScrollView>
                  );
                })()}
              </KeyboardAvoidingView>
            )}
          </Pressable>
        </View>
      </Modal>

      {/* WATER ML MODAL */}
      <Modal
        transparent
        visible={waterModalVisible && !!waterModalData}
        animationType="slide"
        onRequestClose={() => setWaterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setWaterModalVisible(false)}
          />
          <Pressable
            style={[styles.modal, isDark && { backgroundColor: '#020617' }]}
            onPress={(e) => e.stopPropagation()}
          >
            {waterModalData && (
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
              >
                <View style={[styles.modalHeader, isDark && { borderBottomColor: '#0f172a' }]}>
                  <View style={[styles.modalHandle, isDark && { backgroundColor: '#0f172a' }]} />
                  <View style={styles.modalTitleContainer}>
                    <Ionicons name="water" size={24} color={accent} />
                    <Text style={[styles.modalTitle, isDark && { color: '#e5e7eb' }]}>
                      {waterModalData.displayTitle || (language === 'es' ? 'Beber agua' : 'Drink water')}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setWaterModalVisible(false)}
                    style={styles.modalClose}
                  >
                    <Ionicons
                      name="close-circle"
                      size={28}
                      color={isDark ? '#9ca3af' : '#6b7280'}
                    />
                  </Pressable>
                </View>

                {(() => {
                  const act = waterModalData.activity;
                  const targetRaw = parseMlLike(act?.data?.waterMlTarget);
                  const target = Number.isFinite(targetRaw) && targetRaw > 0 ? targetRaw : 2000;
                  const consumedRaw = parseMlLike(act?.data?.waterMlConsumed);
                  const consumed = Number.isFinite(consumedRaw) && consumedRaw > 0 ? consumedRaw : 0;
                  const progress = target > 0 ? Math.max(0, Math.min(1, consumed / target)) : 0;

                  return (
                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28 }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#e5e7eb' : '#111827' }}>
                        {t('calendar.progressLabel')}
                      </Text>
                      <Text style={{ marginTop: 6, fontSize: 13, color: isDark ? '#9ca3af' : '#6b7280' }}>
                        {`${Math.round(progress * 100)}% · ${consumed} / ${target} ml`}
                      </Text>
                      <View
                        style={{
                          marginTop: 10,
                          height: 10,
                          borderRadius: 9999,
                          backgroundColor: isDark ? '#0b1120' : '#e5e7eb',
                          overflow: 'hidden',
                          borderWidth: 1,
                          borderColor: isDark ? '#1e293b' : '#d1d5db',
                        }}
                      >
                        <View
                          style={{
                            width: `${Math.round(progress * 100)}%`,
                            height: '100%',
                            backgroundColor: accent,
                          }}
                        />
                      </View>

                      <Text
                        style={{
                          marginTop: 16,
                          fontSize: 14,
                          fontWeight: '700',
                          color: isDark ? '#e5e7eb' : '#111827',
                        }}
                      >
                        {t('calendar.addWater')}
                      </Text>
                      <TextInput
                        value={waterAddMlText}
                        onChangeText={setWaterAddMlText}
                        placeholder={t('calendar.addWaterPlaceholder')}
                        placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                        keyboardType="numeric"
                        style={{
                          marginTop: 10,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: isDark ? '#1e293b' : '#e5e7eb',
                          paddingHorizontal: 12,
                          paddingVertical: 12,
                          backgroundColor: isDark ? '#0b1120' : '#f9fafb',
                          color: isDark ? '#e5e7eb' : '#111827',
                        }}
                      />

                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                        <Pressable
                          onPress={() => setWaterModalVisible(false)}
                          style={{
                            flex: 1,
                            paddingVertical: 12,
                            borderRadius: 9999,
                            borderWidth: 1,
                            borderColor: isDark ? '#334155' : '#d1d5db',
                            alignItems: 'center',
                            backgroundColor: 'transparent',
                          }}
                        >
                          <Text style={{ fontWeight: '700', color: isDark ? '#e5e7eb' : '#111827' }}>
                            {t('cancel')}
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={() => {
                            const inc = parseMlLike(waterAddMlText);
                            if (!waterModalData?.activity) return;
                            addWaterMl(waterModalData.activity, inc);
                            setWaterModalVisible(false);
                          }}
                          style={{
                            flex: 1,
                            paddingVertical: 12,
                            borderRadius: 9999,
                            borderWidth: 1,
                            borderColor: accent,
                            alignItems: 'center',
                            backgroundColor: 'transparent',
                          }}
                        >
                          <Text style={{ fontWeight: '800', color: accent }}>
                            {t('calendar.saveWater')}
                          </Text>
                        </Pressable>
                      </View>

                      <View style={{ height: 12 }} />
                    </ScrollView>
                  );
                })()}
              </KeyboardAvoidingView>
            )}
          </Pressable>
        </View>
      </Modal>

      {/* MARKET LIST MODAL */}
      <Modal
        transparent
        visible={marketModalVisible && !!marketModalData}
        animationType="slide"
        onRequestClose={closeMarketModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeMarketModal}
          />
          <Pressable
            style={[styles.modal, isDark && { backgroundColor: '#020617' }]}
            onPress={(e) => e.stopPropagation()}
          >
            {marketModalData && (
              <>
                <View style={[styles.modalHeader, styles.marketModalHeaderCompact, isDark && { borderBottomColor: '#0f172a' }]}>
                  <View style={[styles.modalHandle, styles.marketModalHandleCompact, isDark && { backgroundColor: '#0f172a' }]} />
                  <View style={styles.modalTitleContainer}>
                    <Ionicons name="cart" size={24} color={accent} />
                    <Text style={[styles.modalTitle, isDark && { color: '#e5e7eb' }]}>
                      {marketModalData.marketLabel || t('calendar.marketDefaultTitle')}
                    </Text>
                  </View>
                  <View
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <Pressable
                      onPress={closeMarketModal}
                      style={[
                        styles.marketModalHeaderIconBtn,
                        isDark && styles.marketModalHeaderIconBtnDark,
                      ]}
                      hitSlop={8}
                    >
                      <Ionicons name="close-circle" size={28} color={isDark ? '#9ca3af' : '#6b7280'} />
                    </Pressable>
                  </View>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={{ maxHeight: '80%' }}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.marketModalContent}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#e5e7eb' : '#111827' }}>
                      {getDisplayTitle(marketModalData.activity)}
                    </Text>
                    <Text style={{ fontSize: 13, color: isDark ? '#9ca3af' : '#6b7280', marginTop: 4 }}>
                      {formatDate(marketModalData.activity.date, language)}
                    </Text>

                    <View
                      style={[
                        styles.checklistSection,
                        styles.marketModalChecklistSection,
                        isDark && { backgroundColor: '#0b1120', borderWidth: 1, borderColor: '#1e293b' },
                      ]}
                    >
                      <View
                        style={[
                          styles.checklistHeader,
                          styles.marketModalChecklistHeader,
                          isDark && { borderBottomColor: '#1e293b' },
                        ]}
                      >
                        <View style={styles.checklistIconBg}>
                          <Ionicons name="cart" size={16} color={accent} />
                        </View>
                        <Text style={[styles.checklistTitle, isDark && { color: '#e5e7eb' }]}>
                          {marketModalData.marketLabel ||
                            t('calendar.marketDefaultSectionTitle')}
                        </Text>
                        <View style={styles.checklistBadge}>
                          {(() => {
                            const allItems =
                              (activities[marketModalData.activity.date] || []).find(
                                (a) => a.id === marketModalData.activity.id
                              )?.data[marketModalData.marketKey] || [];
                            const checkedCount = allItems.filter((i) => i.checked)
                              .length;
                            return (
                              <Text style={styles.checklistBadgeText}>
                                {checkedCount}/{allItems.length}
                              </Text>
                            );
                          })()}
                        </View>
                      </View>

                      {(() => {
                        const allItems =
                          (activities[marketModalData.activity.date] || []).find(
                            (a) => a.id === marketModalData.activity.id
                          )?.data[marketModalData.marketKey] || [];

                        const currencySymbol = t('habitForm.marketPricePlaceholder') || '$';
                        const totalAmount = (allItems || []).reduce((sum, it) => {
                          const qty = parseFloat(String(it?.quantity ?? it?.qty ?? 0).replace(',', '.')) || 0;
                          const price = parseFloat(String(it?.price ?? 0).replace(',', '.')) || 0;
                          return sum + qty * price;
                        }, 0);

                        return (
                          <>
                            <MarketTable
                              items={allItems}
                              virtualized={false}
                              embedded
                              showSummary={false}
                              isDark={isDark}
                              accentColor={accent}
                              onToggle={(index) =>
                                toggleChecklistItem(
                                  marketModalData.activity,
                                  marketModalData.marketKey,
                                  index
                                )
                              }
                            />

                            <View style={[styles.marketModalTotalRow, isDark && styles.marketModalTotalRowDark]}>
                              <Text style={[styles.marketModalTotalLabel, isDark && styles.marketModalTotalLabelDark]}>
                                {t('calendar.total') || 'Total:'}
                              </Text>
                              <Text style={[styles.marketModalTotalValue, isDark && styles.marketModalTotalValueDark]}>
                                {currencySymbol}{totalAmount.toFixed(2)}
                              </Text>
                            </View>

                            <Pressable
                              onPress={closeMarketModal}
                              style={[
                                styles.marketModalAcceptBtn,
                                isDark && styles.marketModalAcceptBtnDark,
                                { borderColor: accent },
                              ]}
                            >
                              <Text style={[styles.marketModalAcceptTxt, { color: accent }]}
                              >
                                {t('calendar.accept') || 'Aceptar'}
                              </Text>
                            </Pressable>
                          </>
                        );
                      })()}
                    </View>
                  </View>
                  <View style={{ height: 12 }} />
                </ScrollView>
              </>
            )}
          </Pressable>
        </View>
      </Modal>

      {/* VITAMINS LIST MODAL */}
      <MarketAddModal
        visible={marketAddVisible}
        onClose={() => setMarketAddVisible(false)}
        onAdd={(item) => {
          if (marketAddContext && marketAddContext.activity) {
            const listKey = marketAddContext.listKey || 'market';
            addMarketItem(marketAddContext.activity, listKey, item);
          }
          setMarketAddVisible(false);
        }}
      />

      <VitaminsAddModal
        visible={vitaminsAddVisible}
        onClose={() => setVitaminsAddVisible(false)}
        onAdd={(item) => {
          if (vitaminsAddContext && vitaminsAddContext.activity) {
            const listKey = vitaminsAddContext.listKey || 'vitamins';
            addVitaminsItem(vitaminsAddContext.activity, listKey, item);
          }
          setVitaminsAddVisible(false);
        }}
      />

      <Modal
        transparent
        visible={vitaminsModalVisible && !!vitaminsModalData}
        animationType="slide"
        onRequestClose={() => setVitaminsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setVitaminsModalVisible(false)}
          />
          <Pressable
            style={[styles.modal, isDark && { backgroundColor: '#020617' }]}
            onPress={(e) => e.stopPropagation()}
          >
            {vitaminsModalData && (
              <>
                <View style={[styles.modalHeader, isDark && { borderBottomColor: '#0f172a' }]}>
                  <View style={[styles.modalHandle, isDark && { backgroundColor: '#0f172a' }]} />
                  <View style={styles.modalTitleContainer}>
                    <Ionicons name="medkit" size={24} color="#22c55e" />
                    <Text style={[styles.modalTitle, isDark && { color: '#e5e7eb' }]}>
                      {vitaminsModalData.vitaminsLabel ||
                        t('calendar.vitaminsDefaultTitle')}
                    </Text>
                  </View>
                  <View style={styles.modalHeaderActions}>
                    <Pressable
                      onPress={() => {
                        setVitaminsAddContext({
                          activity: vitaminsModalData.activity,
                          listKey: vitaminsModalData.vitaminsKey,
                        });
                        setVitaminsAddVisible(true);
                      }}
                      style={styles.modalIconBtn}
                    >
                      <Ionicons name="add-circle" size={28} color="#22c55e" />
                    </Pressable>

                    <Pressable
                      onPress={() => setVitaminsModalVisible(false)}
                      style={styles.modalIconBtn}
                    >
                      <Ionicons name="close-circle" size={28} color="#6b7280" />
                    </Pressable>
                  </View>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={{ maxHeight: '80%' }}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#e5e7eb' : '#111827' }}>
                      {getDisplayTitle(vitaminsModalData.activity)}
                    </Text>
                    <Text style={{ fontSize: 13, color: isDark ? '#9ca3af' : '#6b7280', marginTop: 4 }}>
                      {formatDate(vitaminsModalData.activity.date, language)}
                    </Text>

                    <View
                      style={[
                        styles.checklistSection,
                        isDark && { backgroundColor: '#0b1120', borderWidth: 1, borderColor: '#1e293b' },
                      ]}
                    >
                      <View style={styles.checklistHeader}>
                        <View style={styles.checklistIconBg}>
                          <Ionicons name="medkit" size={16} color="#22c55e" />
                        </View>
                        <Text style={[styles.checklistTitle, isDark && { color: '#e5e7eb' }]}>
                          {vitaminsModalData.vitaminsLabel ||
                            t('calendar.vitaminsDefaultSectionTitle')}
                        </Text>
                        <View style={styles.checklistBadge}>
                          {(() => {
                            const allItems =
                              (activities[vitaminsModalData.activity.date] || []).find(
                                (a) => a.id === vitaminsModalData.activity.id
                              )?.data[vitaminsModalData.vitaminsKey] || [];
                            const checkedCount = allItems.filter((i) => i.checked)
                              .length;
                            return (
                              <Text style={styles.checklistBadgeText}>
                                {checkedCount}/{allItems.length}
                              </Text>
                            );
                          })()}
                        </View>
                      </View>

                      {(() => {
                        const allItems =
                          (activities[vitaminsModalData.activity.date] || []).find(
                            (a) => a.id === vitaminsModalData.activity.id
                          )?.data[vitaminsModalData.vitaminsKey] || [];

                        return (
                          <VitaminsTable
                            items={allItems}
                            isDark={isDark}
                            onToggle={(index) =>
                              toggleChecklistItem(
                                vitaminsModalData.activity,
                                vitaminsModalData.vitaminsKey,
                                index
                              )
                            }
                          />
                        );
                      })()}
                    </View>
                  </View>
                  <View style={{ height: 24 }} />
                </ScrollView>
              </>
            )}
          </Pressable>
        </View>
      </Modal>

      {/* CHECKLIST (ESPACIOS) MODAL */}
      <Modal
        transparent
        visible={checklistModalVisible && !!checklistModalData}
        animationType="slide"
        onRequestClose={() => setChecklistModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setChecklistModalVisible(false)}
          />
          <View style={[styles.modal, isDark && { backgroundColor: '#020617' }, { height: '85%' }]}>
            {checklistModalData && (
              <>
                <View style={[styles.modalHeader, isDark && { borderBottomColor: '#1e293b' }]}>
                  <View style={styles.modalHandle} />
                  <View style={styles.modalTitleContainer}>
                    <Ionicons name="checkbox" size={24} color={accent} />
                    <Text style={[styles.modalTitle, isDark && { color: '#e5e7eb' }]}>
                      {checklistModalData.checklistLabel ||
                        t('calendar.checklistDefaultTitle')}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setChecklistModalVisible(false)}
                    style={styles.modalClose}
                  >
                    <Ionicons
                      name="close-circle"
                      size={28}
                      color={isDark ? '#9ca3af' : '#6b7280'}
                    />
                  </Pressable>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={{ flex: 1 }}
                  contentContainerStyle={{ paddingBottom: 24 }}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '700',
                        color: isDark ? '#e5e7eb' : '#111827',
                      }}
                    >
                      {getDisplayTitle(checklistModalData.activity)}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: isDark ? '#9ca3af' : '#6b7280',
                        marginTop: 4,
                      }}
                    >
                      {formatDate(checklistModalData.activity.date, language)}
                    </Text>

                    <View
                      style={[
                        styles.checklistSection,
                        isDark && {
                          backgroundColor: '#0b1220',
                          borderWidth: 1,
                          borderColor: '#1e293b',
                          shadowOpacity: 0,
                          elevation: 0,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.checklistHeader,
                          isDark && { borderBottomColor: '#1e293b' },
                        ]}
                      >
                        <View
                          style={[
                            styles.checklistIconBg,
                            isDark && { backgroundColor: '#0f172a' },
                          ]}
                        >
                          <Ionicons name="home" size={16} color={accent} />
                        </View>
                        <Text style={[styles.checklistTitle, isDark && { color: '#e5e7eb' }]}>
                          {checklistModalData.checklistLabel ||
                            t('calendar.checklistDefaultSectionTitle')}
                        </Text>
                        <View style={styles.checklistBadge}>
                          {(() => {
                            const allItems =
                              (activities[checklistModalData.activity.date] || []).find(
                                (a) => a.id === checklistModalData.activity.id
                              )?.data[checklistModalData.checklistKey] || [];

                            const normalized = allItems.map((item) => {
                              if (typeof item === 'string') {
                                return { label: item, checked: false };
                              }
                              return item;
                            });

                            const checkedCount = normalized.filter((i) => i.checked)
                              .length;
                            return (
                              <Text style={styles.checklistBadgeText}>
                                {checkedCount}/{normalized.length}
                              </Text>
                            );
                          })()}
                        </View>
                      </View>

                      {(() => {
                        const allItems =
                          (activities[checklistModalData.activity.date] || []).find(
                            (a) => a.id === checklistModalData.activity.id
                          )?.data[checklistModalData.checklistKey] || [];

                        const normalized = allItems.map((item) => {
                          if (typeof item === 'string') {
                            return { label: item, checked: false };
                          }
                          return item;
                        });

                        const SPACE_EMOJI = {
                          'Sala': '🛋️',
                          'Comedor': '🍽️',
                          'Cocina': '🍳',
                          'Habitaciones / Dormitorios': '🛏️',
                          'Baño': '🚿',
                          'Pasillo': '🚪',
                          'Entrada / Recibidor': '🔑',
                          'Patio': '🏞️',
                          'Jardín': '🌿',
                          'Balcón': '🌇',
                          'Terraza': '🌞',
                          'Garaje / Parqueadero': '🚗',
                          'Entrada exterior': '🏛️',
                          'Estudio / Oficina': '💻',
                          'Sala de TV': '📺',
                          'Sala de juegos': '🎮',
                          'Biblioteca': '📚',
                          'Gimnasio en casa': '🏋️',
                        };

                        const withSpaceEmoji = (label) => {
                          const clean = String(label ?? '').trim();
                          if (!clean) return '';
                          const emoji = SPACE_EMOJI[clean];
                          if (!emoji) return clean;
                          // Avoid double-emoji if already present in label
                          if (clean.startsWith(emoji)) return clean;
                          return `${emoji} ${clean}`;
                        };

                        const displayItems = normalized.map((it) => ({
                          ...it,
                          label: withSpaceEmoji(it?.label),
                        }));

                        return (
                          <ChecklistTable
                            items={displayItems}
                            columns={{ qty: false, extra: false }}
                            isDark={isDark}
                            onToggle={(index) =>
                              toggleChecklistItem(
                                checklistModalData.activity,
                                checklistModalData.checklistKey,
                                index
                              )
                            }
                          />
                        );
                      })()}
                    </View>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* FAB */}
      <Pressable
        style={[styles.fab, { backgroundColor: accent, shadowColor: accent }]}
        onPress={() => {
          setIsChangingHabit(false);
          setEditingActivity(null);
          setEditingSchedule(null);
          setShowHabitModal(true);
        }}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </Pressable>

      {/* HABIT LIST MODAL */}
      <Modal transparent visible={showHabitModal} animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowHabitModal(false)}
          />
          <View style={[styles.modal, isDark && { backgroundColor: '#020617' }]}>
              <View style={[styles.modalHeader, isDark && { borderBottomColor: '#1e293b' }]}>
              <View style={[styles.modalHandle, isDark && { backgroundColor: '#374151' }]} />
              <View style={styles.modalTitleContainer}>
                <Ionicons name="sparkles" size={24} color={accent} />
                <Text style={[styles.modalTitle, isDark && { color: '#e5e7eb' }]}> 
                  {t('calendar.selectHabitTitle')}
                </Text>
              </View>
              <Pressable onPress={() => setShowHabitModal(false)} style={styles.modalClose}>
                <Ionicons name="close-circle" size={28} color={isDark ? '#9ca3af' : '#6b7280'} />
              </Pressable>
            </View>
            {habitsLoading ? (
              <View style={styles.habitsLoadingContainer}>
                <ActivityIndicator size="large" color={accent} />
                <Text style={styles.habitsLoadingText}>
                  {t('calendar.loadingHabits')}
                </Text>
              </View>
            ) : (
              <FlatList
                ref={habitModalCategoryListRef}
                data={habitCategoriesData}
                keyExtractor={(it) => it.key}
                renderItem={({ item, index }) => (
                  <HabitCategoryRow
                    item={item}
                    index={index}
                    isExpanded={expandedHabitCategory === item.category}
                  />
                )}
                onScrollToIndexFailed={(info) => {
                  const offset = info.averageItemLength * info.index;
                  habitModalCategoryListRef.current?.scrollToOffset?.({ offset, animated: true });
                }}
                removeClippedSubviews
                initialNumToRender={6}
                windowSize={7}
                maxToRenderPerBatch={6}
                updateCellsBatchingPeriod={50}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* FORM MODAL */}
      <Modal transparent visible={showFormModal} animationType="slide">
        <HabitFormModal
          habit={selectedHabit}
          selectedDate={selectedDate}
          editingActivity={editingActivity}
          initialSchedule={editingSchedule}
          onSave={handleSaveHabit}
          onClose={() => {
            setShowFormModal(false);
            setEditingActivity(null);
            setEditingSchedule(null);
            setIsChangingHabit(false);
          }}
          onChangeHabit={() => {
            setIsChangingHabit(true);
            setShowFormModal(false);
            setTimeout(() => setShowHabitModal(true), 150);
          }}
        />
      </Modal>

      {/* CONGRATS MODAL */}
      <Modal
        transparent
        visible={congratsVisible}
        animationType="fade"
        onRequestClose={() => setCongratsVisible(false)}
      >
        <View style={styles.congratsOverlay}>
          <View style={styles.congratsCard}>
            <View style={styles.congratsIconCircle}>
              <Ionicons name="trophy" size={40} color={accent} />
            </View>
            <Text style={styles.congratsTitle}>{t('calendar.congratsTitle')}</Text>
            <Text style={styles.congratsSubtitle}>
              {congratsDate === getTodayLocal()
                ? t('calendar.congratsToday')
                : t('calendar.congratsOther')}
            </Text>
            <Pressable
              style={styles.congratsButton}
              onPress={() => setCongratsVisible(false)}
            >
              <Text style={styles.congratsButtonText}>
                {t('calendar.congratsButton')}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* =========================
   STYLES
========================= */

const calendarTheme = {
  calendarBackground: '#ffffff',
  selectedDayBackgroundColor: '#38BDF8',
  selectedDayTextColor: '#ffffff',
  todayTextColor: '#38BDF8',
  todayBackgroundColor: '#dbeafe',
  dayTextColor: '#1f2937',
  textDisabledColor: '#d1d5db',
  dotColor: '#38BDF8',
  selectedDotColor: '#ffffff',
  arrowColor: '#1f2937',
  monthTextColor: '#111827',
  indicatorColor: '#38BDF8',
  textDayFontWeight: '500',
  textMonthFontWeight: '700',
  textDayHeaderFontWeight: '600',
  textDayFontSize: 15,
  textMonthFontSize: 18,
  textDayHeaderFontSize: 13,
  'stylesheet.calendar.header': {
    monthText: {
      fontSize: 18,
      fontWeight: '700',
      color: '#111827',
      marginVertical: 10,
    },
    dayHeader: {
      marginTop: 2,
      marginBottom: 7,
      width: 32,
      textAlign: 'center',
      fontSize: 13,
      fontWeight: '600',
      color: '#6b7280',
    },
    week: {
      marginTop: 7,
      marginBottom: 7,
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
  },
  'stylesheet.day.basic': {
    base: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      fontSize: 15,
      fontWeight: '500',
      color: '#1f2937',
    },
    today: {
      backgroundColor: '#dbeafe',
      borderRadius: 16,
    },
    todayText: {
      color: '#38BDF8',
      fontWeight: '700',
    },
    selected: {
      backgroundColor: '#38BDF8',
      borderRadius: 16,
    },
    selectedText: {
      color: '#ffffff',
      fontWeight: '700',
    },
    disabledText: {
      color: '#d1d5db',
    },
  },
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  calendarWrapper: {
    position: 'relative',
    zIndex: 10,
  },
  calendarDragHintOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -12,
    alignItems: 'center',
  },
  calendarDragHintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.28)',
  },
  calendarDragHintText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },


  // Date Header
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  dateIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  dateTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  daySubtitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 3,
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  // Card
  card: {
    backgroundColor: '#0b1120',
    padding: 20,
    borderRadius: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: '#1e293b',
  },
  cardCompleted: {
    backgroundColor: '#14532d',
    borderColor: '#22c55e',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconContainer: {
    marginLeft: -6,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  cardIconPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  cardTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#fff',
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#cbd5e1',
  },
  cardSubtitleCompleted: {
    color: '#16a34a',
  },
  studyMetaRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  studyMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  studyMetaChipOnDark: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(255,255,255,0.18)',
  },
  studyMetaChipOnLight: {
    backgroundColor: 'rgba(17,24,39,0.06)',
    borderColor: 'rgba(17,24,39,0.12)',
  },
  studyMetaText: {
    fontSize: 12,
    fontWeight: '800',
  },
  birthdayCard: {
    borderColor: '#ffffff33',
    backgroundColor: '#0b1120',
  },
  specialBannerCard: {
    backgroundColor: '#0b1120',
    borderColor: '#1e293b',
  },
  birthdayBanner: {
    ...StyleSheet.absoluteFillObject,
  },
  birthdayBannerImage: {
    borderRadius: 18,
  },
  birthdayOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  birthdayCompletedOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    backgroundColor: 'rgba(20,83,45,0.28)',
  },
  specialBanner: {
    ...StyleSheet.absoluteFillObject,
  },
  specialBannerImage: {
    borderRadius: 18,
  },
  specialOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  specialCompletedOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    backgroundColor: 'rgba(20,83,45,0.28)',
  },
  savingsTopRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savingsInlineStats: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    color: '#e5e7eb',
    fontWeight: '800',
  },
  savingsProgressRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  savingsProgressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  savingsProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  savingsPercentText: {
    fontSize: 12,
    color: '#e5e7eb',
    fontWeight: '900',
    minWidth: 44,
    textAlign: 'right',
  },
  savingsMotivationText: {
    marginTop: 6,
    fontSize: 12,
    color: '#e5e7eb',
    fontWeight: '700',
  },
  waterTopRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  waterInlineStats: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    color: '#e5e7eb',
    fontWeight: '800',
  },
  waterProgressRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  waterProgressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  waterProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  waterPercentText: {
    fontSize: 12,
    color: '#e5e7eb',
    fontWeight: '900',
    minWidth: 44,
    textAlign: 'right',
  },
  waterMotivationText: {
    marginTop: 6,
    fontSize: 12,
    color: '#e5e7eb',
    fontWeight: '700',
  },
  cardTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  cardTimeText: {
    fontSize: 12,
    color: '#fed7aa',
    fontWeight: '600',
  },
  cardRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completeBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  cardBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 0.3,
  },

  // Description
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1.5,
    borderTopColor: '#1e293b',
    gap: 10,
  },
  cardDesc: {
    flex: 1,
    fontSize: 14,
    color: '#e5e7eb',
    lineHeight: 21,
    fontWeight: '500',
  },

  // Expand Button
  expandBtn: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1.5,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#e0f2fe',
    marginHorizontal: -20,
    marginBottom: -20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  expandBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  expandText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 0.2,
  },
  expandCount: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  expandCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Checklist
  checklistContainer: {
    marginTop: 16,
    gap: 12,
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  checklistSection: {
    gap: 12,
    backgroundColor: '#fffdf7',
    padding: 16,
    borderRadius: 22,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  checklistIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ffe4e6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checklistTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.3,
  },
  checklistBadge: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  checklistBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Swipe Actions
  swipeActionsLeft: {
    justifyContent: 'center',
    marginBottom: 12,
    alignItems: 'center',
    flexDirection: 'row',
  },
  swipeActionsRight: {
    justifyContent: 'center',
    marginBottom: 12,
    alignItems: 'center',
    flexDirection: 'row',
  },
  swipeDelete: {
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    marginLeft: 8,
    gap: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.75)',
  },
  swipeEdit: {
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    marginLeft: 8,
    gap: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.75)',
  },
  swipeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 12,
    textAlign: 'center',
    includeFontPadding: false,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#38BDF8',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#f3f4f6',
    position: 'relative',
  },
  marketModalHeaderCompact: {
    paddingBottom: 12,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#d1d5db',
    borderRadius: 3,
    marginBottom: 16,
  },
  marketModalHandleCompact: {
    marginBottom: 10,
  },
  marketModalContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  marketModalChecklistSection: {
    padding: 12,
    gap: 8,
    borderRadius: 18,
  },
  marketModalChecklistHeader: {
    paddingBottom: 8,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  modalClose: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  modalHeaderActions: {
    position: 'absolute',
    right: 16,
    top: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalIconBtn: {
    padding: 2,
  },
  marketModalHeaderIconBtn: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  marketModalHeaderIconBtnDark: {
    backgroundColor: 'rgba(15,23,42,0.85)',
  },
  marketModalTotalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  marketModalTotalRowDark: {
    borderTopColor: '#1e293b',
  },
  marketModalTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  marketModalTotalLabelDark: {
    color: '#e5e7eb',
  },
  marketModalTotalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },
  marketModalTotalValueDark: {
    color: '#ffffff',
  },
  marketModalAcceptBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  marketModalAcceptBtnDark: {
    backgroundColor: 'rgba(2,6,23,0.2)',
  },
  marketModalAcceptTxt: {
    fontWeight: '900',
    fontSize: 14,
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  primaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: '#38BDF8',
  },

  // Category Section
  categorySection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    flex: 1,
    paddingRight: 8,
  },
  categoryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ffe4e6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.2,
    textAlign: 'left',
  },
  categoryCount: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: 'center',
  },
  categoryCountText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  // Habits Grid
  habitsGrid: {
    gap: 12,
  },
  habitItem: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#f9fafb',
  },
  habitCardContent: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 10,
    alignItems: 'flex-start',
  },
  habitCardImage: {
    width: 64,
    height: 64,
    borderRadius: 999,
    overflow: 'hidden',
    resizeMode: 'cover',
    backgroundColor: 'transparent',
  },
  habitImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitTextContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  habitTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  habitDescription: {
    fontSize: 12,
    color: '#4b5563',
    lineHeight: 16,
  },

  // Congrats Modal
  congratsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  congratsCard: {
    width: '82%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  congratsIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  congratsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  congratsSubtitle: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 18,
  },
  congratsButton: {
    marginTop: 4,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  congratsButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});