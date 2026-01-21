import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ChecklistTable({
  items = [],
  onToggle,
  columns = { qty: true, extra: true },
  isDark = false,
}) {
  return (
    <View style={[styles.table, isDark && styles.tableDark]}>
      {/* HEADER */}
      <View style={[styles.row, styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.cell, styles.check]} />
        <Text style={[styles.cell, styles.label, isDark && styles.textDark]}>Lugares</Text>
        {columns.qty && (
          <Text style={[styles.cell, styles.qty, isDark && styles.textDark]}>Cant.</Text>
        )}
        {columns.extra && (
          <Text style={[styles.cell, styles.extra, isDark && styles.textDark]}>Info</Text>
        )}
      </View>

      {items.map((item, index) => (
        <View key={index} style={[styles.row, isDark && styles.rowDark]}>
          <Pressable
            style={[styles.cell, styles.check]}
            onPress={() => onToggle(index)}
          >
            <Ionicons
              name={item.checked ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={item.checked ? '#22c55e' : (isDark ? '#475569' : '#d1d5db')}
            />
          </Pressable>

          <Text
            style={[
              styles.cell,
              styles.label,
              isDark && styles.textDark,
              item.checked && styles.checkedText,
              item.checked && isDark && styles.checkedTextDark,
            ]}
          >
            {item.label}
          </Text>

          {columns.qty && (
            <Text style={[styles.cell, isDark && styles.textDark]}>{item.qty || '-'}</Text>
          )}

          {columns.extra && (
            <Text style={[styles.cell, isDark && styles.textDark]}>{item.extra || '-'}</Text>
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
  tableDark: {
    backgroundColor: '#071127',
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  rowDark: {
    backgroundColor: '#071127',
    borderBottomColor: '#0f172a',
  },
  header: {
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  headerDark: {
    backgroundColor: '#0b1220',
    borderBottomColor: '#1e293b',
  },
  cell: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  textDark: {
    color: '#e5e7eb',
  },
  check: { width: 40, textAlign: 'center' },
  label: { flex: 2 },
  qty: { width: 50, textAlign: 'center' },
  extra: { width: 90, textAlign: 'center' },
  checkedText: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  checkedTextDark: {
    color: '#64748b',
  },
});
