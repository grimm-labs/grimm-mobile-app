import { useMMKVString } from 'react-native-mmkv';

import { storage } from '../storage';

const SELECTED_COUNTRY = 'SELECTED_COUNTRY';
const defaultSelectedCountryCode = 'CM';

export const useSelectedCountryCode = () => {
  const [selectedCountryCode, setSelectedCountryCode] = useMMKVString(SELECTED_COUNTRY, storage);
  if (selectedCountryCode === undefined) {
    return [defaultSelectedCountryCode, setSelectedCountryCode] as const;
  }
  return [selectedCountryCode, setSelectedCountryCode] as const;
};
