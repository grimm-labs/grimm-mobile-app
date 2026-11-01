import * as SecureStore from 'expo-secure-store';

import type { LockoutState } from './lockout';
import type { StoredPin } from './pin';

/** App Lock lives in the secure store, next to the Recovery Phrase. App Lock is on when the PIN hash exists. */
export const APP_LOCK_KEYS = {
  pinHash: 'appLockPinHash',
  pinSalt: 'appLockPinSalt',
  // eslint-disable-next-line no-secrets/no-secrets -- a key name, not a secret
  biometricEnabled: 'appLockBiometricEnabled',
  failedAttempts: 'appLockFailedAttempts',
  lockoutUntil: 'appLockLockoutUntil',
} as const;

/** AsyncStorage (lib/storage JSON helpers): the home card was closed. */
export const APP_LOCK_CARD_DISMISSED_KEY = 'appLockCardDismissed';

export type StoredAppLockState = LockoutState & {
  pin: StoredPin | null;
  isBiometricUnlockEnabled: boolean;
};

const parseCount = (value: string | null) => {
  const count = Number(value);
  return Number.isInteger(count) && count > 0 ? count : 0;
};

const parseTimestamp = (value: string | null) => {
  const timestamp = Number(value);
  return value !== null && Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null;
};

export const readAppLockState = async (): Promise<StoredAppLockState> => {
  const [hash, salt, biometricEnabled, failedAttempts, lockoutUntil] = await Promise.all(
    [APP_LOCK_KEYS.pinHash, APP_LOCK_KEYS.pinSalt, APP_LOCK_KEYS.biometricEnabled, APP_LOCK_KEYS.failedAttempts, APP_LOCK_KEYS.lockoutUntil].map((key) => SecureStore.getItemAsync(key)),
  );
  return {
    pin: hash && salt ? { hash, salt } : null,
    isBiometricUnlockEnabled: biometricEnabled === 'true',
    failedAttempts: parseCount(failedAttempts),
    lockoutUntil: parseTimestamp(lockoutUntil),
  };
};

const setOrDelete = (key: string, value: string | null) => (value === null ? SecureStore.deleteItemAsync(key) : SecureStore.setItemAsync(key, value));

export const savePin = async ({ hash, salt }: StoredPin) => {
  await SecureStore.setItemAsync(APP_LOCK_KEYS.pinSalt, salt);
  await SecureStore.setItemAsync(APP_LOCK_KEYS.pinHash, hash);
};

export const saveBiometricUnlockEnabled = (enabled: boolean) => setOrDelete(APP_LOCK_KEYS.biometricEnabled, enabled ? 'true' : null);

export const saveFailedAttempts = async ({ failedAttempts, lockoutUntil }: LockoutState) => {
  await setOrDelete(APP_LOCK_KEYS.failedAttempts, failedAttempts > 0 ? String(failedAttempts) : null);
  await setOrDelete(APP_LOCK_KEYS.lockoutUntil, lockoutUntil === null ? null : String(lockoutUntil));
};

export const deleteAppLockState = async () => {
  await Promise.all(Object.values(APP_LOCK_KEYS).map((key) => SecureStore.deleteItemAsync(key)));
};
