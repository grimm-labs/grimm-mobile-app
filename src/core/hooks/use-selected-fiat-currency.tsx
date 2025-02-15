import { useMMKVString } from 'react-native-mmkv';

import { storage } from '../storage';

const SELECTED_FIAT_CURRENCY = 'SELECTED_FIAT_CURRENCY';

export const useSelectedFiatCurrency = () => {
  const [selectedFiatCurrency, setSelectedFiatCurrency] = useMMKVString(SELECTED_FIAT_CURRENCY, storage);
  if (selectedFiatCurrency === undefined) {
    return ['XAF', setSelectedFiatCurrency] as const;
  }
  return [selectedFiatCurrency, setSelectedFiatCurrency] as const;
};
