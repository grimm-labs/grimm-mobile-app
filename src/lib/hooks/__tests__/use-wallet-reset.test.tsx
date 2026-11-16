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
const mockRouter = {
  canDismiss: jest.fn(() => true),
  dismissAll: jest.fn(() => mockCalls.push('dismissAll')),
  replace: jest.fn((path: string) => mockCalls.push(`replace ${path}`)),
  push: jest.fn((path: string) => mockCalls.push(`push ${path}`)),
};
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
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

  const renderWalletReset = () => {
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
    return renderHook(() => ({ resetWallet: useWalletReset(), appLock: useAppLock() }), { wrapper });
  };

  it('deletes the five App Lock keys and appLockCardDismissed, on top of the existing Sign Out steps', async () => {
    await seedAppLock({ pin: PIN, biometricUnlock: true, failedAttempts: 5, lockoutUntil: Date.now() + 30_000 });
    await AsyncStorage.setItem('appLockCardDismissed', 'true');
    const { result } = renderWalletReset();
    await waitFor(() => expect(result.current.appLock.isLocked).toBe(true));

    await act(() => result.current.resetWallet());

    expect(mockCalls).toEqual(['resetAppData', 'disconnectBreez', 'disconnectBdk', 'dismissAll', 'replace /']);
    expect(fakeSecureStore.keys()).toEqual([]);
    expect(await AsyncStorage.getItem('appLockCardDismissed')).toBeNull();
    expect(result.current.appLock).toMatchObject({ isAppLockEnabled: false, isLocked: false, failedAttempts: 0, lockoutUntil: null });
  });

  it('drops the screens of the deleted wallet: Back cannot return to them', async () => {
    const { result } = renderWalletReset();
    await waitFor(() => expect(result.current.appLock.isAppLockLoaded).toBe(true));

    await act(() => result.current.resetWallet());

    expect(mockRouter.dismissAll).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).toHaveBeenCalledWith('/');
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('with no screen to drop (Sign Out from the Settings tab), only replaces the route with the start', async () => {
    mockRouter.canDismiss.mockReturnValueOnce(false);
    const { result } = renderWalletReset();
    await waitFor(() => expect(result.current.appLock.isAppLockLoaded).toBe(true));

    await act(() => result.current.resetWallet());

    expect(mockRouter.dismissAll).not.toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/');
  });
});
