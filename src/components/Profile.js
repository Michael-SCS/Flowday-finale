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

        // Últimos 7 días
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
      } catch {
      }

      await supabase.auth.signOut();
    } catch {
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
      {/* PORTADA / BANNER */}
      <View style={styles.coverContainer}>
        <Image
          source={require('../../assets/Banner.png')}
          style={styles.coverImage}
          resizeMode="cover"
        />
        <View style={styles.coverGradient} />
        <Pressable
          style={styles.coverSettingsButton}
          onPress={() => setShowSettingsModal(true)}
        >
          <Ionicons name="settings-outline" size={24} color={accent} />
        </Pressable>
      </View>

      {/* AVATAR PRINCIPAL */}
      <View style={styles.profileAvatarWrapper}>
        <View
          style={[
            styles.profileAvatarLarge,
            { backgroundColor: accent, shadowColor: accent },
          ]}
        >
          <Image
            source={require('../../assets/mascota_saludando.png')}
            style={styles.profileAvatarImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator color={accent} size="large" />
          <Text style={styles.loadingText}>{t('profile.loading')}</Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {error && (
            <View style={styles.cardError}>
              <View style={styles.errorIconWrapper}>
                <Ionicons name="alert-circle" size={32} color="#ef4444" />
              </View>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable
                style={[
                  styles.reloadButton,
                  { backgroundColor: accent, shadowColor: accent },
                ]}
                onPress={loadProfile}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.reloadButtonText}>{t('profile.retry')}</Text>
              </Pressable>
            </View>
          )}

          {profile && !error && (
            <View style={styles.profileSummaryCard}>
              <View style={styles.profileSummaryTextContainer}>
                <Text style={styles.profileName}>
                  {(profile.nombre || 'Tu nombre') + (profile.apellido ? ` ${profile.apellido}` : '')}
                </Text>
                <View style={styles.profileEmailContainer}>
                  <Ionicons name="mail" size={14} color="#9ca3af" />
                  <Text style={styles.profileEmail}>{profile.email}</Text>
                </View>
                {(edad || genero) && (
                  <View style={styles.profileMetaRow}>
                    {edad ? (
                      <View style={styles.profileMetaBadge}>
                        <Ionicons name="calendar" size={12} color={accent} />
                        <Text style={styles.profileMetaText}>{edad} años</Text>
                      </View>
                    ) : null}
                    {genero ? (
                      <View style={styles.profileMetaBadge}>
                        <Ionicons name="person" size={12} color={accent} />
                        <Text style={styles.profileMetaText}>{genero}</Text>
                      </View>
                    ) : null}
                  </View>
                )}
                <View style={styles.profileChipsRow}>
                  <View style={[styles.profileChip, { backgroundColor: `${accent}15` }]}>
                    <Ionicons name="color-palette" size={14} color={accent} />
                    <Text style={[styles.profileChipText, { color: accent }]}>
                      {themeColor}
                    </Text>
                  </View>
                  <View style={[styles.profileChip, { backgroundColor: `${accent}15` }]}>
                    <Ionicons name="globe" size={14} color={accent} />
                    <Text style={[styles.profileChipText, { color: accent }]}>
                      {language.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.profileHintContainer}>
                <Ionicons name="information-circle-outline" size={16} color="#9ca3af" />
                <Text style={styles.profileHintText}>{t('profile.profileHint')}</Text>
              </View>
            </View>
          )}

          {isPro === true && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconCircle, { backgroundColor: `${accent}20` }]}>
                  <Ionicons name="stats-chart" size={20} color={accent} />
                </View>
                <Text style={styles.cardTitle}>{t('profile.proStatsTitle')}</Text>
              </View>

              {statsLoading && (
                <View style={styles.centerContent}>
                  <ActivityIndicator color={accent} size="small" />
                  <Text style={styles.loadingText}>{t('profile.proStatsLoading')}</Text>
                </View>
              )}

              {!statsLoading && (!stats || (stats.weekTotal === 0)) && (
                <Text style={styles.profileHintText}>{t('profile.proStatsEmpty')}</Text>
              )}

              {!statsLoading && stats && stats.weekTotal > 0 && (
                <View style={styles.fieldGroup}>
                  <View style={styles.field}>
                    <Text style={styles.label}>{t('profile.proStatsWeekLabel')}</Text>
                    <Text style={styles.value}>
                      {stats.weekCompleted} / {stats.weekTotal}
                    </Text>
                  </View>

                  {stats.bestDay && (
                    <View style={styles.field}>
                      <Text style={styles.label}>{t('profile.proStatsBestDayLabel')}</Text>
                      <Text style={styles.value}>
                        {stats.bestDay.completed} / {stats.bestDay.total}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
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
              <View style={styles.modalTitleContainer}>
                <View style={[styles.modalIconCircle, { backgroundColor: `${accent}20` }]}>
                  <Ionicons name="shield-checkmark" size={24} color={accent} />
                </View>
                <Text style={styles.modalTitle}>{t('profile.privacyPolicy')}</Text>
              </View>
              <Pressable 
                onPress={() => setShowPolicyModal(false)}
                style={styles.modalClose}
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
                style={[
                  styles.modalCloseButton,
                  { backgroundColor: accent, shadowColor: accent },
                ]}
                onPress={() => setShowPolicyModal(false)}
              >
                <Ionicons name="checkmark-circle" size={22} color="#fff" />
                <Text style={styles.modalCloseButtonText}>
                  {t('profile.policyAccept')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL AJUSTES PERFIL / APP */}
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
              <View style={styles.modalTitleContainer}>
                <View style={[styles.modalIconCircle, { backgroundColor: `${accent}20` }]}>
                  <Ionicons name="settings" size={24} color={accent} />
                </View>
                <Text style={styles.modalTitle}>
                  {t('profile.settingsModalTitle')}
                </Text>
              </View>
              <Pressable
                onPress={() => setShowSettingsModal(false)}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={26} color="#6b7280" />
              </Pressable>
            </View>

            <View style={styles.settingsBodyWrapper}>
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator
              >
              {/* CARD INFORMACIÓN */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIconCircle, { backgroundColor: `${accent}20` }]}>
                    <Ionicons name="information-circle" size={20} color={accent} />
                  </View>
                  <Text style={styles.cardTitle}>{t('profile.personalInfo')}</Text>
                </View>

                <View style={styles.fieldGroup}>
                  <View style={styles.field}>
                    <Text style={styles.label}>{t('profile.firstName')}</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="person-outline" size={18} color="#9ca3af" />
                      <TextInput
                        style={styles.input}
                        value={nombre}
                        onChangeText={setNombre}
                        placeholder={t('profile.firstName')}
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>{t('profile.lastName')}</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="person-outline" size={18} color="#9ca3af" />
                      <TextInput
                        style={styles.input}
                        value={apellido}
                        onChangeText={setApellido}
                        placeholder={t('profile.lastName')}
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>{t('profile.email')}</Text>
                    <View style={styles.valueWrapper}>
                      <Ionicons name="mail" size={18} color="#6b7280" />
                      <Text style={styles.value}>{profile?.email}</Text>
                    </View>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>{t('profile.age')}</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="calendar-outline" size={18} color="#9ca3af" />
                      <TextInput
                        style={styles.input}
                        value={edad}
                        onChangeText={setEdad}
                        placeholder={t('profile.age')}
                        placeholderTextColor="#9ca3af"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>{t('profile.gender')}</Text>
                    <Pressable
                      style={styles.genderSelect}
                      onPress={() => setShowGenderModal(true)}
                    >
                      <View style={styles.genderSelectContent}>
                        <Ionicons name="people-outline" size={18} color={genero ? '#111827' : '#9ca3af'} />
                        <Text
                          style={
                            genero
                              ? styles.genderValue
                              : styles.genderPlaceholder
                          }
                        >
                          {genero || t('profile.genderPlaceholder')}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-down"
                        size={18}
                        color="#9ca3af"
                      />
                    </Pressable>
                  </View>
                </View>

                {successMessage && (
                  <View style={styles.successContainer}>
                    <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                    <Text style={styles.successText}>{successMessage}</Text>
                  </View>
                )}
              </View>

              {/* CARD PERSONALIZACIÓN */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIconCircle, { backgroundColor: `${accent}20` }]}>
                    <Ionicons name="color-palette" size={20} color={accent} />
                  </View>
                  <Text style={styles.cardTitle}>{t('profile.customization')}</Text>
                </View>

                <View style={styles.fieldGroup}>
                  <View style={styles.field}>
                    <Text style={styles.label}>{t('profile.interfaceColor')}</Text>
                    <View style={styles.themeRow}>
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
                              styles.themeOption,
                              isActive && [
                                styles.themeOptionActive,
                                { borderColor: opt.color, backgroundColor: `${opt.color}20` },
                              ],
                            ]}
                            onPress={() => setThemeColor(opt.key)}
                          >
                            <View
                              style={[
                                styles.themeColorDot,
                                { backgroundColor: opt.color },
                                isActive && styles.themeColorDotActive,
                              ]}
                            />
                            <Text
                              style={[
                                styles.themeLabel,
                                isActive && [styles.themeLabelActive, { color: opt.color }],
                              ]}
                            >
                              {opt.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>{t('profile.appLanguage')}</Text>
                    <View style={styles.languageRow}>
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
                              styles.languageChip,
                              isActive && [
                                styles.languageChipActive,
                                { borderColor: accent, backgroundColor: `${accent}20` },
                              ],
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
                            <Text
                              style={[
                                styles.languageChipText,
                                isActive && [
                                  styles.languageChipTextActive,
                                  { color: accent },
                                ],
                              ]}
                            >
                              {opt.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </View>
              </View>

              {/* CARD ACCIONES */}
              <View style={styles.actionsCard}>
                <Pressable
                  style={styles.linkButton}
                  onPress={() => setShowPolicyModal(true)}
                >
                  <View style={styles.linkButtonContent}>
                    <View style={[styles.linkIconCircle, { backgroundColor: `${accent}15` }]}>
                      <Ionicons
                        name="shield-checkmark"
                        size={18}
                        color={accent}
                      />
                    </View>
                    <Text
                      style={[
                        styles.linkButtonText,
                        { color: accent },
                      ]}
                    >
                      {t('profile.privacyPolicy')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
                </Pressable>

                <Pressable
                  style={[
                    styles.logoutButton,
                    { borderColor: `${accent}40`, backgroundColor: `${accent}10` },
                  ]}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={22} color={accent} />
                  <Text
                    style={[
                      styles.logoutButtonText,
                      { color: accent },
                    ]}
                    >
                    {t('profile.logout')}
                  </Text>
                </Pressable>
              </View>
                <View style={{ height: 96 }} />
              </ScrollView>

              {/* BOTÓN FLOTANTE GUARDAR CAMBIOS */}
              <View style={styles.settingsFloatingFooter}>
                <Pressable
                  style={[
                    styles.primaryButton,
                    styles.primaryButtonFloating,
                    { backgroundColor: accent, shadowColor: accent },
                    saving && styles.primaryButtonDisabled,
                  ]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Ionicons
                    name={saving ? 'hourglass' : 'checkmark-circle'}
                    size={22}
                    color="#fff"
                  />
                  <Text style={styles.primaryButtonText}>
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
            style={styles.genderModalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.genderModalHeader}>
              <View style={[styles.genderModalIconCircle, { backgroundColor: `${accent}20` }]}>
                <Ionicons name="people" size={24} color={accent} />
              </View>
              <Text style={styles.genderModalTitle}>
                {t('register.genderModalTitle') || 'Selecciona tu género'}
              </Text>
            </View>
            <View style={styles.genderOptionsContainer}>
              {genderOptions.map((option, index) => (
                <Pressable
                  key={option}
                  style={[
                    styles.genderOption,
                    index !== genderOptions.length - 1 && styles.genderOptionBorder,
                    genero === option && [styles.genderOptionActive, { backgroundColor: `${accent}10` }]
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

  // Portada con gradiente
  coverContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
    marginBottom: 50,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'transparent',
  },
  coverSettingsButton: {
    position: 'absolute',
    right: 20,
    top: Platform.OS === 'ios' ? 50 : 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },

  // Avatar mejorado
  profileAvatarWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: -50,
    marginBottom: 20,
    zIndex: 10,
  },
  profileAvatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 5,
    borderColor: '#fff',
  },
  profileAvatarImage: {
    width: '75%',
    height: '75%',
  },

  // Loading mejorado
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  // Card de error mejorada
  cardError: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    gap: 16,
    borderWidth: 2,
    borderColor: '#fee2e2',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  errorIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
  reloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  reloadButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  // Card resumen perfil mejorada
  profileSummaryCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  profileSummaryTextContainer: {
    gap: 8,
  },
  profileName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  profileEmailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  profileEmail: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  profileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  profileMetaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  profileMetaText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  profileChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  profileChipText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  profileHintContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  profileHintText: {
    flex: 1,
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    fontWeight: '500',
  },

  // Card mejorada
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cardIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.4,
  },

  // Fields mejorados
  fieldGroup: {
    gap: 18,
  },
  field: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '600',
  },
  valueWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  value: {
    flex: 1,
    fontSize: 15,
    color: '#475569',
    fontWeight: '600',
  },
  genderSelect: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  genderSelectContent: {
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

  // Success mejorado
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#bbf7d0',
  },
  successText: {
    flex: 1,
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  // Botones mejorados
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonFloating: {
    marginTop: 0,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.4,
  },

  settingsBodyWrapper: {
    flex: 1,
  },
  settingsFloatingFooter: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: '#fff',
  },

  // Actions Card mejorada
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  linkButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  linkIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkButtonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  // Modal mejorado
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalHandle: {
    width: 48,
    height: 5,
    backgroundColor: '#cbd5e1',
    borderRadius: 3,
    marginBottom: 20,
  },
  modalTitleContainer: {
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
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.6,
  },
  modalClose: {
    position: 'absolute',
    right: 20,
    top: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#f8fafc',
  },
  modalScroll: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  modalScrollContent: {
    paddingBottom: 32,
  },
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
    letterSpacing: -0.3,
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
    paddingLeft: 4,
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
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  modalCloseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.4,
  },

  // Theme options mejoradas
  themeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    gap: 8,
  },
  themeOptionActive: {
    borderWidth: 2,
  },
  themeColorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  themeColorDotActive: {
    borderWidth: 3,
  },
  themeLabel: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  themeLabelActive: {
    fontWeight: '800',
  },

  // Language options mejoradas
  languageRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  languageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    gap: 8,
  },
  languageChipActive: {
    borderWidth: 2,
  },
  languageFlag: {
    fontSize: 18,
  },
  languageChipText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  languageChipTextActive: {
    fontWeight: '800',
  },

  // Gender modal mejorado
  genderModalContent: {
    width: '88%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  genderModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  genderModalIconCircle: {
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
    letterSpacing: -0.4,
  },
  genderOptionsContainer: {
    gap: 0,
  },
  genderOption: {
    paddingVertical: 16,
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
  genderOptionActive: {
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