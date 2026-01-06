import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, Image, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettings } from '../utils/settingsContext';
import { useAuth } from '../auth/AuthProvider';
import imgIcon from '../../assets/icon.png';
import imgMascotaCalendario from '../../assets/mascota_calendario.png';
import imgMascotaPomodoro from '../../assets/mascota_pomodoro.png';
import imgMascotaFinal from '../../assets/mascota_final.png';
import imgLogin from '../../assets/login.png';

const STORAGE_KEY = 'fluu_hasSeenMascotTour';
const PENDING_KEY = 'fluu_mascotTourPending';

export default function MascotTour({ visible, onClose, onRequestTabChange }) {
  const { language } = useSettings();
  const { user } = useAuth();
  const isEn = language === 'en';
  const [step, setStep] = useState(0);
  const storageKey = user?.id ? `${STORAGE_KEY}_${user.id}` : null;
  const pendingKey = user?.id ? `${PENDING_KEY}_${user.id}` : null;

  const steps = isEn
    ? [
        {
          key: 'welcome',
          title: '',
          text:
            'I will walk you through the main parts of the app so you can start organizing your days. It will only take a few seconds.',
          tab: 'Calendar',
          image: imgLogin,
        },
        {
          key: 'calendarMain',
          title: 'Calendar',
          text:
            'In Calendar you will see everything you have scheduled: your habits, tasks and important things for each day.',
          tab: 'Calendar',
          image: imgMascotaCalendario,
        },
        {
          key: 'calendarPlus',
          title: 'Calendar + button',
          text:
            'Use the floating + button at the bottom right of Calendar to create new habits and activities in a simple way.',
          tab: 'Calendar',
          image: imgMascotaCalendario,
          imageStyle: 'button',
        },
        {
          key: 'pomodoro',
          title: 'Pomodoro',
          text:
            'In Pomodoro you can focus using work and break sessions. Use it when you want to concentrate on studying or an important task.',
          tab: 'Pomodoro',
          image: imgMascotaPomodoro,
        },
        {
          key: 'profile',
          title: 'Profile',
          text:
            'In Profile you can change the app color, language and your personal info. If you get lost, you can always come back here.',
          tab: 'Perfil',
          image: imgMascotaFinal,
        },
      ]
    : [
        {
          key: 'welcome',
          title: '',
          text:
            'Te voy a acompañar en un recorrido rápido para que sepas dónde está todo. Solo tomará unos segundos.',
          tab: 'Calendar',
          image: imgLogin,
        },
        {
          key: 'calendarMain',
          title: 'Calendario',
          text:
            'En el Calendario verás todo lo que has agendado: tus hábitos, tareas y cosas importantes para cada día.',
          tab: 'Calendar',
          image: imgMascotaCalendario,
        },
        {
          key: 'calendarPlus',
          title: 'Botón + del calendario',
          text:
            'Usa el botón flotante + que ves abajo a la derecha en el Calendario para agregar nuevos hábitos y actividades de forma sencilla.',
          tab: 'Calendar',
          image: imgMascotaCalendario,
          imageStyle: 'button',
        },
        {
          key: 'pomodoro',
          title: 'Pomodoro',
          text:
            'En Pomodoro puedes hacer sesiones de concentración con descansos. Úsalo cuando quieras enfocarte en estudiar o en una tarea importante.',
          tab: 'Pomodoro',
          image: imgMascotaPomodoro,
        },
        {
          key: 'profile',
          title: 'Perfil',
          text:
            'En Perfil puedes cambiar el color de la app, el idioma y tus datos. Si te pierdes, siempre puedes volver aquí para ajustar todo.',
          tab: 'Perfil',
          image: imgMascotaFinal,
        },
      ];

  const current = steps[step] || steps[0];
  const isLast = step === steps.length - 1;

  useEffect(() => {
    if (visible) {
      setStep(0);
    }
  }, [visible]);

  async function finishTour() {
    try {
      if (storageKey) {
        await AsyncStorage.setItem(storageKey, 'true');
      }

      // Clear the auto-show flag; the tour should only auto-open right after Register.
      if (pendingKey) {
        await AsyncStorage.removeItem(pendingKey);
      }
    } catch (e) {
      // ignore storage errors, tour will just aparecer otra vez
    }

    // Al terminar el tour, vuelve siempre al Calendar
    if (onRequestTabChange) {
      onRequestTabChange('Calendar');
    }

    if (onClose) onClose();
  }

  function handleNext() {
    if (isLast) {
      finishTour();
    } else {
      const nextIndex = step + 1;
      const nextStep = steps[nextIndex];

      if (nextStep && nextStep.tab && onRequestTabChange) {
        onRequestTabChange(nextStep.tab);
      }

      setStep(nextIndex);
    }
  }

  function handleSkip() {
    finishTour();
  }

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Image
              source={current.image}
              style={[
                styles.mascot,
                current.imageStyle === 'button' && styles.mascotButton,
              ]}
              resizeMode="contain"
            />
            <View style={styles.textContainer}>
              <Text style={styles.title}>{current.title}</Text>
              <Text style={styles.text}>{current.text}</Text>
            </View>
          </View>

          <View style={styles.footerRow}>
            <Pressable onPress={handleSkip} style={styles.secondaryButton}>
              <Text style={styles.secondaryText}>
                {isEn ? 'Skip tour' : 'Saltar recorrido'}
              </Text>
            </Pressable>

            <Pressable onPress={handleNext} style={styles.primaryButton}>
              <Text style={styles.primaryText}>
                {isLast ? (isEn ? "Let's start" : 'Empezar') : isEn ? 'Next' : 'Siguiente'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.progressRow}>
          {steps.map((s, index) => (
            <View
              key={s.key}
              style={[
                styles.dot,
                index === step ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  mascot: {
    width: 140,
    height: 140,
    borderRadius: 32,
  },
  mascotButton: {
    width: 140,
    height: 140,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  text: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    textAlign: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    gap: 12,
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexShrink: 1,
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  primaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: '#38BDF8',
    flexShrink: 0,
  },
  primaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#38BDF8',
    width: 18,
  },
  dotInactive: {
    backgroundColor: '#d1d5db',
  },
});
