import React from 'react';

import { cleanup, fireEvent, screen, setup, waitFor } from '@/lib/test-utils';
import LightningPaymentScreen from '../enter-address';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockParseInput = jest.fn();
const mockShowErrorMessage = jest.fn();

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
    useLocalSearchParams: () => ({}),
    Stack: {
      Screen: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    },
  };
});

jest.mock('@/lib/context/breez-context', () => ({
  useBreez: () => ({
    parseInput: mockParseInput,
  }),
  InputType_Tags: {
    BitcoinAddress: 'BitcoinAddress',
    Bolt11Invoice: 'Bolt11Invoice',
    LnurlPay: 'LnurlPay',
    LightningAddress: 'LightningAddress',
  },
}));

jest.mock('@/components/ui/utils', () => ({
  showErrorMessage: (...args: unknown[]) => mockShowErrorMessage(...args),
}));

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe('LightningPaymentScreen (enter-address)', () => {
  describe('Rendering', () => {
    it('renders the input field and button', () => {
      setup(<LightningPaymentScreen />);

      expect(screen.getByPlaceholderText('lightningPayment.placeholder')).toBeOnTheScreen();
      expect(screen.getByText('lightningPayment.payButton')).toBeOnTheScreen();
    });
  });

  describe('Empty input', () => {
    it('shows error when input is empty and button is pressed', async () => {
      const { user } = setup(<LightningPaymentScreen />);

      const button = screen.getByText('lightningPayment.payButton');
      await user.press(button);

      expect(mockShowErrorMessage).toHaveBeenCalledWith('lightningPayment.errors.invalidInvoice');
      expect(mockParseInput).not.toHaveBeenCalled();
    });
  });

  describe('Bolt11 Invoice', () => {
    it('navigates to transaction-details for valid Bolt11 invoice', async () => {
      mockParseInput.mockResolvedValueOnce({
        tag: 'Bolt11Invoice',
        inner: [{ amountMsat: 5000000n, invoice: { bolt11: 'lnbc1...' } }],
      });

      const { user } = setup(<LightningPaymentScreen />);
      const input = screen.getByPlaceholderText('lightningPayment.placeholder');

      fireEvent.changeText(input, 'lnbc1...');
      await user.press(screen.getByText('lightningPayment.payButton'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({
          pathname: '/send/transaction-details',
          params: { rawInvoice: 'lnbc1...' },
        });
      });
    });

    it('shows error for zero-amount Bolt11 invoice', async () => {
      mockParseInput.mockResolvedValueOnce({
        tag: 'Bolt11Invoice',
        inner: [{ amountMsat: undefined, invoice: { bolt11: 'lnbc1...' } }],
      });

      const { user } = setup(<LightningPaymentScreen />);
      const input = screen.getByPlaceholderText('lightningPayment.placeholder');

      fireEvent.changeText(input, 'lnbc1...');
      await user.press(screen.getByText('lightningPayment.payButton'));

      await waitFor(() => {
        expect(mockShowErrorMessage).toHaveBeenCalledWith('lightningPayment.errors.zeroAmountNotSupported');
      });
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Lightning Address', () => {
    it('navigates to enter-amount for LightningAddress type', async () => {
      mockParseInput.mockResolvedValueOnce({
        tag: 'LightningAddress',
        inner: [{ address: 'alice@pay.usegrimm.app', payRequest: {} }],
      });

      const { user } = setup(<LightningPaymentScreen />);
      const input = screen.getByPlaceholderText('lightningPayment.placeholder');

      fireEvent.changeText(input, 'alice@pay.usegrimm.app');
      await user.press(screen.getByText('lightningPayment.payButton'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({
          pathname: '/send/enter-amount',
          params: { paymentInput: 'alice@pay.usegrimm.app' },
        });
      });
    });

    it('navigates to enter-amount for LnurlPay type', async () => {
      mockParseInput.mockResolvedValueOnce({
        tag: 'LnurlPay',
        inner: [{ callback: 'https://usegrimm.app' }],
      });

      const { user } = setup(<LightningPaymentScreen />);
      const input = screen.getByPlaceholderText('lightningPayment.placeholder');

      fireEvent.changeText(input, 'lnurl1...');
      await user.press(screen.getByText('lightningPayment.payButton'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({
          pathname: '/send/enter-amount',
          params: { paymentInput: 'lnurl1...' },
        });
      });
    });
  });

  describe('Bitcoin Address', () => {
    it('shows error for bitcoin address', async () => {
      mockParseInput.mockResolvedValueOnce({
        tag: 'BitcoinAddress',
        inner: [{ address: 'bc1q...' }],
      });

      const { user } = setup(<LightningPaymentScreen />);
      const input = screen.getByPlaceholderText('lightningPayment.placeholder');

      fireEvent.changeText(input, 'bc1q...');
      await user.press(screen.getByText('lightningPayment.payButton'));

      await waitFor(() => {
        expect(mockShowErrorMessage).toHaveBeenCalledWith('lightningPayment.errors.bitcoinNotSupported');
      });
    });
  });

  describe('Unsupported input', () => {
    it('shows error for unsupported address type', async () => {
      mockParseInput.mockResolvedValueOnce({
        tag: 'UnknownType',
        inner: [],
      });

      const { user } = setup(<LightningPaymentScreen />);
      const input = screen.getByPlaceholderText('lightningPayment.placeholder');

      fireEvent.changeText(input, 'something-unknown');
      await user.press(screen.getByText('lightningPayment.payButton'));

      await waitFor(() => {
        expect(mockShowErrorMessage).toHaveBeenCalledWith('lightningPayment.errors.unsupportedAddress');
      });
    });
  });

  describe('Error handling', () => {
    it('shows error when parseInput throws', async () => {
      mockParseInput.mockRejectedValueOnce(new Error('Network error'));

      const { user } = setup(<LightningPaymentScreen />);
      const input = screen.getByPlaceholderText('lightningPayment.placeholder');

      fireEvent.changeText(input, 'some-invalid-input');
      await user.press(screen.getByText('lightningPayment.payButton'));

      await waitFor(() => {
        expect(mockShowErrorMessage).toHaveBeenCalledWith('lightningPayment.errors.preparePaymentFailed');
      });
    });
  });

  describe('Input change', () => {
    it('updates input value when typing', () => {
      setup(<LightningPaymentScreen />);
      const input = screen.getByPlaceholderText('lightningPayment.placeholder');

      fireEvent.changeText(input, 'new-input-value');

      expect(input.props.value).toBe('new-input-value');
    });
  });
});
