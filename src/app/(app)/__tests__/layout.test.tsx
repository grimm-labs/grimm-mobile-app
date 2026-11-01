jest.mock('expo-secure-store', () => require('@/lib/app-lock/__tests__/helpers/fake-secure-store'));
jest.mock('expo-local-authentication', () => require('@/lib/app-lock/__tests__/helpers/fake-local-authentication'));
jest.mock('expo-crypto', () => require('@/lib/app-lock/__tests__/helpers/fake-expo-crypto'));

import '@/lib/i18n';

import React from 'react';

import { fakeLocalAuthentication } from '@/lib/app-lock/__tests__/helpers/fake-local-authentication';
import { fakeSecureStore, getItemAsync } from '@/lib/app-lock/__tests__/helpers/fake-secure-store';
import { renderWithAppLock, seedAppLock } from '@/lib/app-lock/__tests__/helpers/render-with-app-lock';
import { act, cleanup, screen, waitFor } from '@/lib/test-utils';

import TabLayout from '../_layout';

const mockHideAsync = jest.fn(async () => {});
jest.mock('expo-router', () => {
  const React = require('react');
  const { Text, View } = require('react-native');
  const Tabs = ({ children }: { children: React.ReactNode }) => <View testID="tabs">{children}</View>;
  Tabs.Screen = () => null;
  return {
    SplashScreen: { hideAsync: () => mockHideAsync() },
    Redirect: ({ href }: { href: string }) => <Text testID="redirect">{href}</Text>,
    Tabs,
    useRouter: () => ({ push: jest.fn() }),
  };
});

jest.mock('@/lib', () => ({
  initializeLanguage: async () => {},
}));

const mockInitializeBreez = jest.fn();
const mockInitializeBdk = jest.fn();

jest.mock('@/lib/context', () => ({
  AppContext: jest.requireActual('@/lib/context/app-context-provider').AppContext,
  useBdk: () => ({ isBdkInitialized: false, initializeBdk: mockInitializeBdk }),
}));

jest.mock('@/lib/context/breez-context', () => ({
  useBreez: () => ({ isBreezInitialized: false, initializeBreez: mockInitializeBreez, isDataLoaded: true, disconnectBreez: jest.fn() }),
}));

jest.mock('@/lib/context/bdk-context', () => ({
  useBdk: () => ({ disconnectBdk: jest.fn() }),
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

/** Advances the clock in small steps, letting React render and run effects between them. */
async function advanceTime(ms: number) {
  for (let elapsed = 0; elapsed < ms; elapsed += 100) {
    await act(async () => {
      await jest.advanceTimersByTimeAsync(100);
    });
  }
}

describe('(app) layout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    fakeSecureStore.reset();
    fakeLocalAuthentication.reset();
  });

  afterEach(() => {
    cleanup();
    jest.useRealTimers();
  });

  it.each([
    ['with a wallet', true],
    ['without a wallet', false],
  ])('does not hide the splash before isAppLockLoaded is true (%s)', async (_label, hasSeedPhrase) => {
    let answer: () => void = () => {};
    const stored = new Promise<void>((resolve) => (answer = resolve));
    getItemAsync.mockImplementation(async (key: string) => {
      if (key.startsWith('appLock')) await stored;
      return fakeSecureStore.get(key);
    });

    renderWithAppLock(<TabLayout />, { appContext: { isDataLoaded: true, hasSeedPhrase } });
    await advanceTime(5_000);
    expect(mockHideAsync).not.toHaveBeenCalled();

    await act(async () => answer());
    await advanceTime(1_500);
    expect(mockHideAsync).toHaveBeenCalledTimes(1);
  });

  it('starts Breez and BDK while the app is locked', async () => {
    await seedAppLock({ pin: '482915' });

    renderWithAppLock(<TabLayout />, { appContext: { isDataLoaded: true, hasSeedPhrase: true } });

    await waitFor(() => expect(screen.getByTestId('lock-screen')).toBeOnTheScreen());
    expect(mockInitializeBreez).toHaveBeenCalled();
    expect(mockInitializeBdk).toHaveBeenCalled();
    expect(screen.getByTestId('tabs')).toBeOnTheScreen();
  });
});
