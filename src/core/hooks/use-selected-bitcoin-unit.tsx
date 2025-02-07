import { useMMKVString } from 'react-native-mmkv';

import { storage } from '../storage';

const SELECTED_BITCOIN_UNIT = 'SELECTED_BITCOIN_UNIT';

export const useSelectedBitcoinUnit = () => {
  const [selectedBitcoinUnit, setSelectedBitcoinUnit] = useMMKVString(SELECTED_BITCOIN_UNIT, storage);
  if (selectedBitcoinUnit === undefined) {
    return ['SAT', setSelectedBitcoinUnit] as const;
  }
  return [selectedBitcoinUnit, setSelectedBitcoinUnit] as const;
};
