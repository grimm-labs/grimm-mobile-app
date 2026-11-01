jest.mock('expo-secure-store', () => require('@/lib/app-lock/__tests__/helpers/fake-secure-store'));
jest.mock('expo-local-authentication', () => require('@/lib/app-lock/__tests__/helpers/fake-local-authentication'));
jest.mock('expo-crypto', () => require('@/lib/app-lock/__tests__/helpers/fake-expo-crypto'));

import '@/lib/i18n';

import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';

import { fakeLocalAuthentication } from '@/lib/app-lock/__tests__/helpers/fake-local-authentication';
import { fakeSecureStore } from '@/lib/app-lock/__tests__/helpers/fake-secure-store';
import { seedAppLock, startAppWithAppLock } from '@/lib/app-lock/__tests__/helpers/render-with-app-lock';
import { act, cleanup, screen } from '@/lib/test-utils';

import Home from '../index';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/lib/context', () => ({
  AppContext: jest.requireActual('@/lib/context/app-context-provider').AppContext,
  useBreez: () => ({ balance: 0, network: 'mainnet', refreshWalletInfo: jest.fn() }),
  useBdk: () => ({ balance: 0, retryBdkConnection: jest.fn(), isSyncing: false }),
}));

jest.mock('@/lib/context/breez-context', () => ({
  AppNetwork: { MAINNET: 'mainnet', TESTNET: 'testnet' },
  useBreez: () => ({ disconnectBreez: jest.fn() }),
}));

jest.mock('@/lib/context/bdk-context', () => ({
  useBdk: () => ({ disconnectBdk: jest.fn() }),
}));

jest.mock('@/components/wallet-overview', () => ({ WalletOverview: () => null }));
jest.mock('@/components/wallet-view', () => ({ WalletView: () => null }));
jest.mock('@/components/esplora-connection-banner', () => ({ EsploraConnectionBanner: () => null }));

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

jest.mock('@/components/ui/focus-aware-status-bar', () => ({
  FocusAwareStatusBar: () => null,
}));

const COMBINATIONS = [false, true].flatMap((isAppLockEnabled) =>
  [false, true].flatMap((isCardDismissed) => [false, true].map((isRecoveryPhraseBackedUp) => ({ isAppLockEnabled, isCardDismissed, isRecoveryPhraseBackedUp }))),
);

describe('Home', () => {
  beforeEach(async () => {
    fakeSecureStore.reset();
    fakeLocalAuthentication.reset();
    await AsyncStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it.each(COMBINATIONS)('never stacks the backup card and the App Lock card (App Lock on: $isAppLockEnabled, dismissed: $isCardDismissed, backed up: $isRecoveryPhraseBackedUp)', async ({ isAppLockEnabled, isCardDismissed, isRecoveryPhraseBackedUp }) => {
    if (isAppLockEnabled) await seedAppLock({ pin: '482915' });
    if (isCardDismissed) await AsyncStorage.setItem('appLockCardDismissed', 'true');

    await startAppWithAppLock(<Home />, { appContext: { isSeedPhraseBackup: isRecoveryPhraseBackedUp } });
    await act(async () => {
      for (let i = 0; i < 20; i++) await Promise.resolve();
    });

    const isBackupCardShown = screen.queryByTestId('seed-backup-banner') !== null;
    const isAppLockCardShown = screen.queryByTestId('home-app-lock-card') !== null;
    expect(isBackupCardShown).toBe(!isRecoveryPhraseBackedUp);
    expect(isAppLockCardShown).toBe(!isAppLockEnabled && !isCardDismissed && isRecoveryPhraseBackedUp);
    expect(isBackupCardShown && isAppLockCardShown).toBe(false);
  });
});
