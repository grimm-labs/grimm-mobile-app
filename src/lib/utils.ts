import { Blockchain, DatabaseConfig, Descriptor, DescriptorSecretKey, Mnemonic, Wallet } from 'bdk-rn';
import type { BlockchainElectrumConfig, Network } from 'bdk-rn/lib/lib/enums';
import { KeychainKind } from 'bdk-rn/lib/lib/enums';
import { Linking } from 'react-native';
import type { StoreApi, UseBoundStore } from 'zustand';

import countries from '../assets/data/available-countries.json';
import { CountryManager } from './country-manager';

export function openLinkInBrowser(url: string) {
  Linking.canOpenURL(url).then((canOpen) => canOpen && Linking.openURL(url));
}

type WithSelectors<S> = S extends { getState: () => infer T } ? S & { use: { [K in keyof T]: () => T[K] } } : never;

export const createSelectors = <S extends UseBoundStore<StoreApi<object>>>(_store: S) => {
  let store = _store as WithSelectors<typeof _store>;
  store.use = {};
  for (let k of Object.keys(store.getState())) {
    (store.use as any)[k] = () => store((s) => s[k as keyof typeof s]);
  }

  return store;
};

export const getCountryManager = () => {
  return new CountryManager(countries);
};

export const isMnemonicValid = async (mnemonic: string): Promise<boolean> => {
  if (!mnemonic || typeof mnemonic !== 'string') {
    console.warn('The provided mnemonic is invalid or empty.');
    return false;
  }

  try {
    const mnemonicInstance = new Mnemonic();
    await mnemonicInstance.fromString(mnemonic);
    return true;
  } catch (error) {
    console.error('Error validating the mnemonic:', error);
    return false;
  }
};

export async function createWallet(mnemonic: string, network: Network): Promise<Wallet> {
  try {
    const mnemonicInstance = await new Mnemonic().fromString(mnemonic);
    const descriptorSecretKey = await new DescriptorSecretKey().create(network, mnemonicInstance);

    const [externalDescriptor, internalDescriptor, dbConfig] = await Promise.all([
      new Descriptor().newBip84(descriptorSecretKey, KeychainKind.External, network),
      new Descriptor().newBip84(descriptorSecretKey, KeychainKind.Internal, network),
      new DatabaseConfig().memory(),
    ]);

    return await new Wallet().create(externalDescriptor, internalDescriptor, network, dbConfig);
  } catch (error) {
    console.error('Error creating wallet:', error);
    throw new Error('Failed to create wallet');
  }
}

export const getBlockchainConfig = (): BlockchainElectrumConfig => ({
  url: 'ssl://electrum.blockstream.info:60002',
  sock5: null,
  retry: 5,
  timeout: 5,
  stopGap: 100,
  validateDomain: false,
});

export const getBlockchain = async (config: BlockchainElectrumConfig = getBlockchainConfig()) => {
  return await new Blockchain().create(config);
};

export const convertSatsToBtc = (sats: number): string => {
  return (sats / 100_000_000).toFixed(8);
};

export const formatBalance = (total: number, unit: 'BTC' | 'SAT'): string => {
  if (unit === 'SAT') {
    return `${total.toLocaleString('en-US')} SAT`;
  }
  if (unit === 'BTC') {
    return `${convertSatsToBtc(total)} BTC`;
  }
  return total.toLocaleString();
};
