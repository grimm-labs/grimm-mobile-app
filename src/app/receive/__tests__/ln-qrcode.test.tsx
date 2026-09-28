import { act } from '@testing-library/react-native';
import React from 'react';

import { cleanup, fireEvent, screen, setup, waitFor } from '@/lib/test-utils';

// Native module mocks (must be before component import)
jest.mock('@breeztech/breez-sdk-spark-react-native', () => ({
  PaymentStatus: { Completed: 'completed' },
  PaymentType: { Receive: 'receive' },
}));

jest.mock('bdk-rn', () => require('@/lib/bdk/__tests__/helpers/mock-bdk-rn'));

jest.mock('@/api', () => ({
  supportedBitcoinCurrencies: [],
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

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: (props: Record<string, unknown>) => <Text>{String(props.name)}</Text>,
  };
});

jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return (props: Record<string, unknown>) => <Text>{String(props.name)}</Text>;
});

jest.mock('@/components/ui/focus-aware-status-bar', () => ({
  FocusAwareStatusBar: () => null,
}));

jest.mock('@/components/back-button', () => ({
  HeaderLeft: () => null,
}));

// `t` must keep a stable identity: the screen lists it in a useCallback dependency array.
const mockT = (key: string) => key;

jest.mock('react-i18next', () => ({
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
  useTranslation: () => ({ t: mockT }),
}));

let mockParams: Record<string, string> = { satsAmount: '1000', type: 'lightning' };
const mockDismissAll = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useLocalSearchParams: () => mockParams,
    useRouter: () => ({ dismissAll: mockDismissAll, replace: mockReplace }),
    Stack: {
      Screen: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    },
  };
});

jest.mock('react-native-flash-message', () => ({
  showMessage: jest.fn(),
}));

jest.mock('react-native-qrcode-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props: Record<string, unknown>) => <View testID="qr-code">{String(props.value)}</View>;
});

const mockReceiveBolt11 = jest.fn();
const mockReceiveBitcoinAddress = jest.fn();

jest.mock('@/lib/context/breez-context', () => ({
  useBreez: () => ({
    receiveBolt11: mockReceiveBolt11,
    receiveBitcoinAddress: mockReceiveBitcoinAddress,
  }),
}));

jest.mock('@/lib/context/bitcoin-prices-context', () => ({
  useBitcoin: () => ({
    bitcoinPrices: { XAF: { last: 36000000, buy: 36000000, sell: 36000000, symbol: 'FCFA' } },
  }),
}));

jest.mock('@/lib/context', () => ({
  AppContext: require('react').createContext({
    selectedCountry: { currency: 'XAF', name: 'Cameroon', isoCode: 'CM' },
    lnInvoiceExpirySecs: 3600,
  }),
}));

jest.mock('@/lib', () => {
  const countdown = jest.requireActual('@/lib/hooks/use-countdown');
  return {
    convertBitcoinToFiat: jest.fn(() => 0),
    getFiatCurrency: jest.fn(() => 'XAF'),
    splitStringIntoChunks: jest.fn((value: string, size: number) => (value ? (value.match(new RegExp(`.{1,${size}}`, 'g')) ?? []) : [])),
    formatRemainingTime: countdown.formatRemainingTime,
    useCountdown: countdown.useCountdown,
  };
});

import { AppContext } from '@/lib/context';

import ReceivePaymentScreen from '../ln-qrcode';

const renderWithContext = (lnInvoiceExpirySecs: number) =>
  setup(
    <AppContext.Provider value={{ selectedCountry: { currency: 'XAF', name: 'Cameroon', isoCode: 'CM' }, lnInvoiceExpirySecs } as any}>
      <ReceivePaymentScreen />
    </AppContext.Provider>,
  );

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  mockParams = { satsAmount: '1000', type: 'lightning' };
  mockReceiveBolt11.mockResolvedValue({ paymentRequest: 'lnbc10u1ptest', fee: BigInt(0) });
  mockReceiveBitcoinAddress.mockResolvedValue({ paymentRequest: 'bc1qtestaddress', fee: BigInt(0) });
});

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
  jest.useRealTimers();
});

describe('ReceivePaymentScreen (ln-qrcode)', () => {
  it('generates the invoice with the expiry configured in settings', async () => {
    renderWithContext(1800);

    await waitFor(() => expect(screen.getByTestId('qr-code')).toBeOnTheScreen());

    expect(mockReceiveBolt11).toHaveBeenCalledTimes(1);
    expect(mockReceiveBolt11).toHaveBeenCalledWith(expect.any(String), 1000, 1800);
    expect(screen.getByTestId('qr-code')).toHaveTextContent('LNBC10U1PTEST');
  });

  it('falls back to the context default expiry', async () => {
    renderWithContext(3600);

    await waitFor(() => expect(screen.getByTestId('qr-code')).toBeOnTheScreen());

    expect(mockReceiveBolt11).toHaveBeenCalledWith(expect.any(String), 1000, 3600);
  });

  it('shows a countdown matching the configured expiry and ticks down', async () => {
    renderWithContext(1800);

    await waitFor(() => expect(screen.getByTestId('invoice-countdown')).toBeOnTheScreen());
    expect(screen.getByTestId('invoice-countdown')).toHaveTextContent(/paymentDetails\.expiresIn (30:00|29:59)/);

    act(() => {
      jest.advanceTimersByTime(60_000);
    });

    expect(screen.getByTestId('invoice-countdown')).toHaveTextContent(/paymentDetails\.expiresIn 29:0\d/);
  });

  it('marks the invoice as expired, hides the QR code and allows regenerating', async () => {
    renderWithContext(600);

    await waitFor(() => expect(screen.getByTestId('qr-code')).toBeOnTheScreen());

    act(() => {
      jest.advanceTimersByTime(601_000);
    });

    expect(screen.getByTestId('invoice-countdown')).toHaveTextContent('paymentDetails.expired');
    expect(screen.queryByTestId('qr-code')).toBeNull();
    expect(screen.queryByText('receive_payment.scan_text')).toBeNull();
    expect(screen.getByTestId('regenerate-invoice')).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId('regenerate-invoice'));

    await waitFor(() => expect(mockReceiveBolt11).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByTestId('qr-code')).toBeOnTheScreen());
    expect(screen.getByTestId('invoice-countdown')).toHaveTextContent(/paymentDetails\.expiresIn (10:00|9:59)/);
  });

  it('does not show a countdown nor call receiveBolt11 for on-chain receive', async () => {
    mockParams = { satsAmount: '0', type: 'onchain' };
    renderWithContext(3600);

    await waitFor(() => expect(screen.getByTestId('qr-code')).toBeOnTheScreen());

    expect(mockReceiveBitcoinAddress).toHaveBeenCalledTimes(1);
    expect(mockReceiveBolt11).not.toHaveBeenCalled();
    expect(screen.queryByTestId('invoice-countdown')).toBeNull();
  });

  it('shows an error state when the amount is invalid', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockParams = { satsAmount: '0', type: 'lightning' };
    renderWithContext(3600);

    await waitFor(() => expect(screen.getByText('receive_payment.error_title')).toBeOnTheScreen());

    expect(screen.getByText('receive_payment.invalid_amount')).toBeOnTheScreen();
    expect(mockReceiveBolt11).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
