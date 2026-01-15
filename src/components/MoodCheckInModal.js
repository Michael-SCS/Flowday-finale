import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../utils/i18n';
import { useSettings } from '../utils/settingsContext';

export default function MoodCheckInModal({
  visible,
  accent = '#7c3aed',
  isDark = false,
  title = '¿Cómo te sientes hoy?',
  subtitle = 'Elige una carita para registrar tu estado de ánimo.',
  footerText,
  dateLabel,
  onSelect,
}) {
  const { t } = useI18n();
  const { language } = useSettings();
  const options = useMemo(
    () => [
      {
        score: 1,
        emoji: '😞',
        lightBg: '#fee2e2',
        lightBorder: '#fca5a5',
        darkBg: '#2a1111',
        darkBorder: '#7f1d1d',
      },
      {
        score: 2,
        emoji: '😕',
        lightBg: '#ffedd5',
        lightBorder: '#fdba74',
        darkBg: '#261507',
        darkBorder: '#9a3412',
      },
      {
        score: 3,
        emoji: '😐',
        lightBg: '#e2e8f0',
        lightBorder: '#cbd5e1',
        darkBg: '#0f172a',
        darkBorder: '#334155',
      },
      {
        score: 4,
        emoji: '🙂',
        lightBg: '#dcfce7',
        lightBorder: '#86efac',
        darkBg: '#082214',
        darkBorder: '#166534',
      },
      {
        score: 5,
        emoji: '😄',
        lightBg: '#dbeafe',
        lightBorder: '#93c5fd',
        darkBg: '#0b1b33',
        darkBorder: '#1d4ed8',
      },
    ],
    []
  );

  const footer = footerText ?? t('mood.checkInFooter');

  const badgeLabel = useMemo(() => {
    if (typeof dateLabel === 'string' && dateLabel.trim()) return dateLabel.trim();

    const lang = (language || 'en').toLowerCase();
    const localeMap = {
      es: 'es-ES',
      en: 'en-US',
      pt: 'pt-BR',
      fr: 'fr-FR',
    };

    const locale = localeMap[lang] || 'en-US';
    try {
      return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
      }).format(new Date());
    } catch {
      return new Date().toLocaleDateString();
    }
  }, [dateLabel, language]);

  return (
    <Modal visible={!!visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={[styles.card, isDark && { backgroundColor: '#0b1120', borderColor: '#1e293b' }]}>
          <View style={[styles.badge, { backgroundColor: `${accent}22`, borderColor: `${accent}44` }]}>
            <Text style={[styles.badgeText, { color: accent }]}>{badgeLabel}</Text>
          </View>

          <Text style={[styles.title, isDark && { color: '#e5e7eb' }]}>{title}</Text>
          <Text style={[styles.subtitle, isDark && { color: '#94a3b8' }]}>{subtitle}</Text>

          <View style={styles.row}>
            {options.map((opt) => (
              <Pressable
                key={opt.score}
                onPress={() => onSelect?.(opt)}
                style={({ pressed }) => [
                  styles.emojiButton,
                  {
                    borderColor: isDark ? opt.darkBorder : opt.lightBorder,
                    backgroundColor: isDark ? opt.darkBg : opt.lightBg,
                  },
                  pressed && { transform: [{ scale: 0.96 }], opacity: 0.9 },
                ]}
              >
                <Text style={styles.emoji}>{opt.emoji}</Text>
                <Text style={[styles.points, { color: isDark ? '#cbd5e1' : '#0f172a' }]}>{opt.score}</Text>
              </Pressable>
            ))}
          </View>

          {footer ? (
            <Text style={[styles.footer, { color: isDark ? '#64748b' : '#94a3b8' }]}>
              {footer}
            </Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    padding: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 12,
    letterSpacing: 1.2,
    fontWeight: '800',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: '#64748b',
  },
  row: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  emojiButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  points: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    marginTop: 14,
    fontSize: 12,
    textAlign: 'center',
  },
});
