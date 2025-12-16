import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';

export default function HabitModal({ onSelect, onClose }) {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHabits();
  }, []);

  async function loadHabits() {
    setLoading(true);

    const { data, error } = await supabase
      .from('habit_templates')
      .select(`
        id,
        title,
        category,
        type,
        icon,
        config
      `)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (!error && data) {
      setHabits(data);
    }

    setLoading(false);
  }

  // Agrupar por categoría
  const grouped = habits.reduce((acc, habit) => {
    acc[habit.category] = acc[habit.category] || [];
    acc[habit.category].push(habit);
    return acc;
  }, {});

  return (
    <View style={styles.sheet}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Agregar hábito</Text>
        <Pressable onPress={onClose}>
          <Ionicons name="close" size={24} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {Object.keys(grouped).map((category) => (
            <View key={category} style={styles.section}>
              <Text style={styles.sectionTitle}>
                {category}
              </Text>

              {grouped[category].map((habit) => (
                <Pressable
                  key={habit.id}
                  style={styles.item}
                  onPress={() => onSelect(habit)}
                >
                  <Image
                    source={{ uri: habit.icon }}
                    style={styles.icon}
                  />
                  <Text style={styles.itemText}>
                    {habit.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  loading: {
    padding: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 8,
  },
  icon: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  itemText: {
    fontSize: 15,
  },
});
