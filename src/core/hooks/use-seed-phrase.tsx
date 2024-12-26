import { useMMKVString } from 'react-native-mmkv';

import { storage } from '../storage';

const SEED_PHRASE = 'SEED_PHRASE';

export const useSeedPhrase = () => {
  const [seedPhrase, setSeedPhrase] = useMMKVString(SEED_PHRASE, storage);
  if (seedPhrase === undefined) {
    return [undefined, setSeedPhrase] as const;
  }
  return [seedPhrase, setSeedPhrase] as const;
};
