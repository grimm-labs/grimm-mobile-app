import { DatabaseConfig, Descriptor, DescriptorSecretKey, Mnemonic, Wallet } from 'bdk-rn';
import type { Network } from 'bdk-rn/lib/lib/enums';
import { KeychainKind } from 'bdk-rn/lib/lib/enums';
import { Linking } from 'react-native';
import type { StoreApi, UseBoundStore } from 'zustand';

import countries from '@/assets/data/countries.json';

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
    // Créer un mnémonique à partir de la seed phrase
    const mnemonicInstance = await new Mnemonic().fromString(mnemonic);

    // Créer une clé secrète de descripteur
    const descriptorSecretKey = await new DescriptorSecretKey().create(network, mnemonicInstance);

    // Créer les descripteurs externes et internes (BIP84)
    const externalDescriptor = await new Descriptor().newBip84(descriptorSecretKey, KeychainKind.External, network);
    const internalDescriptor = await new Descriptor().newBip84(descriptorSecretKey, KeychainKind.Internal, network);

    // Configuration de la base de données
    const dbConfig = await new DatabaseConfig().memory();

    // Créer le portefeuille
    const wallet = await new Wallet().create(externalDescriptor, internalDescriptor, network, dbConfig);

    return wallet; // Retourne le portefeuille créé
  } catch (error) {
    console.error('Error creating wallet:', error);
    throw new Error('Failed to create wallet');
  }
}

export const getCountryManager = () => {
  return new CountryManager(countries);
};
