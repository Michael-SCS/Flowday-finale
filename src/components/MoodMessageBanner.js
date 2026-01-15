import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MoodMessageBanner({
  title,
  message,
  emoji,
  accent = '#7c3aed',
  isDark = false,
  onClose,
}) {
  if (!message) return null;

  return (
    <View style={[styles.banner, isDark && { backgroundColor: '#0b1120', borderColor: '#1e293b' }]}>
      <View style={[styles.emojiWrap, { backgroundColor: `${accent}18`, borderColor: `${accent}33` }]}>
        <Text style={styles.emojiText}>{emoji || '🙂'}</Text>
      </View>

      <View style={{ flex: 1 }}>
        {title ? (
          <Text style={[styles.title, isDark && { color: '#e5e7eb' }]}>{title}</Text>
        ) : null}
        <Text style={[styles.text, isDark && { color: '#cbd5e1' }]}>{message}</Text>
      </View>

      {typeof onClose === 'function' ? (
        <Pressable
          onPress={onClose}
          hitSlop={12}
          style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.75 }]}
        >
          <Ionicons name="close" size={18} color={isDark ? '#cbd5e1' : '#334155'} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 22,
  },
  title: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  text: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: '#334155',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
