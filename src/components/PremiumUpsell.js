import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Pressable, Image, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useI18n } from '../utils/i18n';

export default function PremiumUpsellScreen() {
  const { t } = useI18n();
  const accent = '#FACC15';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerIconWrapper}>
          <View style={[styles.headerIconCircle, { borderColor: accent }]}> 
            <MaterialCommunityIcons name="crown-outline" size={36} color={accent} />
          </View>
        </View>

        <Text style={styles.title}>{t('premium.title')}</Text>
        <Text style={styles.subtitle}>{t('premium.subtitle')}</Text>

        <Text style={styles.sectionTitle}>{t('premium.featuresTitle')}</Text>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Ionicons name="checkmark-circle" size={22} color={accent} />
            <Text style={styles.cardText}>{t('premium.benefit1')}</Text>
          </View>
          <View style={styles.cardRow}>
            <Ionicons name="checkmark-circle" size={22} color={accent} />
            <Text style={styles.cardText}>{t('premium.benefit2')}</Text>
          </View>
          <View style={styles.cardRow}>
            <Ionicons name="checkmark-circle" size={22} color={accent} />
            <Text style={styles.cardText}>{t('premium.benefit3')}</Text>
          </View>
          <View style={styles.cardRow}>
            <Ionicons name="checkmark-circle" size={22} color={accent} />
            <Text style={styles.cardText}>{t('premium.benefit4')}</Text>
          </View>
        </View>

        <View style={styles.mascotWrapper}>
          <Image
            source={require('../../assets/Fluu-premium.png')}
            style={styles.mascotImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.footer}>
          <Pressable
            style={[styles.ctaButton, { backgroundColor: accent, shadowColor: accent }]}
            onPress={() => {}}
          >
            <Ionicons name="sparkles" size={22} color="#fff" />
            <Text style={styles.ctaText}>{t('premium.cta')}</Text>
          </Pressable>

          <Text style={styles.comingSoonText}>{t('premium.comingSoon')}</Text>
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
});
