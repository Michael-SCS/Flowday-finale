import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
} from 'react-native';
import {
  CalendarProvider,
  ExpandableCalendar,
} from 'react-native-calendars';

import HabitModal from './HabitModal';
import HabitFormModal from './HabitFormModal';

import {
  loadActivities,
  saveActivities,
} from '../utils/localActivities';

const today = new Date().toISOString().split('T')[0];

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(today);
  const [activities, setActivities] = useState({});

  const [showHabitModal, setShowHabitModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);

  const [selectedHabit, setSelectedHabit] = useState(null);

  useEffect(() => {
    loadActivities().then(setActivities);
  }, []);

  async function persist(updated) {
    setActivities(updated);
    await saveActivities(updated);
  }

  async function addActivity(date, activity) {
    const updated = {
      ...activities,
      [date]: activities[date]
        ? [...activities[date], activity]
        : [activity],
    };
    await persist(updated);
  }

  function handleHabitSelected(habit) {
    setSelectedHabit(habit);
    setShowHabitModal(false);

    setTimeout(() => {
      setShowFormModal(true);
    }, 150);
  }

  return (
    <View style={styles.container}>
      <CalendarProvider
        date={selectedDate}
        onDateChanged={setSelectedDate}
        showTodayButton
      >
        <ExpandableCalendar />

        <View style={styles.content}>
          <Text style={styles.dayTitle}>
            {selectedDate}
          </Text>

          {activities[selectedDate]?.length ? (
            activities[selectedDate].map((a, i) => (
              <View key={i} style={styles.card}>
                <Text>{a.title}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>
              No hay hábitos 🌱
            </Text>
          )}
        </View>
      </CalendarProvider>

      <Pressable
        style={styles.fab}
        onPress={() => setShowHabitModal(true)}
      >
        <Text style={styles.fabText}>＋</Text>
      </Pressable>

      {/* CATÁLOGO */}
      <Modal transparent visible={showHabitModal}>
        <View style={styles.modalOverlay}>
          <HabitModal onSelect={handleHabitSelected} />
        </View>
      </Modal>

      {/* FORM DINÁMICO */}
      <Modal transparent visible={showFormModal}>
        <View style={styles.modalOverlay}>
          <HabitFormModal
            habit={selectedHabit}
            date={selectedDate}
            onSave={(data) => {
              addActivity(selectedDate, data);
              setShowFormModal(false);
            }}
            onClose={() => setShowFormModal(false)}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff7ed' },
  content: { padding: 20 },
  dayTitle: { fontSize: 18, fontWeight: '600' },
  empty: { color: '#6b7280', marginTop: 10 },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#fb7185',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabText: { color: '#fff', fontSize: 28 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
});
