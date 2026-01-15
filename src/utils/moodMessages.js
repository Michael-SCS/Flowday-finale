function dateHash(dateKey) {
  try {
    const s = String(dateKey || '');
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (h * 31 + s.charCodeAt(i)) % 1_000_000;
    }
    return h;
  } catch {
    return 0;
  }
}

function minutesSinceMidnight(d) {
  return d.getHours() * 60 + d.getMinutes();
}

/**
 * Picks a mood message for a given score.
 * - For today, rotates during the day (by time segments).
 * - For other dates, returns a deterministic message for that date.
 */
export function pickMoodMessage({ score, dateKey, isToday, t, now = new Date() }) {
  const s = Number(score);
  if (!Number.isFinite(s)) return null;
  const clamped = Math.max(1, Math.min(5, Math.round(s)));

  const raw = t?.(`mood.messages.${clamped}`);
  const messages = Array.isArray(raw) ? raw.filter((x) => typeof x === 'string' && x.trim()) : [];
  if (!messages.length) return null;

  // Rotate every 3 hours (0..7). Keeps things fresh but not too jumpy.
  const segment = isToday ? Math.floor(minutesSinceMidnight(now) / 180) : 0;
  const seed = dateHash(dateKey) + clamped * 97;

  const index = (seed + segment) % messages.length;
  return messages[index];
}
