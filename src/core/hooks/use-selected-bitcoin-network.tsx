import { Network } from 'bdk-rn/lib/lib/enums';
import { useMMKVString } from 'react-native-mmkv';

import { storage } from '../storage';

const SELECTED_BITCOIN_NETWORK = 'SELECTED_BITCOIN_NETWORK';

export const useSelectedBitcoinNetwork = () => {
  const [selectedBitcoinNetwork, setSelectedBitcoinNetwork] = useMMKVString(SELECTED_BITCOIN_NETWORK, storage);
  if (selectedBitcoinNetwork === undefined) {
    return [Network.Testnet, setSelectedBitcoinNetwork] as const;
  }
  return [selectedBitcoinNetwork, setSelectedBitcoinNetwork] as const;
};
