import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MarketTable({ items = [], onToggle }) {
  let totalQuantity = 0;
  let totalAmount = 0;

  return (
    <View style={styles.table}>
      {/* HEADER */}
      <View style={[styles.row, styles.header]}>
        <Text style={[styles.cell, styles.check]} />
        <Text style={[styles.cell, styles.product]}>Producto</Text>
        <Text style={[styles.cell, styles.qty]}>Cant.</Text>
        <Text style={[styles.cell, styles.price]}>$</Text>
        <Text style={[styles.cell, styles.subtotal]}>Subtotal</Text>
      </View>

      {items.map((item, index) => {
        const product = item.product || item.name || '';
        const qty =
          item.quantity !== undefined && item.quantity !== null
            ? String(item.quantity)
            : item.qty || '';
        const price =
          item.price !== undefined && item.price !== null
            ? String(item.price)
            : '';

        const qtyNumber = (() => {
          const n = parseFloat(String(qty).replace(',', '.'));
          return Number.isFinite(n) ? n : 0;
        })();

        const priceNumber = (() => {
          const n = parseFloat(String(price).replace(',', '.'));
          return Number.isFinite(n) ? n : 0;
        })();

        const lineTotal = qtyNumber * priceNumber;
        totalQuantity += qtyNumber;
        totalAmount += lineTotal;

        return (
          <View key={index} style={styles.row}>
            <Pressable
              style={[styles.cell, styles.check]}
              onPress={() => onToggle && onToggle(index)}
            >
              <Ionicons
                name={item.checked ? 'checkmark-circle' : 'ellipse-outline'}
                size={19}
                color={item.checked ? '#f97316' : '#d1d5db'}
              />
            </Pressable>

            <Text
              style={[
                styles.cell,
                styles.product,
                item.checked && styles.checkedText,
              ]}
            >
              {product}
            </Text>

            <Text style={[styles.cell, styles.qty]}>{qty}</Text>
            <Text style={[styles.cell, styles.price]}>{price}</Text>
            <Text style={[styles.cell, styles.subtotal]}>
              {lineTotal > 0 ? lineTotal.toFixed(2) : ''}
            </Text>
          </View>
        );
      })}

      {items.length > 0 && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>
            {`Productos: ${items.length}   Cantidad total: ${totalQuantity}   Total: $${totalAmount.toFixed(2)}`}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    marginTop: 20,
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
    backgroundColor: '#fee2e2',
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
  },
  cell: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  check: { width: 40, textAlign: 'center' },
  product: { flex: 2.2 },
  qty: { width: 60, textAlign: 'center' },
  price: { width: 70, textAlign: 'center' },
  subtotal: { width: 90, textAlign: 'right' },
  checkedText: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  summaryRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
});
