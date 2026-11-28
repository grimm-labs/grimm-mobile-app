import React from 'react';
import { Platform } from 'react-native';

import { cleanup, screen, setup, waitFor } from '@/lib/test-utils';

jest.mock('@breeztech/breez-sdk-spark-react-native', () => require('@/lib/breez/__tests__/helpers/fake-breez-sdk'));

const mockT = (key: string, options?: Record<string, unknown>) => (options ? `${key} ${JSON.stringify(options)}` : key);
jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: jest.fn() },
  useTranslation: () => ({ t: mockT }),
}));

jest.mock('react-native-flash-message', () => ({ showMessage: jest.fn() }));
jest.mock('@env', () => ({ Env: { VERSION: '1.5.2' } }));
jest.mock('expo-application', () => ({ nativeBuildVersion: '42' }));
jest.mock('expo-router', () => ({ Stack: { Screen: () => null } }));
jest.mock('@react-navigation/native', () => {
  const { useEffect } = require('react');
  return { ...jest.requireActual('@react-navigation/native'), useFocusEffect: (effect: () => void) => useEffect(effect, [effect]) };
});
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});
jest.mock('@/components/back-button', () => ({ HeaderLeft: () => null }));
jest.mock('@/components/ui/focus-aware-status-bar', () => ({ FocusAwareStatusBar: () => null }));

const mockBreez = {
  breezWalletInfos: { balanceSats: BigInt(1_000) },
  isBreezInitialized: true,
  isConnected: true,
  network: 'mainnet',
  listUnclaimedDeposits: jest.fn(async () => []),
};
jest.mock('@/lib/context', () => ({ useBreez: () => mockBreez }));

jest.mock('@/lib/breez/sdk-logs', () => ({ exportSdkLogs: jest.fn() }));

import { showMessage } from 'react-native-flash-message';

import { exportSdkLogs } from '@/lib/breez/sdk-logs';

import BreezSdkDetailsScreen from '../breez-sdk';

const mockExport = exportSdkLogs as jest.Mock;

describe('BreezSdkDetailsScreen: export the SDK logs', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    warnSpy.mockRestore();
  });

  async function pressExport() {
    const { user } = setup(<BreezSdkDetailsScreen />);
    await waitFor(() => expect(mockBreez.listUnclaimedDeposits).toHaveBeenCalled());
    await user.press(screen.getByTestId('breez-sdk-export-logs'));
  }

  it('explains what the logs contain', () => {
    setup(<BreezSdkDetailsScreen />);

    expect(screen.getByText('breezDetails.exportLogs.description')).toBeOnTheScreen();
  });

  it('shares the logs with what Breez support needs in the header', async () => {
    mockExport.mockResolvedValue('shared');

    await pressExport();

    expect(mockExport).toHaveBeenCalledWith({ appVersion: '1.5.2 (42)', platform: `${Platform.OS} ${Platform.Version}`, network: 'mainnet', exportedAt: expect.any(Date) }, 'breezDetails.exportLogs.dialogTitle');
    expect(showMessage).not.toHaveBeenCalled();
  });

  it.each([
    ['empty', 'breezDetails.exportLogs.empty', 'info'],
    ['unavailable', 'breezDetails.exportLogs.unavailable', 'danger'],
  ])('says so when there is nothing to share (%s)', async (result, message, type) => {
    mockExport.mockResolvedValue(result);

    await pressExport();

    await waitFor(() => expect(showMessage).toHaveBeenCalledWith({ message, type }));
  });

  it('reports a failed export', async () => {
    mockExport.mockRejectedValue(new Error('disk full'));

    await pressExport();

    await waitFor(() => expect(showMessage).toHaveBeenCalledWith({ message: 'breezDetails.exportLogs.error', type: 'danger' }));
  });
});
