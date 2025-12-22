import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const KEY = 'FLUU_ACTIVITIES';

async function getUserKey() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  return `${KEY}_${user.id}`;
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
