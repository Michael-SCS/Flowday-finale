import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const CACHE_KEY_BASE = '@flowday_habit_templates';
const CACHE_TIME_KEY_BASE = '@flowday_habit_templates_time';
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 horas

async function getUserCacheKeys() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, cacheKey: null, cacheTimeKey: null };
  }

  const suffix = `_${user.id}`;
  return {
    user,
    cacheKey: `${CACHE_KEY_BASE}${suffix}`,
    cacheTimeKey: `${CACHE_TIME_KEY_BASE}${suffix}`,
  };
}

/* ======================
   OBTENER DESDE CACHE
====================== */
export async function getCachedHabits() {
  try {
    const { cacheKey } = await getUserCacheKeys();
    if (!cacheKey) return null;

    const cached = await AsyncStorage.getItem(cacheKey);
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
  const { cacheKey, cacheTimeKey } = await getUserCacheKeys();
  if (!cacheKey || !cacheTimeKey) return;

  await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
  await AsyncStorage.setItem(cacheTimeKey, Date.now().toString());
}

/* ======================
   SABER SI DEBE REFRESCAR
====================== */
async function shouldRefresh() {
  const { cacheTimeKey } = await getUserCacheKeys();
  if (!cacheTimeKey) return true;

  const last = await AsyncStorage.getItem(cacheTimeKey);
  if (!last) return true;
  return Date.now() - Number(last) > CACHE_TTL;
}

/* ======================
   CARGA OPTIMIZADA
====================== */
export async function loadHabitTemplates() {
  const { user } = await getUserCacheKeys();
  if (!user) return [];

  // 1️⃣ DEVOLVER CACHE INMEDIATO
  const cached = await getCachedHabits();
  if (cached) {
    // refresco en segundo plano
    refreshInBackground();
    return cached;
  }

  // 2️⃣ SI NO HAY CACHE, BAJAR DE SUPABASE
  const userFilter = `user_id.eq.${user.id},user_id.is.null`;

  // Intento 1: plantillas por usuario o globales (user_id null)
  const { data, error } = await supabase
    .from('habit_templates')
    .select('*')
    .eq('is_active', true)
    .or(userFilter)
    .order('order_index');

  if (!error && data && data.length > 0) {
    await saveCache(data);
    return data;
  }

  // Fallback: tabla sin user_id o sin datos por usuario → cargar todas las activas
  const { data: fallbackData, error: fallbackError } = await supabase
    .from('habit_templates')
    .select('*')
    .eq('is_active', true)
    .order('order_index');

  if (!fallbackError && fallbackData) {
    await saveCache(fallbackData);
    return fallbackData;
  }

  return [];
}

/* ======================
   REFRESCO SILENCIOSO
====================== */
async function refreshInBackground() {
  const { user } = await getUserCacheKeys();
  if (!user) return;

  const refresh = await shouldRefresh();
  if (!refresh) return;

  const userFilter = `user_id.eq.${user.id},user_id.is.null`;

  // Intento 1: plantillas por usuario o globales
  const { data, error } = await supabase
    .from('habit_templates')
    .select('*')
    .eq('is_active', true)
    .or(userFilter)
    .order('order_index');

  if (!error && data && data.length > 0) {
    await saveCache(data);
    return;
  }

  // Fallback: tabla sin user_id o sin datos por usuario
  const { data: fallbackData, error: fallbackError } = await supabase
    .from('habit_templates')
    .select('*')
    .eq('is_active', true)
    .order('order_index');

  if (!fallbackError && fallbackData) {
    await saveCache(fallbackData);
  }
}

// Limpiar cache de plantillas de hábitos del usuario actual
export async function clearHabitCache() {
  const { cacheKey, cacheTimeKey } = await getUserCacheKeys();
  if (!cacheKey || !cacheTimeKey) return;

  await AsyncStorage.multiRemove([cacheKey, cacheTimeKey]);
}
