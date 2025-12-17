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
   HELPERS
========================= */

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

  const [expanded, setExpanded] = useState({});
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
    const updated = { ...activities };
    const date = payload.schedule.startDate;

    if (!updated[date]) updated[date] = [];

    // El form envía "data", lo guardamos como "data" (para compatibilidad)
    const activityData = payload.data || {};

    // Si estamos editando, actualizamos la actividad existente
    if (editingActivity) {
      updated[date] = updated[date].map((act) =>
        act.id === editingActivity.id
          ? {
              ...act,
              title: payload.habit.title,
              icon: payload.habit.icon,
              description: payload.description || null,
              data: activityData,
            }
          : act
      );
    } else {
      // Si es nuevo, lo agregamos
      updated[date].push({
        id: uuidv4(),
        habit_id: payload.habit.id,
        title: payload.habit.title,
        icon: payload.habit.icon,
        description: payload.description || null,
        data: activityData,
        date,
      });
    }

    saveActivities(updated);
    setShowFormModal(false);
    setEditingActivity(null);
  }

  /* =========================
     CHECKLIST
  ========================= */

  function toggleExpand(id) {
    setExpanded((p) => ({ ...p, [id]: !p[id] }));
  }

  function toggleChecklistItem(activity, listType, index) {
    const updated = { ...activities };

    updated[activity.date] = updated[activity.date].map((act) => {
      if (act.id !== activity.id) return act;

      const data = { ...act.data };
      const list = [...(data[listType] || [])];
      
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
     CHECKLIST HELPERS
  ========================= */

  function hasChecklist(activity) {
    // Verifica si la actividad tiene alguna lista en data
    return activity.data && (
      (activity.data.market && activity.data.market.length > 0) ||
      (activity.data.vitamins && activity.data.vitamins.length > 0)
    );
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
              <Ionicons name="calendar" size={24} color="#fb7185" />
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
                const isExpandable = hasChecklist(activity);
                const hasMarket = activity.data?.market?.length > 0;
                const hasVitamins = activity.data?.vitamins?.length > 0;

                // IMPORTANTE: Agregamos la fecha al objeto activity
                const activityWithDate = {
                  ...activity,
                  date: selectedDate
                };

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
                    <View style={styles.card}>
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
                          <Text style={styles.cardTitle}>{activity.title}</Text>
                          {isExpandable && (
                            <View style={styles.cardBadge}>
                              <Ionicons name="list" size={12} color="#fb7185" />
                              <Text style={styles.cardBadgeText}>Lista</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* DESCRIPTION */}
                      {activity.description && (
                        <View style={styles.descriptionContainer}>
                          <Ionicons name="document-text-outline" size={16} color="#9ca3af" />
                          <Text style={styles.cardDesc}>{activity.description}</Text>
                        </View>
                      )}

                      {/* EXPAND CHECKLIST */}
                      {isExpandable && (
                        <>
                          <Pressable
                            onPress={() => toggleExpand(activity.id)}
                            style={styles.expandBtn}
                          >
                            <View style={styles.expandBtnContent}>
                              <Ionicons
                                name={expanded[activity.id] ? 'chevron-up' : 'chevron-down'}
                                size={18}
                                color="#fb7185"
                              />
                              <Text style={styles.expandText}>
                                {expanded[activity.id] ? 'Ocultar lista' : 'Ver lista completa'}
                              </Text>
                            </View>
                          </Pressable>

                          {expanded[activity.id] && (
                            <View style={styles.checklistContainer}>
                              {hasMarket && (
                                <View style={styles.checklistSection}>
                                  <View style={styles.checklistHeader}>
                                    <Ionicons name="cart" size={16} color="#fb7185" />
                                    <Text style={styles.checklistTitle}>Mercado</Text>
                                  </View>
                                  <ChecklistTable
                                    items={activity.data.market}
                                    columns={{ qty: true, extra: true }}
                                    onToggle={(index) =>
                                      toggleChecklistItem(activityWithDate, 'market', index)
                                    }
                                  />
                                </View>
                              )}

                              {hasVitamins && (
                                <View style={styles.checklistSection}>
                                  <View style={styles.checklistHeader}>
                                    <Ionicons name="fitness" size={16} color="#fb7185" />
                                    <Text style={styles.checklistTitle}>Vitaminas</Text>
                                  </View>
                                  <ChecklistTable
                                    items={activity.data.vitamins}
                                    columns={{ qty: false, extra: true }}
                                    onToggle={(index) =>
                                      toggleChecklistItem(activityWithDate, 'vitamins', index)
                                    }
                                  />
                                </View>
                              )}
                            </View>
                          )}
                        </>
                      )}
                    </View>
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
              <Text style={styles.modalTitle}>Selecciona un hábito</Text>
              <Pressable onPress={() => setShowHabitModal(false)} style={styles.modalClose}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {habits.map((habit) => (
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
                  <View style={styles.habitRow}>
                    {habit.icon ? (
                      <Image source={{ uri: habit.icon }} style={styles.habitIcon} />
                    ) : (
                      <View style={styles.habitIconPlaceholder}>
                        <Ionicons name="sparkles" size={20} color="#fb7185" />
                      </View>
                    )}
                    <Text style={styles.habitText}>{habit.title}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
                  </View>
                </Pressable>
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
  calendarBackground: '#fff',
  selectedDayBackgroundColor: '#fb7185',
  selectedDayTextColor: '#ffffff',
  todayTextColor: '#fb7185',
  dayTextColor: '#1f2937',
  textDisabledColor: '#d1d5db',
  dotColor: '#fb7185',
  selectedDotColor: '#ffffff',
  arrowColor: '#fb7185',
  monthTextColor: '#1f2937',
  textMonthFontWeight: '600',
  textDayFontSize: 14,
  textMonthFontSize: 18,
  textDayHeaderFontSize: 12,
  textDayHeaderFontWeight: '600',
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
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dateIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ffe4e6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dateTextContainer: {
    flex: 1,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    textTransform: 'capitalize',
  },
  activityCount: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
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
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconContainer: {
    marginRight: 12,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  cardIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 10,
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
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe4e6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  cardBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fb7185',
  },

  // Description
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 8,
  },
  cardDesc: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },

  // Expand Button
  expandBtn: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  expandBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  expandText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fb7185',
  },

  // Checklist
  checklistContainer: {
    marginTop: 12,
    gap: 12,
  },
  checklistSection: {
    gap: 8,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  checklistTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 20,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  modalClose: {
    position: 'absolute',
    right: 20,
    top: 20,
    padding: 4,
  },

  // Habit Item
  habitItem: {
    backgroundColor: '#fafafa',
    marginHorizontal: 20,
    marginTop: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    marginRight: 12,
  },
  habitIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#ffe4e6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  habitText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
});