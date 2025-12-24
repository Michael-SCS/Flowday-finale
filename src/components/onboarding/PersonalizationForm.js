import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Switch, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  KeyboardAvoidingView,
  Platform,
  Animated
} from 'react-native';
import { supabase } from '../../utils/supabase';
import { useI18n } from '../../utils/i18n';
import { useSettings } from '../../utils/settingsContext';

export default function PersonalizationForm({ navigation }) {
  const [sleepProblems, setSleepProblems] = useState(false);
  const [concentrationProblems, setConcentrationProblems] = useState(false);
  const [stressLevel, setStressLevel] = useState(3);
  const [mainGoal, setMainGoal] = useState('productivity');
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();
  const { themeMode } = useSettings();

  async function savePersonalization() {
    setLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Usuario no autenticado');
      
      const payload = {
        user_id: user.id,
        sleep_problems: sleepProblems,
        concentration_problems: concentrationProblems,
        stress_level: stressLevel,
        main_goal: mainGoal,
      };
      
      const { error } = await supabase.from('user_onboarding').upsert(payload);
      if (error) throw error;
      
      navigation.replace('Final');
    } catch (err) {
      alert(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  const isDark = themeMode === 'dark';
  const bg = isDark ? '#0f172a' : '#f8fafc';
  const textColor = isDark ? '#f1f5f9' : '#0f172a';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const mutedText = isDark ? '#94a3b8' : '#64748b';

  return (
    <KeyboardAvoidingView 
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <Animated.ScrollView 
        style={[styles.container, { backgroundColor: bg }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={true}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>
            {t('personalization.title')}
          </Text>
          <Text style={[styles.subtitle, { color: mutedText }]}>
            Ayúdanos a personalizar tu experiencia
          </Text>
        </View>

        {/* Problemas de sueño y concentración */}
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text style={styles.switchIcon}>😴</Text>
              <View style={styles.switchTextContainer}>
                <Text style={[styles.switchTitle, { color: textColor }]}>
                  {t('personalization.sleepProblems')}
                </Text>
                <Text style={[styles.switchSubtitle, { color: mutedText }]}>
                  Dificultad para dormir
                </Text>
              </View>
            </View>
            <Switch 
              value={sleepProblems} 
              onValueChange={setSleepProblems}
              trackColor={{ false: isDark ? '#334155' : '#cbd5e1', true: '#10b981' }}
              thumbColor={sleepProblems ? '#ffffff' : '#f1f5f9'}
              ios_backgroundColor={isDark ? '#334155' : '#cbd5e1'}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]} />

          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text style={styles.switchIcon}>🎯</Text>
              <View style={styles.switchTextContainer}>
                <Text style={[styles.switchTitle, { color: textColor }]}>
                  {t('personalization.concentrationProblems')}
                </Text>
                <Text style={[styles.switchSubtitle, { color: mutedText }]}>
                  Problemas de enfoque
                </Text>
              </View>
            </View>
            <Switch 
              value={concentrationProblems} 
              onValueChange={setConcentrationProblems}
              trackColor={{ false: isDark ? '#334155' : '#cbd5e1', true: '#10b981' }}
              thumbColor={concentrationProblems ? '#ffffff' : '#f1f5f9'}
              ios_backgroundColor={isDark ? '#334155' : '#cbd5e1'}
            />
          </View>
        </View>

        {/* Nivel de estrés */}
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📊</Text>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              {t('personalization.stressLevel')}
            </Text>
          </View>
          <Text style={[styles.stressValue, { color: isDark ? '#a78bfa' : '#6366f1' }]}>
            Nivel {stressLevel} de 5
          </Text>
          <View style={styles.stressRow}>
            {[1, 2, 3, 4, 5].map((n) => {
              const isActive = stressLevel === n;
              return (
                <TouchableOpacity 
                  key={n} 
                  style={[
                    styles.stressBtn,
                    {
                      backgroundColor: isActive 
                        ? '#f97316'
                        : (isDark ? '#334155' : '#f1f5f9'),
                      borderColor: isActive 
                        ? '#fb923c'
                        : (isDark ? '#475569' : '#e2e8f0'),
                    }
                  ]} 
                  onPress={() => setStressLevel(n)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.stressBtnText,
                    { color: isActive ? '#ffffff' : textColor }
                  ]}>
                    {n}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.stressLabels}>
            <Text style={[styles.stressLabel, { color: mutedText }]}>Bajo</Text>
            <Text style={[styles.stressLabel, { color: mutedText }]}>Alto</Text>
          </View>
        </View>

        {/* Objetivo principal */}
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🎯</Text>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              {t('personalization.mainGoal')}
            </Text>
          </View>
          <View style={styles.goalsContainer}>
            {[
              { key: 'sleep', label: t('personalization.goalSleep'), icon: '😴' },
              { key: 'productivity', label: t('personalization.goalProductivity'), icon: '⚡' },
              { key: 'wellbeing', label: t('personalization.goalWellbeing'), icon: '🌟' },
              { key: 'organization', label: t('personalization.goalOrganization'), icon: '📋' },
            ].map((g) => {
              const isActive = mainGoal === g.key;
              return (
                <TouchableOpacity 
                  key={g.key} 
                  style={[
                    styles.goalBtn,
                    {
                      backgroundColor: isActive 
                        ? (isDark ? '#6366f1' : '#4f46e5')
                        : (isDark ? '#334155' : '#f8fafc'),
                      borderColor: isActive 
                        ? (isDark ? '#818cf8' : '#6366f1')
                        : (isDark ? '#475569' : '#e2e8f0'),
                    }
                  ]} 
                  onPress={() => setMainGoal(g.key)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.goalIcon}>{g.icon}</Text>
                  <Text style={[
                    styles.goalText,
                    { color: isActive ? '#ffffff' : textColor }
                  ]}>
                    {g.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity 
          style={[
            styles.btn,
            { 
              backgroundColor: isDark ? '#10b981' : '#16a34a',
              opacity: loading ? 0.7 : 1,
            }
          ]} 
          onPress={savePersonalization} 
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.btnText}>
              ✓ {t('personalization.finish')}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 60,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  switchIcon: {
    fontSize: 28,
  },
  switchTextContainer: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  switchSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  stressValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  stressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  stressBtn: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  stressBtnText: {
    fontSize: 20,
    fontWeight: '700',
  },
  stressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  stressLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  goalsContainer: {
    gap: 10,
  },
  goalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  goalIcon: {
    fontSize: 24,
  },
  goalText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  btn: {
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#16a34a',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
    minHeight: 56,
    justifyContent: 'center',
  },
  btnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: -0.3,
  },
});