import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUserId, userScopedKey } from './userScope';

const KEY = 'FLUU_CUSTOM_HABITS';

async function getUserKey() {
  const userId = getCurrentUserId();
  if (!userId) return null;
  return userScopedKey(KEY, userId);
}

/* Obtener hábitos personalizados */
export async function getLocalHabits() {
  const key = await getUserKey();
  if (!key) return [];

  const data = await AsyncStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

/* Guardar nuevo hábito */
export async function saveLocalHabit(habit) {
  const habits = await getLocalHabits();

  const newHabit = {
    id: Date.now().toString(), // id local
    ...habit,
    createdAt: new Date().toISOString(),
  };

  const updated = [...habits, newHabit];
  const key = await getUserKey();
  if (!key) return newHabit;

  await AsyncStorage.setItem(key, JSON.stringify(updated));

  return newHabit;
}

/* Eliminar hábito */
export async function removeLocalHabit(id) {
  const habits = await getLocalHabits();
  const filtered = habits.filter(h => h.id !== id);
  const key = await getUserKey();
  if (!key) return;

  await AsyncStorage.setItem(key, JSON.stringify(filtered));
}

// Limpiar hábitos locales del usuario actual
export async function clearLocalHabits() {
  const key = await getUserKey();
  if (!key) return;

  await AsyncStorage.removeItem(key);
}
