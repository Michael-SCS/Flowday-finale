import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { translate } from './i18n';

// v2: incluimos versión en la clave para evitar usar cache antiguo
const CACHE_KEY_BASE = '@fluu_habit_templates_v2';
const CACHE_TIME_KEY_BASE = '@fluu_habit_templates_time_v2';
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 horas
const SUPPORTED_LANGUAGES = ['es', 'en', 'fr', 'pt', 'de'];

let _cachedUser = null;

function parseConfig(config) {
  if (!config) return null;
  if (typeof config === 'object') return config;
  try {
    return JSON.parse(config);
  } catch {
    return null;
  }
}

function normalizeType(type) {
  return String(type || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

function localizeSpecialHabitFieldLabel(template, field, language) {
  if (!field) return field;
  const fieldType = String(field.type || '').trim().toLowerCase();

  // Field-type based localization for "special" templates
  if (fieldType === 'market') {
    return { ...field, label: translate('calendar.marketDefaultSectionTitle', language) };
  }
  if (fieldType === 'vitamins') {
    return { ...field, label: translate('calendar.vitaminsDefaultSectionTitle', language) };
  }
  if (fieldType === 'checklist') {
    // Commonly used for "organize" templates
    return { ...field, label: translate('calendar.checklistDefaultSectionTitle', language) };
  }

  // Template-type based localization for question-like text fields
  if (fieldType === 'text') {
    const byType = {
      birthday: 'specialHabits.birthday.question',
      study: 'specialHabits.study.question',
      book: 'specialHabits.book.question',
      read: 'specialHabits.book.question',
      call: 'specialHabits.call.question',
      skincare: 'specialHabits.skincare.question',
      water: 'specialHabits.water.question',
    };

    const typeKey = byType[normalizeType(template?.type)];
    if (typeKey) {
      return {
        ...field,
        label: translate(typeKey, language),
      };
    }
  }

  const labelMap = {
    '¿Quién cumplirá años?': 'specialHabits.birthday.question',
    '¿Qué estudiarás hoy?': 'specialHabits.study.question',
    '¿Qué libro leerás hoy?': 'specialHabits.book.question',
    '¿A quién llamarás hoy?': 'specialHabits.call.question',
    '¿Con qué cuidarás tu piel hoy?': 'specialHabits.skincare.question',
    '¿Qué producto usarás para tu piel?': 'specialHabits.skincare.question',
    '¿Qué producto usarás para tu piel hoy?': 'specialHabits.skincare.question',
    '¿Cuál es tu objetivo de agua hoy?': 'specialHabits.water.question',

    // Section headers that often come hardcoded in templates
    'Lista de compras': 'calendar.marketDefaultSectionTitle',
    'Lista de mercado': 'calendar.marketDefaultSectionTitle',
    'Shopping list': 'calendar.marketDefaultSectionTitle',
    'Lista de compras del mercado': 'calendar.marketDefaultSectionTitle',
    'Vitaminas': 'calendar.vitaminsDefaultSectionTitle',
    'Vitaminas a tomar': 'calendar.vitaminsDefaultSectionTitle',
    'Vitamins': 'calendar.vitaminsDefaultSectionTitle',
    'Espacios a organizar': 'calendar.checklistDefaultSectionTitle',
    'Spaces to organize': 'calendar.checklistDefaultSectionTitle',
  };

  const mapKey = labelMap[String(field.label || '').trim()];
  if (mapKey) {
    return {
      ...field,
      label: translate(mapKey, language),
    };
  }

  return field;
}

function localizeTemplates(templates, language) {
  if (!Array.isArray(templates) || templates.length === 0) return templates;

  return templates.map((template) => {
    const cfg = parseConfig(template?.config);
    if (!cfg || !Array.isArray(cfg.fields)) return template;

    const nextCfg = {
      ...cfg,
      fields: cfg.fields.map((field) =>
        localizeSpecialHabitFieldLabel(template, field, language)
      ),
    };

    return {
      ...template,
      config: nextCfg,
    };
  });
}

async function getUserCacheKeys(language = 'es') {
  if (!_cachedUser) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    _cachedUser = user || null;
  }

  if (!_cachedUser) {
    return { user: null, cacheKey: null, cacheTimeKey: null };
  }

  const suffix = `_${_cachedUser.id}`;
  return {
    user: _cachedUser,
    cacheKey: `${CACHE_KEY_BASE}${suffix}_${language}`,
    cacheTimeKey: `${CACHE_TIME_KEY_BASE}${suffix}_${language}`,
  };
}

/* ======================
  OBTENER DESDE CACHE
====================== */
export async function getCachedHabits(language = 'es') {
  try {
   const { cacheKey } = await getUserCacheKeys(language);
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
async function saveCache(data, language = 'es') {
  const { cacheKey, cacheTimeKey } = await getUserCacheKeys(language);
  if (!cacheKey || !cacheTimeKey) return;

  await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
  await AsyncStorage.setItem(cacheTimeKey, Date.now().toString());
}

/* ======================
  SABER SI DEBE REFRESCAR
====================== */
async function shouldRefresh(language = 'es') {
  const { cacheTimeKey } = await getUserCacheKeys(language);
  if (!cacheTimeKey) return true;

  const last = await AsyncStorage.getItem(cacheTimeKey);
  if (!last) return true;
  return Date.now() - Number(last) > CACHE_TTL;
}

/* ======================
   HELPERS DE CARGA REMOTA
====================== */
async function fetchTemplatesForLanguage(lang) {
  const language = SUPPORTED_LANGUAGES.includes(lang) ? lang : 'en';

  const { data, error } = await supabase
    .from('habit_templates')
    .select(`
      id,
      category,
      type,
      icon,
      order_index,
      config,
      is_active,
      habit_template_translations!inner (
        language,
        title,
        description
      )
    `)
    .eq('is_active', true)
    .eq('habit_template_translations.language', language)
    .order('order_index');

  if (error || !data || data.length === 0) {
    return [];
  }

  return data.map((row) => {
    const translations = row.habit_template_translations || [];
    const t = Array.isArray(translations) ? translations[0] : translations;

    return {
      id: row.id,
      category: row.category,
      type: row.type,
      icon: row.icon,
      orderIndex: row.order_index,
      config: row.config,
      isActive: row.is_active,
      title: t?.title ?? '',
      description: t?.description ?? '',
      language: t?.language ?? language,
    };
  });
}

/* ======================
   CARGA OPTIMIZADA
====================== */
export async function loadHabitTemplates(appLanguage = 'es') {
  const lang = SUPPORTED_LANGUAGES.includes(appLanguage) ? appLanguage : 'en';

  const { user } = await getUserCacheKeys(lang);
  if (!user) return [];

  // 1️⃣ Devolver cache inmediato si existe
  const cached = await getCachedHabits(lang);
  if (cached) {
    refreshInBackground(lang);
    return localizeTemplates(cached, lang);
  }

  // 2️⃣ Intentar con el idioma actual
  let templates = await fetchTemplatesForLanguage(lang);

  // 3️⃣ Fallback a inglés si no hay traducciones para el idioma actual
  if (templates.length === 0 && lang !== 'en') {
    templates = await fetchTemplatesForLanguage('en');
  }

  const localized = localizeTemplates(templates, lang);
  await saveCache(localized, lang);
  return localized;
}

/* ======================
   REFRESCO SILENCIOSO
====================== */
async function refreshInBackground(language = 'es') {
  const lang = SUPPORTED_LANGUAGES.includes(language) ? language : 'en';

  const { user } = await getUserCacheKeys(lang);
  if (!user) return;

  const refresh = await shouldRefresh(lang);
  if (!refresh) return;

  let templates = await fetchTemplatesForLanguage(lang);
  if (templates.length === 0 && lang !== 'en') {
    templates = await fetchTemplatesForLanguage('en');
  }

  const localized = localizeTemplates(templates, lang);
  await saveCache(localized, lang);
}

// Limpiar cache de plantillas de hábitos del usuario actual
export async function clearHabitCache() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const suffix = `_${user.id}`;
  const languages = SUPPORTED_LANGUAGES;
  const keysToRemove = [];

  for (const lang of languages) {
    keysToRemove.push(
      `${CACHE_KEY_BASE}${suffix}_${lang}`,
      `${CACHE_TIME_KEY_BASE}${suffix}_${lang}`,
    );
  }

  await AsyncStorage.multiRemove(keysToRemove);
  _cachedUser = null;
}
