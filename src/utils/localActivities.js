import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUserId, userScopedKey } from './userScope';

const KEY = 'FLUU_ACTIVITIES';

async function getUserKey() {
  const userId = getCurrentUserId();
  if (!userId) return null;
  return userScopedKey(KEY, userId);
}

export async function loadActivities() {
  const key = await getUserKey();
  if (!key) return {};

  const data = await AsyncStorage.getItem(key);
  return data ? JSON.parse(data) : {};
}

export async function saveActivities(activities) {
  const key = await getUserKey();
  if (!key) return;

  await AsyncStorage.setItem(key, JSON.stringify(activities));
}

// Limpiar actividades locales del usuario actual
export async function clearActivities() {
  const key = await getUserKey();
  if (!key) return;

  await AsyncStorage.removeItem(key);
}
