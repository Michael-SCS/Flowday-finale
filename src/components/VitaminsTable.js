import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function VitaminsTable({ items = [], onToggle, isDark = false }) {
  return (
    <View style={[styles.table, isDark && styles.tableDark]}>
      {/* HEADER */}
      <View style={[styles.row, styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.cell, styles.check]} />
        <Text style={[styles.cell, styles.name, isDark && styles.textDark]}>Vitamina</Text>
        <Text style={[styles.cell, styles.qty, isDark && styles.textDark]}>Cant.</Text>
      </View>

      {items.map((item, index) => {
        const name = item.name || item.label || '';
        const qty =
          item.quantity !== undefined && item.quantity !== null
            ? String(item.quantity)
            : item.qty || '';

        return (
          <View key={index} style={[styles.row, isDark && styles.rowDark]}>
            <Pressable
              style={[styles.cell, styles.check]}
              onPress={() => onToggle && onToggle(index)}
            >
              <Ionicons
                name={item.checked ? 'checkmark-circle' : 'ellipse-outline'}
                size={19}
                color={item.checked ? '#22c55e' : '#d1d5db'}
              />
            </Pressable>

            <Text
              style={[
                styles.cell,
                styles.name,
                item.checked && styles.checkedText,
                isDark && styles.textDark,
                isDark && item.checked && styles.checkedTextDark,
              ]}
            >
              {name}
            </Text>

            <Text style={[styles.cell, styles.qty, isDark && styles.textDark]}>{qty}</Text>
          </View>
        );
      })}
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
    backgroundColor: '#0b1120',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  rowDark: {
    backgroundColor: '#0b1120',
    borderBottomColor: '#1e293b',
  },
  header: {
    backgroundColor: '#dcfce7',
    borderBottomWidth: 1,
    borderBottomColor: '#bbf7d0',
  },
  headerDark: {
    backgroundColor: '#0b1120',
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
  name: { flex: 2 },
  qty: { width: 60, textAlign: 'center' },
  checkedText: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  checkedTextDark: {
    color: '#64748b',
  },
});
