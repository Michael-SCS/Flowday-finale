import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const CACHE_KEY = '@flowday_habit_templates';
const CACHE_TIME_KEY = '@flowday_habit_templates_time';
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 horas

/* ======================
   OBTENER DESDE CACHE
====================== */
export async function getCachedHabits() {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  } catch {
    return null;
  }
}

/* ======================
   GUARDAR CACHE
====================== */
async function saveCache(data) {
  await AsyncStorage.setItem(
    CACHE_KEY,
    JSON.stringify(data)
  );
  await AsyncStorage.setItem(
    CACHE_TIME_KEY,
    Date.now().toString()
  );
}

/* ======================
   SABER SI DEBE REFRESCAR
====================== */
async function shouldRefresh() {
  const last = await AsyncStorage.getItem(
    CACHE_TIME_KEY
  );
  if (!last) return true;
  return Date.now() - Number(last) > CACHE_TTL;
}

/* ======================
   CARGA OPTIMIZADA
====================== */
export async function loadHabitTemplates() {
  // 1️⃣ DEVOLVER CACHE INMEDIATO
  const cached = await getCachedHabits();
  if (cached) {
    // refresco en segundo plano
    refreshInBackground();
    return cached;
  }

  // 2️⃣ SI NO HAY CACHE, BAJAR DE SUPABASE
  const { data, error } = await supabase
    .from('habit_templates')
    .select('*')
    .eq('is_active', true)
    .order('order_index');

  if (!error && data) {
    await saveCache(data);
    return data;
  }

  return [];
}

/* ======================
   REFRESCO SILENCIOSO
====================== */
async function refreshInBackground() {
  const refresh = await shouldRefresh();
  if (!refresh) return;

  const { data, error } = await supabase
    .from('habit_templates')
    .select('*')
    .eq('is_active', true)
    .order('order_index');

  if (!error && data) {
    await saveCache(data);
  }
}
