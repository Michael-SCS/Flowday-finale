const CATEGORY_TRANSLATIONS = {
  'Cuida de ti': {
    en: 'Self-care',
    pt: 'Cuide de você',
    fr: 'Prends soin de toi',
  },
  'Actividad física': {
    en: 'Physical activity',
    pt: 'Atividade física',
    fr: 'Activité physique',
  },
  'Vive más sano': {
    en: 'Live healthier',
    pt: 'Viva mais saudável',
    fr: 'Vis plus sainement',
  },
  Aprende: {
    en: 'Learn',
    pt: 'Aprender',
    fr: 'Apprendre',
  },
  'Vida social': {
    en: 'Social life',
    pt: 'Vida social',
    fr: 'Vie sociale',
  },
  Hogar: {
    en: 'Home',
    pt: 'Casa',
    fr: 'Maison',
  },
  'Vida económica': {
    en: 'Finances',
    pt: 'Finanças',
    fr: 'Finances',
  },
  Salud: {
    en: 'Health',
    pt: 'Saúde',
    fr: 'Santé',
  },
  Social: {
    en: 'Social',
    pt: 'Social',
    fr: 'Social',
  },
  Productividad: {
    en: 'Productivity',
    pt: 'Produtividade',
    fr: 'Productivité',
  },
  'Sin categoría': {
    en: 'Uncategorized',
    pt: 'Sem categoria',
    fr: 'Sans catégorie',
  },
};

export function translateHabitCategory(rawCategory, language = 'es') {
  const category = String(rawCategory || '').trim();
  if (!category) return category;

  const lang = String(language || 'es').toLowerCase();
  if (lang === 'es') return category;

  const entry = CATEGORY_TRANSLATIONS[category];
  if (!entry) return category;

  return entry[lang] || entry.en || category;
}
