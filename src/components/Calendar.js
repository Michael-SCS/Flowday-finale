import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CalendarProvider,
  ExpandableCalendar,
} from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { supabase } from '../utils/supabase';
import HabitFormModal from './HabitFormModal';
import ChecklistTable from './ChecklistTable';
import MarketTable from './MarketTable';
import VitaminsTable from './VitaminsTable';
import { v4 as uuidv4 } from 'uuid';

/* =========================
   CONSTANTES
========================= */

const STORAGE_KEY = 'FLOWDAY_ACTIVITIES';

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


function formatDate(dateString) {
  const [y, m, d] = dateString.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/* =========================
   COMPONENTE
========================= */

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState(today);
  const [activities, setActivities] = useState({});
  const [habits, setHabits] = useState([]);

  const [showHabitModal, setShowHabitModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [editingActivity, setEditingActivity] = useState(null);

  const [marketModalVisible, setMarketModalVisible] = useState(false);
  const [marketModalData, setMarketModalData] = useState(null);
  const [vitaminsModalVisible, setVitaminsModalVisible] = useState(false);
  const [vitaminsModalData, setVitaminsModalData] = useState(null);
  const [checklistModalVisible, setChecklistModalVisible] = useState(false);
  const [checklistModalData, setChecklistModalData] = useState(null);
  const swipeableRefs = React.useRef({});

  /* =========================
     LOAD DATA
  ========================= */

  useEffect(() => {
    loadActivities();
    loadHabits();
  }, []);

  async function loadActivities() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setActivities(parsed);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  }

  async function saveActivities(data) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      // IMPORTANTE: Actualizar el estado DESPUÉS de guardar
      setActivities({ ...data }); // Crear nuevo objeto para forzar re-render
      console.log('💾 Estado actualizado:', Object.keys(data).length, 'fechas');
    } catch (error) {
      console.error('Error saving activities:', error);
    }
  }

  async function loadHabits() {
    try {
      const { data, error } = await supabase
        .from('habit_templates')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      if (data) setHabits(data);
    } catch (error) {
      console.error('Error loading habits:', error);
    }
  }

  /* =========================
     SAVE HABIT
  ========================= */

  function handleSaveHabit(payload) {
    // Si venimos desde una edición, actualizamos SOLO esa actividad
    if (editingActivity && payload.editingActivityId === editingActivity.id) {
      const updated = { ...activities };
      const { habit, description, data } = payload;
      const dateKey = editingActivity.date;

      if (updated[dateKey]) {
        updated[dateKey] = updated[dateKey].map((act) => {
          if (act.id !== editingActivity.id) return act;
          return {
            ...act,
            habit_id: habit.id,
            title: habit.title,
            icon: habit.icon,
            description: description || null,
            data: data || {},
          };
        });

        saveActivities(updated);
      }

      setEditingActivity(null);
      setShowFormModal(false);
      return;
    }

    const updated = { ...activities };
    const { schedule, habit, description, data } = payload;

    let datesToCreate = [];

    if (schedule.frequency === 'once') {
      datesToCreate = [schedule.startDate];
    }

    if (schedule.frequency === 'daily') {
      const start = parseLocalDate(schedule.startDate);
      const end = schedule.endDate
        ? new Date(schedule.endDate)
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
        ? new Date(schedule.endDate)
        : new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());

      let d = new Date(start);
      while (d <= end) {
        datesToCreate.push(formatLocalDate(d));
        d.setMonth(d.getMonth() + 1);
      }
    }

    if (schedule.frequency === 'yearly') {
      const start = parseLocalDate(schedule.startDate);;
      const end = schedule.endDate
        ? new Date(schedule.endDate)
        : new Date(start.getFullYear() + 5, start.getMonth(), start.getDate());

      let d = new Date(start);
      while (d <= end) {
        datesToCreate.push(formatLocalDate(d));
        d.setFullYear(d.getFullYear() + 1);
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
    const updated = { ...activities };

    if (!updated[activity.date]) return;

    updated[activity.date] = updated[activity.date].map((act) => {
      if (act.id !== activity.id) return act;
      return {
        ...act,
        completed: !act.completed,
      };
    });

    saveActivities(updated);
  }

  /* =========================
     DELETE / EDIT
  ========================= */

  function confirmDelete(activity) {
    Alert.alert(
      'Eliminar actividad',
      '¿Qué deseas hacer?',
      [
        {
          text: 'Eliminar solo esta',
          onPress: () => deleteOne(activity),
        },
        {
          text: 'Eliminar esta y las siguientes',
          onPress: () => deleteFromHere(activity),
        },
        { text: 'Cancelar', style: 'cancel' },
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
      // Solo elimina en fechas >= a la fecha seleccionada
      if (date >= activity.date) {
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
    const habitTemplate = habits.find(h => h.id === activity.habit_id);

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

  return (
    <SafeAreaView style={styles.safe}>
      <CalendarProvider
        date={selectedDate}
        onDateChanged={setSelectedDate}
        showTodayButton
      >
        <ExpandableCalendar
          firstDay={1}
          markedDates={{
            ...Object.keys(activities).reduce((acc, d) => {
              acc[d] = { marked: true, dotColor: '#fb7185' };
              return acc;
            }, {}),
            [selectedDate]: {
              selected: true,
              selectedColor: '#fb7185',
              marked: activities[selectedDate]?.length > 0,
            },
          }}
          theme={calendarTheme}
        />

        <View style={styles.content}>
          <View style={styles.dateHeader}>
            <View style={styles.dateIconContainer}>
              <Ionicons name="calendar" size={26} color="#fff" />
            </View>
            <View style={styles.dateTextContainer}>
              <Text style={styles.dayTitle}>{formatDate(selectedDate)}</Text>
              <Text style={styles.activityCount}>
                {activities[selectedDate]?.length || 0}{' '}
                {activities[selectedDate]?.length === 1 ? 'actividad' : 'actividades'}
              </Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {activities[selectedDate]?.length ? (
              activities[selectedDate].map((activity) => {
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
                          <Text style={styles.swipeText}>Editar</Text>
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
                              <Ionicons name="sparkles" size={20} color="#fb7185" />
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
                              <Ionicons name="list" size={12} color="#fb7185" />
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
                <Text style={styles.emptyTitle}>No hay actividades</Text>
                <Text style={styles.emptySubtitle}>
                  Presiona el botón + para agregar una nueva actividad
                </Text>
              </View>
            )}
            <View style={{ height: 100 }} />
          </ScrollView>
        </View>
      </CalendarProvider>

      {/* MARKET LIST MODAL */}
      <Modal
        transparent
        visible={marketModalVisible && !!marketModalData}
        animationType="slide"
        onRequestClose={() => setMarketModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMarketModalVisible(false)}
        >
          <Pressable
            style={styles.modal}
            onPress={(e) => e.stopPropagation()}
          >
            {marketModalData && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHandle} />
                  <View style={styles.modalTitleContainer}>
                    <Ionicons name="cart" size={24} color="#fb7185" />
                    <Text style={styles.modalTitle}>
                      {marketModalData.marketLabel || 'Lista de mercado'}
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
                >
                  <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>
                      {marketModalData.activity.title}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                      {formatDate(marketModalData.activity.date)}
                    </Text>

                    <View style={styles.checklistSection}>
                      <View style={styles.checklistHeader}>
                        <View style={styles.checklistIconBg}>
                          <Ionicons name="cart" size={16} color="#fb7185" />
                        </View>
                        <Text style={styles.checklistTitle}>
                          {marketModalData.marketLabel || 'Lista de compras'}
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
        </Pressable>
      </Modal>

      {/* VITAMINS LIST MODAL */}
      <Modal
        transparent
        visible={vitaminsModalVisible && !!vitaminsModalData}
        animationType="slide"
        onRequestClose={() => setVitaminsModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setVitaminsModalVisible(false)}
        >
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
                      {vitaminsModalData.vitaminsLabel || 'Vitaminas a tomar'}
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
                >
                  <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>
                      {vitaminsModalData.activity.title}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                      {formatDate(vitaminsModalData.activity.date)}
                    </Text>

                    <View style={styles.checklistSection}>
                      <View style={styles.checklistHeader}>
                        <View style={styles.checklistIconBg}>
                          <Ionicons name="medkit" size={16} color="#22c55e" />
                        </View>
                        <Text style={styles.checklistTitle}>
                          {vitaminsModalData.vitaminsLabel || 'Vitaminas'}
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
        </Pressable>
      </Modal>

      {/* CHECKLIST (ESPACIOS) MODAL */}
      <Modal
        transparent
        visible={checklistModalVisible && !!checklistModalData}
        animationType="slide"
        onRequestClose={() => setChecklistModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setChecklistModalVisible(false)}
        >
          <Pressable
            style={styles.modal}
            onPress={(e) => e.stopPropagation()}
          >
            {checklistModalData && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHandle} />
                  <View style={styles.modalTitleContainer}>
                    <Ionicons name="checkbox" size={24} color="#fb7185" />
                    <Text style={styles.modalTitle}>
                      {checklistModalData.checklistLabel || 'Checklist'}
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
                >
                  <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>
                      {checklistModalData.activity.title}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                      {formatDate(checklistModalData.activity.date)}
                    </Text>

                    <View style={styles.checklistSection}>
                      <View style={styles.checklistHeader}>
                        <View style={styles.checklistIconBg}>
                          <Ionicons name="home" size={16} color="#fb7185" />
                        </View>
                        <Text style={styles.checklistTitle}>
                          {checklistModalData.checklistLabel || 'Espacios a organizar'}
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
        </Pressable>
      </Modal>

      {/* FAB */}
      <Pressable style={styles.fab} onPress={() => setShowHabitModal(true)}>
        <Ionicons name="add" size={32} color="#fff" />
      </Pressable>

      {/* HABIT LIST MODAL */}
      <Modal transparent visible={showHabitModal} animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowHabitModal(false)}>
          <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <View style={styles.modalTitleContainer}>
                <Ionicons name="grid" size={24} color="#fb7185" />
                <Text style={styles.modalTitle}>Selecciona un hábito</Text>
              </View>
              <Pressable onPress={() => setShowHabitModal(false)} style={styles.modalClose}>
                <Ionicons name="close-circle" size={28} color="#6b7280" />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Agrupar hábitos por categoría */}
              {Object.entries(
                habits.reduce((acc, habit) => {
                  const category = habit.category || 'Sin categoría';
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(habit);
                  return acc;
                }, {})
              ).map(([category, categoryHabits]) => (
                <View key={category} style={styles.categorySection}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryIconContainer}>
                      <Ionicons
                        name={
                          category === 'Hogar' ? 'home' :
                            category === 'Vida económica' ? 'wallet' :
                              category === 'Salud' ? 'fitness' :
                                category === 'Social' ? 'people' :
                                  category === 'Productividad' ? 'briefcase' :
                                    'apps'
                        }
                        size={20}
                        color="#fb7185"
                      />
                    </View>
                    <Text style={styles.categoryTitle}>{category}</Text>
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
                          setEditingActivity(null);
                          setShowHabitModal(false);
                          setTimeout(() => setShowFormModal(true), 150);
                        }}
                      >
                        <View style={styles.habitIconWrapper}>
                          {habit.icon ? (
                            <Image source={{ uri: habit.icon }} style={styles.habitIcon} />
                          ) : (
                            <View style={styles.habitIconPlaceholder}>
                              <Ionicons name="sparkles" size={24} color="#fb7185" />
                            </View>
                          )}
                        </View>
                        <Text style={styles.habitText} numberOfLines={2}>
                          {habit.title}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
              <View style={{ height: 20 }} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* FORM MODAL */}
      <Modal transparent visible={showFormModal} animationType="slide">
        <HabitFormModal
          habit={selectedHabit}
          selectedDate={selectedDate}
          editingActivity={editingActivity}
          onSave={handleSaveHabit}
          onClose={() => {
            setShowFormModal(false);
            setEditingActivity(null);
          }}
        />
      </Modal>
    </SafeAreaView>
  );
}

/* =========================
   STYLES
========================= */

const calendarTheme = {
  calendarBackground: '#ffffff',
  selectedDayBackgroundColor: '#fb7185',
  selectedDayTextColor: '#ffffff',
  todayTextColor: '#fb7185',
  todayBackgroundColor: '#ffe4e6',
  dayTextColor: '#1f2937',
  textDisabledColor: '#d1d5db',
  dotColor: '#fb7185',
  selectedDotColor: '#ffffff',
  arrowColor: '#1f2937',
  monthTextColor: '#111827',
  indicatorColor: '#fb7185',
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
      backgroundColor: '#ffe4e6',
      borderRadius: 16,
    },
    todayText: {
      color: '#fb7185',
      fontWeight: '700',
    },
    selected: {
      backgroundColor: '#fb7185',
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
    backgroundColor: '#fb7185',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#fb7185',
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
    opacity: 0.6,
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
    color: '#6b7280',
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#6b7280',
  },
  cardSubtitleCompleted: {
    color: '#9ca3af',
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
    color: '#fb7185',
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
    backgroundColor: '#fef2f2',
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
    color: '#fb7185',
    letterSpacing: 0.2,
  },
  expandCount: {
    backgroundColor: '#fb7185',
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
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#fecdd3',
    shadowColor: '#fb7185',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: '#fecdd3',
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
    backgroundColor: '#fb7185',
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
    backgroundColor: '#fb7185',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fb7185',
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
    backgroundColor: '#fb7185',
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
    backgroundColor: '#fafafa',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    gap: 10,
  },
  habitIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  habitIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },
  habitIconPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#ffe4e6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    lineHeight: 18,
  },
});