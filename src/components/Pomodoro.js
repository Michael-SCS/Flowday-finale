import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, Modal, ScrollView } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

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

export default function PomodoroScreen() {
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
  const [showSettingsModal, setShowSettingsModal] = useState(true);
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
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerIconContainer}>
          <Ionicons name="timer" size={28} color="#fff" />
        </View>
        <Text style={styles.title}>Pomodoro</Text>
      </View>

      {fullScreenMode ? (
        <View style={styles.fullScreenContent}>
          <View style={styles.timerCard}>
            <View style={styles.timerCircle}>
              <View style={styles.timerInner}>
                {countdownActive ? (
                  <>
                    <Text style={styles.countdownText}>{countdownValue}</Text>
                    <Text style={styles.phaseText}>Prepárate...</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.timerText}>
                      {minutes}:{secs.toString().padStart(2, '0')}
                    </Text>
                    <View style={styles.phaseContainer}>
                      <Ionicons 
                        name={phase === 'work' ? 'briefcase' : 'cafe'} 
                        size={20} 
                        color="#fb7185" 
                      />
                      <Text style={styles.phaseText}>
                        {phase === 'work' ? 'Trabajo' : 'Descanso'}
                      </Text>
                    </View>
                    <View style={styles.sessionBadge}>
                      <Text style={styles.sessionText}>
                        Sesión {currentSession} / {totalSessions}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progress * 100}%` },
                ]}
              />
            </View>
          </View>

          <Pressable
            style={styles.fullScreenStopButton}
            onPress={handleStop}
          >
            <Ionicons name="stop-circle" size={24} color="#fff" />
            <Text style={styles.mainButtonText}>Detener</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.mainContent}>
          <View style={styles.timerCard}>
            <View style={styles.timerCircle}>
              <View style={styles.timerInner}>
                <Text style={styles.timerText}>
                  {minutes}:{secs.toString().padStart(2, '0')}
                </Text>
                <View style={styles.phaseContainer}>
                  <Ionicons 
                    name={phase === 'work' ? 'briefcase' : 'cafe'} 
                    size={20} 
                    color="#fb7185" 
                  />
                  <Text style={styles.phaseText}>
                    {phase === 'work' ? 'Trabajo' : 'Descanso'}
                  </Text>
                </View>
                <View style={styles.sessionBadge}>
                  <Text style={styles.sessionText}>
                    Sesión {currentSession} / {totalSessions}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progress * 100}%` },
                ]}
              />
            </View>

            {customInvalid && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color="#ef4444" />
                <Text style={styles.errorText}>
                  Revisa los minutos personalizados
                </Text>
              </View>
            )}
          </View>

          <View style={styles.controlsRow}>
            <Pressable
              style={[
                styles.mainButton,
                !canStart && styles.mainButtonDisabled,
              ]}
              onPress={handleStart}
              disabled={!canStart}
            >
              <Ionicons name="play-circle" size={24} color="#fff" />
              <Text style={styles.mainButtonText}>Iniciar</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => setShowSettingsModal(true)}
            >
              <Ionicons name="settings-outline" size={22} color="#fb7185" />
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
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowSettingsModal(false)}
        >
          <Pressable 
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            {/* HEADER MODAL */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <View style={styles.modalTitleContainer}>
                <Ionicons name="settings" size={24} color="#fb7185" />
                <Text style={styles.modalTitle}>Configuración</Text>
              </View>
              <Pressable 
                onPress={() => setShowSettingsModal(false)}
                style={styles.modalClose}
              >
                <Ionicons name="close-circle" size={28} color="#6b7280" />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {/* PRESETS */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="flash" size={20} color="#fb7185" />
                  <Text style={styles.sectionTitle}>Ajustes rápidos</Text>
                </View>

                <View style={styles.presetsGrid}>
                {PRESETS.map((preset) => {
                  const isActive = !useCustom && preset.id === selectedPresetId;
                  return (
                    <Pressable
                      key={preset.id}
                      style={[
                        styles.presetButton,
                        isActive && styles.presetButtonActive,
                      ]}
                      onPress={() => handleSelectPreset(preset)}
                    >
                      <Text
                        style={[
                          styles.presetButtonText,
                          isActive && styles.presetButtonTextActive,
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
                    useCustom && styles.presetButtonActive,
                  ]}
                  onPress={handleToggleCustom}
                >
                  <Ionicons 
                    name="create" 
                    size={16} 
                    color={useCustom ? '#fff' : '#fb7185'} 
                  />
                  <Text
                    style={[
                      styles.presetButtonText,
                      useCustom && styles.presetButtonTextActive,
                    ]}
                  >
                    Personalizado
                  </Text>
                </Pressable>
              </View>

                {useCustom && (
                  <View style={styles.customRow}>
                    <View style={styles.customField}>
                      <Text style={styles.label}>Trabajo (min)</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="25"
                        placeholderTextColor="#9ca3af"
                        value={customWork}
                        onChangeText={setCustomWork}
                      />
                    </View>
                    <View style={styles.customField}>
                      <Text style={styles.label}>Descanso (min)</Text>
                      <TextInput
                        style={styles.input}
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
                  <Ionicons name="repeat" size={20} color="#fb7185" />
                  <Text style={styles.sectionTitle}>Sesiones</Text>
                </View>

                <View style={styles.sessionsCard}>
                  <View style={styles.sessionsInfo}>
                    <Text style={styles.sessionsMainText}>
                      {totalSessions} sesiones
                    </Text>
                    <Text style={styles.sessionsSubText}>
                      {workMinutes} min trabajo • {restMinutes} min descanso
                    </Text>
                    <View style={styles.totalBadge}>
                      <Ionicons name="time" size={14} color="#fb7185" />
                      <Text style={styles.totalText}>
                        Total: {totalPlanMinutes} min
                      </Text>
                    </View>
                  </View>

                  <View style={styles.sessionsControls}>
                    <Pressable
                      style={styles.sessionsButton}
                      onPress={() => handleChangeSessions(-1)}
                    >
                      <Ionicons name="remove" size={20} color="#fb7185" />
                    </Pressable>
                    <View style={styles.sessionsCountContainer}>
                      <Text style={styles.sessionsCount}>{totalSessions}</Text>
                    </View>
                    <Pressable
                      style={styles.sessionsButton}
                      onPress={() => handleChangeSessions(1)}
                    >
                      <Ionicons name="add" size={20} color="#fb7185" />
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* BOTÓN GUARDAR */}
              <Pressable
                style={styles.modalSaveButton}
                onPress={handleSaveSettings}
              >
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.modalSaveButtonText}>Guardar configuración</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
    backgroundColor: '#fafafa',
  },

  mainContent: {
    flex: 1,
    justifyContent: 'space-between',
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
    backgroundColor: '#fb7185',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fb7185',
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
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 8,
    borderColor: '#ffe4e6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    backgroundColor: '#fffbfc',
    shadowColor: '#fb7185',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  timerInner: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  timerText: {
    fontSize: 46,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -2,
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
    color: '#fb7185',
  },
  sessionBadge: {
    backgroundColor: '#ffe4e6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  sessionText: {
    fontSize: 14,
    color: '#fb7185',
    fontWeight: '700',
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
    backgroundColor: '#fb7185',
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
    backgroundColor: '#fb7185',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fb7185',
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
    borderColor: '#fecdd3',
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
    backgroundColor: '#fb7185',
    borderRadius: 999,
    shadowColor: '#fb7185',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  countdownText: {
    fontSize: 96,
    fontWeight: '900',
    color: '#fb7185',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: 8,
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
    borderColor: '#fecdd3',
    backgroundColor: '#fff',
  },
  presetButtonActive: {
    backgroundColor: '#fb7185',
    borderColor: '#fb7185',
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fb7185',
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
    color: '#fb7185',
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
    borderColor: '#fecdd3',
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
    backgroundColor: '#fb7185',
    padding: 18,
    borderRadius: 16,
    shadowColor: '#fb7185',
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