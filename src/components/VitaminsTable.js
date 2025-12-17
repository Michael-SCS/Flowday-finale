import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function VitaminsTable({ items = [], onToggle }) {
  return (
    <View style={styles.table}>
      {/* HEADER */}
      <View style={[styles.row, styles.header]}>
        <Text style={[styles.cell, styles.check]} />
        <Text style={[styles.cell, styles.name]}>Vitamina</Text>
        <Text style={[styles.cell, styles.qty]}>Cant.</Text>
      </View>

      {items.map((item, index) => {
        const name = item.name || item.label || '';
        const qty =
          item.quantity !== undefined && item.quantity !== null
            ? String(item.quantity)
            : item.qty || '';

        return (
          <View key={index} style={styles.row}>
            <Pressable
              style={[styles.cell, styles.check]}
              onPress={() => onToggle && onToggle(index)}
            >
              <Ionicons
                name={item.checked ? 'checkbox' : 'square-outline'}
                size={18}
                color={item.checked ? '#22c55e' : '#9ca3af'}
              />
            </Pressable>

            <Text
              style={[
                styles.cell,
                styles.name,
                item.checked && styles.checkedText,
              ]}
            >
              {name}
            </Text>

            <Text style={[styles.cell, styles.qty]}>{qty}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#bbf7d0',
  },
  cell: {
    padding: 10,
    fontSize: 13,
  },
  check: { width: 36, textAlign: 'center' },
  name: { flex: 2 },
  qty: { width: 60, textAlign: 'center' },
  checkedText: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
});
