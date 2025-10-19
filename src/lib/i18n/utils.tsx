import type TranslateOptions from 'i18next';
import i18n from 'i18next';
import memoize from 'lodash.memoize';
import { useCallback } from 'react';
import { useEffect, useState } from 'react';
import { I18nManager } from 'react-native';

import { getItem, setItem } from '../storage';
import type { Language, resources } from './resources';
import type { RecursiveKeyOf } from './types';

type DefaultLocale = typeof resources.en.translation;
export type TxKeyPath = RecursiveKeyOf<DefaultLocale>;

export const LOCAL = 'local';

export const getLanguage = async () => await getItem<Language | undefined>(LOCAL);

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
    let mounted = true;
    getItem<Language>(LOCAL).then((lang) => {
      if (mounted && lang) setLanguageState(lang);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const setLanguage = useCallback((lang?: Language) => {
    setItem(LOCAL, lang);
    if (lang !== undefined) changeLanguage(lang as Language);
    setLanguageState(lang);
  }, []);

  return { language, setLanguage };
};
