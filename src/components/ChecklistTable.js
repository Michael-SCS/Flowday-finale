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
              name={item.checked ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={item.checked ? '#22c55e' : '#d1d5db'}
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
    borderRadius: 18,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  cell: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  check: { width: 40, textAlign: 'center' },
  label: { flex: 2 },
  qty: { width: 50, textAlign: 'center' },
  extra: { width: 90, textAlign: 'center' },
  checkedText: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
});
