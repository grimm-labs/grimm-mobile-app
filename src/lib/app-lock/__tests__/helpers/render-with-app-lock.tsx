/**
 * Renders a screen with the real AppLockProvider and the real Lock Screen, as the root layout does.
 * The test file must mock the native boundaries first: expo-secure-store, expo-local-authentication and expo-crypto
 * (the fakes next to this file), expo-router, and the Breez and BDK contexts (the Wallet Reset uses them).
 */
import type { RenderOptions } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import React from 'react';

import { LockScreen } from '@/components/lock-screen';
import { createPinSalt, hashPin } from '@/lib/app-lock';
import { fakeSecureStore } from '@/lib/app-lock/__tests__/helpers/fake-secure-store';
import { AppContext } from '@/lib/context/app-context-provider';
import { AppLockProvider, useAppLock } from '@/lib/context/app-lock-context';
import { render, screen, waitFor } from '@/lib/test-utils';
import { BitcoinUnit } from '@/types/enum';

type AppContextValue = React.ContextType<typeof AppContext>;

export function createAppContextValue(overrides: Partial<AppContextValue> = {}): AppContextValue {
  return {
    hideBalance: false,
    preventScreenCapture: false,
    onboarding: false,
    isDataLoaded: true,
    hasSeedPhrase: true,
    isSeedPhraseBackup: false,
    selectedCountry: { currency: 'XAF', callingCode: '237', region: 'Africa', subregion: 'Middle Africa', name: 'Cameroon', nameFr: 'Cameroun', isoCode: 'CM' },
    bitcoinUnit: BitcoinUnit.Sats,
    lnInvoiceExpirySecs: 3600,
    setHideBalance: jest.fn(),
    setPreventScreenCapture: jest.fn(),
    setOnboarding: jest.fn(),
    resetAppData: jest.fn(async () => {}),
    setSeedPhrase: jest.fn(),
    setIsSeedPhraseBackup: jest.fn(),
    setSelectedCountry: jest.fn(),
    setBitcoinUnit: jest.fn(),
    setLnInvoiceExpirySecs: jest.fn(),
    ...overrides,
  };
}

/** Writes an App Lock state into the fake secure store, as if the user had turned it on in an earlier session. */
export async function seedAppLock({ pin, biometricUnlock = false, failedAttempts = 0, lockoutUntil = null }: { pin: string; biometricUnlock?: boolean; failedAttempts?: number; lockoutUntil?: number | null }) {
  const salt = createPinSalt();
  fakeSecureStore.set('appLockPinSalt', salt);
  fakeSecureStore.set('appLockPinHash', await hashPin(pin, salt));
  if (biometricUnlock) fakeSecureStore.set('appLockBiometricEnabled', 'true');
  if (failedAttempts > 0) fakeSecureStore.set('appLockFailedAttempts', String(failedAttempts));
  if (lockoutUntil !== null) fakeSecureStore.set('appLockLockoutUntil', String(lockoutUntil));
}

/** Renders a testID once the App Lock state is loaded, so tests can wait for the end of the cold start. */
function AppLockLoadedProbe() {
  const { isAppLockLoaded } = useAppLock();
  const { View } = require('react-native');
  return isAppLockLoaded ? <View testID="app-lock-loaded" /> : null;
}

type Options = Omit<RenderOptions, 'wrapper'> & { appContext?: Partial<AppContextValue> };

export function renderWithAppLock(ui: ReactElement, { appContext, ...options }: Options = {}) {
  const appContextValue = createAppContextValue(appContext);
  const tree = (node: ReactElement) => (
    <AppContext.Provider value={appContextValue}>
      <AppLockProvider>
        {node}
        <AppLockLoadedProbe />
        <LockScreen />
      </AppLockProvider>
    </AppContext.Provider>
  );
  const result = render(tree(ui), options);
  return {
    ...result,
    appContext: appContextValue,
    /** Replaces the screen under the Lock Screen, as a navigation would, without remounting the providers. */
    rerenderScreen: (node: ReactElement) => result.rerender(tree(node)),
  };
}

/** A cold start: renders, then waits until the App Lock state is loaded. */
export async function startAppWithAppLock(ui: ReactElement, options?: Options) {
  const result = renderWithAppLock(ui, options);
  await waitFor(() => expect(screen.getByTestId('app-lock-loaded')).toBeOnTheScreen());
  return result;
}
