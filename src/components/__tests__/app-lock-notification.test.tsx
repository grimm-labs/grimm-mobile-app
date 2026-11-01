jest.mock('expo-secure-store', () => require('@/lib/app-lock/__tests__/helpers/fake-secure-store'));
jest.mock('expo-local-authentication', () => require('@/lib/app-lock/__tests__/helpers/fake-local-authentication'));
jest.mock('expo-crypto', () => require('@/lib/app-lock/__tests__/helpers/fake-expo-crypto'));

import '@/lib/i18n';

import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';

import { AppLockNotification } from '@/components/app-lock-notification';
import { fakeLocalAuthentication } from '@/lib/app-lock/__tests__/helpers/fake-local-authentication';
import { fakeSecureStore } from '@/lib/app-lock/__tests__/helpers/fake-secure-store';
import { seedAppLock, startAppWithAppLock } from '@/lib/app-lock/__tests__/helpers/render-with-app-lock';
import { act, cleanup, fireEvent, screen } from '@/lib/test-utils';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/lib/context/breez-context', () => ({
  useBreez: () => ({ disconnectBreez: jest.fn() }),
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

type Combination = { isAppLockEnabled: boolean; isCardDismissed: boolean; isRecoveryPhraseBackedUp: boolean };

const COMBINATIONS: Combination[] = [false, true].flatMap((isAppLockEnabled) =>
  [false, true].flatMap((isCardDismissed) => [false, true].map((isRecoveryPhraseBackedUp) => ({ isAppLockEnabled, isCardDismissed, isRecoveryPhraseBackedUp }))),
);

async function flushPromises() {
  await act(async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve();
  });
}

async function renderCard({ isAppLockEnabled, isCardDismissed, isRecoveryPhraseBackedUp }: Combination) {
  if (isAppLockEnabled) await seedAppLock({ pin: '482915' });
  if (isCardDismissed) await AsyncStorage.setItem('appLockCardDismissed', 'true');
  await startAppWithAppLock(<AppLockNotification />, { appContext: { isSeedPhraseBackup: isRecoveryPhraseBackedUp } });
  await flushPromises();
}

describe('AppLockNotification (home card)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    fakeSecureStore.reset();
    fakeLocalAuthentication.reset();
    await AsyncStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it.each(COMBINATIONS)('App Lock on: $isAppLockEnabled, dismissed: $isCardDismissed, backed up: $isRecoveryPhraseBackedUp', async (combination) => {
    await renderCard(combination);

    const shouldShow = !combination.isAppLockEnabled && !combination.isCardDismissed && combination.isRecoveryPhraseBackedUp;
    expect(screen.queryByTestId('home-app-lock-card') !== null).toBe(shouldShow);
  });

  it('shows "Protect your wallet" in the backup card style', async () => {
    await renderCard({ isAppLockEnabled: false, isCardDismissed: false, isRecoveryPhraseBackedUp: true });

    expect(screen.getByText('Protect your wallet')).toBeOnTheScreen();
    expect(screen.getByTestId('home-app-lock-card')).toHaveProp('className', expect.stringContaining('rounded-xl'));
  });

  it('tapping opens settings/app-lock', async () => {
    await renderCard({ isAppLockEnabled: false, isCardDismissed: false, isRecoveryPhraseBackedUp: true });

    fireEvent.press(screen.getByTestId('home-app-lock-card'));

    expect(mockPush).toHaveBeenCalledWith('/settings/app-lock');
  });

  it('closing hides it for good, across a remount', async () => {
    await renderCard({ isAppLockEnabled: false, isCardDismissed: false, isRecoveryPhraseBackedUp: true });

    fireEvent.press(screen.getByTestId('home-app-lock-card-close'));
    await flushPromises();

    expect(screen.queryByTestId('home-app-lock-card')).not.toBeOnTheScreen();
    expect(mockPush).not.toHaveBeenCalled();
    cleanup();

    await startAppWithAppLock(<AppLockNotification />, { appContext: { isSeedPhraseBackup: true } });
    await flushPromises();
    expect(screen.queryByTestId('home-app-lock-card')).not.toBeOnTheScreen();
    expect(await AsyncStorage.getItem('appLockCardDismissed')).toBe('true');
  });
});
