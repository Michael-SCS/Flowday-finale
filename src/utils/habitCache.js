import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { translate } from './i18n';
import { getCurrentUserId } from './userScope';

// v3: incluimos versión en la clave para evitar usar cache antiguo
const CACHE_KEY_BASE = '@fluu_habit_templates_v3';
const CACHE_TIME_KEY_BASE = '@fluu_habit_templates_time_v3';
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 horas
const SUPPORTED_LANGUAGES = ['es', 'en', 'fr', 'pt', 'de'];

// Cambia este valor cuando actualices imágenes en Supabase para forzar recarga.
// (También ayuda cuando se re-suben archivos con el mismo nombre y la CDN queda con cache.)
const IMAGE_CACHE_BUST_VERSION = '2026-01-21';

function withImageCacheBuster(url) {
  if (!url || typeof url !== 'string') return url;
  if (!/^https?:\/\//i.test(url)) return url;
  if (url.includes('fluu_v=')) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}fluu_v=${encodeURIComponent(IMAGE_CACHE_BUST_VERSION)}`;
}

function applyIconCacheBuster(templates) {
  if (!Array.isArray(templates) || templates.length === 0) return templates;
  return templates.map((t) => ({
    ...t,
    icon: withImageCacheBuster(t?.icon),
  }));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(() => {
    try {
      controller?.abort();
    } catch {}
  }, timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller?.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function verifySingleIconUrl(url, { timeoutMs = 15000 } = {}) {
  if (!url || typeof url !== 'string') {
    return { ok: false, reason: 'missing_url' };
  }

  try {
    // Try HEAD first (fast). Some CDNs/servers may not support HEAD reliably.
    let res = null;
    try {
      res = await fetchWithTimeout(url, { method: 'HEAD' }, timeoutMs);
    } catch {
      res = null;
    }

    if (!res) {
      // Fallback to GET if HEAD fails.
      res = await fetchWithTimeout(url, { method: 'GET' }, timeoutMs);
    }

    const status = res?.status;
    const ok = !!res?.ok;
    const contentType =
      typeof res?.headers?.get === 'function'
        ? res.headers.get('content-type')
        : null;

    if (!ok) {
      return { ok: false, status, contentType: contentType || null, reason: 'http_error' };
    }

    // If the server returns something non-image, flag it.
    if (contentType && !String(contentType).toLowerCase().startsWith('image/')) {
      return { ok: false, status, contentType, reason: 'not_image' };
    }

    return { ok: true, status, contentType: contentType || null };
  } catch (e) {
    return { ok: false, reason: 'network_error', error: String(e?.message || e) };
  }
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      results[current] = await fn(items[current], current);
    }
  }

  const count = Math.max(1, Math.min(limit || 4, items.length || 1));
  await Promise.all(Array.from({ length: count }, () => worker()));
  return results;
}

export async function verifyHabitIconUrls(templates, {
  concurrency = 6,
  timeoutMs = 15000,
  log = true,
} = {}) {
  if (!Array.isArray(templates) || templates.length === 0) {
    const empty = { total: 0, withIcon: 0, ok: 0, failed: 0, failures: [] };
    if (log) console.log('🖼️ Icon verify: no templates to verify.');
    return empty;
  }

  const normalized = applyIconCacheBuster(templates);
  const toCheck = normalized.filter((t) => !!t?.icon);

  const checks = await mapLimit(
    toCheck,
    concurrency,
    async (t) => ({
      template: t,
      result: await verifySingleIconUrl(t.icon, { timeoutMs }),
    })
  );

  const failures = checks
    .filter((x) => !x?.result?.ok)
    .map((x) => ({
      id: x?.template?.id,
      title: x?.template?.title,
      icon: x?.template?.icon,
      reason: x?.result?.reason,
      status: x?.result?.status ?? null,
      contentType: x?.result?.contentType ?? null,
      error: x?.result?.error ?? null,
    }));

  const summary = {
    total: normalized.length,
    withIcon: toCheck.length,
    ok: toCheck.length - failures.length,
    failed: failures.length,
    failures,
  };

  if (log) {
    console.log(
      `🖼️ Icon verify: ${summary.ok}/${summary.withIcon} OK (${summary.failed} failed)`
    );
    if (failures.length) {
      console.log('🖼️ Icon failures (first 10):');
      failures.slice(0, 10).forEach((f) => {
        console.log(`- ${f.title || f.id}: ${f.icon} (${f.reason}${f.status ? ` ${f.status}` : ''})`);
      });
    }
  }

  return summary;
}

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
  const userId = getCurrentUserId();
  // Guest mode: cache templates on-device so the app can show habits without auth.
  const suffix = userId ? `_${userId}` : '_GUEST';
  return {
    user: { id: userId || 'GUEST' },
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
      icon: withImageCacheBuster(row.icon),
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
export async function loadHabitTemplates(appLanguage = 'es', options = {}) {
  const lang = SUPPORTED_LANGUAGES.includes(appLanguage) ? appLanguage : 'en';

  const forceRefresh = !!options?.forceRefresh;

  if (!forceRefresh) {
    // 1️⃣ Devolver cache inmediato si existe
    const cached = await getCachedHabits(lang);
    if (cached) {
      refreshInBackground(lang);
      return applyIconCacheBuster(localizeTemplates(cached, lang));
    }
  }

  // 2️⃣ Intentar con el idioma actual
  let templates = await fetchTemplatesForLanguage(lang);

  // 3️⃣ Fallback a inglés si no hay traducciones para el idioma actual
  if (templates.length === 0 && lang !== 'en') {
    templates = await fetchTemplatesForLanguage('en');
  }

  const localized = localizeTemplates(templates, lang);
  const withIcons = applyIconCacheBuster(localized);
  await saveCache(withIcons, lang);
  return withIcons;
}

/* ======================
   REFRESCO SILENCIOSO
====================== */
async function refreshInBackground(language = 'es') {
  const lang = SUPPORTED_LANGUAGES.includes(language) ? language : 'en';

  const refresh = await shouldRefresh(lang);
  if (!refresh) return;

  let templates = await fetchTemplatesForLanguage(lang);
  if (templates.length === 0 && lang !== 'en') {
    templates = await fetchTemplatesForLanguage('en');
  }

  const localized = localizeTemplates(templates, lang);
  const withIcons = applyIconCacheBuster(localized);
  await saveCache(withIcons, lang);
}

// Limpiar cache de plantillas de hábitos del usuario actual
export async function clearHabitCache() {
  const userId = getCurrentUserId();
  const suffix = userId ? `_${userId}` : '_GUEST';
  const languages = SUPPORTED_LANGUAGES;
  const keysToRemove = [];

  for (const lang of languages) {
    keysToRemove.push(
      `${CACHE_KEY_BASE}${suffix}_${lang}`,
      `${CACHE_TIME_KEY_BASE}${suffix}_${lang}`,
    );
  }

  await AsyncStorage.multiRemove(keysToRemove);
}
