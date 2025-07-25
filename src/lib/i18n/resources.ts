import en from '@/translations/en.json';
import fr from '@/translations/fr.json';

export const resources = {
  en: {
    translation: en,
  },
  fr: {
    translation: fr,
  },
};

export type Language = keyof typeof resources;
