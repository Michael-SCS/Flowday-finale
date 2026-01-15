import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUserId, userScopedKey } from './userScope';

const ENTRIES_KEY = 'FLUU_MOOD_ENTRIES';
const LAST_PROMPT_KEY = 'FLUU_MOOD_LAST_PROMPT_DATE';
const DISMISSED_BANNER_KEY = 'FLUU_MOOD_BANNER_DISMISSED_DATE';

function dateKey(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function clampScore(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return 3;
  return Math.max(1, Math.min(5, Math.round(n)));
}

async function getUserKey(baseKey) {
  const userId = getCurrentUserId();
  if (!userId) return null;
  return userScopedKey(baseKey, userId);
}

export function todayMoodKey() {
  return dateKey(new Date());
}

export async function loadMoodEntries() {
  const key = await getUserKey(ENTRIES_KEY);
  if (!key) return [];

  try {
    const raw = await AsyncStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];

    // Normalize a bit to avoid crashes if storage is corrupted.
    return parsed
      .filter((e) => e && typeof e === 'object' && typeof e.date === 'string')
      .map((e) => ({
        date: String(e.date),
        score: clampScore(e.score),
        emoji: typeof e.emoji === 'string' ? e.emoji : null,
        createdAt: typeof e.createdAt === 'string' ? e.createdAt : null,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}

export async function saveMoodForDate(date, { score, emoji }) {
  const key = await getUserKey(ENTRIES_KEY);
  if (!key) return;

  const d = String(date || '').trim();
  if (!d) return;

  const safeScore = clampScore(score);
  const safeEmoji = typeof emoji === 'string' ? emoji : null;

  try {
    const existing = await loadMoodEntries();
    const filtered = existing.filter((e) => e.date !== d);

    const updated = [...filtered, {
      date: d,
      score: safeScore,
      emoji: safeEmoji,
      createdAt: new Date().toISOString(),
    }]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-365);

    await AsyncStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // best-effort
  }
}

export async function saveMoodForToday(payload) {
  return saveMoodForDate(todayMoodKey(), payload);
}

export async function getMoodForDate(date) {
  const d = String(date || '').trim();
  if (!d) return null;
  const entries = await loadMoodEntries();
  return entries.find((e) => e.date === d) || null;
}

export async function getMoodSeriesLastNDays(days = 7) {
  const n = Math.max(1, Math.min(31, Number(days) || 7));
  const entries = await loadMoodEntries();
  const map = new Map(entries.map((e) => [e.date, e]));

  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = dateKey(d);
    const hit = map.get(key) || null;
    out.push({
      date: key,
      score: hit ? hit.score : null,
      emoji: hit ? hit.emoji : null,
    });
  }

  return out;
}

export async function getLastPromptDate() {
  const key = await getUserKey(LAST_PROMPT_KEY);
  if (!key) return null;
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setLastPromptDate(date) {
  const key = await getUserKey(LAST_PROMPT_KEY);
  if (!key) return;
  try {
    await AsyncStorage.setItem(key, String(date));
  } catch {
    // best-effort
  }
}

export async function getDismissedMoodBannerDate() {
  const key = await getUserKey(DISMISSED_BANNER_KEY);
  if (!key) return null;
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setDismissedMoodBannerDate(date) {
  const key = await getUserKey(DISMISSED_BANNER_KEY);
  if (!key) return;
  try {
    await AsyncStorage.setItem(key, String(date));
  } catch {
    // best-effort
  }
}
