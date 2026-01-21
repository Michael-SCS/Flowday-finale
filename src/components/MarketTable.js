import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../utils/settingsContext';

const MarketTableItem = React.memo(function MarketTableItem({ item, index, isDark, accentColor, onToggle }) {
  const product = typeof item === 'string' ? item : (item.product || item.name || item.label || '');
  const qty = item.quantity !== undefined && item.quantity !== null ? String(item.quantity) : item.qty || '';
  const price = item.price !== undefined && item.price !== null ? String(item.price) : '';

  const qtyNumber = (() => { const n = parseFloat(String(qty).replace(',', '.')); return Number.isFinite(n) ? n : 0; })();
  const priceNumber = (() => { const n = parseFloat(String(price).replace(',', '.')); return Number.isFinite(n) ? n : 0; })();
  const lineTotal = qtyNumber * priceNumber;

  return (
    <Pressable
      style={[
        styles.card,
        isDark && styles.cardDark,
        item.checked && styles.cardChecked,
        item.checked && isDark && styles.cardCheckedDark
      ]}
      onPress={() => onToggle && onToggle(index)}
    >
      <View style={styles.cardContent}>
        <View style={styles.checkboxContainer}>
          <Ionicons
            name={item.checked ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={item.checked ? (accentColor || '#10b981') : (isDark ? '#64748b' : '#d1d5db')}
          />
        </View>

        <View style={styles.productInfo}>
          <Text
            style={[
              styles.productName,
              isDark && styles.productNameDark,
              item.checked && styles.productNameChecked
            ]}
            numberOfLines={2}
          >
            {product}
          </Text>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, isDark && styles.detailLabelDark]}>Cantidad:</Text>
              <Text style={[styles.detailValue, isDark && styles.detailValueDark]}>{qty}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, isDark && styles.detailLabelDark]}>Precio:</Text>
              <Text style={[styles.detailValue, isDark && styles.detailValueDark]}>${price}</Text>
            </View>

            {lineTotal > 0 && (
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, isDark && styles.detailLabelDark]}>Subtotal:</Text>
                <Text style={[styles.subtotalValue, isDark && styles.subtotalValueDark]}>${lineTotal.toFixed(2)}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
});

export default function MarketTable({
  items = [],
  onToggle,
  onClose,
  virtualized = true,
  embedded = false,
  showHeader = true,
  showSummary = true,
  title,
  accentColor,
  isDark: isDarkOverride,
}) {
  const { themeMode } = useSettings();
  const isDark = typeof isDarkOverride === 'boolean' ? isDarkOverride : themeMode === 'dark';

  const renderItem = useCallback(
    ({ item, index }) => (
      <MarketTableItem item={item} index={index} isDark={isDark} accentColor={accentColor} onToggle={onToggle} />
    ),
    [isDark, accentColor, onToggle]
  );

  const keyExtractor = useCallback(
    (item, index) => (item && item.id ? String(item.id) : String(index)),
    []
  );

  const { totalQuantity, totalAmount } = useMemo(() => {
    let tQty = 0;
    let tAmount = 0;
    items.forEach((item) => {
      const qty = parseFloat(String(item?.quantity ?? item?.qty ?? 0).replace(',', '.')) || 0;
      const price = parseFloat(String(item?.price ?? 0).replace(',', '.')) || 0;
      tQty += qty;
      tAmount += qty * price;
    });
    return { totalQuantity: tQty, totalAmount: tAmount };
  }, [items]);
  return (
    <View
      style={[
        styles.container,
        embedded && styles.containerEmbedded,
        isDark && styles.containerDark,
        embedded && isDark && styles.containerEmbeddedDark,
      ]}
    >
      {/* HEADER CON BOTÓN DE CERRAR (opcional) */}
      {showHeader && !embedded && (
        <View style={[styles.header, isDark && styles.headerDark]}>
          <Text
            style={[styles.headerTitle, isDark && styles.headerTitleDark]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title || 'Lista de Compras'}
          </Text>
          {onClose && (
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-circle" size={28} color={isDark ? '#e5e7eb' : '#111827'} />
            </Pressable>
          )}
        </View>
      )}

      {virtualized ? (
        <FlatList
          data={items}
          contentContainerStyle={[styles.scrollContent, embedded && styles.scrollContentEmbedded]}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      ) : (
        <View style={[styles.scrollContent, embedded && styles.scrollContentEmbedded]}>
          {items.map((item, index) => (
            <MarketTableItem
              key={keyExtractor(item, index)}
              item={item}
              index={index}
              isDark={isDark}
              accentColor={accentColor}
              onToggle={onToggle}
            />
          ))}
        </View>
      )}

      {/* RESUMEN TOTAL */}
      {showSummary && items.length > 0 && (
        <View style={[styles.summary, isDark && styles.summaryDark]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>
              Productos:
            </Text>
            <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
              {items.length}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>
              Cantidad total:
            </Text>
            <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
              {totalQuantity}
            </Text>
          </View>

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={[styles.totalLabel, isDark && styles.totalLabelDark]}>
              Total:
            </Text>
            <Text style={[styles.totalValue, isDark && styles.totalValueDark]}>
              ${totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  containerDark: {
    backgroundColor: '#0f172a',
  },
  containerEmbedded: {
    backgroundColor: 'transparent',
    flex: 0,
    flexGrow: 0,
  },
  containerEmbeddedDark: {
    backgroundColor: 'transparent',
    flex: 0,
    flexGrow: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerDark: {
    backgroundColor: '#1e293b',
    borderBottomColor: '#334155',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    paddingHorizontal: 44,
  },
  headerTitleDark: {
    color: '#f1f5f9',
  },
  closeButton: {
    padding: 4,
    position: 'absolute',
    right: 16,
  },
  scrollContent: {
    flex: 1,
    padding: 12,
  },
  scrollContentEmbedded: {
    padding: 0,
    flex: 0,
    flexGrow: 0,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  cardChecked: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  cardCheckedDark: {
    backgroundColor: '#064e3b',
    borderColor: '#10b981',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 10,
  },
  checkboxContainer: {
    marginRight: 10,
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    lineHeight: 20,
  },
  productNameDark: {
    color: '#f1f5f9',
  },
  productNameChecked: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 4,
  },
  detailLabelDark: {
    color: '#94a3b8',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  detailValueDark: {
    color: '#e2e8f0',
  },
  subtotalValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f97316',
  },
  subtotalValueDark: {
    color: '#fb923c',
  },
  summary: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  summaryDark: {
    backgroundColor: '#1e293b',
    borderTopColor: '#334155',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#6b7280',
  },
  summaryLabelDark: {
    color: '#94a3b8',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  summaryValueDark: {
    color: '#e2e8f0',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  totalLabelDark: {
    color: '#f1f5f9',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f97316',
  },
  totalValueDark: {
    color: '#fb923c',
  },
});