import * as Crypto from 'expo-crypto';

export const PIN_LENGTH = 6;
const SALT_BYTES = 16;

export type StoredPin = { hash: string; salt: string };

export const isValidPin = (pin: string) => new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);

export const createPinSalt = () =>
  Array.from(Crypto.getRandomBytes(SALT_BYTES))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

/** Hex SHA-256 of salt + PIN. App Lock is a UI gate (ADR 0001): this hash is not an encryption key. */
export const hashPin = (pin: string, salt: string) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, salt + pin, { encoding: Crypto.CryptoEncoding.HEX });

export const verifyPin = async (pin: string, stored: StoredPin) => (await hashPin(pin, stored.salt)) === stored.hash;
