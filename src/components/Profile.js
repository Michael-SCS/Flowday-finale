import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView, TextInput, Modal, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';
import { useSettings, getAccentColor } from '../utils/settingsContext';
import { useI18n, translate } from '../utils/i18n';
import { clearLocalHabits } from '../utils/localHabits';
import { clearActivities } from '../utils/localActivities';
import { clearHabitCache } from '../utils/habitCache';
import { useTour } from '../utils/tourContext';
import { useProStatus } from '../utils/proStatus';
import { loadActivities as loadUserActivities } from '../utils/localActivities';
import { clearPomodoroStats } from '../utils/pomodoroStats';

export default function ProfileScreen() {
  const { themeColor, language, setThemeColor, setLanguage } = useSettings();
  const { t } = useI18n();
  const { openTour } = useTour();
  const { isPro } = useProStatus();
  const accent = getAccentColor(themeColor);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [edad, setEdad] = useState('');
  const [genero, setGenero] = useState('');
  const [languageValue, setLanguageValue] = useState(language || 'es');
  const genderOptions = [
    'Masculino',
    'Femenino',
    'No binario',
    'Género fluido',
    'Prefiero no decirlo',
    'Otro',
  ];

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError(t('profile.loadUserError'));
        setProfile(null);
        return;
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('id, nombre, apellido, edad, genero, email, language')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        setError(t('profile.loadProfileError'));
        setProfile(null);
        return;
      }

      if (!data) {
        setError(t('profile.noProfileConfigured'));
        setProfile(null);
        return;
      }

      setProfile(data);
      setNombre(data.nombre || '');
      setApellido(data.apellido || '');
      setEdad(
        data.edad !== null && data.edad !== undefined ? String(data.edad) : ''
      );
      setGenero(data.genero || '');
      if (data.language) {
        setLanguageValue(data.language);
        setLanguage(data.language);
      }
    } catch {
      setError(t('profile.unexpectedLoadError'));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (isPro !== true) return;

    let cancelled = false;
    const loadStats = async () => {
      try {
        setStatsLoading(true);
        const activitiesByDate = await loadUserActivities();

        const today = new Date();
        const ONE_DAY = 24 * 60 * 60 * 1000;

        const dateStr = (d) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        };

        const last7Days = [];
        for (let i = 6; i >= 0; i -= 1) {
          const d = new Date(today.getTime() - i * ONE_DAY);
          last7Days.push(dateStr(d));
        }

        let weekTotal = 0;
        let weekCompleted = 0;
        let bestDay = null;
        let bestRatio = 0;

        last7Days.forEach((ds) => {
          const acts = activitiesByDate[ds] || [];
          const total = acts.length;
          const completed = acts.filter((a) => a.completed).length;
          weekTotal += total;
          weekCompleted += completed;

          if (total > 0) {
            const ratio = completed / total;
            if (ratio > bestRatio) {
              bestRatio = ratio;
              bestDay = { date: ds, completed, total };
            }
          }
        });

        if (!cancelled) {
          setStats({
            weekTotal,
            weekCompleted,
            bestDay,
          });
        }
      } catch {
        if (!cancelled) {
          setStats(null);
        }
      } finally {
        if (!cancelled) {
          setStatsLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      cancelled = true;
    };
  }, [isPro]);

  const handleSave = async () => {
    if (!profile) return;
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const edadNumber = edad ? parseInt(edad, 10) : null;

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          nombre: nombre || profile.nombre,
          apellido: apellido || null,
          edad: Number.isNaN(edadNumber) ? null : edadNumber,
          genero: genero || null,
          language: languageValue || 'es',
        })
        .eq('id', profile.id)
        .select('id, nombre, apellido, edad, genero, email, language')
        .maybeSingle();

      if (updateError) {
        setError(t('profile.updateError'));
        return;
      }

      if (data) {
        setProfile(data);
        const nextLanguage = data.language || languageValue || language || 'es';
        setSuccessMessage(translate('profile.updated', nextLanguage));
        if (data.language) {
          setLanguage(data.language);
        }
        setShowSettingsModal(false);
      }
    } catch {
      setError(t('profile.unexpectedUpdateError'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      try {
        await clearHabitCache();
        await clearLocalHabits();
        await clearActivities();
        await clearPomodoroStats();
      } catch {
      }

      await supabase.auth.signOut();
    } catch {
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* HEADER CON BANNER Y AVATAR */}
        <View style={styles.headerSection}>
          <View style={styles.bannerContainer}>
            <Image
              source={require('../../assets/Banner.png')}
              style={styles.bannerImage}
              resizeMode="cover"
            />
            <View style={styles.bannerOverlay} />
            <Pressable
              style={[styles.settingsIconButton, { backgroundColor: accent }]}
              onPress={() => setShowSettingsModal(true)}
            >
              <Ionicons name="settings-sharp" size={20} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.avatarSection}>
            <View style={[styles.avatarContainer, { borderColor: accent, shadowColor: accent }]}>
              <View style={[styles.avatarCircle, { backgroundColor: accent }]}>
                <Image
                  source={require('../../assets/mascota_saludando.png')}
                  style={styles.avatarImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={accent} size="large" />
            <Text style={styles.loadingText}>{t('profile.loading')}</Text>
          </View>
        ) : (
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {error && (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle" size={48} color="#ef4444" />
                <Text style={styles.errorTitle}>Oops!</Text>
                <Text style={styles.errorText}>{error}</Text>
                <Pressable
                  style={[styles.retryButton, { backgroundColor: accent }]}
                  onPress={loadProfile}
                >
                  <Ionicons name="refresh" size={18} color="#fff" />
                  <Text style={styles.retryButtonText}>{t('profile.retry')}</Text>
                </Pressable>
              </View>
            )}

            {profile && !error && (
              <>
                {/* CARD PRINCIPAL DEL PERFIL */}
                <View style={styles.mainProfileCard}>
                  <View style={styles.profileInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.profileName}>
                        {profile.nombre || 'Tu nombre'}
                        {profile.apellido && ` ${profile.apellido}`}
                      </Text>
                      {isPro === true && (
                        <View style={[styles.proBadge, { backgroundColor: `${accent}15`, borderColor: `${accent}40` }]}> 
                          <Ionicons name="crown" size={14} color={accent} />
                          <Text style={[styles.proBadgeText, { color: accent }]}>PRO</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.emailRow}>
                      <Ionicons name="mail" size={16} color="#64748b" />
                      <Text style={styles.emailText}>{profile.email}</Text>
                    </View>

                    <View style={styles.badgesRow}>
                      {edad && (
                        <View style={[styles.infoBadge, { backgroundColor: `${accent}15`, borderColor: `${accent}30` }]}>
                          <Ionicons name="calendar-outline" size={14} color={accent} />
                          <Text style={[styles.badgeText, { color: accent }]}>{edad} años</Text>
                        </View>
                      )}
                      {genero && (
                        <View style={[styles.infoBadge, { backgroundColor: `${accent}15`, borderColor: `${accent}30` }]}>
                          <Ionicons name="person-outline" size={14} color={accent} />
                          <Text style={[styles.badgeText, { color: accent }]}>{genero}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.preferencesRow}>
                      <View style={[styles.preferenceChip, { backgroundColor: `${accent}10` }]}>
                        <Ionicons name="color-palette" size={14} color={accent} />
                        <Text style={[styles.preferenceText, { color: accent }]}>{themeColor}</Text>
                      </View>
                      <View style={[styles.preferenceChip, { backgroundColor: `${accent}10` }]}>
                        <Ionicons name="language" size={14} color={accent} />
                        <Text style={[styles.preferenceText, { color: accent }]}>{language.toUpperCase()}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.hintBox}>
                    <Ionicons name="information-circle" size={18} color="#94a3b8" />
                    <Text style={styles.hintText}>{t('profile.profileHint')}</Text>
                  </View>
                </View>

                {/* ESTADÍSTICAS PRO */}
                {isPro === true && (
                  <View style={styles.statsCard}>
                    <View style={styles.statsHeader}>
                      <View style={[styles.statsIconBox, { backgroundColor: `${accent}20` }]}>
                        <Ionicons name="trending-up" size={22} color={accent} />
                      </View>
                      <View style={styles.statsHeaderText}>
                        <Text style={styles.statsTitle}>{t('profile.proStatsTitle')}</Text>
                        <Text style={styles.statsSubtitle}>Últimos 7 días</Text>
                      </View>
                    </View>

                    {statsLoading ? (
                      <View style={styles.statsLoading}>
                        <ActivityIndicator color={accent} size="small" />
                      </View>
                    ) : !stats || stats.weekTotal === 0 ? (
                      <View style={styles.emptyStats}>
                        <Ionicons name="bar-chart-outline" size={32} color="#cbd5e1" />
                        <Text style={styles.emptyStatsText}>{t('profile.proStatsEmpty')}</Text>
                      </View>
                    ) : (
                      <View style={styles.statsGrid}>
                        <View style={[styles.statBox, { backgroundColor: `${accent}08` }]}>
                          <Text style={styles.statLabel}>{t('profile.proStatsWeekLabel')}</Text>
                          <Text style={[styles.statValue, { color: accent }]}>
                            {stats.weekCompleted}/{stats.weekTotal}
                          </Text>
                          <View style={styles.progressBar}>
                            <View 
                              style={[
                                styles.progressFill, 
                                { 
                                  backgroundColor: accent,
                                  width: `${(stats.weekCompleted / stats.weekTotal) * 100}%` 
                                }
                              ]} 
                            />
                          </View>
                        </View>

                        {stats.bestDay && (
                          <View style={[styles.statBox, { backgroundColor: `${accent}08` }]}>
                            <Text style={styles.statLabel}>{t('profile.proStatsBestDayLabel')}</Text>
                            <Text style={[styles.statValue, { color: accent }]}>
                              {stats.bestDay.completed}/{stats.bestDay.total}
                            </Text>
                            <View style={styles.progressBar}>
                              <View 
                                style={[
                                  styles.progressFill, 
                                  { 
                                    backgroundColor: accent,
                                    width: `${(stats.bestDay.completed / stats.bestDay.total) * 100}%` 
                                  }
                                ]} 
                              />
                            </View>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}

                {/* BOTÓN CERRAR SESIÓN */}
                <Pressable
                  style={[styles.logoutButton, { borderColor: accent }]}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={22} color={accent} />
                  <Text style={[styles.logoutText, { color: accent }]}>{t('profile.logout')}</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        )}

        {/* MODAL POLÍTICA */}
        <Modal
          visible={showPolicyModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowPolicyModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHandle} />
                <View style={styles.modalTitleRow}>
                  <View style={[styles.modalIconCircle, { backgroundColor: `${accent}20` }]}>
                    <Ionicons name="shield-checkmark" size={24} color={accent} />
                  </View>
                  <Text style={styles.modalTitle}>{t('profile.privacyPolicy')}</Text>
                </View>
                <Pressable 
                  onPress={() => setShowPolicyModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={26} color="#6b7280" />
                </Pressable>
              </View>

              <ScrollView 
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator
              >
                <View style={styles.policySection}>
                  <Text style={styles.modalText}>{t('profile.privacyIntro')}</Text>
                </View>

                <View style={styles.policySection}>
                  <View style={styles.policySectionHeader}>
                    <View style={[styles.policySectionIcon, { backgroundColor: `${accent}15` }]}>
                      <Ionicons name="shield" size={18} color={accent} />
                    </View>
                    <Text style={styles.policySubtitle}>
                      {t('profile.privacyUseOfDataTitle')}
                    </Text>
                  </View>
                  <Text style={styles.modalText}>
                    {t('profile.privacyUseOfDataText')}
                  </Text>
                  <View style={styles.bulletList}>
                    <View style={styles.bulletItem}>
                      <View style={[styles.bulletDot, { backgroundColor: accent }]} />
                      <Text style={styles.bulletText}>
                        {t('profile.privacyUseOfDataBullet1')}
                      </Text>
                    </View>
                    <View style={styles.bulletItem}>
                      <View style={[styles.bulletDot, { backgroundColor: accent }]} />
                      <Text style={styles.bulletText}>
                        {t('profile.privacyUseOfDataBullet2')}
                      </Text>
                    </View>
                    <View style={styles.bulletItem}>
                      <View style={[styles.bulletDot, { backgroundColor: accent }]} />
                      <Text style={styles.bulletText}>
                        {t('profile.privacyUseOfDataBullet3')}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.policySection}>
                  <View style={styles.policySectionHeader}>
                    <View style={[styles.policySectionIcon, { backgroundColor: `${accent}15` }]}>
                      <Ionicons name="people" size={18} color={accent} />
                    </View>
                    <Text style={styles.policySubtitle}>
                      {t('profile.privacySharingTitle')}
                    </Text>
                  </View>
                  <Text style={styles.modalText}>
                    {t('profile.privacySharingText')}
                  </Text>
                </View>

                <View style={styles.policySection}>
                  <View style={styles.policySectionHeader}>
                    <View style={[styles.policySectionIcon, { backgroundColor: `${accent}15` }]}>
                      <Ionicons name="warning" size={18} color={accent} />
                    </View>
                    <Text style={styles.policySubtitle}>
                      {t('profile.privacyLiabilityTitle')}
                    </Text>
                  </View>
                  <Text style={styles.modalText}>
                    {t('profile.privacyLiabilityText')}
                  </Text>
                </View>

                <View style={styles.policySection}>
                  <View style={styles.policySectionHeader}>
                    <View style={[styles.policySectionIcon, { backgroundColor: `${accent}15` }]}>
                      <Ionicons name="medical" size={18} color={accent} />
                    </View>
                    <Text style={styles.policySubtitle}>
                      {t('profile.privacyNotAdviceTitle')}
                    </Text>
                  </View>
                  <Text style={styles.modalText}>
                    {t('profile.privacyNotAdviceText')}
                  </Text>
                </View>

                <View style={styles.policySection}>
                  <View style={styles.policySectionHeader}>
                    <View style={[styles.policySectionIcon, { backgroundColor: `${accent}15` }]}>
                      <Ionicons name="hand-right" size={18} color={accent} />
                    </View>
                    <Text style={styles.policySubtitle}>
                      {t('profile.privacyRightsTitle')}
                    </Text>
                  </View>
                  <Text style={styles.modalText}>
                    {t('profile.privacyRightsText')}
                  </Text>
                </View>

                <View style={styles.policySection}>
                  <View style={styles.policySectionHeader}>
                    <View style={[styles.policySectionIcon, { backgroundColor: `${accent}15` }]}>
                      <Ionicons name="happy" size={18} color={accent} />
                    </View>
                    <Text style={styles.policySubtitle}>
                      {t('profile.privacyMinorsTitle')}
                    </Text>
                  </View>
                  <Text style={styles.modalText}>
                    {t('profile.privacyMinorsText')}
                  </Text>
                </View>

                <View style={styles.policySection}>
                  <View style={styles.policySectionHeader}>
                    <View style={[styles.policySectionIcon, { backgroundColor: `${accent}15` }]}>
                      <Ionicons name="sync" size={18} color={accent} />
                    </View>
                    <Text style={styles.policySubtitle}>
                      {t('profile.privacyChangesTitle')}
                    </Text>
                  </View>
                  <Text style={styles.modalText}>
                    {t('profile.privacyChangesText')}
                  </Text>
                </View>

                <View style={[styles.policySection, styles.acceptanceSection]}>
                  <View style={styles.acceptanceIconWrapper}>
                    <Ionicons name="checkmark-circle" size={28} color={accent} />
                  </View>
                  <Text style={styles.acceptanceText}>
                    {t('profile.privacyAcceptanceText')}
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <Pressable
                  style={[styles.modalAcceptButton, { backgroundColor: accent }]}
                  onPress={() => setShowPolicyModal(false)}
                >
                  <Ionicons name="checkmark-circle" size={22} color="#fff" />
                  <Text style={styles.modalAcceptText}>{t('profile.policyAccept')}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL AJUSTES */}
        <Modal
          visible={showSettingsModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowSettingsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHandle} />
                <View style={styles.modalTitleRow}>
                  <View style={[styles.modalIconCircle, { backgroundColor: `${accent}20` }]}>
                    <Ionicons name="settings" size={24} color={accent} />
                  </View>
                  <Text style={styles.modalTitle}>{t('profile.settingsModalTitle')}</Text>
                </View>
                <Pressable
                  onPress={() => setShowSettingsModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={26} color="#6b7280" />
                </Pressable>
              </View>

              <View style={styles.settingsBody}>
                <ScrollView
                  style={styles.modalScroll}
                  contentContainerStyle={styles.modalScrollContent}
                  showsVerticalScrollIndicator
                >
                  {/* INFORMACIÓN PERSONAL */}
                  <View style={styles.settingsCard}>
                    <View style={styles.settingsCardHeader}>
                      <View style={[styles.settingsCardIcon, { backgroundColor: `${accent}20` }]}>
                        <Ionicons name="person" size={20} color={accent} />
                      </View>
                      <Text style={styles.settingsCardTitle}>{t('profile.personalInfo')}</Text>
                    </View>

                    <View style={styles.inputGroup}>
                      <View style={styles.inputField}>
                        <Text style={styles.inputLabel}>{t('profile.firstName')}</Text>
                        <View style={styles.inputContainer}>
                          <Ionicons name="person-outline" size={18} color="#9ca3af" />
                          <TextInput
                            style={styles.textInput}
                            value={nombre}
                            onChangeText={setNombre}
                            placeholder={t('profile.firstName')}
                            placeholderTextColor="#9ca3af"
                          />
                        </View>
                      </View>

                      <View style={styles.inputField}>
                        <Text style={styles.inputLabel}>{t('profile.lastName')}</Text>
                        <View style={styles.inputContainer}>
                          <Ionicons name="person-outline" size={18} color="#9ca3af" />
                          <TextInput
                            style={styles.textInput}
                            value={apellido}
                            onChangeText={setApellido}
                            placeholder={t('profile.lastName')}
                            placeholderTextColor="#9ca3af"
                          />
                        </View>
                      </View>

                      <View style={styles.inputField}>
                        <Text style={styles.inputLabel}>{t('profile.email')}</Text>
                        <View style={styles.readOnlyContainer}>
                          <Ionicons name="mail" size={18} color="#6b7280" />
                          <Text style={styles.readOnlyText}>{profile?.email}</Text>
                        </View>
                      </View>

                      <View style={styles.inputField}>
                        <Text style={styles.inputLabel}>{t('profile.age')}</Text>
                        <View style={styles.inputContainer}>
                          <Ionicons name="calendar-outline" size={18} color="#9ca3af" />
                          <TextInput
                            style={styles.textInput}
                            value={edad}
                            onChangeText={setEdad}
                            placeholder={t('profile.age')}
                            placeholderTextColor="#9ca3af"
                            keyboardType="numeric"
                          />
                        </View>
                      </View>

                      <View style={styles.inputField}>
                        <Text style={styles.inputLabel}>{t('profile.gender')}</Text>
                        <Pressable
                          style={styles.genderSelector}
                          onPress={() => setShowGenderModal(true)}
                        >
                          <View style={styles.genderSelectorContent}>
                            <Ionicons name="people-outline" size={18} color={genero ? '#111827' : '#9ca3af'} />
                            <Text style={genero ? styles.genderValue : styles.genderPlaceholder}>
                              {genero || t('profile.genderPlaceholder')}
                            </Text>
                          </View>
                          <Ionicons name="chevron-down" size={18} color="#9ca3af" />
                        </Pressable>
                      </View>
                    </View>

                    {successMessage && (
                      <View style={styles.successBanner}>
                        <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                        <Text style={styles.successText}>{successMessage}</Text>
                      </View>
                    )}
                  </View>

                  {/* PERSONALIZACIÓN */}
                  <View style={styles.settingsCard}>
                    <View style={styles.settingsCardHeader}>
                      <View style={[styles.settingsCardIcon, { backgroundColor: `${accent}20` }]}>
                        <Ionicons name="color-palette" size={20} color={accent} />
                      </View>
                      <Text style={styles.settingsCardTitle}>{t('profile.customization')}</Text>
                    </View>

                    <View style={styles.inputGroup}>
                      <View style={styles.inputField}>
                        <Text style={styles.inputLabel}>{t('profile.interfaceColor')}</Text>
                        <View style={styles.colorGrid}>
                          {[
                            { key: 'blue', label: t('profile.colorBlue'), color: '#38BDF8' },
                            { key: 'pink', label: t('profile.colorPink'), color: '#FB7185' },
                            { key: 'yellow', label: t('profile.colorYellow'), color: '#FACC15' },
                            { key: 'purple', label: t('profile.colorPurple'), color: '#A855F7' },
                            { key: 'teal', label: t('profile.colorTeal'), color: '#14B8A6' },
                          ].map((opt) => {
                            const isActive = opt.key === themeColor;
                            return (
                              <Pressable
                                key={opt.key}
                                style={[
                                  styles.colorOption,
                                  isActive && [styles.colorOptionActive, { borderColor: opt.color }],
                                ]}
                                onPress={() => setThemeColor(opt.key)}
                              >
                                <View style={[styles.colorCircle, { backgroundColor: opt.color }]} />
                                <Text style={[styles.colorLabel, isActive && { color: opt.color, fontWeight: '700' }]}>
                                  {opt.label}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>

                      <View style={styles.inputField}>
                        <Text style={styles.inputLabel}>{t('profile.appLanguage')}</Text>
                        <View style={styles.languageGrid}>
                          {[
                            { key: 'es', label: t('profile.languageEs'), flag: '🇪🇸' },
                            { key: 'en', label: t('profile.languageEn'), flag: '🇺🇸' },
                            { key: 'pt', label: t('profile.languagePt'), flag: '🇧🇷' },
                            { key: 'fr', label: t('profile.languageFr'), flag: '🇫🇷' },
                          ].map((opt) => {
                            const isActive = opt.key === languageValue;
                            return (
                              <Pressable
                                key={opt.key}
                                style={[
                                  styles.languageOption,
                                  isActive && [styles.languageOptionActive, { borderColor: accent }],
                                ]}
                                onPress={async () => {
                                  setLanguageValue(opt.key);
                                  setLanguage(opt.key);
                                  try {
                                    await clearHabitCache();
                                  } catch {
                                  }
                                }}
                              >
                                <Text style={styles.languageFlag}>{opt.flag}</Text>
                                <Text style={[styles.languageLabel, isActive && { color: accent, fontWeight: '700' }]}>
                                  {opt.label}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* POLÍTICA DE PRIVACIDAD */}
                  <View style={styles.settingsCard}>
                    <Pressable
                      style={styles.policyLink}
                      onPress={() => setShowPolicyModal(true)}
                    >
                      <View style={styles.policyLinkContent}>
                        <View style={[styles.policyLinkIcon, { backgroundColor: `${accent}15` }]}>
                          <Ionicons name="shield-checkmark" size={18} color={accent} />
                        </View>
                        <Text style={[styles.policyLinkText, { color: accent }]}>
                          {t('profile.privacyPolicy')}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                    </Pressable>
                  </View>

                  <View style={{ height: 100 }} />
                </ScrollView>

                {/* BOTÓN GUARDAR FLOTANTE */}
                <View style={styles.floatingButtonContainer}>
                  <Pressable
                    style={[
                      styles.saveButton,
                      { backgroundColor: accent },
                      saving && styles.saveButtonDisabled,
                    ]}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    <Ionicons name={saving ? 'hourglass' : 'checkmark-circle'} size={22} color="#fff" />
                    <Text style={styles.saveButtonText}>
                      {saving ? t('profile.saving') : t('profile.save')}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL GÉNERO */}
        <Modal
          visible={showGenderModal}
          animationType="fade"
          transparent
          onRequestClose={() => setShowGenderModal(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowGenderModal(false)}
          >
            <Pressable
              style={styles.genderModal}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.genderModalHeader}>
                <View style={[styles.genderModalIcon, { backgroundColor: `${accent}20` }]}>
                  <Ionicons name="people" size={24} color={accent} />
                </View>
                <Text style={styles.genderModalTitle}>
                  {t('register.genderModalTitle') || 'Selecciona tu género'}
                </Text>
              </View>
              <View style={styles.genderOptions}>
                {genderOptions.map((option, index) => (
                  <Pressable
                    key={option}
                    style={[
                      styles.genderOptionItem,
                      index !== genderOptions.length - 1 && styles.genderOptionBorder,
                      genero === option && [styles.genderOptionItemActive, { backgroundColor: `${accent}10` }]
                    ]}
                    onPress={() => {
                      setGenero(option);
                      setShowGenderModal(false);
                    }}
                  >
                    <Text style={[
                      styles.genderOptionText,
                      genero === option && [styles.genderOptionTextActive, { color: accent }]
                    ]}>
                      {option}
                    </Text>
                    {genero === option && (
                      <Ionicons name="checkmark-circle" size={20} color={accent} />
                    )}
                  </Pressable>
                ))}
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  // HEADER SECTION
  headerSection: {
    marginBottom: 24,
  },
  bannerContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.1))',
  },
  settingsIconButton: {
    position: 'absolute',
    right: 16,
    top: Platform.OS === 'ios' ? 50 : 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: -44,
  },
  avatarContainer: {
    padding: 4,
    borderRadius: 50,
    backgroundColor: '#fff',
    borderWidth: 4,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '70%',
    height: '70%',
  },

  // LOADING
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },

  // SCROLL
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  // ERROR CARD
  errorCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#fee2e2',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#dc2626',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  // MAIN PROFILE CARD
  mainProfileCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  profileInfo: {
    gap: 12,
    marginBottom: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  profileName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    gap: 4,
  },
  proBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emailText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  preferencesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  preferenceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  preferenceText: {
    fontSize: 13,
    fontWeight: '700',
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    fontWeight: '500',
  },

  // STATS CARD
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  statsIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsHeaderText: {
    flex: 1,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  statsSubtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  statsLoading: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyStats: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 12,
  },
  emptyStatsText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  statsGrid: {
    gap: 12,
  },
  statBox: {
    padding: 16,
    borderRadius: 16,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // LOGOUT BUTTON
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '92%',
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalCloseButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#f8fafc',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
  },

  // POLICY MODAL
  policySection: {
    marginBottom: 24,
  },
  policySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  policySectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  policySubtitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalText: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500',
  },
  bulletList: {
    marginTop: 14,
    gap: 12,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 9,
  },
  bulletText: {
    flex: 1,
    color: '#475569',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500',
  },
  acceptanceSection: {
    backgroundColor: '#f0fdf4',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#bbf7d0',
    alignItems: 'center',
    gap: 12,
  },
  acceptanceIconWrapper: {
    marginBottom: 4,
  },
  acceptanceText: {
    color: '#166534',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  modalAcceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  modalAcceptText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },

  // SETTINGS MODAL
  settingsBody: {
    flex: 1,
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  settingsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingsCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  inputGroup: {
    gap: 16,
  },
  inputField: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '600',
  },
  readOnlyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  readOnlyText: {
    flex: 1,
    fontSize: 15,
    color: '#475569',
    fontWeight: '600',
  },
  genderSelector: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  genderSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  genderValue: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '600',
  },
  genderPlaceholder: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '500',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    padding: 14,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#bbf7d0',
  },
  successText: {
    flex: 1,
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '700',
  },
  colorGrid: {
    gap: 10,
  },
  colorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  colorOptionActive: {
    backgroundColor: '#fff',
    borderWidth: 2,
  },
  colorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  colorLabel: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '600',
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  languageOptionActive: {
    backgroundColor: '#fff',
    borderWidth: 2,
  },
  languageFlag: {
    fontSize: 18,
  },
  languageLabel: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  policyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  policyLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  policyLinkIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  policyLinkText: {
    fontSize: 15,
    fontWeight: '700',
  },
  floatingButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },

  // GENDER MODAL
  genderModal: {
    width: '88%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  genderModalHeader: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  genderModalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  genderOptions: {
    gap: 0,
  },
  genderOptionItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
  },
  genderOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  genderOptionItemActive: {
    borderBottomWidth: 0,
  },
  genderOptionText: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
  },
  genderOptionTextActive: {
    fontWeight: '800',
  },
});