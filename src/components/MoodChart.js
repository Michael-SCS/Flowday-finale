import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useI18n } from '../utils/i18n';
import { getMoodForDate, getMoodSeriesLastNDays, todayMoodKey } from '../utils/moodTracker';

export default function MoodChart({ accent = '#7c3aed', isDark = false, days = 7, embedded = false }) {
  const { t } = useI18n();
  const [series, setSeries] = useState([]);
  const [today, setToday] = useState(null);

  const load = useCallback(() => {
    let mounted = true;
    (async () => {
      const [s, td] = await Promise.all([
        getMoodSeriesLastNDays(days),
        getMoodForDate(todayMoodKey()),
      ]);
      if (!mounted) return;
      setSeries(Array.isArray(s) ? s : []);
      setToday(td);
    })().catch(() => {});

    return () => {
      mounted = false;
    };
  }, [days]);

  useFocusEffect(load);

  const maxHeight = 70;

  const avg = useMemo(() => {
    const vals = series.map((x) => x.score).filter((v) => typeof v === 'number');
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [series]);

  return (
    <View>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, isDark && { color: '#e5e7eb' }]}>
            {t('mood.chartTitle')}
          </Text>
          <Text style={[styles.subtitle, isDark && { color: '#94a3b8' }]}>
            {t('mood.chartSubtitle')}
          </Text>
        </View>

        <View style={[styles.pill, { backgroundColor: `${accent}18`, borderColor: `${accent}33` }]}>
          <Text style={[styles.pillText, { color: accent }]}>
            {today?.emoji ? `${t('mood.todayLabel')}: ${today.emoji}` : `${t('mood.todayLabel')}: —`}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.chart,
          isDark && { backgroundColor: '#0b1120', borderColor: '#1e293b' },
          embedded && styles.chartEmbedded,
        ]}
      >
        <View style={styles.barsRow}>
          {series.map((d) => {
            const score = typeof d.score === 'number' ? d.score : null;
            const h = score ? Math.max(6, Math.round((score / 5) * maxHeight)) : 6;
            const filled = !!score;
            return (
              <View key={d.date} style={styles.barCol}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: h,
                      backgroundColor: filled ? accent : (isDark ? '#1e293b' : '#e2e8f0'),
                      opacity: filled ? 1 : 0.6,
                    },
                  ]}
                />
                <Text style={[styles.dayLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  {String(d.date).slice(-2)}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.legendRow}>
          {typeof avg === 'number' ? (
            <Text style={[styles.legendText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              Promedio: {avg.toFixed(1)}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748b',
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  chart: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chartEmbedded: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    borderRadius: 10,
  },
  dayLabel: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '700',
  },
  legendRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
