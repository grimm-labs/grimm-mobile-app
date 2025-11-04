/* eslint-disable max-params */
import { Mnemonic } from 'bdk-rn';
import { Linking } from 'react-native';
import type { StoreApi, UseBoundStore } from 'zustand';

import { type BitcoinCurrencyCode, type RatesResponse, supportedBitcoinCurrencies } from '@/api';
import type { Country } from '@/interfaces';
import { BitcoinUnit } from '@/types/enum';

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

export const convertSatsToBtc = (sats: number): string => {
  return (sats / 100_000_000).toFixed(8);
};

export const convertBtcToSats = (btc: number): number => {
  return Math.round(btc * 1e8);
};

export const formatBalance = (total: number, unit: BitcoinUnit): string => {
  if (unit === BitcoinUnit.Sats) {
    if (total === 0) {
      return '0 SATS';
    }
    return `${total.toLocaleString('en-US')} SATS`;
  }

  if (unit === BitcoinUnit.Btc) {
    return `${convertSatsToBtc(total)} BTC`;
  }
  return total.toLocaleString();
};

/**
 * Validates a BIP39 mnemonic phrase
 * @param mnemonic - The mnemonic phrase to validate
 * @param allowedWordCounts - Allowed word counts (default: 12 and 24 words)
 * @returns Promise<boolean> - true if the mnemonic is valid, false otherwise
 */
export const isMnemonicValid = async (mnemonic: string, allowedWordCounts: number[] = [12, 24]): Promise<boolean> => {
  if (!mnemonic || typeof mnemonic !== 'string') {
    return false;
  }

  const normalizedMnemonic = mnemonic.trim().toLowerCase().replace(/\s+/g, ' ');

  if (!normalizedMnemonic) {
    return false;
  }

  const words = normalizedMnemonic.split(' ');
  const wordCount = words.length;

  if (!allowedWordCounts.includes(wordCount)) {
    return false;
  }

  if (words.some((word) => !word || word.length === 0)) {
    return false;
  }

  try {
    await new Mnemonic().fromString(normalizedMnemonic);
    return true;
  } catch (error) {
    if (__DEV__) {
      console.warn('Mnemonic validation failed:', error);
    }
    return false;
  }
};

export const getFiatCurrency = (country: Country): string => {
  return supportedBitcoinCurrencies.includes(country.currency as BitcoinCurrencyCode) ? country.currency : 'USD';
};

/**
 * Converts a Bitcoin amount to fiat currency
 * @param amount - The amount to convert
 * @param bitcoinUnit - The unit of Bitcoin ('btc' or 'sats')
 * @param outputCurrency - The desired output fiat currency
 * @param bitcoinPrices - The object containing Bitcoin prices in various currencies
 * @returns The amount converted into fiat currency
 */
export const convertBitcoinToFiat = (amount: number, bitcoinUnit: BitcoinUnit, outputCurrency: string, bitcoinPrices: RatesResponse | null): number => {
  if (!bitcoinPrices) {
    return 0;
  }

  if (!(outputCurrency.toUpperCase() in bitcoinPrices.BTC)) {
    console.warn(`Currency ${outputCurrency} not supported.`);
    return 0;
  }

  const bitcoinPriceInOutputCurrency = bitcoinPrices.BTC[outputCurrency.toUpperCase() as BitcoinCurrencyCode];

  let amountInBTC: number;
  if (bitcoinUnit === BitcoinUnit.Sats) {
    amountInBTC = amount / 100_000_000;
  } else {
    amountInBTC = amount;
  }

  const fiatAmount = amountInBTC * bitcoinPriceInOutputCurrency;

  return fiatAmount;
};
