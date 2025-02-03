import { useMMKVString } from 'react-native-mmkv';

import { storage } from '../storage';

const SELECTED_COUNTRY = 'SELECTED_COUNTRY';
const defaultSelectedCountry = 'CM';

export const useSelectedCountry = () => {
  const [selectedCountry, setSelectedCountry] = useMMKVString(
    SELECTED_COUNTRY,
    storage
  );
  if (selectedCountry?.length === 0) {
    return [defaultSelectedCountry, setSelectedCountry] as const;
  }
  return [selectedCountry, setSelectedCountry] as const;
};
