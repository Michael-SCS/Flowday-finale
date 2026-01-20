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
import { loadHabitTemplates } from '../utils/habitCache';
import { useI18n } from '../utils/i18n';
import { useSettings } from '../utils/settingsContext';
import { translateHabitCategory } from '../utils/habitCategories';

export default function HabitModal({ onSelect, onClose }) {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();
  const { language } = useSettings();

  useEffect(() => {
    loadHabits();
  }, [language]);

  async function loadHabits() {
    setLoading(true);
    try {
      const data = await loadHabitTemplates(language);
      if (data && Array.isArray(data)) {
        setHabits(data);
      } else {
        setHabits([]);
      }
    } finally {
      setLoading(false);
    }
  }

  // Agrupar por categoría
  const grouped = habits.reduce((acc, habit) => {
    const category = habit.category || 'Sin categoría';
    acc[category] = acc[category] || [];
    acc[category].push(habit);
    return acc;
  }, {});

  return (
    <View style={styles.sheet}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('habitList.title')}</Text>
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
          {Object.keys(grouped).map((category) => {
            const displayCategory = translateHabitCategory(category, language);

            return (
              <View key={category} style={styles.section}>
                <Text style={styles.sectionTitle}>{displayCategory}</Text>

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
                      <Ionicons name="sparkles" size={18} color="#A8D8F0" />
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
          )})}
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
    marginBottom: 12,
    fontSize: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 8,
  },
  icon: {
    width: 32,
    height: 32,
    marginRight: 10,
    borderRadius: 9,
    backgroundColor: '#fee2e2',
  },
  iconPlaceholder: {
    width: 32,
    height: 32,
    marginRight: 10,
    borderRadius: 9,
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
