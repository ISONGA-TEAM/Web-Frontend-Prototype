import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';
import rw from '../locales/rw.json';

// UI strings live in locale JSON files (C-6). Kinyarwanda coverage is a draft: missing keys fall back to
// English, and the translations need review by a native speaker before the pilot.
i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, rw: { translation: rw } },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
});

export default i18n;
