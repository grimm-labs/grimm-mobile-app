import { Blockchain, DatabaseConfig, Descriptor, DescriptorSecretKey, Mnemonic, Wallet } from 'bdk-rn';
import type { BlockchainElectrumConfig, Network } from 'bdk-rn/lib/lib/enums';
import { KeychainKind } from 'bdk-rn/lib/lib/enums';
import { Linking } from 'react-native';
import type { StoreApi, UseBoundStore } from 'zustand';

import countries from '@/assets/data/available-countries.json';

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

export async function createWallet(mnemonic: string, network: Network) {
  try {
    const mnemonicInstance = await new Mnemonic().fromString(mnemonic);
    const descriptorSecretKey = await new DescriptorSecretKey().create(network, mnemonicInstance);
    const externalDescriptor = await new Descriptor().newBip84(descriptorSecretKey, KeychainKind.External, network);
    const internalDescriptor = await new Descriptor().newBip84(descriptorSecretKey, KeychainKind.Internal, network);
    const dbConfig = await new DatabaseConfig().memory();
    const wallet = await new Wallet().create(externalDescriptor, internalDescriptor, network, dbConfig);
    return wallet;
  } catch (error) {
    throw new Error('Failed to create wallet');
  }
}

export const getCountryManager = () => {
  return new CountryManager(countries);
};

export const convertBtcToSats = (btc: number) => {
  return btc * 100_000_000;
};

export const convertSatsToBtc = (sats: number): number => {
  return parseFloat((sats / 100_000_000).toFixed(8));
};

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
