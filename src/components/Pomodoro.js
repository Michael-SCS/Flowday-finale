import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useSettings, getAccentColor } from '../utils/settingsContext';
import { useI18n } from '../utils/i18n';
import { addFocusedMinutes } from '../utils/pomodoroStats';

/* =========================
   CONSTANTES
========================= */

const PRESETS = [
  { id: '15-5', label: '15 / 5', work: 15, rest: 5 },
  { id: '20-10', label: '20 / 10', work: 20, rest: 10 },
  { id: '25-5', label: '25 / 5', work: 25, rest: 5 },
  { id: '30-10', label: '30 / 10', work: 30, rest: 10 },
];

const INITIAL_PRESET = PRESETS[2]; // 25 / 5

const RING_RADIUS = 110;
const RING_STROKE = 6;
// use inner radius so stroke is fully inside the viewBox and won't be clipped
const RING_INNER_RADIUS = RING_RADIUS - RING_STROKE / 2;
const RING_DIAMETER = RING_RADIUS * 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_INNER_RADIUS;

export default function PomodoroScreen() {
  const { t } = useI18n();
  const { themeColor, themeMode } = useSettings();
  const accent = getAccentColor(themeColor);
  const isDark = themeMode === 'dark';
  // Configuración
  const [selectedPresetId, setSelectedPresetId] = useState(INITIAL_PRESET.id);
  const [useCustom, setUseCustom] = useState(false);
  const [customWork, setCustomWork] = useState(String(INITIAL_PRESET.work));
  const [customRest, setCustomRest] = useState(String(INITIAL_PRESET.rest));
  const [totalSessions, setTotalSessions] = useState(4);

  // Estado del timer
  const [phase, setPhase] = useState('work');
  const [currentSession, setCurrentSession] = useState(1);
  const [secondsRemaining, setSecondsRemaining] = useState(
    INITIAL_PRESET.work * 60
  );
  const [running, setRunning] = useState(false);
  const [fullScreenMode, setFullScreenMode] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [startSound, setStartSound] = useState(null);
  const [endSound, setEndSound] = useState(null);
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);

  /* =========================
     DERIVADOS
  ========================= */

  const activePreset = PRESETS.find((p) => p.id === selectedPresetId) || INITIAL_PRESET;

  const parsedCustomWork = parseInt(customWork, 10);
  const parsedCustomRest = parseInt(customRest, 10);

  const workMinutes = useCustom
    ? Math.max(isNaN(parsedCustomWork) ? 0 : parsedCustomWork, 1)
    : activePreset.work;

  const restMinutes = useCustom
    ? Math.max(isNaN(parsedCustomRest) ? 0 : parsedCustomRest, 1)
    : activePreset.rest;

  const totalPhaseSeconds = (phase === 'work' ? workMinutes : restMinutes) * 60 || 1;
  const progressRaw = 1 - secondsRemaining / totalPhaseSeconds;
  const progress = Math.min(Math.max(progressRaw, 0), 1);

  const phaseColor = phase === 'work' ? '#ef4444' : '#22c55e';
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);

  const totalMinutesPerSession = workMinutes + restMinutes;
  const totalPlanMinutes = totalMinutesPerSession * totalSessions;

  const customInvalid = useCustom && (
    isNaN(parsedCustomWork) ||
    isNaN(parsedCustomRest) ||
    parsedCustomWork <= 0 ||
    parsedCustomRest <= 0
  );

  const canStart = !customInvalid && totalSessions > 0;

  /* =========================
     SONIDOS
  ========================= */

  useEffect(() => {
    let mounted = true;

    const loadSounds = async () => {
      try {
        const [startObj, endObj] = await Promise.all([
          Audio.Sound.createAsync(
            require('../../assets/sounds/pomodoro-start.mp3')
          ),
          Audio.Sound.createAsync(
            require('../../assets/sounds/pomodoro-end.mp3')
          ),
        ]);

        if (!mounted) {
          await startObj.sound.unloadAsync();
          await endObj.sound.unloadAsync();
          return;
        }

        setStartSound(startObj.sound);
        setEndSound(endObj.sound);
      } catch (e) {
        // Si no existen los archivos de sonido, simplemente no suena
      }
    };

    loadSounds();

    return () => {
      mounted = false;
      if (startSound) {
        startSound.unloadAsync();
      }
      if (endSound) {
        endSound.unloadAsync();
      }
    };
  }, []);

  const playStartSound = async () => {
    try {
      if (startSound) {
        await startSound.replayAsync();
      }
    } catch {
      // ignorar errores de sonido
    }
  };

  const playEndSound = async () => {
    try {
      if (endSound) {
        await endSound.replayAsync();
      }
    } catch {
      // ignorar errores de sonido
    }
  };

  /* =========================
     HANDLERS
  ========================= */

  const hardReset = (workMins) => {
    const mins = workMins || workMinutes;
    setRunning(false);
    setPhase('work');
    setCurrentSession(1);
    setSecondsRemaining(mins * 60);
    setCountdownActive(false);
    setCountdownValue(3);
  };

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setUseCustom(false);
    setCustomWork(String(preset.work));
    setCustomRest(String(preset.rest));
    hardReset(preset.work);
  };

  const handleToggleCustom = () => {
    const nextUseCustom = !useCustom;
    setUseCustom(nextUseCustom);

    if (!nextUseCustom) {
      hardReset(activePreset.work);
    } else {
      const safeCustomWork = Math.max(
        isNaN(parsedCustomWork) ? 0 : parsedCustomWork,
        1
      );
      hardReset(safeCustomWork);
    }
  };

  const handleChangeSessions = (delta) => {
    setTotalSessions((prev) => {
      const next = Math.min(Math.max(prev + delta, 1), 12);
      return next;
    });
  };

  const handleStart = () => {
    if (!canStart) return;
    setFullScreenMode(true);
    setCountdownValue(3);
    setCountdownActive(true);
    playStartSound();
  };

  const handleStop = () => {
    setRunning(false);
    setFullScreenMode(false);
    hardReset();
  };

  const handleSaveSettings = () => {
    hardReset();
    setShowSettingsModal(false);
  };

  /* =========================
     TIMER
  ========================= */

  useEffect(() => {
    if (!fullScreenMode || !countdownActive) return undefined;

    const interval = setInterval(() => {
      setCountdownValue((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCountdownActive(false);
          setRunning(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [fullScreenMode, countdownActive]);

  useEffect(() => {
    if (!running) return undefined;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        const next = prev - 1;

        if (next === 3) {
          playEndSound();
        }

        if (next <= 0) {
          if (phase === 'work') {
            // Registrar minutos de foco completados en esta fase de trabajo
            addFocusedMinutes(workMinutes);

            setPhase('break');
            return restMinutes * 60;
          }

          if (currentSession >= totalSessions) {
            setRunning(false);
            return 0;
          }

          setCurrentSession((s) => s + 1);
          setPhase('work');
          return workMinutes * 60;
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [running, phase, workMinutes, restMinutes, totalSessions, currentSession]);

  /* =========================
     FORMATO TIEMPO
  ========================= */

  const minutes = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;

  /* =========================
     UI
  ========================= */
  return (
  <SafeAreaView style={[styles.safeArea, isDark && { backgroundColor: '#020617' }]}>
    <View style={[styles.container, isDark && { backgroundColor: '#020617' }]}>
    {/* HEADER */}
    {!fullScreenMode && (
      <View style={styles.header}>
      <View
        style={[
          styles.headerIconContainer,
          { backgroundColor: accent, shadowColor: accent },
        ]}
      >
        <Ionicons name="timer" size={28} color="#fff" />
      </View>
      <Text style={[styles.title, isDark && { color: '#e5e7eb' }]}>{t('pomodoro.title')}</Text>
      </View>
    )}

    {fullScreenMode ? (
        <View style={styles.fullScreenContent}>
            <View style={[styles.timerCard, isDark && { backgroundColor: '#0b1120', borderColor: '#1e293b', shadowColor: '#000' }]}>
            <View style={[styles.timerCircle, { shadowColor: accent }, isDark && { backgroundColor: '#020617', borderColor: '#1f2937' }]}>
              <Svg
                style={styles.progressSvg}
                width={RING_DIAMETER}
                height={RING_DIAMETER}
                viewBox={`0 0 ${RING_DIAMETER} ${RING_DIAMETER}`}
              >
                <Circle
                  cx={RING_RADIUS}
                  cy={RING_RADIUS}
                  r={RING_INNER_RADIUS}
                  stroke="#e5e7eb"
                  strokeWidth={RING_STROKE}
                  fill="none"
                />
                <Circle
                  cx={RING_RADIUS}
                  cy={RING_RADIUS}
                  r={RING_INNER_RADIUS}
                  stroke={phaseColor}
                  strokeWidth={RING_STROKE}
                  fill="none"
                  strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${RING_RADIUS} ${RING_RADIUS})`}
                />
              </Svg>
              <View style={[styles.timerInner, isDark && { backgroundColor: '#020617' }]}>
                {countdownActive ? (
                  <>
                    <Text style={[styles.countdownText, { color: accent }]}>{countdownValue}</Text>
                    <Text style={[styles.phaseText, { color: accent }]}>{t('pomodoro.preparing')}</Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.timerText, isDark && { color: '#e5e7eb' }]}>
                      {minutes}:{secs.toString().padStart(2, '0')}
                    </Text>
                    <View style={styles.phaseContainer}>
                      <Ionicons 
                        name={phase === 'work' ? 'briefcase' : 'cafe'} 
                        size={20} 
                        color={accent} 
                      />
                      <Text style={[styles.phaseText, { color: accent }]}>
                        {phase === 'work'
                          ? t('pomodoro.workLabel')
                          : t('pomodoro.breakLabel')}
                      </Text>
                    </View>
                    <View style={[styles.sessionBadge, isDark && { backgroundColor: '#071021' }]}>
                      <Text style={[styles.sessionText, { color: accent }, isDark && { color: accent }]}>
                        {t('pomodoro.sessions')} {currentSession} / {totalSessions}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>

          <Pressable
            style={[
              styles.fullScreenStopButton,
              { backgroundColor: accent, shadowColor: accent },
              isDark && { shadowColor: '#000' },
            ]}
            onPress={handleStop}
          >
            <Ionicons name="stop-circle" size={24} color="#fff" />
            <Text style={styles.mainButtonText}>{t('pomodoro.stop')}</Text>
          </Pressable>
        </View>
      ) : (
      <View style={styles.mainContent}>
        <View style={[styles.timerCard, isDark && { backgroundColor: '#0b1120', borderColor: '#1e293b', shadowColor: '#000' }]}>
        <View style={[styles.timerCircle, { shadowColor: accent }, isDark && { backgroundColor: '#020617', borderColor: '#1f2937' }]}>
              <Svg
                style={styles.progressSvg}
                width={RING_DIAMETER}
                height={RING_DIAMETER}
                viewBox={`0 0 ${RING_DIAMETER} ${RING_DIAMETER}`}
              >
                <Circle
                  cx={RING_RADIUS}
                  cy={RING_RADIUS}
                  r={RING_INNER_RADIUS}
                  stroke="#e5e7eb"
                  strokeWidth={RING_STROKE}
                  fill="none"
                />
                <Circle
                  cx={RING_RADIUS}
                  cy={RING_RADIUS}
                  r={RING_INNER_RADIUS}
                  stroke={phaseColor}
                  strokeWidth={RING_STROKE}
                  fill="none"
                  strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${RING_RADIUS} ${RING_RADIUS})`}
                />
              </Svg>
              <View style={[styles.timerInner, isDark && { backgroundColor: '#020617' }]}>
                    <Text style={[styles.timerText, isDark && { color: '#e5e7eb' }]}>
                  {minutes}:{secs.toString().padStart(2, '0')}
                </Text>
                <View style={styles.phaseContainer}>
                  <Ionicons 
                    name={phase === 'work' ? 'briefcase' : 'cafe'} 
                    size={20} 
                    color={accent} 
                  />
                  <Text style={[styles.phaseText, { color: accent }]}>
                    {phase === 'work'
                      ? t('pomodoro.workLabel')
                      : t('pomodoro.breakLabel')}
                  </Text>
                </View>
                    <View style={[styles.sessionBadge, isDark && { backgroundColor: '#071021' }]}>
                      <Text style={[styles.sessionText, { color: accent }, isDark && { color: accent }]}>
                    {t('pomodoro.sessions')} {currentSession} / {totalSessions}
                  </Text>
                </View>
              </View>
            </View>

            {customInvalid && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color="#ef4444" />
                <Text style={styles.errorText}>
                  {t('pomodoro.invalidCustom')}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.controlsRow}>
            <Pressable
              style={[
                styles.mainButton,
                { backgroundColor: accent, shadowColor: accent },
                !canStart && styles.mainButtonDisabled,
              ]}
              onPress={handleStart}
              disabled={!canStart}
            >
              <Ionicons name="play-circle" size={24} color="#fff" />
              <Text style={styles.mainButtonText}>{t('pomodoro.start')}</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => setShowSettingsModal(true)}
            >
              <Ionicons name="settings-outline" size={22} color={accent} />
            </Pressable>
          </View>
        </View>
      )}

      {/* MODAL DE CONFIGURACIÓN */}
      <Modal
        animationType="slide"
        transparent
        visible={showSettingsModal}
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setShowSettingsModal(false)}
          >
            <Pressable 
              style={[styles.modalContent, isDark && { backgroundColor: '#020617', borderColor: '#1e293b' }]}
              onPress={(e) => e.stopPropagation()}
            >
            {/* HEADER MODAL */}
            <View style={[styles.modalHeader, isDark && { borderBottomColor: '#1e293b' }]}>
              <View style={styles.modalHandle} />
              <View style={styles.modalTitleContainer}>
                <Ionicons name="settings" size={24} color={accent} />
                <Text style={[styles.modalTitle, isDark && { color: '#e5e7eb' }]}>{t('pomodoro.settingsTitle') || 'Configuración'}</Text>
              </View>
              <Pressable 
                onPress={() => setShowSettingsModal(false)}
                style={styles.modalClose}
              >
                <Ionicons name="close-circle" size={28} color={isDark ? '#9ca3af' : '#6b7280'} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {/* PRESETS */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="flash" size={20} color={accent} />
                  <Text style={[styles.sectionTitle, isDark && { color: '#e5e7eb' }]}>{t('pomodoro.quickSettings')}</Text>
                </View>

                <View style={styles.presetsGrid}>
                {PRESETS.map((preset) => {
                  const isActive = !useCustom && preset.id === selectedPresetId;
                  return (
                    <Pressable
                      key={preset.id}
                      style={[
                        styles.presetButton,
                        isDark && { backgroundColor: '#0b1120', borderColor: '#1e293b' },
                        isActive && styles.presetButtonActive,
                        isActive && { backgroundColor: accent, borderColor: accent },
                      ]}
                      onPress={() => handleSelectPreset(preset)}
                    >
                      <Text
                        style={[
                          styles.presetButtonText,
                          isActive && styles.presetButtonTextActive,
                          !isActive && { color: accent },
                          isDark && !isActive && { color: '#e5e7eb' },
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </Pressable>
                  );
                })}

                <Pressable
                  style={[
                    styles.presetButton,
                    isDark && { backgroundColor: '#0b1120', borderColor: '#1e293b' },
                    useCustom && styles.presetButtonActive,
                    useCustom && { backgroundColor: accent, borderColor: accent },
                  ]}
                  onPress={handleToggleCustom}
                >
                  <Ionicons 
                    name="create" 
                    size={16} 
                    color={useCustom ? '#fff' : (isDark ? '#e5e7eb' : accent)} 
                  />
                  <Text
                    style={[
                      styles.presetButtonText,
                      useCustom && styles.presetButtonTextActive,
                      !useCustom && { color: accent },
                      isDark && !useCustom && { color: '#e5e7eb' },
                    ]}
                  >
                    {t('pomodoro.presetCustom')}
                  </Text>
                </Pressable>
              </View>

                {useCustom && (
                  <View style={styles.customRow}>
                    <View style={styles.customField}>
                      <Text style={[styles.label, isDark && { color: '#9ca3af' }]}>{t('pomodoro.workMinutesLabel') || 'Trabajo (min)'}</Text>
                      <TextInput
                        style={[styles.input, isDark && { backgroundColor: '#020617', borderColor: '#1e293b', color: '#e5e7eb' }]}
                        keyboardType="numeric"
                        placeholder="25"
                        placeholderTextColor="#9ca3af"
                        value={customWork}
                        onChangeText={setCustomWork}
                      />
                    </View>
                    <View style={styles.customField}>
                      <Text style={[styles.label, isDark && { color: '#9ca3af' }]}>{t('pomodoro.restMinutesLabel') || 'Descanso (min)'}</Text>
                      <TextInput
                        style={[styles.input, isDark && { backgroundColor: '#020617', borderColor: '#1e293b', color: '#e5e7eb' }]}
                        keyboardType="numeric"
                        placeholder="5"
                        placeholderTextColor="#9ca3af"
                        value={customRest}
                        onChangeText={setCustomRest}
                      />
                    </View>
                  </View>
                )}
              </View>

              {/* SESIONES */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="repeat" size={20} color={accent} />
                  <Text style={[styles.sectionTitle, isDark && { color: '#e5e7eb' }]}>{t('pomodoro.sessions')}</Text>
                </View>

                <View style={[styles.sessionsCard, isDark && { backgroundColor: '#0b1120', borderColor: '#1e293b' }]}>
                  <View style={styles.sessionsInfo}>
                    <Text style={[styles.sessionsMainText, isDark && { color: '#e5e7eb' }]}>
                      {totalSessions} {t('pomodoro.sessions')}
                    </Text>
                    <Text style={[styles.sessionsSubText, isDark && { color: '#9ca3af' }]}>
                      {workMinutes} {t('pomodoro.workMinutes')} • {restMinutes} {t('pomodoro.restMinutes')}
                    </Text>
                    <View style={styles.totalBadge}>
                      <Ionicons name="time" size={14} color={accent} />
                      <Text style={[styles.totalText, { color: accent }, isDark && { color: '#e5e7eb' }]}> 
                        {t('pomodoro.total')} {totalPlanMinutes} min
                      </Text>
                    </View>
                  </View>

                  <View style={styles.sessionsControls}>
                    <Pressable
                      style={[styles.sessionsButton, isDark && { backgroundColor: '#020617', borderColor: '#1e293b' }]}
                      onPress={() => handleChangeSessions(-1)}
                    >
                      <Ionicons name="remove" size={20} color={accent} />
                    </Pressable>
                    <View style={styles.sessionsCountContainer}>
                      <Text style={[styles.sessionsCount, isDark && { color: '#e5e7eb' }]}>{totalSessions}</Text>
                    </View>
                    <Pressable
                      style={[styles.sessionsButton, isDark && { backgroundColor: '#020617', borderColor: '#1e293b' }]}
                      onPress={() => handleChangeSessions(1)}
                    >
                      <Ionicons name="add" size={20} color={accent} />
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* BOTÓN GUARDAR */}
              <Pressable
                style={[
                  styles.modalSaveButton,
                  { backgroundColor: accent, shadowColor: accent },
                ]}
                onPress={handleSaveSettings}
              >
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.modalSaveButtonText}>{t('pomodoro.saveConfig')}</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
        </Modal>
        </View>
      </SafeAreaView>
  );
}

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },

  mainContent: {
    flex: 1,
    justifyContent: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 14,
  },
  headerIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },

  // Timer Card
  timerCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 32,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: '#f3f4f6',
    alignItems: 'center',
  },
  timerCircle: {
    width: 230,
    height: 230,
    borderRadius: 115,
    // remove border here to avoid overlapping with the SVG stroke
    borderWidth: 0,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    backgroundColor: '#f9fafb',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  timerInner: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  timerText: {
    fontSize: 50,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -1,
    textAlign: 'center',
  },
  phaseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  phaseText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#38BDF8',
  },
  sessionBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  sessionText: {
    fontSize: 14,
    color: '#38BDF8',
    fontWeight: '700',
  },
  progressSvg: {
    position: 'absolute',
  },
  progressBarBackground: {
    width: '100%',
    height: 12,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#38BDF8',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '600',
  },

  // Controls
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  mainButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  mainButtonDisabled: {
    opacity: 0.5,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  secondaryButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // Full Screen
  fullScreenContent: {
    flex: 1,
    justifyContent: 'center',
  },
  fullScreenStopButton: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 32,
    alignSelf: 'center',
    paddingVertical: 18,
    paddingHorizontal: 40,
    backgroundColor: '#38BDF8',
    borderRadius: 999,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  countdownText: {
    fontSize: 80,
    fontWeight: '900',
    color: '#111827',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '92%',
    maxHeight: '80%',
    paddingBottom: 8,
    overflow: 'hidden',
  },
  modalScrollContent: {
    paddingBottom: 24,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#f3f4f6',
    position: 'relative',
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#d1d5db',
    borderRadius: 3,
    marginBottom: 16,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  modalClose: {
    position: 'absolute',
    right: 16,
    top: 16,
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },

  // Presets
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  presetButtonActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#38BDF8',
  },
  presetButtonTextActive: {
    color: '#fff',
  },

  // Custom
  customRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  customField: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderRadius: 12,
    backgroundColor: '#fafafa',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },

  // Sessions
  sessionsCard: {
    flexDirection: 'row',
    backgroundColor: '#fafafa',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    gap: 16,
  },
  sessionsInfo: {
    flex: 1,
    gap: 4,
  },
  sessionsMainText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  sessionsSubText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  totalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  totalText: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '700',
  },
  sessionsControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sessionsButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  sessionsCountContainer: {
    minWidth: 32,
    alignItems: 'center',
  },
  sessionsCount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },

  // Save Button
  modalSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: '#38BDF8',
    padding: 18,
    borderRadius: 16,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalSaveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});