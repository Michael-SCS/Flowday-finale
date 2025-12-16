import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'FLOWDAY_CUSTOM_HABITS';

/* Obtener hábitos personalizados */
export async function getLocalHabits() {
  const data = await AsyncStorage.getItem(KEY);
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
  await AsyncStorage.setItem(KEY, JSON.stringify(updated));

  return newHabit;
}

/* Eliminar hábito */
export async function removeLocalHabit(id) {
  const habits = await getLocalHabits();
  const filtered = habits.filter(h => h.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(filtered));
}
