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
        description,
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
                  {habit.icon ? (
                    <Image
                      source={{ uri: habit.icon }}
                      style={styles.icon}
                    />
                  ) : (
                    <View style={styles.iconPlaceholder}>
                      <Ionicons name="sparkles" size={20} color="#38BDF8" />
                    </View>
                  )}
                  <View style={styles.itemTextContainer}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {habit.title}
                    </Text>
                    {habit.description ? (
                      <Text
                        style={styles.itemDescription}
                        numberOfLines={2}
                      >
                        {habit.description}
                      </Text>
                    ) : null}
                  </View>
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
    backgroundColor: '#f9fafb',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 8,
  },
  icon: {
    width: 36,
    height: 36,
    marginRight: 10,
    borderRadius: 10,
    backgroundColor: '#fee2e2',
  },
  iconPlaceholder: {
    width: 36,
    height: 36,
    marginRight: 10,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 3,
  },
  itemDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
});
