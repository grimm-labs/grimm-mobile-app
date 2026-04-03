import React from 'react';

import { cleanup, screen, setup, waitFor } from '@/lib/test-utils';

import PaymentDetailsScreen from '../transaction-details';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockParseInput = jest.fn();
const mockPrepareSend = jest.fn();
const mockExecuteSend = jest.fn();
const mockPrepareLnurlPay = jest.fn();
const mockExecuteLnurlPay = jest.fn();
const mockShowErrorMessage = jest.fn();

let mockSearchParams: Record<string, string | undefined> = {};

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('@expo/vector-icons/build/Ionicons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props: Record<string, unknown>) => <View {...props} />;
});

jest.mock('@/components/ui/focus-aware-status-bar', () => ({
  FocusAwareStatusBar: () => null,
}));

jest.mock('react-i18next', () => ({
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/lib/i18n', () => ({
  translate: (key: string) => key,
}));

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => ({
      push: mockPush,
      back: mockBack,
    }),
    useLocalSearchParams: () => mockSearchParams,
    Stack: {
      Screen: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    },
  };
});

jest.mock('@/lib/context/breez-context', () => ({
  useBreez: () => ({
    parseInput: mockParseInput,
    prepareSend: mockPrepareSend,
    executeSend: mockExecuteSend,
    prepareLnurlPay: mockPrepareLnurlPay,
    executeLnurlPay: mockExecuteLnurlPay,
    balance: 100000,
  }),
  InputType_Tags: {
    Bolt11Invoice: 'Bolt11Invoice',
    LightningAddress: 'LightningAddress',
    LnurlPay: 'LnurlPay',
  },
}));

jest.mock('@/lib/context', () => {
  const React = require('react');
  return {
    AppContext: React.createContext({
      selectedCountry: { name: 'United States', code: 'US', currency: 'USD' },
    }),
  };
});

jest.mock('@/lib/context/bitcoin-prices-context', () => ({
  useBitcoin: () => ({
    bitcoinPrices: { BTC: { USD: 50000 } },
  }),
}));

jest.mock('@/lib', () => ({
  convertBitcoinToFiat: () => 2.5,
  getFiatCurrency: () => 'USD',
}));

jest.mock('@/components/ui/utils', () => ({
  showErrorMessage: (...args: unknown[]) => mockShowErrorMessage(...args),
}));

jest.mock('@/components/slide-to-confirm', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');
  return ({ onConfirm, loading }: { onConfirm: () => void; loading?: boolean }) => (
    <Pressable testID="slide-to-confirm" onPress={onConfirm} disabled={loading}>
      <Text>{loading ? 'Processing...' : 'Slide to confirm'}</Text>
    </Pressable>
  );
});

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
  mockSearchParams = {};
});

describe('PaymentDetailsScreen (transaction-details)', () => {
  describe('Bolt11 Invoice flow', () => {
    it('shows loading state initially', () => {
      mockSearchParams = { rawInvoice: 'lnbc1...' };
      mockParseInput.mockReturnValue(new Promise(() => {})); // never resolves

      setup(<PaymentDetailsScreen />);

      expect(screen.getByText('paymentDetails.loading')).toBeOnTheScreen();
      expect(screen.getByText('paymentDetails.loadingSubtitle')).toBeOnTheScreen();
    });

    it('displays invoice details after parsing', async () => {
      mockSearchParams = { rawInvoice: 'lnbc1...' };
      mockParseInput.mockResolvedValueOnce({
        tag: 'Bolt11Invoice',
        inner: [
          {
            amountMsat: 5000000n,
            invoice: { bolt11: 'lnbc1...' },
            payeePubkey: '03abc123',
            description: 'Test payment',
            expiry: 3600n,
            timestamp: BigInt(Math.floor(Date.now() / 1000)),
          },
        ],
      });
      mockPrepareSend.mockResolvedValueOnce({
        paymentMethod: {
          inner: { sparkTransferFeeSats: 10n, lightningFeeSats: 5n },
        },
      });

      setup(<PaymentDetailsScreen />);

      await waitFor(() => {
        expect(screen.getByText('paymentDetails.amount')).toBeOnTheScreen();
      });

      expect(screen.getByText('5000 SAT')).toBeOnTheScreen();
      expect(screen.getByText('03abc123')).toBeOnTheScreen();
      expect(screen.getByText('Test payment')).toBeOnTheScreen();
      expect(screen.getByText('paymentDetails.networkFee')).toBeOnTheScreen();
    });

    it('shows decode error when invoice parsing fails', async () => {
      mockSearchParams = { rawInvoice: 'lnbc1...' };
      mockParseInput.mockResolvedValueOnce({
        tag: 'Bolt11Invoice',
        inner: [{ amountMsat: undefined }],
      });

      setup(<PaymentDetailsScreen />);

      await waitFor(() => {
        expect(screen.getByText('paymentDetails.errorMessage')).toBeOnTheScreen();
      });
    });

    it('shows not enough funds error', async () => {
      mockSearchParams = { rawInvoice: 'lnbc1...' };
      mockParseInput.mockResolvedValueOnce({
        tag: 'Bolt11Invoice',
        inner: [
          {
            amountMsat: 5000000n,
            invoice: { bolt11: 'lnbc1...' },
            payeePubkey: '03abc123',
            expiry: 3600n,
            timestamp: BigInt(Math.floor(Date.now() / 1000)),
          },
        ],
      });
      mockPrepareSend.mockRejectedValueOnce(new Error('not enough funds'));

      setup(<PaymentDetailsScreen />);

      await waitFor(() => {
        expect(screen.getByText('paymentDetails.errorMessage')).toBeOnTheScreen();
      });
    });

    it('shows invalidData error on generic parse failure', async () => {
      mockSearchParams = { rawInvoice: 'lnbc1...' };
      mockParseInput.mockRejectedValueOnce(new Error('something else'));

      setup(<PaymentDetailsScreen />);

      await waitFor(() => {
        expect(mockShowErrorMessage).toHaveBeenCalledWith('paymentDetails.errors.invalidData');
      });
    });

    it('executes bolt11 payment on confirm', async () => {
      mockSearchParams = { rawInvoice: 'lnbc1...' };
      const mockPrepareResponse = {
        paymentMethod: {
          inner: { sparkTransferFeeSats: 0n, lightningFeeSats: 0n },
        },
      };
      mockParseInput.mockResolvedValueOnce({
        tag: 'Bolt11Invoice',
        inner: [
          {
            amountMsat: 1000000n,
            invoice: { bolt11: 'lnbc1...' },
            payeePubkey: '03abc123',
            expiry: 3600n,
            timestamp: BigInt(Math.floor(Date.now() / 1000)),
          },
        ],
      });
      mockPrepareSend.mockResolvedValueOnce(mockPrepareResponse);
      mockExecuteSend.mockResolvedValueOnce({
        payment: { amount: 1000n },
      });

      const { user } = setup(<PaymentDetailsScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('slide-to-confirm')).toBeOnTheScreen();
      });

      await user.press(screen.getByTestId('slide-to-confirm'));

      await waitFor(() => {
        expect(mockExecuteSend).toHaveBeenCalledWith(mockPrepareResponse);
      });

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/transaction-result/success-screen',
        params: { transactionType: 'sent', satsAmount: '1000' },
      });
    });
  });

  describe('Lightning Address flow', () => {
    it('displays LN address as destination', async () => {
      mockSearchParams = { lightningAddress: 'bob@pay.usegrimm.app', amountSats: '5000' };
      mockParseInput.mockResolvedValueOnce({
        tag: 'LightningAddress',
        inner: [{ address: 'bob@pay.usegrimm.app', payRequest: { callback: 'https://getalby.com/lnurlp/alice' } }],
      });
      mockPrepareLnurlPay.mockResolvedValueOnce({
        amountSats: 5000n,
        feeSats: 10n,
      });

      setup(<PaymentDetailsScreen />);

      await waitFor(() => {
        expect(screen.getByText('bob@pay.usegrimm.app')).toBeOnTheScreen();
      });

      expect(screen.getByText('5000 SAT')).toBeOnTheScreen();
    });

    it('handles LnurlPay input type', async () => {
      mockSearchParams = { lightningAddress: 'lnurl1...', amountSats: '3000' };
      mockParseInput.mockResolvedValueOnce({
        tag: 'LnurlPay',
        inner: [{ callback: 'https://usegrimm.app/lnurlp' }],
      });
      mockPrepareLnurlPay.mockResolvedValueOnce({
        amountSats: 3000n,
        feeSats: 5n,
      });

      setup(<PaymentDetailsScreen />);

      await waitFor(() => {
        expect(screen.getByText('3000 SAT')).toBeOnTheScreen();
      });
    });

    it('shows decode error for unsupported parsed type', async () => {
      mockSearchParams = { lightningAddress: 'bad@pay.usegrimm.app', amountSats: '1000' };
      mockParseInput.mockResolvedValueOnce({
        tag: 'BitcoinAddress',
        inner: [{ address: 'bc1q...' }],
      });

      setup(<PaymentDetailsScreen />);

      await waitFor(() => {
        expect(screen.getByText('paymentDetails.errorMessage')).toBeOnTheScreen();
      });
    });

    it('shows not enough funds error for LN address', async () => {
      mockSearchParams = { lightningAddress: 'bob@pay.usegrimm.app', amountSats: '5000' };
      mockParseInput.mockResolvedValueOnce({
        tag: 'LightningAddress',
        inner: [{ address: 'bob@pay.usegrimm.app', payRequest: {} }],
      });
      mockPrepareLnurlPay.mockRejectedValueOnce(new Error('not enough funds'));

      setup(<PaymentDetailsScreen />);

      await waitFor(() => {
        expect(screen.getByText('paymentDetails.errorMessage')).toBeOnTheScreen();
      });
    });

    it('shows invalidData error for generic LN address failure', async () => {
      mockSearchParams = { lightningAddress: 'bob@pay.usegrimm.app', amountSats: '5000' };
      mockParseInput.mockResolvedValueOnce({
        tag: 'LightningAddress',
        inner: [{ address: 'bob@pay.usegrimm.app', payRequest: {} }],
      });
      mockPrepareLnurlPay.mockRejectedValueOnce(new Error('generic failure'));

      setup(<PaymentDetailsScreen />);

      await waitFor(() => {
        expect(mockShowErrorMessage).toHaveBeenCalledWith('paymentDetails.errors.invalidData');
      });
    });

    it('executes LNURL payment on confirm', async () => {
      mockSearchParams = { lightningAddress: 'bob@pay.usegrimm.app', amountSats: '5000' };
      const mockLnurlPrepareResponse = {
        amountSats: 5000n,
        feeSats: 10n,
      };
      mockParseInput.mockResolvedValueOnce({
        tag: 'LightningAddress',
        inner: [{ address: 'bob@pay.usegrimm.app', payRequest: { callback: 'https://getalby.com' } }],
      });
      mockPrepareLnurlPay.mockResolvedValueOnce(mockLnurlPrepareResponse);
      mockExecuteLnurlPay.mockResolvedValueOnce({ amount: 5000n });

      const { user } = setup(<PaymentDetailsScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('slide-to-confirm')).toBeOnTheScreen();
      });

      await user.press(screen.getByTestId('slide-to-confirm'));

      await waitFor(() => {
        expect(mockExecuteLnurlPay).toHaveBeenCalledWith(mockLnurlPrepareResponse);
      });

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/transaction-result/success-screen',
        params: { transactionType: 'sent', satsAmount: '5000' },
      });
    });

    it('does not show expiry timer for LN address', async () => {
      mockSearchParams = { lightningAddress: 'bob@pay.usegrimm.app', amountSats: '5000' };
      mockParseInput.mockResolvedValueOnce({
        tag: 'LightningAddress',
        inner: [{ address: 'bob@pay.usegrimm.app', payRequest: {} }],
      });
      mockPrepareLnurlPay.mockResolvedValueOnce({
        amountSats: 5000n,
        feeSats: 0n,
      });

      setup(<PaymentDetailsScreen />);

      await waitFor(() => {
        expect(screen.getByText('bob@pay.usegrimm.app')).toBeOnTheScreen();
      });

      expect(screen.queryByText('paymentDetails.expiresIn')).not.toBeOnTheScreen();
    });
  });

  describe('Insufficient balance', () => {
    it('shows insufficient balance for bolt11 when total exceeds balance', async () => {
      mockSearchParams = { rawInvoice: 'lnbc1...' };
      mockParseInput.mockResolvedValueOnce({
        tag: 'Bolt11Invoice',
        inner: [
          {
            amountMsat: BigInt(200000 * 1000),
            invoice: { bolt11: 'lnbc1...' },
            payeePubkey: '03abc123',
            expiry: 3600n,
            timestamp: BigInt(Math.floor(Date.now() / 1000)),
          },
        ],
      });
      mockPrepareSend.mockResolvedValueOnce({
        paymentMethod: {
          inner: { sparkTransferFeeSats: 0n, lightningFeeSats: 0n },
        },
      });

      setup(<PaymentDetailsScreen />);

      await waitFor(() => {
        expect(screen.getByText('paymentDetails.errors.notEnoughFunds')).toBeOnTheScreen();
      });
    });
  });

  describe('Invalid payment guard', () => {
    it('shows error when trying to send without decoded data (bolt11 path)', async () => {
      mockSearchParams = { rawInvoice: 'lnbc1...' };
      mockParseInput.mockResolvedValueOnce({
        tag: 'Bolt11Invoice',
        inner: [
          {
            amountMsat: 1000000n,
            invoice: { bolt11: 'lnbc1...' },
            payeePubkey: '03abc',
            expiry: 3600n,
            timestamp: BigInt(Math.floor(Date.now() / 1000)),
          },
        ],
      });
      // prepareSend fails so no savedPrepareResponse
      mockPrepareSend.mockRejectedValueOnce(new Error('some error'));

      setup(<PaymentDetailsScreen />);

      await waitFor(() => {
        expect(mockShowErrorMessage).toHaveBeenCalledWith('paymentDetails.errors.invalidData');
      });
    });
  });

  describe('Error screen', () => {
    it('renders go back button on error screen', async () => {
      mockSearchParams = { rawInvoice: 'lnbc1...' };
      mockParseInput.mockResolvedValueOnce({
        tag: 'Bolt11Invoice',
        inner: [{ amountMsat: undefined }],
      });

      const { user } = setup(<PaymentDetailsScreen />);

      await waitFor(() => {
        expect(screen.getByText('paymentDetails.goBack')).toBeOnTheScreen();
      });

      await user.press(screen.getByText('paymentDetails.goBack'));

      expect(mockBack).toHaveBeenCalled();
    });
  });
});
