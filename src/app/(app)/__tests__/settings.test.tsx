jest.mock('expo-secure-store', () => require('@/lib/app-lock/__tests__/helpers/fake-secure-store'));
jest.mock('expo-local-authentication', () => require('@/lib/app-lock/__tests__/helpers/fake-local-authentication'));
jest.mock('expo-crypto', () => require('@/lib/app-lock/__tests__/helpers/fake-expo-crypto'));

import '@/lib/i18n';

import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';

import { spyOnConsole } from '@/lib/app-lock/__tests__/helpers/console-spy';
import { fakeLocalAuthentication } from '@/lib/app-lock/__tests__/helpers/fake-local-authentication';
import { fakeSecureStore } from '@/lib/app-lock/__tests__/helpers/fake-secure-store';
import { seedAppLock, startAppWithAppLock } from '@/lib/app-lock/__tests__/helpers/render-with-app-lock';
import { act, cleanup, fireEvent, screen } from '@/lib/test-utils';

import Settings from '../settings';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockDisconnectBreez = jest.fn(async () => {});
const mockDisconnectBdk = jest.fn(async () => {});

jest.mock('@/lib/context', () => ({
  AppContext: jest.requireActual('@/lib/context/app-context-provider').AppContext,
  useBdk: () => ({ disconnectBdk: mockDisconnectBdk }),
}));

jest.mock('@/lib/context/breez-context', () => ({
  useBreez: () => ({ disconnectBreez: mockDisconnectBreez }),
}));

jest.mock('@/lib/context/bdk-context', () => ({
  useBdk: () => ({ disconnectBdk: mockDisconnectBdk }),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props: Record<string, unknown>) => <View {...props} />;
});

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { Ionicons: (props: Record<string, unknown>) => <View {...props} /> };
});

jest.mock('@/components/ui/focus-aware-status-bar', () => ({
  FocusAwareStatusBar: () => null,
}));

const PIN = '482915';

async function flushPromises() {
  await act(async () => {
    for (let i = 0; i < 50; i++) await Promise.resolve();
  });
}

describe('Settings tab', () => {
  let consoleSpy: ReturnType<typeof spyOnConsole>;

  beforeEach(async () => {
    jest.clearAllMocks();
    fakeSecureStore.reset();
    fakeLocalAuthentication.reset();
    await AsyncStorage.clear();
    consoleSpy = spyOnConsole();
  });

  afterEach(() => {
    cleanup();
    consoleSpy.expectNoSecretLogged([PIN]);
    consoleSpy.restore();
  });

  it('the App Lock item opens settings/app-lock', async () => {
    await startAppWithAppLock(<Settings />);

    expect(screen.getByTestId('settings-app-lock')).toHaveTextContent(/App Lock/);
    fireEvent.press(screen.getByTestId('settings-app-lock'));

    expect(mockPush).toHaveBeenCalledWith('/settings/app-lock');
  });

  it('Sign Out runs the Wallet Reset without asking for the PIN', async () => {
    await seedAppLock({ pin: PIN, biometricUnlock: true });
    await AsyncStorage.setItem('appLockCardDismissed', 'true');
    const { appContext } = await startAppWithAppLock(<Settings />, { appContext: { isSeedPhraseBackup: true } });
    for (const digit of PIN) fireEvent.press(screen.getByTestId(`lock-screen-pin-pad-key-${digit}`));
    await flushPromises();
    expect(screen.queryByTestId('lock-screen')).not.toBeOnTheScreen();

    fireEvent.press(screen.getByTestId('settings-logout'));
    fireEvent.press(screen.getByTestId('logout-confirm-button'));
    await flushPromises();

    expect(screen.queryByTestId('lock-screen')).not.toBeOnTheScreen();
    expect(appContext.resetAppData).toHaveBeenCalledTimes(1);
    expect(mockDisconnectBreez).toHaveBeenCalledTimes(1);
    expect(mockDisconnectBdk).toHaveBeenCalledTimes(1);
    expect(fakeSecureStore.keys()).toEqual([]);
    expect(await AsyncStorage.getItem('appLockCardDismissed')).toBeNull();
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
