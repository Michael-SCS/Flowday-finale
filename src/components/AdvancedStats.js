import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../utils/i18n';
import { useSettings, getAccentColor } from '../utils/settingsContext';
import { loadActivities } from '../utils/localActivities';
import { loadPomodoroStats } from '../utils/pomodoroStats';

function getToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function AdvancedStatsScreen() {
  const { t } = useI18n();
  const { themeColor, themeMode } = useSettings();
  const accent = getAccentColor(themeColor);
  const isDark = themeMode === 'dark';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const activitiesByDate = await loadActivities();
        const pomodoroByDate = await loadPomodoroStats();

        const today = getToday();
        const ONE_DAY = 24 * 60 * 60 * 1000;

        // Últimos 7 días
        const last7Days = [];
        for (let i = 6; i >= 0; i -= 1) {
          const d = new Date(today.getTime() - i * ONE_DAY);
          last7Days.push(dateKey(d));
        }

        // Últimos 30 días
        const last30Days = [];
        for (let i = 29; i >= 0; i -= 1) {
          const d = new Date(today.getTime() - i * ONE_DAY);
          last30Days.push(dateKey(d));
        }

        let weekTotal = 0;
        let weekCompleted = 0;

        last7Days.forEach((ds) => {
          const dayActs = activitiesByDate[ds] || [];
          weekTotal += dayActs.length;
          weekCompleted += dayActs.filter((a) => a.completed).length;
        });

        let monthTotal = 0;
        let monthCompleted = 0;

        last30Days.forEach((ds) => {
          const dayActs = activitiesByDate[ds] || [];
          monthTotal += dayActs.length;
          monthCompleted += dayActs.filter((a) => a.completed).length;
        });

        // Racha actual global (días consecutivos con al menos una actividad completada)
        let currentStreak = 0;
        for (let i = 0; i < last30Days.length; i += 1) {
          const idx = last30Days.length - 1 - i; // desde hoy hacia atrás
          const key = last30Days[idx];
          const acts = activitiesByDate[key] || [];
          const hasCompleted = acts.some((a) => a.completed);
          if (hasCompleted) {
            currentStreak += 1;
          } else {
            break;
          }
        }

        // Cumplimiento por día de la semana (últimos 30 días)
        const weekdayStats = [
          { label: 'Dom', total: 0, completed: 0 },
          { label: 'Lun', total: 0, completed: 0 },
          { label: 'Mar', total: 0, completed: 0 },
          { label: 'Mié', total: 0, completed: 0 },
          { label: 'Jue', total: 0, completed: 0 },
          { label: 'Vie', total: 0, completed: 0 },
          { label: 'Sáb', total: 0, completed: 0 },
        ];

        last30Days.forEach((ds) => {
          const acts = activitiesByDate[ds] || [];
          if (acts.length === 0) return;

          const [y, m, d] = ds.split('-').map(Number);
          const date = new Date(y, m - 1, d);
          const wd = date.getDay(); // 0-6
          const total = acts.length;
          const completed = acts.filter((a) => a.completed).length;
          weekdayStats[wd].total += total;
          weekdayStats[wd].completed += completed;
        });

        const weekdayWithPct = weekdayStats.map((w) => ({
          ...w,
          pct: w.total > 0 ? Math.round((w.completed / w.total) * 100) : 0,
        }));

        const bestWeekday = weekdayWithPct.reduce(
          (best, current) => {
            if (current.total === 0) return best;
            if (!best) return current;
            if (current.pct > best.pct) return current;
            return best;
          },
          null,
        );

        // Rachas por hábito (últimos 30 días)
        const habitMap = new Map();

        // inicializar mapa con todos los hábitos que aparezcan en los últimos 30 días
        last30Days.forEach((ds) => {
          const acts = activitiesByDate[ds] || [];
          acts.forEach((a) => {
            const key = a.habit_id || a.title;
            if (!key) return;
            if (!habitMap.has(key)) {
              habitMap.set(key, {
                id: key,
                title: a.title || 'Hábito',
                currentStreak: 0,
                bestStreak: 0,
                runningStreak: 0,
              });
            }
          });
        });

        // recorrer días en orden cronológico para calcular rachas
        last30Days.forEach((ds) => {
          const acts = activitiesByDate[ds] || [];
          const completedByHabit = new Set();
          acts.forEach((a) => {
            if (!a.completed) return;
            const key = a.habit_id || a.title;
            if (!key || !habitMap.has(key)) return;
            completedByHabit.add(key);
          });

          habitMap.forEach((value, key) => {
            if (completedByHabit.has(key)) {
              value.runningStreak += 1;
              if (value.runningStreak > value.bestStreak) {
                value.bestStreak = value.runningStreak;
              }
            } else {
              value.runningStreak = 0;
            }
          });
        });

        // la racha "actual" de cada hábito es la runningStreak después del último día
        habitMap.forEach((value) => {
          value.currentStreak = value.runningStreak;
        });

        const topHabits = Array.from(habitMap.values())
          .filter((h) => h.bestStreak > 0)
          .sort((a, b) => b.bestStreak - a.bestStreak)
          .slice(0, 3);

        // Bloque: mejor franja horaria para cumplir (según actividades completadas)
        const timeBuckets = [
          { id: 'morning', label: 'Mañana', from: 5, to: 12, total: 0 }, // 05:00-11:59
          { id: 'afternoon', label: 'Tarde', from: 12, to: 18, total: 0 }, // 12:00-17:59
          { id: 'evening', label: 'Noche', from: 18, to: 24, total: 0 }, // 18:00-23:59
        ];

        last30Days.forEach((ds) => {
          const acts = activitiesByDate[ds] || [];
          acts.forEach((a) => {
            if (!a.completed || !a.time) return;
            const [hh] = String(a.time).split(':');
            const hour = parseInt(hh, 10);
            if (Number.isNaN(hour)) return;

            const bucket = timeBuckets.find((b) => hour >= b.from && hour < b.to);
            if (bucket) {
              bucket.total += 1;
            }
          });
        });

        const bestTimeBucket = timeBuckets.reduce(
          (best, current) => {
            if (current.total === 0) return best;
            if (!best) return current;
            if (current.total > best.total) return current;
            return best;
          },
          null,
        );

        // Resumen Pomodoro (minutos de foco)
        let pomodoroWeekMinutes = 0;
        last7Days.forEach((ds) => {
          const v = pomodoroByDate[ds];
          if (typeof v === 'number') {
            pomodoroWeekMinutes += v;
          }
        });

        let pomodoroMonthMinutes = 0;
        last30Days.forEach((ds) => {
          const v = pomodoroByDate[ds];
          if (typeof v === 'number') {
            pomodoroMonthMinutes += v;
          }
        });

        let pomodoroStreak = 0;
        for (let i = 0; i < last30Days.length; i += 1) {
          const idx = last30Days.length - 1 - i;
          const key = last30Days[idx];
          const v = pomodoroByDate[key];
          if (typeof v === 'number' && v > 0) {
            pomodoroStreak += 1;
          } else {
            break;
          }
        }

        const weekPct = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;
        const monthPct = monthTotal > 0 ? Math.round((monthCompleted / monthTotal) * 100) : 0;

        setSummary({
          weekCompleted,
          weekTotal,
          weekPct,
          monthCompleted,
          monthTotal,
          monthPct,
          currentStreak,
          weekdayWithPct,
          bestWeekday,
          topHabits,
          timeBuckets,
          bestTimeBucket,
          pomodoroWeekMinutes,
          pomodoroMonthMinutes,
          pomodoroStreak,
        });
      } catch (e) {
        setError(e.message || 'Error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, isDark && { backgroundColor: '#020617' }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={[styles.headerIconCircle, { backgroundColor: `${accent}15` }]}>
            <Ionicons name="stats-chart" size={24} color={accent} />
          </View>
          <View style={styles.headerTextBox}>
            <Text style={[styles.headerTitle, isDark && { color: '#e5e7eb' }]}>{t('profile.proStatsTitle')}</Text>
            <Text style={[styles.headerSubtitle, isDark && { color: '#94a3b8' }]}>Resumen avanzado</Text>
          </View>
        </View>

        {loading && (
          <View style={styles.centerBox}>
            <ActivityIndicator color={accent} size="large" />
          </View>
        )}

        {!loading && error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={32} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!loading && !error && summary && (
          <>
            {/* Resumen rápido */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tu semana y tu mes</Text>
              <View style={styles.row}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Esta semana</Text>
                  <Text style={[styles.metricValue, { color: accent }]}>{summary.weekPct}%</Text>
                  <Text style={styles.metricHint}>
                    {summary.weekCompleted}/{summary.weekTotal} actividades completadas
                  </Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Este mes</Text>
                  <Text style={[styles.metricValue, { color: accent }]}>{summary.monthPct}%</Text>
                  <Text style={styles.metricHint}>
                    {summary.monthCompleted}/{summary.monthTotal} actividades completadas
                  </Text>
                </View>
              </View>
            </View>

            {/* Racha actual global */}
            <View style={styles.card}>
              <View style={styles.streakRow}>
                <Ionicons name="flame" size={22} color={accent} />
                <Text style={styles.cardTitle}>Racha actual</Text>
              </View>
              <Text style={[styles.streakNumber, { color: accent }]}>{summary.currentStreak}</Text>
              <Text style={styles.streakHint}>
                días seguidos con al menos una actividad completada
              </Text>
            </View>

            {/* Mejor hora del día para cumplir */}
            {summary.timeBuckets && summary.bestTimeBucket && (
              <View style={styles.card}>
                <View style={styles.streakRow}>
                  <Ionicons name="time-outline" size={20} color={accent} />
                  <Text style={styles.cardTitle}>Mejor momento del día</Text>
                </View>
                <View style={styles.timeRow}>
                  {summary.timeBuckets.map((b) => (
                    <View
                      key={b.id}
                      style={[
                        styles.timeBox,
                        b.id === summary.bestTimeBucket.id && [
                          styles.timeBoxBest,
                          { borderColor: accent, backgroundColor: `${accent}10` },
                        ],
                      ]}
                    >
                      <Text
                        style={[
                          styles.timeLabel,
                          b.id === summary.bestTimeBucket.id && { color: accent },
                        ]}
                      >
                        {b.label}
                      </Text>
                      <Text style={styles.timeCount}>{b.total}</Text>
                      <Text style={styles.timeHint}>hábitos cumplidos</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.weekdayHint}>
                  Donde más cumples: {summary.bestTimeBucket.label}
                </Text>
              </View>
            )}

            {/* Mejores días de la semana */}
            {summary.weekdayWithPct && summary.bestWeekday && (
              <View style={styles.card}>
                <View style={styles.streakRow}>
                  <Ionicons name="calendar" size={20} color={accent} />
                  <Text style={styles.cardTitle}>Tus días más fuertes</Text>
                </View>
                <View style={styles.weekdayRow}>
                  {summary.weekdayWithPct.map((w) => (
                    <View
                      key={w.label}
                      style={[
                        styles.weekdayBox,
                        w.label === summary.bestWeekday.label && [
                          styles.weekdayBoxBest,
                          { borderColor: accent, backgroundColor: `${accent}10` },
                        ],
                      ]}
                    >
                      <Text
                        style={[
                          styles.weekdayLabel,
                          w.label === summary.bestWeekday.label && { color: accent },
                        ]}
                      >
                        {w.label}
                      </Text>
                      <Text style={styles.weekdayPct}>{w.pct}%</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.weekdayHint}>
                  Mejor día: {summary.bestWeekday.label} ({summary.bestWeekday.pct}% de
                  cumplimiento)
                </Text>
              </View>
            )}

            {/* Top hábitos por racha */}
            {summary.topHabits && summary.topHabits.length > 0 && (
              <View style={styles.card}>
                <View style={styles.streakRow}>
                  <Ionicons name="ribbon-outline" size={20} color={accent} />
                  <Text style={styles.cardTitle}>Hábitos con mejor racha</Text>
                </View>
                {summary.topHabits.map((h) => (
                  <View key={h.id} style={styles.habitRow}>
                    <View style={styles.habitTextBox}>
                      <Text style={styles.habitTitle}>{h.title}</Text>
                      <Text style={styles.habitSubtitle}>
                        Mejor racha: {h.bestStreak} días · Actual: {h.currentStreak} días
                      </Text>
                    </View>
                    <View style={[styles.habitBadge, { borderColor: accent }]}> 
                      <Text style={[styles.habitBadgeText, { color: accent }]}>🔥 {h.bestStreak}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Resumen de Pomodoro enfocado */}
            {(summary.pomodoroWeekMinutes > 0 || summary.pomodoroMonthMinutes > 0) && (
              <View style={styles.card}>
                <View style={styles.streakRow}>
                  <Ionicons name="flame-outline" size={20} color={accent} />
                  <Text style={styles.cardTitle}>Tu foco con Pomodoro</Text>
                </View>
                <View style={styles.row}>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Esta semana</Text>
                    <Text style={[styles.metricValue, { color: accent }]}>
                      {summary.pomodoroWeekMinutes} min
                    </Text>
                    <Text style={styles.metricHint}>minutos de foco completados</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Últimos 30 días</Text>
                    <Text style={[styles.metricValue, { color: accent }]}>
                      {summary.pomodoroMonthMinutes} min
                    </Text>
                    <Text style={styles.metricHint}>minutos totales de foco</Text>
                  </View>
                </View>
                {summary.pomodoroStreak > 0 && (
                  <Text style={[styles.weekdayHint, { marginTop: 8 }]}>
                    Racha de días con foco: {summary.pomodoroStreak}
                  </Text>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scroll: {
    padding: 20,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextBox: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  centerBox: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    flex: 1,
    color: '#b91c1c',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#0b1120',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#e5e7eb',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  metricBox: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#020617',
  },
  metricLabel: {
    fontSize: 13,
    color: '#cbd5e1',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  metricHint: {
    marginTop: 4,
    fontSize: 12,
    color: '#94a3b8',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: '900',
  },
  streakHint: {
    marginTop: 4,
    fontSize: 13,
    color: '#6b7280',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  timeBox: {
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    alignItems: 'center',
  },
  timeBoxBest: {
    borderWidth: 1.5,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  timeCount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  timeHint: {
    marginTop: 2,
    fontSize: 11,
    color: '#6b7280',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  weekdayBox: {
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    alignItems: 'center',
  },
  weekdayBoxBest: {
    borderWidth: 1.5,
  },
  weekdayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  weekdayPct: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  weekdayHint: {
    marginTop: 10,
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  habitTextBox: {
    flex: 1,
    paddingRight: 8,
  },
  habitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  habitSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  habitBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: '#f9fafb',
  },
  habitBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
