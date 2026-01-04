import { Platform } from 'react-native';

let _notificationsModule = null;
let _handlerConfigured = false;

async function getNotificationsModule() {
  // In Expo Go (SDK 53+), remote push support was removed and the module can log errors.
  // We lazy-load and gracefully no-op so the app doesn't get stuck on a blank screen.
  if (_notificationsModule) return _notificationsModule;
  try {
    const mod = await import('expo-notifications');
    _notificationsModule = mod;
    return mod;
  } catch (e) {
    console.warn('[notifications] expo-notifications not available', e);
    _notificationsModule = null;
    return null;
  }
}

async function ensureHandlerConfigured() {
  if (_handlerConfigured) return;
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  try {
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
  } catch (e) {
    console.warn('[notifications] Error configuring handler', e);
  } finally {
    _handlerConfigured = true;
  }
}

export async function requestNotificationPermissions() {
  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return false;
    await ensureHandlerConfigured();

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

export async function cancelAllScheduledNotifications() {
  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.warn('[notifications] Error cancelando notificaciones programadas', e);
  }
}

/**
 * Programa una notificación local 30 minutos antes de la hora indicada.
 * dateStr: 'YYYY-MM-DD'
 * timeStr: 'HH:MM'
 */
export async function scheduleReminderForActivity({ date, time, title, body }) {
  const { notificationsEnabled = true } = arguments?.[0] || {};

  if (!notificationsEnabled) return;
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
    const Notifications = await getNotificationsModule();
    if (!Notifications) return;

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
