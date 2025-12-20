import 'react-native-get-random-values';
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Alert,
  Modal,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CalendarProvider,
  ExpandableCalendar,
  LocaleConfig,
} from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { ActivityIndicator } from 'react-native';
import { loadHabitTemplates } from '../utils/habitCache';
import HabitFormModal from './HabitFormModal';
import ChecklistTable from './ChecklistTable';
import MarketTable from './MarketTable';
import VitaminsTable from './VitaminsTable';
import { v4 as uuidv4 } from 'uuid';
import { useSettings, getAccentColor } from '../utils/settingsContext';
import { useI18n } from '../utils/i18n';
import {
  loadActivities as loadUserActivities,
  saveActivities as saveUserActivities,
} from '../utils/localActivities';

// Función para obtener la fecha local correctamente
function getTodayLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const today = getTodayLocal();

/* =========================
   DATE HELPERS (GLOBAL)
========================= */

function parseLocalDate(dateString) {
  const [y, m, d] = dateString.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function timeStringToMinutes(timeStr) {
  if (!timeStr) return null;
  const [h, m] = String(timeStr).split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function hasTimeConflictForDate(existingActivities, candidate, editingActivityId) {
  const candidateStart = timeStringToMinutes(candidate.time);
  if (candidateStart == null) return false;

  const candidateDuration =
    typeof candidate.durationMinutes === 'number' && candidate.durationMinutes > 0
      ? candidate.durationMinutes
      : 0;
  const candidateEnd = candidateDuration > 0 ? candidateStart + candidateDuration : candidateStart;

  for (const act of existingActivities) {
    if (editingActivityId && act.id === editingActivityId) continue;
    const otherStart = timeStringToMinutes(act.time);
    if (otherStart == null) continue;

    const otherDuration =
      typeof act.durationMinutes === 'number' && act.durationMinutes > 0
        ? act.durationMinutes
        : 0;
    const otherEnd = otherDuration > 0 ? otherStart + otherDuration : otherStart;

    if (candidateDuration === 0 && otherDuration === 0) {
      if (candidateStart === otherStart) return true;
    } else {
      if (candidateStart < otherEnd && candidateEnd > otherStart) return true;
    }
  }

  return false;
}

function formatLocalDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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
  const locale = lang === 'en' ? 'en-US' : 'es-ES';
  return new Date(y, m - 1, d).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/* =========================
  CONFIGURACIÓN CALENDARIO (ES/EN)
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

LocaleConfig.defaultLocale = 'es';

/* =========================
   COMPONENTE
========================= */

export default function Calendar() {
  const { themeColor, language } = useSettings();
  const { t } = useI18n();
  const accent = getAccentColor(themeColor);
  const [selectedDate, setSelectedDate] = useState(today);
  const [activities, setActivities] = useState({});
  const [habits, setHabits] = useState([]);
  const [habitsLoading, setHabitsLoading] = useState(true);

  const [showHabitModal, setShowHabitModal] = useState(false);
  const [isChangingHabit, setIsChangingHabit] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [editingActivity, setEditingActivity] = useState(null);

  const [marketModalVisible, setMarketModalVisible] = useState(false);
  const [marketModalData, setMarketModalData] = useState(null);
  const [vitaminsModalVisible, setVitaminsModalVisible] = useState(false);
  const [vitaminsModalData, setVitaminsModalData] = useState(null);
  const [checklistModalVisible, setChecklistModalVisible] = useState(false);
  const [checklistModalData, setChecklistModalData] = useState(null);
  const [congratsVisible, setCongratsVisible] = useState(false);
  const [congratsDate, setCongratsDate] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const swipeableRefs = React.useRef({});

  /* =========================
     LOAD DATA
  ========================= */

  useEffect(() => {
    loadActivities();
    loadHabits();
  }, []);

  const localeKey = language === 'en' ? 'en' : 'es';
  LocaleConfig.defaultLocale = localeKey;

  // Asegurar que la etiqueta "Hoy/Today" del calendario
  // también respete el idioma actual
  if (localeKey === 'es') {
    LocaleConfig.locales.es.today = t('calendar.todayButton');
  } else {
    LocaleConfig.locales.en.today = t('calendar.todayButton');
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
      await saveUserActivities(data);
      // IMPORTANTE: Actualizar el estado DESPUÉS de guardar
      setActivities({ ...data }); // Crear nuevo objeto para forzar re-render
      console.log('💾 Estado actualizado (por usuario):', Object.keys(data).length, 'fechas');
    } catch (error) {
      console.error('Error saving activities:', error);
    }
  }

  async function loadHabits() {
    try {
      setHabitsLoading(true);
      const data = await loadHabitTemplates();
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
    // Si venimos desde una edición, actualizamos SOLO esa actividad
    if (editingActivity && payload.editingActivityId === editingActivity.id) {
      const updated = { ...activities };
      const { habit, description, data, schedule } = payload;

      // Si es una actividad única, solo editamos esta instancia
      if (!schedule || schedule.frequency === 'once') {
        const dateKey = editingActivity.date;

        if (updated[dateKey]) {
          if (schedule?.time) {
            const hasConflict = hasTimeConflictForDate(
              updated[dateKey],
              {
                time: schedule.time,
                durationMinutes: schedule.durationMinutes,
              },
              editingActivity.id
            );

            if (hasConflict) {
              Alert.alert(
                t('calendar.timeConflictTitle'),
                t('calendar.timeConflictMessage')
              );
              return;
            }
          }

          updated[dateKey] = updated[dateKey].map((act) => {
            if (act.id !== editingActivity.id) return act;
            return {
              ...act,
              habit_id: habit.id,
              title: habit.title,
              icon: habit.icon,
              description: description || null,
              time: schedule?.time ?? act.time ?? null,
              durationMinutes:
                typeof schedule?.durationMinutes === 'number'
                  ? schedule.durationMinutes
                  : act.durationMinutes ?? null,
              endTime: schedule?.endTime ?? act.endTime ?? null,
              data: data || {},
            };
          });

          saveActivities(updated);
        }

        setEditingActivity(null);
        setShowFormModal(false);
        return;
      }

      // Si tiene una frecuencia (diaria, semanal, etc.),
      // actualizamos TODA la serie de ese hábito
      const oldHabitId = editingActivity.habit_id;

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

      if (schedule.time) {
        const candidate = {
          time: schedule.time,
          durationMinutes: schedule.durationMinutes,
        };

        const hasConflictSomeDay = datesToCreate.some((date) =>
          hasTimeConflictForDate(updated[date] || [], candidate, null)
        );

        if (hasConflictSomeDay) {
          Alert.alert(
            t('calendar.timeConflictTitle'),
            t('calendar.timeConflictMessage')
          );
          return;
        }
      }

      datesToCreate.forEach((date) => {
        if (!updated[date]) updated[date] = [];

        updated[date].push({
          id: uuidv4(),
          habit_id: habit.id,
          title: habit.title,
          icon: habit.icon,
          description: description || null,
          time: schedule.time || null,
          durationMinutes:
            typeof schedule.durationMinutes === 'number'
              ? schedule.durationMinutes
              : null,
          endTime: schedule.endTime || null,
          data: data || {},
          date,
          completed: false,
        });
      });

      saveActivities(updated);
      setEditingActivity(null);
      setShowFormModal(false);
      return;
    }

    const updated = { ...activities };
    const { schedule, habit, description, data, allowDuplicate } = payload;

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

    if (schedule.time) {
      const candidate = {
        time: schedule.time,
        durationMinutes: schedule.durationMinutes,
      };

      const hasConflictSomeDay = datesToCreate.some((date) =>
        hasTimeConflictForDate(updated[date] || [], candidate, null)
      );

      if (hasConflictSomeDay) {
        Alert.alert(
          t('calendar.timeConflictTitle'),
          t('calendar.timeConflictMessage')
        );
        return;
      }
    }

    // Evitar duplicar el mismo evento en el mismo día, salvo confirmación
    if (!allowDuplicate) {
      const hasDuplicateSameDay = datesToCreate.some((date) => {
        const dayActs = updated[date] || [];
        return dayActs.some((act) => act.habit_id === habit.id);
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

      updated[date].push({
        id: uuidv4(),
        habit_id: habit.id,
        title: habit.title,
        icon: habit.icon,
        description: description || null,
        time: schedule.time || null,
        durationMinutes:
          typeof schedule.durationMinutes === 'number'
            ? schedule.durationMinutes
            : null,
        endTime: schedule.endTime || null,
        data: data || {},
        date,
        completed: false,
      });
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

    // Itera sobre todas las fechas
    Object.keys(updated).forEach((date) => {
      // Solo elimina en fechas posteriores a la seleccionada (no el mismo día)
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
          time: activity.time || null,
          durationMinutes: activity.durationMinutes || null,
          endTime: activity.endTime || null,
        }
      : {
          startDate: parseLocalDate(activity.date),
          endDate: null,
          frequency: 'once',
          daysOfWeek: [],
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
    return habits.find((h) => h.id === activity.habit_id);
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

  /* =========================
     UI
  ========================= */

  const markedDates = Object.keys(activities).reduce((acc, d) => {
    const dayActs = activities[d] || [];
    const total = dayActs.length;
    const completed = dayActs.filter((a) => a.completed).length;
    const allCompleted = total > 0 && completed === total;

    if (total > 0) {
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
        acc[d] = {
          marked: true,
          dotColor: accent,
        };
      }
    }

    return acc;
  }, {});

  const selectedDayActs = activities[selectedDate] || [];
  const selectedTotal = selectedDayActs.length;
  const selectedCompleted = selectedDayActs.filter((a) => a.completed).length;
  const selectedAllCompleted = selectedTotal > 0 && selectedCompleted === selectedTotal;

  markedDates[selectedDate] = {
    ...(markedDates[selectedDate] || {}),
    customStyles: selectedAllCompleted
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

  return (
    <SafeAreaView style={styles.safe}>
      <CalendarProvider
        date={selectedDate}
        onDateChanged={setSelectedDate}
        showTodayButton
        todayButtonText={t('calendar.todayButton')}
      >
        <ExpandableCalendar
          key={language}
          firstDay={1}
          markedDates={markedDates}
          markingType="custom"
          theme={{
            ...calendarTheme,
            selectedDayBackgroundColor: accent,
            todayTextColor: accent,
            dotColor: accent,
            indicatorColor: accent,
            selectedDotColor: '#ffffff',
          }}
        />

        <View style={styles.content}>
            {activities[selectedDate]?.length ? (
              [...(activities[selectedDate] || [])]
                .sort((a, b) => {
                  const aMin = timeStringToMinutes(a.time) ?? Number.POSITIVE_INFINITY;
                  const bMin = timeStringToMinutes(b.time) ?? Number.POSITIVE_INFINITY;
                  return aMin - bMin;
                })
                .map((activity) => {
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

                const timeRangeText = (() => {
                  if (!activityWithDate.time) return null;
                  if (activityWithDate.endTime && activityWithDate.endTime !== activityWithDate.time) {
                    return `${activityWithDate.time} - ${activityWithDate.endTime}`;
                  }
                  return activityWithDate.time;
                })();

                let friendlySubtitle = null;
                const rawTextValue = textKey
                  ? activityWithDate.data?.[textKey]
                  : null;

                if (rawTextValue) {
                  const titleLower = (activityWithDate.title || '').toLowerCase();
                  const answer = String(rawTextValue).trim();

                  if (titleLower.includes('estudiar')) {
                    friendlySubtitle = `Hoy debes estudiar: ${answer}`;
                  } else if (titleLower.includes('leer') && titleLower.includes('libro')) {
                    friendlySubtitle = `Hoy leerás ${answer}`;
                  } else if (
                    titleLower.includes('llamar') &&
                    (titleLower.includes('amigo') || titleLower.includes('amig'))
                  ) {
                    friendlySubtitle = `Recuerda: llamarás a ${answer}`;
                  } else if (titleLower.includes('cumple')) {
                    friendlySubtitle = `Hoy es el cumpleaños de: ${answer}`;
                  } else if (titleLower.includes('cuidar') && titleLower.includes('piel')) {
                    friendlySubtitle = `Hoy cuidarás tu piel con: ${answer}`;
                  } else if (titleLower.includes('beber') && titleLower.includes('agua')) {
                    friendlySubtitle = `Hoy tu objetivo de agua es: ${answer}`;
                  } else if (textLabel) {
                    friendlySubtitle = `${textLabel} ${answer}`.trim();
                  } else {
                    friendlySubtitle = answer;
                  }
                }

                const isCompleted = !!activityWithDate.completed;

                return (
                  <Swipeable
                    key={activity.id}
                    ref={(ref) => {
                      if (ref) swipeableRefs.current[activity.id] = ref;
                    }}
                    renderLeftActions={() => (
                      <Pressable
                        style={styles.swipeActionsLeft}
                        onPress={() => confirmDelete(activityWithDate)}
                      >
                        <View style={styles.swipeDelete}>
                          <Ionicons name="trash-outline" size={24} color="#fff" />
                          <Text style={styles.swipeText}>Eliminar</Text>
                        </View>
                      </Pressable>
                    )}
                    renderRightActions={() => (
                      <Pressable
                        style={styles.swipeActionsRight}
                        onPress={() => editActivity(activityWithDate)}
                      >
                        <View style={styles.swipeEdit}>
                          <Ionicons name="create-outline" size={24} color="#fff" />
                          <Text style={styles.swipeText}>{t('calendar.edit')}</Text>
                        </View>
                      </Pressable>
                    )}
                    overshootLeft={false}
                    overshootRight={false}
                  >
                    <Pressable
                      style={[styles.card, isCompleted && styles.cardCompleted]}
                      onPress={() => {
                        if (hasMarket) {
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
                      {/* HEADER */}
                      <View style={styles.cardHeader}>
                        <View style={styles.cardIconContainer}>
                          {activity.icon ? (
                            <Image
                              source={{ uri: activity.icon }}
                              style={styles.cardIcon}
                            />
                          ) : (
                            <View style={styles.cardIconPlaceholder}>
                              <Ionicons name="sparkles" size={20} color={accent} />
                            </View>
                          )}
                        </View>
                        <View style={styles.cardHeaderText}>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.cardTitle,
                                isCompleted && styles.cardTitleCompleted,
                              ]}
                            >
                              {activity.title}
                            </Text>
                            {timeRangeText && (
                              <View style={styles.cardTimeRow}>
                                <Ionicons
                                  name="time-outline"
                                  size={14}
                                  color="#f97316"
                                />
                                <Text
                                  style={[
                                    styles.cardTimeText,
                                    isCompleted && styles.cardSubtitleCompleted,
                                  ]}
                                >
                                  {timeRangeText}
                                </Text>
                              </View>
                            )}
                            {friendlySubtitle && (
                              <Text
                                style={[
                                  styles.cardSubtitle,
                                  isCompleted && styles.cardSubtitleCompleted,
                                ]}
                              >
                                {friendlySubtitle}
                              </Text>
                            )}
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
                                color={isCompleted ? '#22c55e' : '#9ca3af'}
                              />
                            </Pressable>
                          {hasMarket && (
                            <View style={styles.cardBadge}>
                              <Ionicons name="list" size={12} color={accent} />
                              <Text style={styles.cardBadgeText}>Lista</Text>
                            </View>
                          )}
                          </View>
                        </View>
                      </View>

                      {/* DESCRIPTION */}
                      {activity.description && (
                        <View style={styles.descriptionContainer}>
                          <Ionicons name="document-text-outline" size={16} color="#9ca3af" />
                          <Text style={styles.cardDesc}>{activity.description}</Text>
                        </View>
                      )}

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
            <View style={{ height: 100 }} />
        </View>
      </CalendarProvider>

      {/* MARKET LIST MODAL */}
      <Modal
        transparent
        visible={marketModalVisible && !!marketModalData}
        animationType="slide"
        onRequestClose={() => setMarketModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setMarketModalVisible(false)}
          />
          <Pressable
            style={styles.modal}
            onPress={(e) => e.stopPropagation()}
          >
            {marketModalData && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHandle} />
                  <View style={styles.modalTitleContainer}>
                    <Ionicons name="cart" size={24} color={accent} />
                    <Text style={styles.modalTitle}>
                      {marketModalData.marketLabel || t('calendar.marketDefaultTitle')}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setMarketModalVisible(false)}
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
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>
                      {marketModalData.activity.title}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                      {formatDate(marketModalData.activity.date, language)}
                    </Text>

                    <View style={styles.checklistSection}>
                      <View style={styles.checklistHeader}>
                        <View style={styles.checklistIconBg}>
                          <Ionicons name="cart" size={16} color={accent} />
                        </View>
                        <Text style={styles.checklistTitle}>
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

                        return (
                          <MarketTable
                            items={allItems}
                            onToggle={(index) =>
                              toggleChecklistItem(
                                marketModalData.activity,
                                marketModalData.marketKey,
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

      {/* VITAMINS LIST MODAL */}
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
            style={styles.modal}
            onPress={(e) => e.stopPropagation()}
          >
            {vitaminsModalData && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHandle} />
                  <View style={styles.modalTitleContainer}>
                    <Ionicons name="medkit" size={24} color="#22c55e" />
                    <Text style={styles.modalTitle}>
                      {vitaminsModalData.vitaminsLabel ||
                        t('calendar.vitaminsDefaultTitle')}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setVitaminsModalVisible(false)}
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
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>
                      {vitaminsModalData.activity.title}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                      {formatDate(vitaminsModalData.activity.date, language)}
                    </Text>

                    <View style={styles.checklistSection}>
                      <View style={styles.checklistHeader}>
                        <View style={styles.checklistIconBg}>
                          <Ionicons name="medkit" size={16} color="#22c55e" />
                        </View>
                        <Text style={styles.checklistTitle}>
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
          <Pressable
            style={styles.modal}
            onPress={(e) => e.stopPropagation()}
          >
            {checklistModalData && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHandle} />
                  <View style={styles.modalTitleContainer}>
                    <Ionicons name="checkbox" size={24} color={accent} />
                    <Text style={styles.modalTitle}>
                      {checklistModalData.checklistLabel ||
                        t('calendar.checklistDefaultTitle')}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setChecklistModalVisible(false)}
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
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>
                      {checklistModalData.activity.title}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                      {formatDate(checklistModalData.activity.date, language)}
                    </Text>

                    <View style={styles.checklistSection}>
                      <View style={styles.checklistHeader}>
                        <View style={styles.checklistIconBg}>
                          <Ionicons name="home" size={16} color={accent} />
                        </View>
                        <Text style={styles.checklistTitle}>
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

                        return (
                          <ChecklistTable
                            items={normalized}
                            columns={{ qty: false, extra: false }}
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
                  <View style={{ height: 24 }} />
                </ScrollView>
              </>
            )}
          </Pressable>
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
          <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <View style={styles.modalTitleContainer}>
                <Ionicons name="sparkles" size={24} color={accent} />
                <Text style={styles.modalTitle}>
                  {t('calendar.selectHabitTitle')}
                </Text>
              </View>
              <Pressable onPress={() => setShowHabitModal(false)} style={styles.modalClose}>
                <Ionicons name="close-circle" size={28} color="#6b7280" />
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
              <ScrollView
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                {/* Agrupar hábitos por categoría */}
                {Object.entries(
                  habits.reduce((acc, habit) => {
                    const rawCategory = habit.category || 'Sin categoría';
                    if (!acc[rawCategory]) acc[rawCategory] = [];
                    acc[rawCategory].push(habit);
                    return acc;
                  }, {})
                ).map(([category, categoryHabits]) => {
                  const displayCategory = language === 'en'
                    ? category === 'Cuida de ti'
                      ? 'Self-care'
                      : category === 'Actividad física'
                      ? 'Physical activity'
                      : category === 'Vive más sano'
                      ? 'Live healthier'
                      : category === 'Aprende'
                      ? 'Learn'
                      : category === 'Vida social'
                      ? 'Social life'
                      : category === 'Hogar'
                      ? 'Home'
                      : category === 'Vida económica'
                      ? 'Finances'
                      : category === 'Salud'
                      ? 'Health'
                      : category === 'Social'
                      ? 'Social'
                      : category === 'Productividad'
                      ? 'Productivity'
                      : category === 'Sin categoría'
                      ? 'Uncategorized'
                      : category
                    : category;

                  return (
                  <View key={category} style={styles.categorySection}>
                    <View style={styles.categoryHeader}>
                      <View style={styles.categoryIconContainer}>
                        <Ionicons
                          name={
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
                          }
                          size={20}
                          color={accent}
                        />
                      </View>
                      <Text style={styles.categoryTitle}>{displayCategory}</Text>
                      <View style={styles.categoryCount}>
                        <Text style={styles.categoryCountText}>{categoryHabits.length}</Text>
                      </View>
                    </View>

                    <View style={styles.habitsGrid}>
                      {categoryHabits.map((habit) => (
                        <Pressable
                          key={habit.id}
                          style={styles.habitItem}
                          onPress={() => {
                            setSelectedHabit(habit);
                            if (!isChangingHabit) {
                              setEditingActivity(null);
                              setEditingSchedule(null);
                            }
                            setShowHabitModal(false);
                            setTimeout(() => setShowFormModal(true), 150);
                            setIsChangingHabit(false);
                          }}
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
                                <Ionicons name="sparkles" size={24} color="#38BDF8" />
                              </View>
                            )}
                            <View style={styles.habitTextContainer}>
                              <Text style={styles.habitTitle} numberOfLines={2}>
                                {habit.title}
                              </Text>
                              {habit.description ? (
                                <Text
                                  style={styles.habitDescription}
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
                  </View>
                  );
                })}
                <View style={{ height: 20 }} />
              </ScrollView>
            )}
          </Pressable>
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
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    textTransform: 'capitalize',
    letterSpacing: -0.5,
  },
  activityCount: {
    fontSize: 14,
    color: '#6b7280',
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
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  cardCompleted: {
    backgroundColor: '#dcfce7',
    borderColor: '#bbf7d0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconContainer: {
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  cardIconPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ffe4e6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    letterSpacing: -0.3,
  },
  cardTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#166534',
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#6b7280',
  },
  cardSubtitleCompleted: {
    color: '#16a34a',
  },
  cardTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  cardTimeText: {
    fontSize: 12,
    color: '#f97316',
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
    backgroundColor: '#ffe4e6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: '#fecdd3',
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
    borderTopColor: '#e5e7eb',
    gap: 10,
  },
  cardDesc: {
    flex: 1,
    fontSize: 14,
    color: '#4b5563',
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
  },
  swipeActionsRight: {
    justifyContent: 'center',
    marginBottom: 12,
  },
  swipeDelete: {
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    gap: 4,
  },
  swipeEdit: {
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    gap: 4,
  },
  swipeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#d1d5db',
    borderRadius: 3,
    marginBottom: 16,
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

  // Category Section
  categorySection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
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
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.2,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  habitItem: {
    width: '47%',
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
    width: 52,
    height: 52,
    borderRadius: 14,
    resizeMode: 'cover',
    backgroundColor: '#fee2e2',
  },
  habitImagePlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitTextContainer: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  habitDescription: {
    fontSize: 11,
    color: '#6b7280',
    lineHeight: 14,
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