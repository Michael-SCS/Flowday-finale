import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../utils/settingsContext';
import { useI18n } from '../utils/i18n';

export default function MarketAddModal({ visible, onClose, onAdd }) {
  const { themeMode } = useSettings();
  const isDark = themeMode === 'dark';
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');

  useEffect(() => {
    if (!visible) {
      setName('');
      setQuantity('1');
      setPrice('');
    }
  }, [visible]);

  function handleAdd() {
    const qty = parseFloat(String(quantity).replace(',', '.')) || 0;
    const pr = parseFloat(String(price).replace(',', '.')) || 0;
    if (!name.trim()) return;
    onAdd && onAdd({ product: name.trim(), quantity: qty, price: pr, checked: false });
    onClose && onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.wrapper}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={[styles.card, isDark && styles.cardDark]}>
              <View style={styles.header}>
                <Text style={[styles.title, isDark && styles.titleDark]}>Agregar producto</Text>
                <Pressable onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color={isDark ? '#cbd5e1' : '#374151'} />
                </Pressable>
              </View>

            <View style={styles.field}>
              <Text style={[styles.label, isDark && styles.labelDark]}>Nombre</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark, { minHeight: 48 }]}
                value={name}
                onChangeText={setName}
                placeholder="Lechuga, manzanas..."
                placeholderTextColor={isDark ? '#94a3af' : '#9ca3af'}
                autoCorrect
                autoCapitalize="words"
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, isDark && styles.labelDark]}>Cantidad</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={quantity}
                onChangeText={(v) => setQuantity(v.replace(/[^0-9,\.]/g, ''))}
                keyboardType="numeric"
                placeholder="1"
                placeholderTextColor={isDark ? '#94a3af' : '#9ca3af'}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, isDark && styles.labelDark]}>Valor unitario</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={price}
                onChangeText={(v) => setPrice(v.replace(/[^0-9,\.]/g, ''))}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={isDark ? '#94a3af' : '#9ca3af'}
              />
            </View>

            <View style={styles.actionsRow}>
              <Pressable style={[styles.btn, styles.cancel]} onPress={onClose}>
                <Text style={styles.cancelText}>{t('cancel')}</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.confirm]} onPress={handleAdd}>
                <Text style={styles.confirmText}>{t('specialHabits.market.addButton')}</Text>
              </Pressable>
            </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  wrapper: {
    flex: 1,
    padding: 16,
    justifyContent: 'flex-end',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#fff',
  },
  cardDark: {
    backgroundColor: '#0b1220',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  titleDark: { color: '#e5e7eb' },
  closeBtn: { padding: 6 },
  field: { marginBottom: 12 },
  label: { fontSize: 13, color: '#374151', marginBottom: 6, fontWeight: '600' },
  labelDark: { color: '#cbd5e1' },
  input: {
    borderWidth: 1,
    borderColor: '#e6eef9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    color: '#111827',
  },
  inputDark: {
    borderColor: '#273142',
    backgroundColor: '#071127',
    color: '#e5e7eb',
  },
  row: { flexDirection: 'row' },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 96,
    alignItems: 'center',
  },
  cancel: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  cancelText: { color: '#374151', fontWeight: '700' },
  confirm: { backgroundColor: '#16a34a' },
  confirmText: { color: '#fff', fontWeight: '700' },
});
