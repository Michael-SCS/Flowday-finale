import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Pressable, Image, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useI18n } from '../utils/i18n';
import { useSettings, getAccentColor } from '../utils/settingsContext';

export default function PremiumUpsellScreen() {
  const { t } = useI18n();
  const { themeColor, themeMode } = useSettings();
  const accent = getAccentColor(themeColor);
  const isDark = themeMode === 'dark';
  const [selectedPlan, setSelectedPlan] = useState('annual');

  const bg = isDark ? '#020617' : '#f8fafc';
  const textColor = isDark ? '#e5e7eb' : '#0f172a';
  const muted = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#0b1220' : '#ffffff';
  const borderColor = isDark ? '#1e293b' : '#e2e8f0';
  const planEmphasisBg = isDark ? '#111827' : '#fffbeb';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bg }] }>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { backgroundColor: bg }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerIconWrapper}>
          <View style={[styles.headerIconCircle, { borderColor: accent, backgroundColor: cardBg }]}> 
            <MaterialCommunityIcons name="crown-outline" size={36} color={accent} />
          </View>
        </View>

        <Text style={[styles.title, { color: textColor }]}>{t('premium.title')}</Text>
        <Text style={[styles.subtitle, { color: muted }]}>{t('premium.subtitle')}</Text>
        <Text style={[styles.sectionTitle, { color: textColor }]}>{t('premium.featuresTitle')}</Text>

        {/* Bloque: Estadísticas avanzadas */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }] }>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconCircle, { backgroundColor: `${accent}15` }]}>
              <Ionicons name="stats-chart" size={20} color={accent} />
            </View>
            <Text style={[styles.cardTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>{t('premium.statsTitle')}</Text>
          </View>
          <Text style={[styles.cardText, { color: isDark ? '#cbd5e1' : '#334155' }]}>{t('premium.statsDescription')}</Text>
        </View>

        {/* Bloque: Hábitos inteligentes */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }] }>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconCircle, { backgroundColor: `${accent}15` }]}>
              <Ionicons name="bulb-outline" size={20} color={accent} />
            </View>
            <Text style={[styles.cardTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>{t('premium.smartHabitsTitle')}</Text>
          </View>
          <Text style={[styles.cardText, { color: isDark ? '#cbd5e1' : '#334155' }]}>{t('premium.smartHabitsDescription')}</Text>
        </View>

        {/* Bloque: Profundidad y enfoque */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }] }>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconCircle, { backgroundColor: `${accent}15` }]}>
              <Ionicons name="timer-outline" size={20} color={accent} />
            </View>
            <Text style={[styles.cardTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>{t('premium.focusTitle')}</Text>
          </View>
          <Text style={[styles.cardText, { color: isDark ? '#cbd5e1' : '#334155' }]}>{t('premium.focusDescription')}</Text>
        </View>

        {/* Bloque: Calendario + reflexión diaria */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }] }>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconCircle, { backgroundColor: `${accent}15` }]}>
              <Ionicons name="calendar-outline" size={20} color={accent} />
            </View>
            <Text style={[styles.cardTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>{t('premium.calendarTitle')}</Text>
          </View>
          <Text style={[styles.cardText, { color: isDark ? '#cbd5e1' : '#334155' }]}>{t('premium.calendarDescription')}</Text>
        </View>

        {/* Bloque: Plan semanal guiado + días llenos */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }] }>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconCircle, { backgroundColor: `${accent}15` }]}>
              <Ionicons name="sparkles-outline" size={20} color={accent} />
            </View>
            <Text style={[styles.cardTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>{t('premium.weeklyPlannerTitle')}</Text>
          </View>
          <Text style={[styles.cardText, { color: isDark ? '#cbd5e1' : '#334155' }]}>{t('premium.weeklyPlannerDescription')}</Text>

          <View style={[styles.inlineDivider, { backgroundColor: borderColor }]} />

          <View style={styles.inlineRow}>
            <Ionicons name="warning-outline" size={18} color={accent} />
            <Text style={[styles.cardText, { color: isDark ? '#cbd5e1' : '#334155' }]}>{t('premium.overloadDescription')}</Text>
          </View>
        </View>

        <View style={styles.mascotWrapper}>
          <Image
            source={require('../../assets/Fluu-premium.png')}
            style={styles.mascotImage}
            resizeMode="contain"
          />
        </View>

        {/* Sección de precios */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>{t('premium.plansTitle')}</Text>

        <View style={styles.plansRow}>
          {/* Plan mensual */}
          <Pressable
            onPress={() => setSelectedPlan('monthly')}
            style={[
              styles.planCard,
              selectedPlan === 'monthly' && styles.planCardSelected,
              { backgroundColor: cardBg, borderColor },
            ]}
          >
            <View style={styles.planHeaderRow}>
              <Text style={[styles.planLabel, { color: textColor }]}>{t('premium.monthlyLabel')}</Text>
              {selectedPlan === 'monthly' && (
                <View style={styles.planSelectedPill}>
                  <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                  <Text style={styles.planSelectedPillText}>{t('premium.selectedLabel')}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.planPrice, { color: textColor }]}>{t('premium.monthlyPrice')}</Text>
            <Text style={[styles.planTagline, { color: muted }]}>{t('premium.monthlyTagline')}</Text>
          </Pressable>

          {/* Plan anual */}
          <Pressable
            onPress={() => setSelectedPlan('annual')}
            style={[
              styles.planCard,
              styles.planCardEmphasis,
              selectedPlan === 'annual' && styles.planCardSelected,
              { backgroundColor: planEmphasisBg, borderColor: accent },
            ]}
          >
            <View style={styles.planBadgeRow}>
              <Text style={styles.planBadgeText}>{t('premium.annualBadge')}</Text>
            </View>
            <View style={styles.planHeaderRow}>
              <Text style={[styles.planLabel, { color: textColor }]}>{t('premium.annualLabel')}</Text>
              {selectedPlan === 'annual' && (
                <View style={styles.planSelectedPill}>
                  <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                  <Text style={styles.planSelectedPillText}>{t('premium.selectedLabel')}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.planPrice, { color: textColor }]}>{t('premium.annualPrice')}</Text>
            <Text style={styles.planSavings}>{t('premium.annualSavings')}</Text>
            <Text style={[styles.planOneTime, { color: muted }]}>{t('premium.annualOneTime')}</Text>
            <Text style={[styles.planMessage, { color: muted }]}>{t('premium.annualMessage')}</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={[styles.ctaButton, { backgroundColor: accent, shadowColor: accent }]}
            onPress={() => {
              // Aquí conectarás con tu flujo de pago/backend
              // usando selectedPlan ('monthly' | 'annual').
            }}
          >
            <Ionicons name="sparkles" size={22} color="#fff" />
            <Text style={styles.ctaText}>{t('premium.ctaPrimary')}</Text>
          </Pressable>

          <Text style={[styles.comingSoonText, { color: muted }]}>{t('premium.ctaSecondary')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  headerIconWrapper: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  headerIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'left',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  cardText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    fontWeight: '600',
  },
  mascotWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mascotImage: {
    width: 160,
    height: 160,
  },
  inlineDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  footer: {
    alignItems: 'center',
    gap: 10,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 999,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  comingSoonText: {
    marginTop: 8,
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
  },
  // Precios
  plansRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  planCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  planCardEmphasis: {
    borderWidth: 2,
    borderColor: '#FACC15',
    backgroundColor: '#fffbeb',
  },
  planCardSelected: {
    borderWidth: 2,
    borderColor: '#FACC15',
    backgroundColor: '#fffbeb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  planHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  planBadgeRow: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FACC15',
    marginBottom: 6,
  },
  planBadgeText: {
    fontSize: 11,
    color: '#1f2937',
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  planLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  planTagline: {
    fontSize: 12,
    color: '#64748b',
  },
  planSavings: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '700',
    marginBottom: 2,
  },
  planOneTime: {
    fontSize: 11,
    color: '#4b5563',
    marginBottom: 4,
  },
  planMessage: {
    fontSize: 11,
    color: '#6b7280',
  },
  planSelectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#dcfce7',
    gap: 4,
  },
  planSelectedPillText: {
    fontSize: 11,
    color: '#15803d',
    fontWeight: '700',
  },
});
