import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUserId, userScopedKey } from './userScope';

const KEY = 'FLUU_POMODORO_STATS';

function dateKey(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function getUserKey() {
  const userId = getCurrentUserId();
  if (!userId) return null;
  return userScopedKey(KEY, userId);
}

export async function loadPomodoroStats() {
  const key = await getUserKey();
  if (!key) return {};

  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : {};
}

export async function addFocusedMinutes(minutes) {
  try {
    const key = await getUserKey();
    if (!key) return;

    const raw = await AsyncStorage.getItem(key);
    const data = raw ? JSON.parse(raw) : {};

    const today = dateKey(new Date());
    const prev = typeof data[today] === 'number' ? data[today] : 0;
    const safeMinutes = typeof minutes === 'number' && !Number.isNaN(minutes) ? minutes : 0;

    data[today] = prev + safeMinutes;

    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch {
    // no romper la app si falla el guardado
  }
}

export async function clearPomodoroStats() {
  const key = await getUserKey();
  if (!key) return;

  await AsyncStorage.removeItem(key);
}
