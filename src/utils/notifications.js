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

/**
 * Centraliza la programación de notificaciones para hábitos/eventos.
 * Cancela la notificación previa (si notificationId existe), traduce el texto, y programa la nueva.
 * Devuelve el nuevo notificationId (o null si no se programa).
 * @param {Object} params
 * @param {string} params.date - Fecha 'YYYY-MM-DD'
 * @param {string} params.time - Hora 'HH:MM'
 * @param {string} params.habitTitle - Título del hábito/evento (ya traducido)
 * @param {string} params.language - Idioma ('es', 'en', 'pt', 'fr')
 * @param {boolean} params.notificationsEnabled
 * @param {string|null} params.previousNotificationId
 * @returns {Promise<string|null>} notificationId
 */
import { translate } from './i18n';

export async function rescheduleHabitNotification({ date, time, habitTitle, language, notificationsEnabled = true, previousNotificationId = null }) {
  if (!notificationsEnabled) return null;
  if (!date || !time) return null;

  const [year, month, day] = String(date).split('-').map(Number);
  const [hour, minute] = String(time).split(':').map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;

  const target = new Date(year, month - 1, day, hour, minute, 0, 0);
  let triggerTime = new Date(target.getTime() - 30 * 60 * 1000); // 30 min antes
  const now = new Date();
  if (target.getTime() <= now.getTime() || triggerTime.getTime() <= now.getTime()) return null;
  const diffMs = triggerTime.getTime() - now.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  if (!Number.isFinite(diffSeconds) || diffSeconds <= 0) return null;

  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return null;
    const ok = await requestNotificationPermissions();
    if (!ok) return null;

    // Cancelar notificación previa si existe
    if (previousNotificationId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(previousNotificationId);
      } catch (e) {
        console.warn('[notifications] Error cancelando notificación previa', e);
      }
    }

    // Traducción de textos (NO pasar keys de i18n)
    let title = '';
    let body = '';
    switch (language) {
      case 'es':
        title = 'Recordatorio';
        body = `Es momento de ${habitTitle}`;
        break;
      case 'en':
        title = 'Reminder';
        body = `Time for your ${habitTitle}`;
        break;
      case 'pt':
        title = 'Lembrete';
        body = `Hora do seu ${habitTitle}`;
        break;
      case 'fr':
        title = 'Rappel';
        body = `C’est le moment de votre ${habitTitle}`;
        break;
      default:
        title = 'Reminder';
        body = `Time for your ${habitTitle}`;
    }

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

    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger,
    });
    return id;
  } catch (e) {
    console.warn('[notifications] Error programando notificación', e);
    return null;
  }
}
