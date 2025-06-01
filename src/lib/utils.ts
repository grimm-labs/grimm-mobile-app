/* eslint-disable max-params */
import { Mnemonic } from 'bdk-rn';
import type { CountryCode } from 'libphonenumber-js';
import parsePhoneNumberFromString, { getExampleNumber, parsePhoneNumber } from 'libphonenumber-js';
import examples from 'libphonenumber-js/mobile/examples';
import { Linking } from 'react-native';
import type { StoreApi, UseBoundStore } from 'zustand';

import type { RatesResponse as OriginalRatesResponse } from '@/api';
import { supportedFiatCurrencies } from '@/constant';
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

export const formatBalance = (total: number, unit: BitcoinUnit): string => {
  if (unit === BitcoinUnit.Sats) {
    if (total === 0) {
      return '0.00 SATS';
    }
    return `${total.toLocaleString('en-US')} SATS`;
  }

  if (unit === BitcoinUnit.Btc) {
    return `${convertSatsToBtc(total)} BTC`;
  }
  return total.toLocaleString();
};

export const formatPhoneNumber = (number: string, countryCode: CountryCode): string => {
  const parsedNumber = parsePhoneNumberFromString(number, countryCode);
  return parsedNumber?.format('E.164') ?? `+237${number}`;
};

export const getPlaceholderPhoneNumber = (countryCode: CountryCode): string | undefined => {
  return getExampleNumber(countryCode, examples)?.formatNational();
};

export const beautifyPhoneNumber = (phoneNumber: string, format: 'national' | 'international' | 'e164' | 'rfc3966' = 'international'): string => {
  try {
    const parsed = parsePhoneNumber(phoneNumber);

    if (!parsed || !parsed.isValid()) {
      return phoneNumber;
    }

    switch (format) {
      case 'national':
        return parsed.formatNational(); // National format (ex: "693 22 02 22" for Cameroon)
      case 'international':
        return parsed.formatInternational(); // International format (ex: "+237 693 22 02 22")
      case 'e164':
        return parsed.format('E.164'); // E.164 format (ex: "+237693220222")
      case 'rfc3966':
        return parsed.format('RFC3966'); // RFC3966 format (ex: "tel:+237-693-22-02-22")
      default:
        return parsed.formatInternational();
    }
  } catch (error) {
    console.warn('Error formatting phone number:', error);
    return phoneNumber;
  }
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

  const normalizedMnemonic = mnemonic.trim().toLowerCase().replace(/\s+/g, ' '); // Replace multiple spaces with single space

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

  // BIP39 validation via Bdk-rn
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
  return supportedFiatCurrencies.includes(country.currency) ? country.currency : 'USD';
};

type RatesResponse = OriginalRatesResponse & { [currency: string]: number };

/**
 * Converts a Bitcoin amount to fiat currency
 * @param amount - The amount to convert
 * @param bitcoinUnit - The unit of Bitcoin ('btc' or 'sats')
 * @param outputCurrency - The desired output fiat currency
 * @param bitcoinPrices - The object containing Bitcoin prices in various currencies
 * @returns The amount converted into fiat currency
 */
export const convertBitcoinToFiat = (amount: number, bitcoinUnit: BitcoinUnit, outputCurrency: string, bitcoinPrices: RatesResponse): number => {
  // Check if the output currency exists in the price list
  if (!(outputCurrency.toLowerCase() in bitcoinPrices)) {
    throw new Error(`Currency ${outputCurrency} not supported`);
  }

  // Get the Bitcoin price in the output currency
  const bitcoinPriceInOutputCurrency = bitcoinPrices[outputCurrency.toLowerCase()];

  // Convert the amount to BTC if necessary
  let amountInBTC: number;
  if (bitcoinUnit === 'SATS') {
    // 1 BTC = 100,000,000 satoshis
    amountInBTC = amount / 100_000_000;
  } else {
    amountInBTC = amount;
  }

  // Calculate the amount in fiat currency
  const fiatAmount = amountInBTC * bitcoinPriceInOutputCurrency;

  return fiatAmount;
};
