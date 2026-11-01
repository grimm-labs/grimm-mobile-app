jest.mock('expo-secure-store', () => require('@/lib/app-lock/__tests__/helpers/fake-secure-store'));
jest.mock('expo-local-authentication', () => require('@/lib/app-lock/__tests__/helpers/fake-local-authentication'));
jest.mock('expo-crypto', () => require('@/lib/app-lock/__tests__/helpers/fake-expo-crypto'));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import { spyOnConsole } from '@/lib/app-lock/__tests__/helpers/console-spy';
import { fakeSecureStore } from '@/lib/app-lock/__tests__/helpers/fake-secure-store';
import { createAppContextValue, seedAppLock } from '@/lib/app-lock/__tests__/helpers/render-with-app-lock';
import { AppContext } from '@/lib/context/app-context-provider';
import { AppLockProvider, useAppLock } from '@/lib/context/app-lock-context';
import { useWalletReset } from '@/lib/hooks/use-wallet-reset';

const mockT = (key: string) => key;
jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: jest.fn() },
  useTranslation: () => ({ t: mockT }),
}));

const mockCalls: string[] = [];
const mockPush = jest.fn((path: string) => mockCalls.push(`push ${path}`));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockDisconnectBreez = jest.fn(async () => {
  mockCalls.push('disconnectBreez');
});
jest.mock('@/lib/context/breez-context', () => ({
  useBreez: () => ({ disconnectBreez: mockDisconnectBreez }),
}));

const mockDisconnectBdk = jest.fn(async () => {
  mockCalls.push('disconnectBdk');
});
jest.mock('@/lib/context/bdk-context', () => ({
  useBdk: () => ({ disconnectBdk: mockDisconnectBdk }),
}));

const PIN = '482915';

describe('useWalletReset', () => {
  let consoleSpy: ReturnType<typeof spyOnConsole>;

  beforeEach(async () => {
    mockCalls.length = 0;
    jest.clearAllMocks();
    fakeSecureStore.reset();
    await AsyncStorage.clear();
    consoleSpy = spyOnConsole();
  });

  afterEach(() => {
    consoleSpy.expectNoSecretLogged([PIN]);
    consoleSpy.restore();
  });

  it('deletes the five App Lock keys and appLockCardDismissed, on top of the existing Sign Out steps', async () => {
    await seedAppLock({ pin: PIN, biometricUnlock: true, failedAttempts: 5, lockoutUntil: Date.now() + 30_000 });
    await AsyncStorage.setItem('appLockCardDismissed', 'true');
    const appContext = createAppContextValue({
      resetAppData: jest.fn(async () => {
        mockCalls.push('resetAppData');
      }),
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppContext.Provider value={appContext}>
        <AppLockProvider>{children}</AppLockProvider>
      </AppContext.Provider>
    );
    const { result } = renderHook(() => ({ resetWallet: useWalletReset(), appLock: useAppLock() }), { wrapper });
    await waitFor(() => expect(result.current.appLock.isLocked).toBe(true));

    await act(() => result.current.resetWallet());

    expect(mockCalls).toEqual(['resetAppData', 'disconnectBreez', 'disconnectBdk', 'push /']);
    expect(fakeSecureStore.keys()).toEqual([]);
    expect(await AsyncStorage.getItem('appLockCardDismissed')).toBeNull();
    expect(result.current.appLock).toMatchObject({ isAppLockEnabled: false, isLocked: false, failedAttempts: 0, lockoutUntil: null });
  });
});
