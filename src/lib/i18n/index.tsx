import { locale } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { resources } from './resources';
import { getLanguage } from './utils';
export * from './utils';

i18n.use(initReactI18next).init({
  resources,
  lng: locale,
  fallbackLng: 'en',
  compatibilityJSON: 'v3',

  interpolation: {
    escapeValue: false, // escape passed in values to avoid XSS injections
  },
});

getLanguage().then((lang) => {
  if (lang) {
    i18n.changeLanguage(lang).catch(() => {
      // ignore change error
    });
  }
});

export default i18n;
