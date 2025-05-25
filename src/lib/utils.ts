import type { CountryCode } from 'libphonenumber-js';
import parsePhoneNumberFromString, { getExampleNumber, parsePhoneNumber } from 'libphonenumber-js';
import examples from 'libphonenumber-js/mobile/examples';
import { Linking } from 'react-native';
import type { StoreApi, UseBoundStore } from 'zustand';

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

export const formatBalance = (total: number, unit: 'BTC' | 'SAT'): string => {
  if (unit === 'SAT') {
    return `${total.toLocaleString('en-US')} SAT`;
  }
  if (unit === 'BTC') {
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
        return parsed.formatNational(); // Format national (ex: "693 22 02 22" pour le Cameroun)
      case 'international':
        return parsed.formatInternational(); // Format international (ex: "+237 693 22 02 22")
      case 'e164':
        return parsed.format('E.164'); // Format E.164 (ex: "+237693220222")
      case 'rfc3966':
        return parsed.format('RFC3966'); // Format RFC3966 (ex: "tel:+237-693-22-02-22")
      default:
        return parsed.formatInternational();
    }
  } catch (error) {
    console.warn('Erreur lors du formatage du numéro:', error);
    return phoneNumber;
  }
};
