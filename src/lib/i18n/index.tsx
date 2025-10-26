import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { resources } from './resources';
export * from './utils';

i18n.use(initReactI18next).init(
  {
    resources,
    lng: getLocales()[0].languageTag || 'en-US', // TODO: if you are not supporting multiple languages or languages with multiple directions you can set the default value to `en`
    fallbackLng: 'en',
    compatibilityJSON: 'v3', // By default React Native projects does not support Intl

    // allows integrating dynamic values into translations.
    interpolation: {
      escapeValue: false, // escape passed in values to avoid XSS injections
    },
  },
  undefined,
);

export default i18n;
