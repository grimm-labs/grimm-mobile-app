import AsyncStorage from '@react-native-async-storage/async-storage';
import type TranslateOptions from 'i18next';
import i18n from 'i18next';
import memoize from 'lodash.memoize';
import { useCallback, useEffect, useState } from 'react';
import { I18nManager } from 'react-native';

import type { Language, resources } from './resources';
import type { RecursiveKeyOf } from './types';

type DefaultLocale = typeof resources.en.translation;

export type TxKeyPath = RecursiveKeyOf<DefaultLocale>;

export const LOCAL = 'local';

export const getLanguage = async () => {
  return await AsyncStorage.getItem(LOCAL);
};

export const translate = memoize(
  (key: TxKeyPath, options = undefined) => i18n.t(key, options) as unknown as string,
  (key: TxKeyPath, options: typeof TranslateOptions) => (options ? key + JSON.stringify(options) : key),
);

export const changeLanguage = (lang: Language) => {
  i18n.changeLanguage(lang);
  I18nManager.forceRTL(false);
};

export const useSelectedLanguage = () => {
  const [language, setLanguageState] = useState<Language | undefined>(undefined);

  useEffect(() => {
    const loadLanguage = async () => {
      const storedLang = await AsyncStorage.getItem(LOCAL);
      if (storedLang) {
        setLanguageState(storedLang as Language);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    if (lang !== undefined) {
      await AsyncStorage.setItem(LOCAL, lang);
      changeLanguage(lang as Language);
    }
  }, []);

  return { language: language as Language, setLanguage };
};

export const initializeLanguage = async () => {
  const storedLang = await AsyncStorage.getItem(LOCAL);
  if (storedLang) {
    changeLanguage(storedLang as Language);
  }
};
