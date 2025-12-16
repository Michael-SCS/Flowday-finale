import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
} from 'react-native';
import { supabase } from '../utils/supabase';

export default function HabitModal({ onSelect }) {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHabits();
  }, []);

  async function loadHabits() {
    const { data } = await supabase
      .from('habit_templates')
      .select('id, title, category, type, icon, order_index')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    setHabits(data || []);
    setLoading(false);
  }

  const grouped = habits.reduce((acc, h) => {
    acc[h.category] = acc[h.category] || [];
    acc[h.category].push(h);
    return acc;
  }, {});

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Cargando hábitos…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agregar hábito</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {Object.entries(grouped).map(
          ([category, items]) => (
            <View key={category} style={styles.section}>
              <Text style={styles.sectionTitle}>
                {category}
              </Text>

              {items.map((habit) => (
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
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff7ed',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#6b7280',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  icon: { width: 36, height: 36, marginRight: 12 },
  itemText: { fontSize: 16 },
});
