// src/utils/marketProductName.js
// Normalizes a market product name for comparison and deduplication
export function normalizeMarketProductName(name) {
  if (!name) return '';
  return String(name)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]/g, ''); // Remove non-alphanumeric
}
