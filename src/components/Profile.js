import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView, TextInput, Modal, Platform, Image, Alert, Switch, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';
import { useAuth } from '../auth/AuthProvider';
import { useSettings, getAccentColor } from '../utils/settingsContext';
import { useI18n, translate } from '../utils/i18n';
import { clearLocalHabits } from '../utils/localHabits';
import { clearActivities } from '../utils/localActivities';
import { clearHabitCache } from '../utils/habitCache';
import { useTour } from '../utils/tourContext';
import { useProStatus } from '../utils/proStatus';
import { loadActivities as loadUserActivities } from '../utils/localActivities';
import { clearPomodoroStats } from '../utils/pomodoroStats';
import { cancelAllScheduledNotifications } from '../utils/notifications';
import MoodChart from './MoodChart';
import MoodMessageBanner from './MoodMessageBanner';
import { getDismissedMoodBannerDate, getMoodForDate, todayMoodKey } from '../utils/moodTracker';
import { pickMoodMessage } from '../utils/moodMessages';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user: authUser, session, loading: authLoading, signOut } = useAuth();
  const {
    themeColor,
    themeMode,
    language,
    notificationsEnabled,
    timeFormat,
    setThemeColor,
    setThemeMode,
    setLanguage,
    setNotificationsEnabled,
    setTimeFormat,
  } = useSettings();
  const { t } = useI18n();
  const { openTour } = useTour();
  const { isPro } = useProStatus();
  // Temporary flag to hide Pro features until they're offered
  const showPro = false;
  const accent = getAccentColor(themeColor);
  const isDark = themeMode === 'dark';
  const isGuest = !(session?.user?.id || authUser?.id);

  const startOnboardingSignup = useCallback(async ({ from = 'profile_guest' } = {}) => {
    try { await AsyncStorage.setItem('onboarding_in_progress', 'true'); } catch {}

    // Walk up to the root navigator (Stack) so we can reset reliably.
    let nav = navigation;
    for (let i = 0; i < 6; i += 1) {
      const parent = nav?.getParent?.();
      if (!parent) break;
      nav = parent;
    }

    try {
      nav.reset({
        index: 0,
        routes: [
          {
            name: 'Onboarding',
            state: {
              index: 0,
              routes: [{ name: 'RegisterForm', params: { from } }],
            },
          },
        ],
      });
      return;
    } catch {}

    try {
      nav.navigate('Onboarding', { screen: 'RegisterForm', params: { from } });
    } catch {}
  }, [navigation]);

  useEffect(() => {
    if (!isGuest) return;
    let cancelled = false;

    (async () => {
      try {
        const key = 'guest_register_prompt_shown';
        const shown = await AsyncStorage.getItem(key);
        if (cancelled) return;
        if (shown === 'true') return;

        Alert.alert(
          safeT('profile.guestModeTitle', 'Modo invitado'),
          safeT('profile.guestModeMessage', 'Puedes usar la app sin cuenta. Si te registras, podrás sincronizar y guardar tu perfil.'),
          [
            { text: safeT('profile.guestModeLater', 'Más tarde'), style: 'cancel' },
            {
              text: safeT('profile.guestModeRegister', 'Registrarme'),
              onPress: () => startOnboardingSignup({ from: 'profile_guest_prompt' }),
            },
          ]
        );

        try { await AsyncStorage.setItem(key, 'true'); } catch {}
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isGuest, startOnboardingSignup]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showQuickLanguageModal, setShowQuickLanguageModal] = useState(false);
  const [showQuickTimeFormatModal, setShowQuickTimeFormatModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [dismissedMoodDate, setDismissedMoodDate] = useState(null);
  const [todayMood, setTodayMood] = useState(null);
  const [todayMoodMessage, setTodayMoodMessage] = useState(null);

  const scrollY = useRef(new Animated.Value(0)).current;
  const COLLAPSE_DISTANCE = 120;
  const clampedY = Animated.diffClamp(scrollY, 0, COLLAPSE_DISTANCE);
  const avatarScale = clampedY.interpolate({
    inputRange: [0, COLLAPSE_DISTANCE],
    outputRange: [1, 0.72],
    extrapolate: 'clamp',
  });
  const avatarOpacity = clampedY.interpolate({
    inputRange: [0, COLLAPSE_DISTANCE * 0.9, COLLAPSE_DISTANCE],
    outputRange: [1, 0.9, 0.85],
    extrapolate: 'clamp',
  });
  const avatarTranslateY = clampedY.interpolate({
    inputRange: [0, COLLAPSE_DISTANCE],
    outputRange: [0, -18],
    extrapolate: 'clamp',
  });

  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [edad, setEdad] = useState('');
  const [genero, setGenero] = useState('');
  const [languageValue, setLanguageValue] = useState(language || 'es');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSending, setFeedbackSending] = useState(false);
  const genderKeys = ['male', 'female', 'nonBinary', 'genderFluid', 'preferNotSay', 'other'];
  const genderOptions = genderKeys.map((k) => t(`profile.genderOptions.${k}`));

  const supportedLanguageKeys = ['es', 'en', 'pt', 'fr'];

  const safeT = (key, fallback) => {
    const value = t(key);
    if (value && value !== key) return value;
    return fallback;
  };

  async function sendFeedbackInApp(message) {
    const trimmed = String(message || '').trim();
    if (!trimmed) return;

    if (isGuest) {
      Alert.alert(
        safeT('profile.feedbackTitle', 'Feedback'),
        safeT('profile.guestRequiresAccount', 'Crea una cuenta o inicia sesión para enviar feedback desde la app.')
      );
      return;
    }

    setFeedbackSending(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const sessionUser = session?.user ?? null;
      if (!sessionUser) {
        Alert.alert(t('profile.feedbackTitle'), t('profile.loadUserError'));
        return;
      }

      // Insert minimal payload; DB/RLS should derive user_id from auth.uid().
      const { error } = await supabase.from('feedback').insert({
        user_mail: sessionUser.email ?? null,
        message: trimmed,
      });

      if (error) throw error;

      Alert.alert(t('profile.feedbackTitle'), t('profile.feedbackSendSuccess'));
      setShowFeedbackModal(false);
      setFeedbackText('');
    } catch (e) {
      // Surface the underlying Supabase error to make setup issues (RLS/grants) actionable.
      const details =
        (e && typeof e === 'object' && (e.message || e.error_description || e.details || e.hint))
          ? [e.message, e.error_description, e.details, e.hint].filter(Boolean).join('\n')
          : String(e);

      console.error('Feedback send failed', e);
      Alert.alert(t('profile.feedbackTitle'), `${t('profile.feedbackSendError')}\n\n${details}`);
    } finally {
      setFeedbackSending(false);
    }
  }

  const getYearsSuffix = () => {
    const suffix = t('profile.yearsSuffix');
    if (suffix && suffix !== 'profile.yearsSuffix') return suffix;

    const fallback = {
      es: 'años',
      en: 'years',
      pt: 'anos',
      fr: 'ans',
    };
    return fallback[language] || fallback.en;
  };

  const normalizeGenderKey = (value) => {
    if (!value) return null;
    const raw = String(value).trim();

    if (genderKeys.includes(raw)) return raw;

    const lower = raw.toLowerCase();
    for (const key of genderKeys) {
      for (const lang of supportedLanguageKeys) {
        const label = translate(`profile.genderOptions.${key}`, lang);
        if (typeof label === 'string' && label.toLowerCase() === lower) {
          return key;
        }
      }
    }
    return null;
  };

  const getGenderLabel = (value) => {
    const key = normalizeGenderKey(value);
    if (key) return t(`profile.genderOptions.${key}`);
    return value;
  };

  const getLanguageLabel = (code) => {
    if (!code) return '';
    const normalized = String(code).toLowerCase();
    const key = `profile.language${normalized.charAt(0).toUpperCase() + normalized.slice(1)}`;
    const label = t(key);
    if (label && label !== key) return label;
    return normalized.toUpperCase();
  };

  const quickLanguageOptions = [
    { key: 'es', label: t('profile.languageEs'), flag: '🇪🇸' },
    { key: 'en', label: t('profile.languageEn'), flag: '🇺🇸' },
    { key: 'pt', label: t('profile.languagePt'), flag: '🇧🇷' },
    { key: 'fr', label: t('profile.languageFr'), flag: '🇫🇷' },
  ].map((opt) => ({
    ...opt,
    label: opt.label && opt.label !== `profile.language${opt.key.charAt(0).toUpperCase() + opt.key.slice(1)}`
      ? opt.label
      : opt.key.toUpperCase(),
  }));

  const quickTimeFormatOptions = [
    { key: 'system', label: safeT('profile.timeFormatSystem', 'Sistema'), icon: 'settings-outline' },
    { key: '12h', label: safeT('profile.timeFormat12h', '12h'), icon: 'sunny-outline' },
    { key: '24h', label: safeT('profile.timeFormat24h', '24h'), icon: 'moon-outline' },
  ];

  const formatLastActive = (value) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    try {
      return new Intl.DateTimeFormat(language || 'es', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      }).format(d);
    } catch {
      return d.toLocaleDateString();
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Session-first: don't rely on cached context values that can temporarily be null.
      const { data: sessData, error: sessError } = await supabase.auth.getSession();
      const sessionUser = sessData?.session?.user ?? null;
      const uid = sessionUser?.id ?? authUser?.id ?? session?.user?.id ?? null;

      if (sessError) {
        const details = [sessError.message, sessError.details, sessError.hint].filter(Boolean).join('\n');
        setError(`${t('profile.loadUserError')}\n\n${details}`);
        setProfile(null);
        return;
      }

      if (!uid) {
        // Guest mode: don't show an error, just render a local profile shell.
        setProfile({
          id: null,
          nombre: safeT('profile.guestName', 'Invitado'),
          apellido: null,
          edad: null,
          genero: null,
          email: safeT('profile.guestEmail', 'Modo invitado'),
          language: languageValue || language || 'es',
          notifications_enabled: !!notificationsEnabled,
          last_active_at: null,
          pro: false,
          pro_trial_used: false,
          pro_until: null,
          pro_lifetime: false,
        });
        setNombre('');
        setApellido('');
        setEdad('');
        setGenero('');
        return;
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select(
          'id, nombre, apellido, edad, genero, email, language, notifications_enabled, last_active_at, pro, pro_trial_used, pro_until, pro_lifetime'
        )
        .eq('id', uid)
        .maybeSingle();

      if (profileError) {
        const details = [profileError.message, profileError.details, profileError.hint].filter(Boolean).join('\n');
        setError(`${t('profile.loadProfileError')}\n\n${details}`);
        setProfile(null);
        return;
      }

      if (!data) {
        const emailHint = sessionUser?.email ? `\n\nEmail: ${sessionUser.email}` : '';
        setError(`${t('profile.noProfileConfigured')}\n\nUID: ${uid}${emailHint}`);
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

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const refresh = async () => {
        try {
          const todayKey = todayMoodKey();
          const [dismissed, entry] = await Promise.all([
            getDismissedMoodBannerDate(),
            getMoodForDate(todayKey),
          ]);
          if (!mounted) return;
          setDismissedMoodDate(dismissed);
          setTodayMood(entry);

          const msg = entry?.score
            ? pickMoodMessage({ score: entry.score, dateKey: todayKey, isToday: true, t, now: new Date() })
            : null;
          setTodayMoodMessage(msg);
        } catch {
          if (!mounted) return;
          setDismissedMoodDate(null);
          setTodayMood(null);
          setTodayMoodMessage(null);
        }
      };

      refresh();

      const id = setInterval(() => {
        refresh();
      }, 30 * 60 * 1000);

      return () => {
        mounted = false;
        clearInterval(id);
      };
    }, [t])
  );

  useEffect(() => {
    if (authLoading) return;
    // Always attempt a session-first profile load; loadProfile() will end loading deterministically.
    loadProfile();
  }, [authLoading]);

  useEffect(() => {
    if (!showPro) return;

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

    if (isGuest) {
      Alert.alert(
        safeT('profile.settingsTitle', 'Ajustes'),
        safeT('profile.guestRequiresAccount', 'Crea una cuenta o inicia sesión para guardar tu perfil y sincronizar.')
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const { data: sessData, error: sessError } = await supabase.auth.getSession();
      const sessionUser = sessData?.session?.user ?? null;
      const uid = sessionUser?.id ?? authUser?.id ?? session?.user?.id ?? null;
      if (sessError) {
        const details = [sessError.message, sessError.details, sessError.hint].filter(Boolean).join('\n');
        setError(`${t('profile.loadUserError')}\n\n${details}`);
        return;
      }
      if (!uid) {
        setError(t('profile.loadUserError'));
        return;
      }

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
        .eq('id', uid)
        .select(
          'id, nombre, apellido, edad, genero, email, language, notifications_enabled, last_active_at, pro, pro_trial_used, pro_until, pro_lifetime'
        )
        .maybeSingle();

      if (updateError) {
        const details = [updateError.message, updateError.details, updateError.hint].filter(Boolean).join('\n');
        setError(`${t('profile.updateError')}\n\n${details}`);
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

  const purgeLocalUserData = async () => {
    await Promise.allSettled([
      clearLocalHabits(),
      clearActivities(),
      clearHabitCache(),
      clearPomodoroStats(),
      AsyncStorage.removeItem('device_onboarding_shown'),
      AsyncStorage.removeItem('onboarding_in_progress'),
      AsyncStorage.removeItem('onboarding_profile_payload'),
    ]);
  };

  const performAccountDeletion = async () => {
    if (deletingAccount) return;

    try {
      setDeletingAccount(true);
      setError(null);
      setSuccessMessage(null);

      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      const user = currentSession?.user ?? null;
      if (!user) {
        try {
          await signOut();
        } catch {}
        return;
      }

      let deletedViaFunction = false;
      try {
        const res = await supabase.functions.invoke('delete-account', { body: {} });
        if (!res?.error) deletedViaFunction = true;
      } catch {
        deletedViaFunction = false;
      }

      // Fallback: best-effort cleanup of public user data.
      if (!deletedViaFunction) {
        try {
          await supabase.from('user_onboarding').delete().eq('user_id', user.id);
        } catch {}
        try {
          await supabase.from('profiles').delete().eq('id', user.id);
        } catch {}
      }

      await purgeLocalUserData();
      await signOut();
    } catch {
      Alert.alert(t('profile.deleteAccountErrorTitle'), t('profile.deleteAccountErrorMessage'));
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleDeleteAccount = () => {
    if (deletingAccount) return;

    if (isGuest) {
      Alert.alert(
        safeT('profile.deleteAccountTitle', 'Eliminar cuenta'),
        safeT('profile.guestNoAccountToDelete', 'Estás en modo invitado. No hay una cuenta para eliminar.')
      );
      return;
    }

    Alert.alert(
      t('profile.deleteAccountTitle'),
      t('profile.deleteAccountMessage'),
      [
        { text: t('profile.cancel'), style: 'cancel' },
        { text: t('profile.deleteAccountConfirm'), style: 'destructive', onPress: performAccountDeletion },
      ]
    );
  };

  // Logout has been disabled: users cannot sign out from the app.

  return (
    <SafeAreaView style={[styles.safeArea, isDark && { backgroundColor: '#020617' }]}>
      <View style={[styles.container, isDark && { backgroundColor: '#020617' }]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={accent} size="large" />
            <Text style={[styles.loadingText, isDark && { color: '#e5e7eb' }]}>{t('profile.loading')}</Text>
          </View>
        ) : (
          <Animated.ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
          >
            {/* HEADER (SIN PORTADA) */}
            <View style={styles.headerSection}>
              <View style={styles.headerTopRow}>
                <View style={{ flex: 1 }} />
                <Pressable
                  style={[styles.settingsIconButton, { backgroundColor: `${accent}DD` }]}
                  onPress={() => setShowSettingsModal(true)}
                >
                  <Ionicons name="settings-outline" size={22} color="#fff" />
                </Pressable>
              </View>

              <View style={styles.avatarSection}>
                <Animated.View
                  style={[
                    {
                      opacity: avatarOpacity,
                      transform: [{ translateY: avatarTranslateY }, { scale: avatarScale }],
                    },
                  ]}
                >
                  <View style={[styles.avatarContainer, { borderColor: accent, shadowColor: accent }]}>
                    <View style={[styles.avatarCircle, { backgroundColor: accent }]}>
                      <Image
                        source={require('../../assets/login.png')}
                        style={styles.avatarImage}
                        resizeMode="contain"
                      />
                    </View>
                  </View>
                </Animated.View>
              </View>
            </View>

            {error && (
              <View style={[styles.errorCard, isDark && { backgroundColor: '#0b1120', borderColor: '#7f1d1d' }]}>
                <Ionicons name="alert-circle" size={48} color="#ef4444" />
                <Text style={[styles.errorTitle, isDark && { color: '#fecaca' }]}>Oops!</Text>
                <Text style={[styles.errorText, isDark && { color: '#fecaca' }]}>{error}</Text>
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
                {isGuest && (
                  <View style={[styles.sectionCard, isDark && { backgroundColor: '#020617', borderColor: '#1e293b' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={[styles.sectionHeaderIcon, { backgroundColor: `${accent}20` }]}>
                        <Ionicons name="person-add-outline" size={18} color={accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.sectionHeaderTitle, isDark && { color: '#e5e7eb' }]}>
                          {safeT('profile.guestCtaTitle', 'Crea tu cuenta')}
                        </Text>
                        <Text style={[styles.sectionHeaderSubtitle, isDark && { color: '#94a3b8' }]}>
                          {safeT('profile.guestCtaSubtitle', 'Sincroniza tu progreso y guarda tu perfil')}
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      style={[styles.retryButton, { backgroundColor: accent, marginTop: 12 }]}
                      onPress={() => {
                        Alert.alert(
                          safeT('profile.guestModeTitle', 'Modo invitado'),
                          safeT('profile.guestModeMessage', 'Puedes usar la app sin cuenta. Si te registras, podrás sincronizar y guardar tu perfil.'),
                          [
                            { text: safeT('profile.guestModeLater', 'Más tarde'), style: 'cancel' },
                            {
                              text: safeT('profile.guestModeRegister', 'Registrarme'),
                              onPress: () => startOnboardingSignup({ from: 'profile_guest_cta' }),
                            },
                          ]
                        );
                      }}
                    >
                      <Ionicons name="log-in-outline" size={18} color="#fff" />
                      <Text style={styles.retryButtonText}>{safeT('profile.guestCtaButton', 'Registrarme')}</Text>
                    </Pressable>
                  </View>
                )}

                {/* CARD PRINCIPAL DEL PERFIL */}
                <View style={[styles.mainProfileCard, isDark && { backgroundColor: '#020617' }]}>
                  <View style={styles.profileInfo}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.profileName, isDark && { color: '#e5e7eb' }]}>
                        {profile.nombre || 'Tu nombre'}
                        {profile.apellido && ` ${profile.apellido}`}
                      </Text>
                      {showPro && (
                          <View style={[styles.proBadge, { backgroundColor: `${accent}15`, borderColor: `${accent}40` }]}> 
                            <MaterialCommunityIcons name="crown-outline" size={14} color={accent} />
                            <Text style={[styles.proBadgeText, { color: accent }]}>PRO</Text>
                          </View>
                        )}
                    </View>
                    
                    <View style={styles.emailRow}>
                      <Ionicons name="mail" size={16} color="#64748b" />
                      <Text style={[styles.emailText, isDark && { color: '#cbd5e1' }]}>{profile.email}</Text>
                    </View>

                    <View style={styles.badgesRow}>
                      {edad && (
                        <View style={[styles.infoBadge, { backgroundColor: `${accent}15`, borderColor: `${accent}30` }]}>
                          <Ionicons name="calendar-outline" size={14} color={accent} />
                          <Text style={[styles.badgeText, { color: accent }]}>{edad} {getYearsSuffix()}</Text>
                        </View>
                      )}
                      {genero && (
                        <View style={[styles.infoBadge, { backgroundColor: `${accent}15`, borderColor: `${accent}30` }]}> 
                          <Ionicons name="person-outline" size={14} color={accent} />
                          <Text style={[styles.badgeText, { color: accent }]}>{getGenderLabel(genero)}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.preferencesRow}>
                      <View style={[styles.preferenceChip, { backgroundColor: `${accent}10` }]}>
                        <Ionicons name="color-palette" size={14} color={accent} />
                        <Text style={[styles.preferenceText, { color: accent }]}>{t(`profile.color${themeColor.charAt(0).toUpperCase() + themeColor.slice(1)}`) || themeColor}</Text>
                      </View>
                      <View style={[styles.preferenceChip, { backgroundColor: `${accent}10` }]}>
                        <Ionicons name="language" size={14} color={accent} />
                        <Text style={[styles.preferenceText, { color: accent }]}>{getLanguageLabel(language)}</Text>
                      </View>
                    </View>

                    {profile?.last_active_at ? (
                      <View style={styles.metaRow}>
                        <View style={[styles.metaPill, { backgroundColor: isDark ? '#0b1220' : '#f1f5f9' }]}>
                          <Ionicons name="pulse-outline" size={14} color={isDark ? '#94a3b8' : '#64748b'} />
                          <Text style={[styles.metaPillText, isDark && { color: '#cbd5e1' }]}>
                            {safeT('profile.lastActive', 'Última actividad')}: {formatLastActive(profile.last_active_at) || '-'}
                          </Text>
                        </View>
                      </View>
                    ) : null}
                  </View>

                  {/* hint removed per request */}
                </View>

                {/* ESTADO DE ÁNIMO */}
                <View style={[styles.sectionCard, isDark && { backgroundColor: '#020617', borderColor: '#1e293b' }]}>
                  <MoodChart accent={accent} isDark={isDark} embedded />
                </View>

                {dismissedMoodDate === todayMoodKey() && todayMoodMessage ? (
                  <View style={[styles.sectionCard, isDark && { backgroundColor: '#020617', borderColor: '#1e293b' }]}>
                    <MoodMessageBanner
                      title={t('mood.bannerTitle')}
                      message={todayMoodMessage}
                      emoji={todayMood?.emoji}
                      accent={accent}
                      isDark={isDark}
                    />
                  </View>
                ) : null}

                {/* AJUSTES RÁPIDOS */}
                <View style={[styles.sectionCard, isDark && { backgroundColor: '#020617', borderColor: '#1e293b' }]}>
                  <View style={styles.quickSettingsHeader}>
                    <View style={styles.quickSettingsHeaderTop}>
                      <View style={[styles.sectionHeaderIcon, { backgroundColor: `${accent}20` }]}>
                        <Ionicons name="options" size={18} color={accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.sectionHeaderTitle, isDark && { color: '#e5e7eb' }]}>
                          {safeT('profile.quickSettingsTitle', 'Ajustes rápidos')}
                        </Text>
                        <Text style={[styles.sectionHeaderSubtitle, isDark && { color: '#94a3b8' }]}>
                          {safeT('profile.quickSettingsSubtitle', 'Personaliza sin abrir el modal')}
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      style={[styles.quickSettingsHeaderAction, { borderColor: `${accent}55` }]}
                      onPress={() => setShowSettingsModal(true)}
                    >
                      <Text style={[styles.sectionHeaderActionText, { color: accent }]}>
                        {safeT('profile.moreSettingsButton', 'Más ajustes')}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={accent} />
                    </Pressable>
                  </View>

                  <View style={styles.quickSettingsRows}>
                    <View style={[styles.quickSettingRow, isDark && { backgroundColor: '#0b1120', borderColor: '#1e293b' }]}>
                      <View style={styles.quickSettingLeft}>
                        <View style={[styles.quickSettingIcon, { backgroundColor: `${accent}15` }]}>
                          <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.quickSettingTitle, isDark && { color: '#e5e7eb' }]}>
                            {safeT('profile.appearanceMode', 'Modo')}
                          </Text>
                          <Text style={[styles.quickSettingSubtitle, isDark && { color: '#94a3b8' }]}>
                            {isDark ? safeT('profile.appearanceDark', 'Oscuro') : safeT('profile.appearanceLight', 'Claro')}
                          </Text>
                        </View>
                      </View>
                      <Switch
                        value={isDark}
                        onValueChange={(v) => setThemeMode(v ? 'dark' : 'light')}
                        trackColor={{ false: '#e5e7eb', true: `${accent}66` }}
                        thumbColor={isDark ? accent : '#9ca3af'}
                      />
                    </View>

                    <View style={[styles.quickSettingRow, isDark && { backgroundColor: '#0b1120', borderColor: '#1e293b' }]}>
                      <View style={styles.quickSettingLeft}>
                        <View style={[styles.quickSettingIcon, { backgroundColor: `${accent}15` }]}>
                          <Ionicons name="notifications" size={18} color={accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.quickSettingTitle, isDark && { color: '#e5e7eb' }]}>
                            {safeT('profile.notificationsTitle', 'Notificaciones')}
                          </Text>
                          <Text style={[styles.quickSettingSubtitle, isDark && { color: '#94a3b8' }]}>
                            {notificationsEnabled ? safeT('profile.notificationsOn', 'Activadas') : safeT('profile.notificationsOff', 'Desactivadas')}
                          </Text>
                        </View>
                      </View>
                      <Switch
                        value={!!notificationsEnabled}
                        onValueChange={async (v) => {
                          await setNotificationsEnabled(!!v);
                          if (!v) {
                            await cancelAllScheduledNotifications();
                          }
                        }}
                        trackColor={{ false: '#e5e7eb', true: `${accent}66` }}
                        thumbColor={notificationsEnabled ? accent : '#9ca3af'}
                      />
                    </View>

                    <Pressable
                      style={[styles.quickSettingRow, isDark && { backgroundColor: '#0b1120', borderColor: '#1e293b' }]}
                      onPress={() => setShowQuickLanguageModal(true)}
                    >
                      <View style={styles.quickSettingLeft}>
                        <View style={[styles.quickSettingIcon, { backgroundColor: `${accent}15` }]}>
                          <Ionicons name="language" size={18} color={accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.quickSettingTitle, isDark && { color: '#e5e7eb' }]}>
                            {safeT('profile.appLanguage', 'Idioma')}
                          </Text>
                          <Text style={[styles.quickSettingSubtitle, isDark && { color: '#94a3b8' }]}>
                            {getLanguageLabel(languageValue || language)}
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                    </Pressable>

                    <Pressable
                      style={[styles.quickSettingRow, isDark && { backgroundColor: '#0b1120', borderColor: '#1e293b' }]}
                      onPress={() => setShowQuickTimeFormatModal(true)}
                    >
                      <View style={styles.quickSettingLeft}>
                        <View style={[styles.quickSettingIcon, { backgroundColor: `${accent}15` }]}>
                          <Ionicons name="time" size={18} color={accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.quickSettingTitle, isDark && { color: '#e5e7eb' }]}>
                            {safeT('profile.timeFormatTitle', 'Formato de hora')}
                          </Text>
                          <Text style={[styles.quickSettingSubtitle, isDark && { color: '#94a3b8' }]}>
                            {timeFormat === '12h'
                              ? '12h'
                              : timeFormat === '24h'
                                ? '24h'
                                : safeT('profile.timeFormatSystem', 'Sistema')}
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                    </Pressable>
                  </View>
                </View>

                {/* CUENTA */}
                <View style={[styles.sectionCard, isDark && { backgroundColor: '#020617', borderColor: '#1e293b' }]}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionHeaderIcon, { backgroundColor: `${accent}20` }]}>
                      <Ionicons name="person-circle" size={18} color={accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sectionHeaderTitle, isDark && { color: '#e5e7eb' }]}>
                        {safeT('profile.accountTitle', 'Cuenta')}
                      </Text>
                      <Text style={[styles.sectionHeaderSubtitle, isDark && { color: '#94a3b8' }]}>
                        {safeT('profile.accountSubtitle', 'Soporte, privacidad y seguridad')}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    style={[styles.rowButton, isDark && { backgroundColor: '#0b1120', borderColor: '#1e293b' }]}
                    onPress={() => {
                      if (isGuest) {
                        Alert.alert(
                          safeT('profile.feedbackTitle', 'Feedback'),
                          safeT('profile.guestRequiresAccount', 'Crea una cuenta o inicia sesión para enviar feedback desde la app.')
                        );
                        return;
                      }
                      setShowFeedbackModal(true);
                    }}
                  >
                    <View style={styles.rowButtonLeft}>
                      <View style={[styles.rowButtonIcon, { backgroundColor: `${accent}15` }]}>
                        <Ionicons name="chatbubble-ellipses-outline" size={18} color={accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.rowButtonTitle, isDark && { color: '#e5e7eb' }]}>
                          {safeT('profile.feedbackTitle', 'Feedback')}
                        </Text>
                        <Text style={[styles.rowButtonSubtitle, isDark && { color: '#94a3b8' }]}>
                          {safeT('profile.feedbackOpen', 'Cuéntanos tu experiencia')}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                  </Pressable>

                  <Pressable
                    style={[styles.rowButton, isDark && { backgroundColor: '#0b1120', borderColor: '#1e293b' }]}
                    onPress={() => setShowPolicyModal(true)}
                  >
                    <View style={styles.rowButtonLeft}>
                      <View style={[styles.rowButtonIcon, { backgroundColor: `${accent}15` }]}>
                        <Ionicons name="shield-checkmark-outline" size={18} color={accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.rowButtonTitle, isDark && { color: '#e5e7eb' }]}>
                          {safeT('profile.privacyPolicy', 'Política de privacidad')}
                        </Text>
                        <Text style={[styles.rowButtonSubtitle, isDark && { color: '#94a3b8' }]}>
                          {safeT('profile.privacyOpenHint', 'Cómo usamos tus datos')}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                  </Pressable>

                  {!isGuest && (
                    <Pressable
                      style={[
                        styles.rowButton,
                        isDark && { backgroundColor: '#0b1120', borderColor: '#1e293b' },
                      ]}
                      onPress={handleDeleteAccount}
                      disabled={deletingAccount}
                    >
                      <View style={styles.rowButtonLeft}>
                        <View style={[styles.rowButtonIcon, { backgroundColor: '#ef444420' }]}>
                          {deletingAccount ? (
                            <ActivityIndicator size="small" color="#ef4444" />
                          ) : (
                            <Ionicons name="trash-outline" size={18} color="#ef4444" />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.rowButtonTitle, { color: '#ef4444' }]}>
                            {safeT('profile.deleteAccount', 'Eliminar cuenta')}
                          </Text>
                          <Text style={[styles.rowButtonSubtitle, isDark && { color: '#94a3b8' }]}>
                            {safeT('profile.deleteAccountMessageShort', 'Esta acción es permanente')}
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                    </Pressable>
                  )}
                </View>

                {/* ESTADÍSTICAS PRO */}
                {showPro && (
                  <View style={[styles.statsCard, isDark && { backgroundColor: '#020617' }]}>
                    <View style={styles.statsHeader}>
                      <View style={[styles.statsIconBox, { backgroundColor: `${accent}20` }]}>
                        <Ionicons name="trending-up" size={22} color={accent} />
                      </View>
                      <View style={styles.statsHeaderText}>
                        <Text style={[styles.statsTitle, isDark && { color: '#e5e7eb' }]}>{t('profile.proStatsTitle')}</Text>
                        <Text style={[styles.statsSubtitle, isDark && { color: '#94a3b8' }]}>Últimos 7 días</Text>
                      </View>
                    </View>

                    {statsLoading ? (
                      <View style={styles.statsLoading}>
                        <ActivityIndicator color={accent} size="small" />
                      </View>
                    ) : !stats || stats.weekTotal === 0 ? (
                      <View style={styles.emptyStats}>
                        <Ionicons name="bar-chart-outline" size={32} color="#cbd5e1" />
                        <Text style={[styles.emptyStatsText, isDark && { color: '#94a3b8' }]}>{t('profile.proStatsEmpty')}</Text>
                      </View>
                    ) : (
                      <View style={styles.statsGrid}>
                        <View style={[styles.statBox, { backgroundColor: `${accent}08` }]}>
                          <Text style={[styles.statLabel, isDark && { color: '#cbd5e1' }]}>{t('profile.proStatsWeekLabel')}</Text>
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
                            <Text style={[styles.statLabel, isDark && { color: '#cbd5e1' }]}>{t('profile.proStatsBestDayLabel')}</Text>
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

                {/* BOTÓN CERRAR SESIÓN: eliminado -- los usuarios no pueden cerrar sesión */}
              </>
            )}
          </Animated.ScrollView>
        )}

        {/* MODAL POLÍTICA */}
        <Modal
          visible={showPolicyModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowPolicyModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, isDark && { backgroundColor: '#020617' }]}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHandle} />
                <View style={styles.modalTitleRow}>
                  <View style={[styles.modalIconCircle, { backgroundColor: `${accent}20` }]}>
                    <Ionicons name="shield-checkmark" size={24} color={accent} />
                  </View>
                  <Text style={[styles.modalTitle, isDark && { color: '#e5e7eb' }]}>{t('profile.privacyPolicy')}</Text>
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
                  <Text style={[styles.modalText, isDark && { color: '#cbd5e1' }]}>{t('profile.privacyIntro')}</Text>
                </View>

                <View style={styles.policySection}>
                  <View style={styles.policySectionHeader}>
                    <View style={[styles.policySectionIcon, { backgroundColor: `${accent}15` }]}>
                      <Ionicons name="shield" size={18} color={accent} />
                    </View>
                    <Text style={[styles.policySubtitle, isDark && { color: '#e5e7eb' }]}>
                      {t('profile.privacyUseOfDataTitle')}
                    </Text>
                  </View>
                  <Text style={[styles.modalText, isDark && { color: '#cbd5e1' }] }>
                    {t('profile.privacyUseOfDataText')}
                  </Text>
                  <View style={styles.bulletList}>
                    <View style={styles.bulletItem}>
                      <View style={[styles.bulletDot, { backgroundColor: accent }]} />
                      <Text style={[styles.bulletText, isDark && { color: '#cbd5e1' }] }>
                        {t('profile.privacyUseOfDataBullet1')}
                      </Text>
                    </View>
                    <View style={styles.bulletItem}>
                      <View style={[styles.bulletDot, { backgroundColor: accent }]} />
                      <Text style={[styles.bulletText, isDark && { color: '#cbd5e1' }] }>
                        {t('profile.privacyUseOfDataBullet2')}
                      </Text>
                    </View>
                    <View style={styles.bulletItem}>
                      <View style={[styles.bulletDot, { backgroundColor: accent }]} />
                      <Text style={[styles.bulletText, isDark && { color: '#cbd5e1' }] }>
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
                    <Text style={[styles.policySubtitle, isDark && { color: '#e5e7eb' }]}>
                      {t('profile.privacySharingTitle')}
                    </Text>
                  </View>
                  <Text style={[styles.modalText, isDark && { color: '#cbd5e1' }] }>
                    {t('profile.privacySharingText')}
                  </Text>
                </View>

                <View style={styles.policySection}>
                  <View style={styles.policySectionHeader}>
                    <View style={[styles.policySectionIcon, { backgroundColor: `${accent}15` }]}>
                      <Ionicons name="warning" size={18} color={accent} />
                    </View>
                    <Text style={[styles.policySubtitle, isDark && { color: '#e5e7eb' }]}>
                      {t('profile.privacyLiabilityTitle')}
                    </Text>
                  </View>
                  <Text style={[styles.modalText, isDark && { color: '#cbd5e1' }] }>
                    {t('profile.privacyLiabilityText')}
                  </Text>
                </View>

                <View style={styles.policySection}>
                  <View style={styles.policySectionHeader}>
                    <View style={[styles.policySectionIcon, { backgroundColor: `${accent}15` }]}>
                      <Ionicons name="medical" size={18} color={accent} />
                    </View>
                    <Text style={[styles.policySubtitle, isDark && { color: '#e5e7eb' }]}>
                      {t('profile.privacyNotAdviceTitle')}
                    </Text>
                  </View>
                  <Text style={[styles.modalText, isDark && { color: '#cbd5e1' }] }>
                    {t('profile.privacyNotAdviceText')}
                  </Text>
                </View>

                <View style={styles.policySection}>
                  <View style={styles.policySectionHeader}>
                    <View style={[styles.policySectionIcon, { backgroundColor: `${accent}15` }]}>
                      <Ionicons name="hand-right" size={18} color={accent} />
                    </View>
                    <Text style={[styles.policySubtitle, isDark && { color: '#e5e7eb' }]}>
                      {t('profile.privacyRightsTitle')}
                    </Text>
                  </View>
                  <Text style={[styles.modalText, isDark && { color: '#cbd5e1' }] }>
                    {t('profile.privacyRightsText')}
                  </Text>
                </View>

                <View style={styles.policySection}>
                  <View style={styles.policySectionHeader}>
                    <View style={[styles.policySectionIcon, { backgroundColor: `${accent}15` }]}>
                      <Ionicons name="happy" size={18} color={accent} />
                    </View>
                    <Text style={[styles.policySubtitle, isDark && { color: '#e5e7eb' }]}>
                      {t('profile.privacyMinorsTitle')}
                    </Text>
                  </View>
                  <Text style={[styles.modalText, isDark && { color: '#cbd5e1' }]}>
                    {t('profile.privacyMinorsText')}
                  </Text>
                </View>

                <View style={styles.policySection}>
                  <View style={styles.policySectionHeader}>
                    <View style={[styles.policySectionIcon, { backgroundColor: `${accent}15` }]}>
                      <Ionicons name="sync" size={18} color={accent} />
                    </View>
                    <Text style={[styles.policySubtitle, isDark && { color: '#e5e7eb' }]}>
                      {t('profile.privacyChangesTitle')}
                    </Text>
                  </View>
                  <Text style={[styles.modalText, isDark && { color: '#cbd5e1' }]}>
                    {t('profile.privacyChangesText')}
                  </Text>
                </View>

                <View style={[styles.policySection, styles.acceptanceSection]}>
                  <View style={styles.acceptanceIconWrapper}>
                    <Ionicons name="checkmark-circle" size={28} color={accent} />
                  </View>
                  <Text style={[styles.acceptanceText, { color: '#111827' }]}>
                    {t('profile.privacyAcceptanceText')}
                  </Text>
                </View>
              </ScrollView>

              <View style={[styles.modalFooter, isDark && { backgroundColor: '#020617', borderTopColor: '#1e293b' }]}>
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
            <SafeAreaView
              edges={['bottom']}
              style={[
                styles.modalContent,
                isDark && { backgroundColor: '#020617' },
              ]}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalHandle} />
                <View style={styles.modalTitleRow}>
                  <View style={[styles.modalIconCircle, { backgroundColor: `${accent}20` }]}>
                    <Ionicons name="settings" size={24} color={accent} />
                  </View>
                  <Text style={[styles.modalTitle, isDark && { color: '#e5e7eb' }]}>{t('profile.settingsModalTitle')}</Text>
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
                  contentContainerStyle={[
                    styles.modalScrollContent,
                    { paddingBottom: 20 + (insets?.bottom || 0) },
                  ]}
                  showsVerticalScrollIndicator
                >
                  {/* INFORMACIÓN PERSONAL */}
                  <View style={[styles.settingsCard, isDark && { backgroundColor: '#020617', borderColor: '#1e293b' }] }>
                    <View style={styles.settingsCardHeader}>
                      <View style={[styles.settingsCardIcon, { backgroundColor: `${accent}20` }]}>
                        <Ionicons name="person" size={20} color={accent} />
                      </View>
                      <Text style={[styles.settingsCardTitle, isDark && { color: '#e5e7eb' }]}>{t('profile.personalInfo')}</Text>
                    </View>

                    <View style={styles.inputGroup}>
                      <View style={styles.inputField}>
                        <Text style={[styles.inputLabel, isDark && { color: '#cbd5e1' }]}>{t('profile.firstName')}</Text>
                        <View style={[styles.inputContainer, isDark && { backgroundColor: '#020617', borderColor: '#1e293b' }] }>
                          <Ionicons name="person-outline" size={18} color="#9ca3af" />
                          <TextInput
                            style={[styles.textInput, isDark && { color: '#e5e7eb' }]}
                            value={nombre}
                            onChangeText={setNombre}
                            placeholder={t('profile.firstName')}
                            placeholderTextColor="#9ca3af"
                          />
                        </View>
                      </View>

                      <View style={styles.inputField}>
                        <Text style={[styles.inputLabel, isDark && { color: '#cbd5e1' }]}>{t('profile.lastName')}</Text>
                        <View style={[styles.inputContainer, isDark && { backgroundColor: '#020617', borderColor: '#1e293b' }] }>
                          <Ionicons name="person-outline" size={18} color="#9ca3af" />
                          <TextInput
                            style={[styles.textInput, isDark && { color: '#e5e7eb' }]}
                            value={apellido}
                            onChangeText={setApellido}
                            placeholder={t('profile.lastName')}
                            placeholderTextColor="#9ca3af"
                          />
                        </View>
                      </View>

                      <View style={styles.inputField}>
                        <Text style={[styles.inputLabel, isDark && { color: '#cbd5e1' }]}>{t('profile.email')}</Text>
                        <View style={[styles.readOnlyContainer, isDark && { backgroundColor: '#020617', borderColor: '#1e293b' }] }>
                          <Ionicons name="mail" size={18} color="#6b7280" />
                          <Text style={[styles.readOnlyText, isDark && { color: '#cbd5e1' }]}>{profile?.email}</Text>
                        </View>
                      </View>

                      <View style={styles.inputField}>
                        <Text style={[styles.inputLabel, isDark && { color: '#cbd5e1' }]}>{t('profile.age')}</Text>
                        <View style={[styles.inputContainer, isDark && { backgroundColor: '#020617', borderColor: '#1e293b' }] }>
                          <Ionicons name="calendar-outline" size={18} color="#9ca3af" />
                          <TextInput
                            style={[styles.textInput, isDark && { color: '#e5e7eb' }]}
                            value={edad}
                            onChangeText={setEdad}
                            placeholder={t('profile.age')}
                            placeholderTextColor="#9ca3af"
                            keyboardType="numeric"
                          />
                        </View>
                      </View>

                      <View style={styles.inputField}>
                        <Text style={[styles.inputLabel, isDark && { color: '#cbd5e1' }]}>{t('profile.gender')}</Text>
                        <Pressable
                          style={[styles.genderSelector, isDark && { backgroundColor: '#020617', borderColor: '#1e293b' }]}
                          onPress={() => setShowGenderModal(true)}
                        >
                          <View style={styles.genderSelectorContent}>
                            <Ionicons name="people-outline" size={18} color={genero ? (isDark ? '#e5e7eb' : '#111827') : '#9ca3af'} />
                            <Text
                              style={genero
                                ? [styles.genderValue, isDark && { color: '#e5e7eb' }]
                                : [styles.genderPlaceholder, isDark && { color: '#6b7280' }]}
                            >
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
                        <Text style={[styles.successText, isDark && { color: '#bbf7d0' }]}>{successMessage}</Text>
                      </View>
                    )}
                  </View>

                  {/* PERSONALIZACIÓN */}
                  <View style={[styles.settingsCard, isDark && { backgroundColor: '#020617', borderColor: '#1e293b' }] }>
                    <View style={styles.settingsCardHeader}>
                      <View style={[styles.settingsCardIcon, { backgroundColor: `${accent}20` }]}>
                        <Ionicons name="color-palette" size={20} color={accent} />
                      </View>
                      <Text style={[styles.settingsCardTitle, isDark && { color: '#e5e7eb' }]}>{t('profile.customization')}</Text>
                    </View>

                    <View style={styles.inputGroup}>
                      <View style={styles.inputField}>
                        <Text style={[styles.inputLabel, isDark && { color: '#cbd5e1' }]}>{t('profile.appearanceMode')}</Text>
                        <View style={styles.languageGrid}>
                          {[
                            { key: 'light', label: t('profile.appearanceLight'), icon: 'sunny-outline' },
                            { key: 'dark', label: t('profile.appearanceDark'), icon: 'moon-outline' },
                          ].map((opt) => {
                            const isActive = opt.key === themeMode;
                            return (
                              <Pressable
                                key={opt.key}
                                style={[
                                  styles.languageOption,
                                  isActive && [styles.languageOptionActive, { borderColor: accent }],
                                  isDark && { backgroundColor: '#020617', borderColor: '#1e293b' },
                                ]}
                                onPress={() => setThemeMode(opt.key)}
                              >
                                <Ionicons
                                  name={opt.icon}
                                  size={18}
                                  color={isActive ? accent : isDark ? '#e5e7eb' : '#64748b'}
                                />
                                <Text
                                  style={[
                                    styles.languageLabel,
                                    isActive && { color: accent, fontWeight: '700' },
                                    isDark && !isActive && { color: '#cbd5e1' },
                                  ]}
                                >
                                  {opt.label}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>

                      <View style={styles.inputField}>
                        <Text style={[styles.inputLabel, isDark && { color: '#cbd5e1' }]}>{t('profile.interfaceColor')}</Text>
                        <View style={styles.colorGrid}>
                          {[
                            { key: 'blue', label: t('profile.colorBlue'), color: '#4F7DF3' },
                            { key: 'pink', label: t('profile.colorPink'), color: '#EC6BAA' },
                            { key: 'green', label: t('profile.colorGreen'), color: '#2ECC71' },
                            { key: 'purple', label: t('profile.colorPurple'), color: '#7B61FF' },
                            { key: 'orange', label: t('profile.colorOrange'), color: '#FF8A3D' },
                          ].map((opt) => {
                            const isActive = opt.key === themeColor;
                            return (
                              <Pressable
                                key={opt.key}
                                style={[
                                  styles.colorOption,
                                  isActive && [styles.colorOptionActive, { borderColor: opt.color }],
                                  isDark && { backgroundColor: '#020617', borderColor: '#1e293b' },
                                ]}
                                onPress={() => setThemeColor(opt.key)}
                              >
                                <View style={[styles.colorCircle, { backgroundColor: opt.color }]} />
                                <Text style={[styles.colorLabel, isActive && { color: opt.color, fontWeight: '700' }, isDark && !isActive && { color: '#cbd5e1' }]}>
                                  {opt.label}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>

                      <View style={styles.inputField}>
                        <Text style={[styles.inputLabel, isDark && { color: '#cbd5e1' }]}>{t('profile.appLanguage')}</Text>
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
                                  isDark && { backgroundColor: '#020617', borderColor: '#1e293b' },
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
                                <Text style={[styles.languageLabel, isActive && { color: accent, fontWeight: '700' }, isDark && !isActive && { color: '#cbd5e1' }]}>
                                  {opt.label}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* NOTIFICACIONES */}
                  <View style={[styles.settingsCard, isDark && { backgroundColor: '#020617', borderColor: '#1e293b' }] }>
                    <View style={styles.settingsCardHeader}>
                      <View style={[styles.settingsCardIcon, { backgroundColor: `${accent}20` }]}>
                        <Ionicons name="notifications" size={20} color={accent} />
                      </View>
                      <Text style={[styles.settingsCardTitle, isDark && { color: '#e5e7eb' }]}>
                        {t('profile.notificationsTitle')}
                      </Text>
                    </View>

                    <View style={styles.inputGroup}>
                      <View style={styles.inputField}>
                        <View style={[styles.rowBetween, { alignItems: 'center' }]}>
                          <Text style={[styles.inputLabel, isDark && { color: '#cbd5e1' }]}>
                            {t('profile.notificationsEnabled')}
                          </Text>
                          <Switch
                            value={!!notificationsEnabled}
                            onValueChange={async (v) => {
                              await setNotificationsEnabled(!!v);
                              if (!v) {
                                await cancelAllScheduledNotifications();
                              }
                            }}
                            trackColor={{ false: '#e5e7eb', true: `${accent}66` }}
                            thumbColor={notificationsEnabled ? accent : '#9ca3af'}
                          />
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* FORMATO DE HORA */}
                  <View style={[styles.settingsCard, isDark && { backgroundColor: '#020617', borderColor: '#1e293b' }] }>
                    <View style={styles.settingsCardHeader}>
                      <View style={[styles.settingsCardIcon, { backgroundColor: `${accent}20` }]}>
                        <Ionicons name="time" size={20} color={accent} />
                      </View>
                      <Text style={[styles.settingsCardTitle, isDark && { color: '#e5e7eb' }]}>
                        {t('profile.timeFormatTitle')}
                      </Text>
                    </View>

                    <View style={styles.inputGroup}>
                      <View style={styles.inputField}>
                        <View style={styles.languageGrid}>
                          {[
                            { key: 'system', label: t('profile.timeFormatSystem'), icon: 'settings-outline' },
                            { key: '12h', label: t('profile.timeFormat12h'), icon: 'sunny-outline' },
                            { key: '24h', label: t('profile.timeFormat24h'), icon: 'moon-outline' },
                          ].map((opt) => {
                            const isActive = opt.key === timeFormat;
                            return (
                              <Pressable
                                key={opt.key}
                                style={[
                                  styles.languageOption,
                                  isActive && [styles.languageOptionActive, { borderColor: accent }],
                                  isDark && { backgroundColor: '#020617', borderColor: '#1e293b' },
                                ]}
                                onPress={() => setTimeFormat(opt.key)}
                              >
                                <Ionicons
                                  name={opt.icon}
                                  size={18}
                                  color={isActive ? accent : isDark ? '#e5e7eb' : '#64748b'}
                                />
                                <Text
                                  style={[
                                    styles.languageLabel,
                                    isActive && { color: accent, fontWeight: '700' },
                                    isDark && !isActive && { color: '#cbd5e1' },
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

                  {/* FEEDBACK */}
                  <View style={[styles.settingsCard, isDark && { backgroundColor: '#020617', borderColor: '#1e293b' }] }>
                    <View style={styles.settingsCardHeader}>
                      <View style={[styles.settingsCardIcon, { backgroundColor: `${accent}20` }]}>
                        <Ionicons name="chatbubble-ellipses" size={20} color={accent} />
                      </View>
                      <Text style={[styles.settingsCardTitle, isDark && { color: '#e5e7eb' }]}>
                        {t('profile.feedbackTitle')}
                      </Text>
                    </View>

                    <Pressable style={styles.policyLink} onPress={() => setShowFeedbackModal(true)}>
                      <View style={styles.policyLinkContent}>
                        <View style={[styles.policyLinkIcon, { backgroundColor: `${accent}15` }]}>
                          <Ionicons name="chatbubble-ellipses-outline" size={18} color={accent} />
                        </View>
                        <Text style={[styles.policyLinkText, { color: accent }]}>
                          {t('profile.feedbackOpen')}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                    </Pressable>
                  </View>

                  {/* POLÍTICA DE PRIVACIDAD */}
                  <View style={[styles.settingsCard, isDark && { backgroundColor: '#020617', borderColor: '#1e293b' }] }>
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

                  {/* BORRAR CUENTA */}
                  <View style={[styles.settingsCard, isDark && { backgroundColor: '#020617', borderColor: '#1e293b' }] }>
                    <Pressable
                      style={styles.policyLink}
                      onPress={handleDeleteAccount}
                      disabled={deletingAccount}
                    >
                      <View style={styles.policyLinkContent}>
                        <View style={[styles.policyLinkIcon, { backgroundColor: '#ef444420' }]}>
                          {deletingAccount ? (
                            <ActivityIndicator size="small" color="#ef4444" />
                          ) : (
                            <Ionicons name="trash-outline" size={18} color="#ef4444" />
                          )}
                        </View>
                        <Text style={[styles.policyLinkText, { color: '#ef4444' }]}>{t('profile.deleteAccount')}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                    </Pressable>
                  </View>

                  <View style={{ height: 100 + (insets?.bottom || 0) }} />
                </ScrollView>

                {/* BOTÓN GUARDAR FLOTANTE */}
                <View
                  style={[
                    styles.floatingButtonContainer,
                    { paddingBottom: 16 + (insets?.bottom || 0) },
                    isDark && { backgroundColor: '#020617', borderTopColor: '#1e293b' },
                  ]}
                >
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
            </SafeAreaView>
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
              style={[styles.genderModal, isDark && { backgroundColor: '#020617' }]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.genderModalHeader}>
                <View style={[styles.genderModalIcon, { backgroundColor: `${accent}20` }]}>
                  <Ionicons name="people" size={24} color={accent} />
                </View>
                <Text style={[styles.genderModalTitle, isDark && { color: '#e5e7eb' }]}>
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
                      isDark && { color: '#cbd5e1' },
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

        {/* QUICK MODAL: IDIOMA */}
        <Modal
          visible={showQuickLanguageModal}
          animationType="fade"
          transparent
          onRequestClose={() => setShowQuickLanguageModal(false)}
        >
          <Pressable
            style={styles.modalOverlayCenter}
            onPress={() => setShowQuickLanguageModal(false)}
          >
            <Pressable
              style={[styles.quickSelectModal, isDark && { backgroundColor: '#020617' }]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.quickSelectHeader}>
                <View style={[styles.quickSelectIcon, { backgroundColor: `${accent}20` }]}>
                  <Ionicons name="language" size={22} color={accent} />
                </View>
                <Text style={[styles.quickSelectTitle, isDark && { color: '#e5e7eb' }]}>
                  {safeT('profile.appLanguage', 'Idioma')}
                </Text>
              </View>

              <View style={styles.quickSelectList}>
                {quickLanguageOptions.map((opt, index) => {
                  const active = opt.key === (languageValue || language);
                  return (
                    <Pressable
                      key={opt.key}
                      style={[
                        styles.quickSelectItem,
                        index !== quickLanguageOptions.length - 1 && styles.quickSelectItemBorder,
                        active && [styles.quickSelectItemActive, { backgroundColor: `${accent}10` }],
                      ]}
                      onPress={async () => {
                        setLanguageValue(opt.key);
                        setLanguage(opt.key);
                        setShowQuickLanguageModal(false);
                        try {
                          await clearHabitCache();
                        } catch {
                        }
                      }}
                    >
                      <View style={styles.quickSelectItemLeft}>
                        <Text style={styles.quickSelectFlag}>{opt.flag}</Text>
                        <Text
                          style={[
                            styles.quickSelectItemText,
                            isDark && { color: '#cbd5e1' },
                            active && [styles.quickSelectItemTextActive, { color: accent }],
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </View>
                      {active && <Ionicons name="checkmark-circle" size={20} color={accent} />}
                    </Pressable>
                  );
                })}
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* QUICK MODAL: FORMATO DE HORA */}
        <Modal
          visible={showQuickTimeFormatModal}
          animationType="fade"
          transparent
          onRequestClose={() => setShowQuickTimeFormatModal(false)}
        >
          <Pressable
            style={styles.modalOverlayCenter}
            onPress={() => setShowQuickTimeFormatModal(false)}
          >
            <Pressable
              style={[styles.quickSelectModal, isDark && { backgroundColor: '#020617' }]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.quickSelectHeader}>
                <View style={[styles.quickSelectIcon, { backgroundColor: `${accent}20` }]}>
                  <Ionicons name="time" size={22} color={accent} />
                </View>
                <Text style={[styles.quickSelectTitle, isDark && { color: '#e5e7eb' }]}>
                  {safeT('profile.timeFormatTitle', 'Formato de hora')}
                </Text>
              </View>

              <View style={styles.quickSelectList}>
                {quickTimeFormatOptions.map((opt, index) => {
                  const active = opt.key === timeFormat;
                  return (
                    <Pressable
                      key={opt.key}
                      style={[
                        styles.quickSelectItem,
                        index !== quickTimeFormatOptions.length - 1 && styles.quickSelectItemBorder,
                        active && [styles.quickSelectItemActive, { backgroundColor: `${accent}10` }],
                      ]}
                      onPress={() => {
                        setTimeFormat(opt.key);
                        setShowQuickTimeFormatModal(false);
                      }}
                    >
                      <View style={styles.quickSelectItemLeft}>
                        <Ionicons
                          name={opt.icon}
                          size={18}
                          color={active ? accent : isDark ? '#cbd5e1' : '#64748b'}
                        />
                        <Text
                          style={[
                            styles.quickSelectItemText,
                            isDark && { color: '#cbd5e1' },
                            active && [styles.quickSelectItemTextActive, { color: accent }],
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </View>
                      {active && <Ionicons name="checkmark-circle" size={20} color={accent} />}
                    </Pressable>
                  );
                })}
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* MODAL FEEDBACK */}
        <Modal
          visible={showFeedbackModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowFeedbackModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, isDark && { backgroundColor: '#020617' }]}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHandle} />
                <View style={styles.modalTitleRow}>
                  <View style={[styles.modalIconCircle, { backgroundColor: `${accent}20` }]}>
                    <Ionicons name="chatbubble-ellipses" size={24} color={accent} />
                  </View>
                  <Text style={[styles.modalTitle, isDark && { color: '#e5e7eb' }]}>
                    {t('profile.feedbackTitle')}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowFeedbackModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={26} color="#6b7280" />
                </Pressable>
              </View>

              <View style={styles.settingsBody}>
                <ScrollView
                  style={styles.modalScroll}
                  contentContainerStyle={styles.modalScrollContent}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={[styles.settingsCard, isDark && { backgroundColor: '#020617', borderColor: '#1e293b' }] }>
                    <View style={styles.inputGroup}>
                      <View style={styles.inputField}>
                        <Text style={[styles.inputLabel, isDark && { color: '#cbd5e1' }]}>
                          {t('profile.feedbackMessageLabel')}
                        </Text>
                        <View style={[styles.inputContainer, { alignItems: 'flex-start' }, isDark && { backgroundColor: '#020617', borderColor: '#1e293b' }]}>
                          <TextInput
                            style={[styles.textInput, { minHeight: 120, textAlignVertical: 'top' }, isDark && { color: '#e5e7eb' }]}
                            value={feedbackText}
                            onChangeText={setFeedbackText}
                            placeholder={t('profile.feedbackMessagePlaceholder')}
                            placeholderTextColor="#9ca3af"
                            multiline
                          />
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={{ height: 100 + (insets?.bottom || 0) }} />
                </ScrollView>

                <View
                  style={[
                    styles.floatingButtonContainer,
                    { paddingBottom: 16 + (insets?.bottom || 0) },
                    isDark && { backgroundColor: '#020617', borderTopColor: '#1e293b' },
                  ]}
                >
                  <Pressable
                    style={[
                      styles.saveButton,
                      { backgroundColor: accent },
                      feedbackSending && styles.saveButtonDisabled,
                    ]}
                    onPress={async () => {
                      if (feedbackSending) return;
                      const msg = String(feedbackText || '').trim();
                      if (!msg) {
                        Alert.alert(t('profile.feedbackTitle'), t('profile.feedbackEmpty'));
                        return;
                      }
                      await sendFeedbackInApp(msg);
                    }}
                    disabled={feedbackSending}
                  >
                    {feedbackSending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="send" size={22} color="#fff" />
                    )}
                    <Text style={styles.saveButtonText}>
                      {feedbackSending ? t('profile.feedbackSending') : t('profile.feedbackSend')}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
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
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: Platform.OS === 'ios' ? 8 : 4,
    marginBottom: 12,
  },
  settingsIconButton: {
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
    marginTop: 0,
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
    paddingTop: 8,
    paddingBottom: 32,
  },

  // SECTION CARDS (MAIN SCREEN)
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  sectionHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  sectionHeaderSubtitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  sectionHeaderAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: '#ffffff',
  },
  sectionHeaderActionText: {
    fontSize: 12,
    fontWeight: '800',
  },

  quickSettingsHeader: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 10,
    marginBottom: 14,
  },
  quickSettingsHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickSettingsHeaderAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: '#ffffff',
  },

  quickSettingsRows: {
    gap: 10,
  },
  quickSettingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  quickSettingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  quickSettingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickSettingTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
  },
  quickSettingSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },

  rowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    marginBottom: 10,
  },
  rowButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowButtonTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
  },
  rowButtonSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },

  metaRow: {
    marginTop: 6,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  metaPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
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
  moreSettingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginTop: 16,
  },
  moreSettingsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
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
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
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
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
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

  // QUICK SELECT MODALS
  quickSelectModal: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 14,
  },
  quickSelectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  quickSelectIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickSelectTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  quickSelectList: {
    gap: 0,
  },
  quickSelectItem: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
  },
  quickSelectItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  quickSelectItemActive: {
    borderBottomWidth: 0,
  },
  quickSelectItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  quickSelectItemText: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '600',
  },
  quickSelectItemTextActive: {
    fontWeight: '900',
  },
  quickSelectFlag: {
    fontSize: 18,
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