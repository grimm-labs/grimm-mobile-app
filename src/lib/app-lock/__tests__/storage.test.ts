jest.mock('expo-secure-store', () => require('@/lib/app-lock/__tests__/helpers/fake-secure-store'));

import { fakeSecureStore } from '@/lib/app-lock/__tests__/helpers/fake-secure-store';
import { APP_LOCK_KEYS, deleteAppLockState, readAppLockState, saveBiometricUnlockEnabled, saveFailedAttempts, savePin } from '@/lib/app-lock/storage';

describe('App Lock storage', () => {
  beforeEach(() => {
    fakeSecureStore.reset();
    fakeSecureStore.set('seedPhrase', 'abandon ability able');
  });

  it('reads, writes and deletes exactly the five App Lock keys', async () => {
    expect(Object.values(APP_LOCK_KEYS).sort()).toEqual(['appLockBiometricEnabled', 'appLockFailedAttempts', 'appLockLockoutUntil', 'appLockPinHash', 'appLockPinSalt']);

    await savePin({ hash: 'hash-hex', salt: 'salt-hex' });
    await saveBiometricUnlockEnabled(true);
    await saveFailedAttempts({ failedAttempts: 5, lockoutUntil: 1_800_000_030_000 });

    expect(fakeSecureStore.snapshot()).toEqual({
      seedPhrase: 'abandon ability able',
      appLockPinHash: 'hash-hex',
      appLockPinSalt: 'salt-hex',
      appLockBiometricEnabled: 'true',
      appLockFailedAttempts: '5',
      appLockLockoutUntil: '1800000030000',
    });
    expect(await readAppLockState()).toEqual({ pin: { hash: 'hash-hex', salt: 'salt-hex' }, isBiometricUnlockEnabled: true, failedAttempts: 5, lockoutUntil: 1_800_000_030_000 });

    await deleteAppLockState();

    expect(fakeSecureStore.snapshot()).toEqual({ seedPhrase: 'abandon ability able' });
  });

  it('stores Biometric Unlock as "true" or absent, and a reset count as absent', async () => {
    await saveBiometricUnlockEnabled(true);
    await saveFailedAttempts({ failedAttempts: 2, lockoutUntil: null });
    await saveBiometricUnlockEnabled(false);
    await saveFailedAttempts({ failedAttempts: 0, lockoutUntil: null });

    expect(fakeSecureStore.keys()).toEqual(['seedPhrase']);
  });

  it('reads an empty store as App Lock off, no count and no Lockout', async () => {
    expect(await readAppLockState()).toEqual({ pin: null, isBiometricUnlockEnabled: false, failedAttempts: 0, lockoutUntil: null });
  });

  it('reads corrupted values as no PIN, zero and no Lockout', async () => {
    fakeSecureStore.set(APP_LOCK_KEYS.pinHash, 'hash-without-salt');
    fakeSecureStore.set(APP_LOCK_KEYS.biometricEnabled, 'yes');
    fakeSecureStore.set(APP_LOCK_KEYS.failedAttempts, 'many');
    fakeSecureStore.set(APP_LOCK_KEYS.lockoutUntil, 'soon');

    expect(await readAppLockState()).toEqual({ pin: null, isBiometricUnlockEnabled: false, failedAttempts: 0, lockoutUntil: null });
  });
});
