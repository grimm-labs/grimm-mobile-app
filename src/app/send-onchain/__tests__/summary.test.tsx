import React from 'react';

import { act, cleanup, fireEvent, render, screen, waitFor } from '@/lib/test-utils';

import OnchainSummaryTransactionScreen from '../summary';

const mockPush = jest.fn();
const mockSendTransaction = jest.fn();
const mockCalculateTransactionFee = jest.fn();
const mockShowErrorMessage = jest.fn();
const mockT = (key: string) => key;

const RECIPIENT = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
let mockSearchParams: Record<string, string> = {};
let mockBitcoinUnit = 'SATS';

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Ionicons: (props: Record<string, unknown>) => <View {...props} />,
    MaterialCommunityIcons: (props: Record<string, unknown>) => <View {...props} />,
  };
});

jest.mock('@/components/ui/focus-aware-status-bar', () => ({
  FocusAwareStatusBar: () => null,
}));

jest.mock('@/components/back-button', () => ({
  HeaderLeft: () => null,
}));

jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: jest.fn() },
  useTranslation: () => ({ t: mockT }),
}));

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => ({ push: mockPush }),
    useLocalSearchParams: () => mockSearchParams,
    Stack: {
      Screen: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    },
  };
});

jest.mock('@/lib/context', () => {
  const React = require('react');
  const AppContext = React.createContext({});
  return {
    AppContext,
    // Like the real BdkProvider, a new function identity on every render
    useBdk: () => ({
      wallet: mockWallet,
      sendTransaction: (...args: unknown[]) => mockSendTransaction(...args),
      calculateTransactionFee: (...args: unknown[]) => mockCalculateTransactionFee(...args),
    }),
  };
});

const mockWallet = {};

jest.mock('@/lib/context/bitcoin-prices-context', () => ({
  useBitcoin: () => ({ bitcoinPrices: { BTC: { USD: 50000 } } }),
}));

jest.mock('@/lib', () => ({
  convertBitcoinToFiat: () => 1,
  convertSatsToBtc: (sats: number) => (sats / 100_000_000).toFixed(8),
  getFiatCurrency: () => 'USD',
}));

jest.mock('@/components/ui/utils', () => ({
  showErrorMessage: (...args: unknown[]) => mockShowErrorMessage(...args),
}));

// The slider is a gesture; the tests only need "confirm unless disabled"
jest.mock('@/components/slide-to-confirm', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');
  return ({ onConfirm, loading, disabled }: { onConfirm: () => void; loading?: boolean; disabled?: boolean }) => (
    <Pressable testID="slide-to-confirm" onPress={onConfirm} disabled={loading || disabled}>
      <Text>{loading ? 'Processing...' : 'Slide to confirm'}</Text>
    </Pressable>
  );
});

// Builds errors shaped like the bdk-rn CreateTxError variants (uniffi errors: an Error with a tag and an inner)
function bdkCreateTxError(tag: string, inner: Record<string, unknown> = {}) {
  return Object.assign(new Error(`CreateTxError.${tag}`), { tag, inner });
}

function renderSummary(params: Partial<Record<string, string>> = {}) {
  mockSearchParams = { recipientAddress: RECIPIENT, satsAmount: '25000', feeSpeed: 'medium', feeSatsPerVbyte: '12', ...params } as Record<string, string>;
  const { AppContext } = require('@/lib/context');
  return render(
    <AppContext.Provider value={{ bitcoinUnit: mockBitcoinUnit, selectedCountry: { currency: 'USD' } }}>
      <OnchainSummaryTransactionScreen />
    </AppContext.Provider>,
  );
}

async function waitForEstimation() {
  await waitFor(() => expect(screen.getByTestId('slide-to-confirm')).toBeEnabled());
}

beforeEach(() => {
  mockBitcoinUnit = 'SATS';
  mockCalculateTransactionFee.mockResolvedValue(1410);
  mockSendTransaction.mockResolvedValue('txid-123');
});

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
  jest.useRealTimers();
});

describe('OnchainSummaryTransactionScreen (send-onchain/summary)', () => {
  describe('Amount sent', () => {
    it('sends the entered Amount in sats with the selected fee rate (Amount entered in sats)', async () => {
      renderSummary({ satsAmount: '25000', feeSatsPerVbyte: '12' });
      await waitForEstimation();

      fireEvent.press(screen.getByTestId('slide-to-confirm'));

      await waitFor(() => expect(mockSendTransaction).toHaveBeenCalledWith(RECIPIENT, 25000, 12));
      expect(mockSendTransaction).toHaveBeenCalledTimes(1);
    });

    it('sends the entered Amount in sats with the selected fee rate (Amount entered in BTC)', async () => {
      // enter-amount converts a BTC entry to sats: 0.0015 BTC arrives as 150000
      mockBitcoinUnit = 'BTC';
      renderSummary({ satsAmount: '150000', feeSatsPerVbyte: '3' });
      await waitForEstimation();
      expect(screen.getByText('0.00150000 BTC')).toBeOnTheScreen();

      fireEvent.press(screen.getByTestId('slide-to-confirm'));

      await waitFor(() => expect(mockSendTransaction).toHaveBeenCalledWith(RECIPIENT, 150000, 3));
    });

    it('navigates to transaction-result with the Amount, not the Total', async () => {
      jest.useFakeTimers();
      renderSummary({ satsAmount: '25000' });
      await waitForEstimation();

      fireEvent.press(screen.getByTestId('slide-to-confirm'));
      await act(async () => {
        await jest.advanceTimersByTimeAsync(2000);
      });

      expect(mockPush).toHaveBeenCalledWith('/send-onchain/transaction-result?satsAmount=25000&txId=txid-123');
    });
  });

  describe('Network Fee estimation', () => {
    it('disables the slider while the Network Fee estimation is pending', async () => {
      let resolveFee: (fee: number) => void = () => {};
      mockCalculateTransactionFee.mockReturnValue(new Promise<number>((resolve) => (resolveFee = resolve)));
      renderSummary();

      expect(screen.getByTestId('slide-to-confirm')).toBeDisabled();
      fireEvent.press(screen.getByTestId('slide-to-confirm'));
      expect(mockSendTransaction).not.toHaveBeenCalled();

      await act(async () => resolveFee(1410));
      expect(screen.getByTestId('slide-to-confirm')).toBeEnabled();
    });

    it('does not estimate again when the BDK context re-renders', async () => {
      const { rerender } = renderSummary();
      await waitForEstimation();
      const { AppContext } = require('@/lib/context');

      rerender(
        <AppContext.Provider value={{ bitcoinUnit: mockBitcoinUnit, selectedCountry: { currency: 'USD' } }}>
          <OnchainSummaryTransactionScreen />
        </AppContext.Provider>,
      );

      expect(screen.getByTestId('slide-to-confirm')).toBeEnabled();
      expect(mockCalculateTransactionFee).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['InsufficientFunds', bdkCreateTxError('InsufficientFunds', { needed: 30000n, available: 26000n })],
      ['CoinSelection', bdkCreateTxError('CoinSelection', { errorMessage: 'Insufficient funds: 26000 sat available of 30000 sat needed' })],
    ])('shows the insufficient-funds message and keeps the slider disabled when BDK reports insufficient funds (%s)', async (_variant, error) => {
      mockCalculateTransactionFee.mockRejectedValue(error);
      renderSummary();

      expect(await screen.findByText('onchainSend.summary.errors.insufficientFunds')).toBeOnTheScreen();
      expect(screen.queryByText('onchainSend.summary.errors.feeEstimationFailed')).not.toBeOnTheScreen();
      expect(screen.getByTestId('slide-to-confirm')).toBeDisabled();
    });

    it('shows the generic estimation message and keeps the slider disabled when the estimation fails for another reason', async () => {
      mockCalculateTransactionFee.mockRejectedValue(new Error('Wallet ou blockchain not initialized'));
      renderSummary();

      expect(await screen.findByText('onchainSend.summary.errors.feeEstimationFailed')).toBeOnTheScreen();
      expect(screen.queryByText('onchainSend.summary.errors.insufficientFunds')).not.toBeOnTheScreen();
      expect(screen.getByTestId('slide-to-confirm')).toBeDisabled();
    });
  });

  describe('Send failure', () => {
    it('shows the send error, stays on the summary and lets the user slide again when the send fails', async () => {
      mockSendTransaction.mockRejectedValueOnce(new Error('broadcast failed'));
      renderSummary();
      await waitForEstimation();

      fireEvent.press(screen.getByTestId('slide-to-confirm'));

      await waitFor(() => expect(mockShowErrorMessage).toHaveBeenCalledWith('onchainSend.summary.errors.sendFailed'));
      expect(mockPush).not.toHaveBeenCalled();
      await waitFor(() => expect(screen.getByTestId('slide-to-confirm')).toBeEnabled());

      fireEvent.press(screen.getByTestId('slide-to-confirm'));
      await waitFor(() => expect(mockSendTransaction).toHaveBeenCalledTimes(2));
    });
  });
});
