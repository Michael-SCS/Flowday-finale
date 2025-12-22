import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configuramos cómo se muestran las notificaciones cuando llegan
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // `shouldShowAlert` está deprecado en SDK 53+.
    // Usamos las nuevas banderas para que se muestre el banner/lista
    // cuando la notificación llegue en primer o segundo plano.
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        console.warn('[notifications] Permisos NO concedidos');
        return false;
      }
    }

    // Canal por defecto en Android (usa icono y color definidos en app.json)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    return true;
  } catch (e) {
    console.warn('[notifications] Error solicitando permisos', e);
    return false;
  }
}

/**
 * Programa una notificación local 30 minutos antes de la hora indicada.
 * dateStr: 'YYYY-MM-DD'
 * timeStr: 'HH:MM'
 */
export async function scheduleReminderForActivity({ date, time, title, body }) {
  if (!date || !time) return;

  const [year, month, day] = String(date).split('-').map(Number);
  const [hour, minute] = String(time).split(':').map(Number);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return;
  }
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return;
  }

  const target = new Date(year, month - 1, day, hour, minute, 0, 0);
  let triggerTime = new Date(target.getTime() - 30 * 60 * 1000); // 30 min antes

  const now = new Date();

  // Si la hora de la actividad ya pasó, no tiene sentido programar
  if (target.getTime() <= now.getTime()) {
    console.log('[notifications] Hora de la actividad ya pasada, no se programa', {
      date,
      time,
      target: target.toString(),
      now: now.toString(),
    });
    return;
  }

  // Si el recordatorio de 30 min ya pasó, no programamos nada.
  // El usuario tendrá que crear la actividad con al menos 30 minutos de antelación.
  if (triggerTime.getTime() <= now.getTime()) {
    console.log('[notifications] Trigger 30min ya pasado, no se programa', {
      date,
      time,
      triggerTime: triggerTime.toString(),
      now: now.toString(),
    });
    return;
  }

  const diffMs = triggerTime.getTime() - now.getTime();
  const diffSeconds = Math.round(diffMs / 1000);

  if (!Number.isFinite(diffSeconds) || diffSeconds <= 0) {
    console.log('[notifications] diffSeconds inválido, no se programa', {
      date,
      time,
      triggerTime: triggerTime.toString(),
      now: now.toString(),
      diffSeconds,
    });
    return;
  }

  try {
    const ok = await requestNotificationPermissions();
    if (!ok) return;

    console.log('[notifications] Programando notificación', {
      date,
      time,
      triggerTime: triggerTime.toString(),
      now: now.toString(),
      diffSeconds,
    });

    const trigger =
      Platform.OS === 'android'
        ? {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: diffSeconds,
            channelId: 'default',
          }
        : {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: diffSeconds,
          };

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
      },
      // En SDK 53+ el trigger debe ser un objeto con `type`.
      // Usamos un trigger relativo en segundos (TIME_INTERVAL) y canal por defecto en Android.
      trigger,
    });
  } catch (e) {
    console.warn('[notifications] Error programando notificación', e);
  }
}
