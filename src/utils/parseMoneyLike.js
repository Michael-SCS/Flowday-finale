// Utilidad para convertir strings tipo dinero a número flotante
export function parseMoneyLike(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value)
    .trim()
    .replace(/[^0-9,.-]/g, '')
    .replace(',', '.');
  if (!normalized) return null;
  const num = parseFloat(normalized);
  return Number.isFinite(num) ? num : null;
}