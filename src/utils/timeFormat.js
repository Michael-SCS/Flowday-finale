function toLocaleFromLanguage(language) {
  switch (String(language || '').toLowerCase()) {
    case 'es':
      return 'es-CO';
    case 'pt':
      return 'pt-BR';
    case 'fr':
      return 'fr-FR';
    case 'en':
    default:
      return 'en-US';
  }
}

function timeFormatToHour12(timeFormat) {
  if (timeFormat === '12h') return true;
  if (timeFormat === '24h') return false;
  return undefined; // system
}

export function formatTimeFromDate(date, { language = 'es', timeFormat = 'system' } = {}) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const locale = toLocaleFromLanguage(language);
  const hour12 = timeFormatToHour12(timeFormat);

  try {
    const fmt = new Intl.DateTimeFormat(locale, {
      hour: timeFormat === '24h' ? '2-digit' : 'numeric',
      minute: '2-digit',
      hour12,
    });
    return fmt.format(date);
  } catch {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
}

export function formatTimeFromHHmm(timeStr, { language = 'es', timeFormat = 'system' } = {}) {
  if (!timeStr) return '';
  const [h, m] = String(timeStr).split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return String(timeStr);
  const d = new Date(2000, 0, 1, h, m, 0, 0);
  return formatTimeFromDate(d, { language, timeFormat });
}
