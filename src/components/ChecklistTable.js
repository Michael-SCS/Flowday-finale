import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ChecklistTable({
  items = [],
  onToggle,
  columns = { qty: true, extra: true },
}) {
  return (
    <View style={styles.table}>
      {/* HEADER */}
      <View style={[styles.row, styles.header]}>
        <Text style={[styles.cell, styles.check]} />
        <Text style={[styles.cell, styles.label]}>Ítem</Text>
        {columns.qty && (
          <Text style={[styles.cell, styles.qty]}>Cant.</Text>
        )}
        {columns.extra && (
          <Text style={[styles.cell, styles.extra]}>Info</Text>
        )}
      </View>

      {items.map((item, index) => (
        <View key={index} style={styles.row}>
          <Pressable
            style={[styles.cell, styles.check]}
            onPress={() => onToggle(index)}
          >
            <Ionicons
              name={item.checked ? 'checkbox' : 'square-outline'}
              size={20}
              color={item.checked ? '#22c55e' : '#9ca3af'}
            />
          </Pressable>

          <Text
            style={[
              styles.cell,
              styles.label,
              item.checked && styles.checkedText,
            ]}
          >
            {item.label}
          </Text>

          {columns.qty && (
            <Text style={styles.cell}>{item.qty || '-'}</Text>
          )}

          {columns.extra && (
            <Text style={styles.cell}>{item.extra || '-'}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fde68a',
  },
  cell: {
    padding: 10,
    fontSize: 13,
  },
  check: { width: 36, textAlign: 'center' },
  label: { flex: 2 },
  qty: { width: 50, textAlign: 'center' },
  extra: { width: 90, textAlign: 'center' },
  checkedText: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
});
