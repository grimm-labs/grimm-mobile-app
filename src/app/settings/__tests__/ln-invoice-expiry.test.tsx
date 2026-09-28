import React from 'react';

import { cleanup, screen, setup } from '@/lib/test-utils';

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

jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return (props: Record<string, unknown>) => <Text>{String(props.name)}</Text>;
});

jest.mock('@/components/ui/focus-aware-status-bar', () => ({
  FocusAwareStatusBar: () => null,
}));

jest.mock('react-i18next', () => ({
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    Stack: {
      Screen: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    },
  };
});

jest.mock('@/components/back-button', () => ({
  HeaderLeft: () => null,
}));

jest.mock('@/lib/context', () => ({
  AppContext: require('react').createContext({
    lnInvoiceExpirySecs: 3600,
    setLnInvoiceExpirySecs: jest.fn(),
  }),
}));

import { AppContext } from '@/lib/context';

import LnInvoiceExpiryScreen from '../ln-invoice-expiry';

const mockSetLnInvoiceExpirySecs = jest.fn();

const renderWithContext = (lnInvoiceExpirySecs: number) =>
  setup(
    <AppContext.Provider value={{ lnInvoiceExpirySecs, setLnInvoiceExpirySecs: mockSetLnInvoiceExpirySecs } as any}>
      <LnInvoiceExpiryScreen />
    </AppContext.Provider>,
  );

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe('LnInvoiceExpiryScreen', () => {
  it('renders all expiry presets', () => {
    renderWithContext(3600);

    expect(screen.getByText('lnInvoiceExpiry.options.tenMinutes')).toBeOnTheScreen();
    expect(screen.getByText('lnInvoiceExpiry.options.thirtyMinutes')).toBeOnTheScreen();
    expect(screen.getByText('lnInvoiceExpiry.options.oneHour')).toBeOnTheScreen();
    expect(screen.getByText('lnInvoiceExpiry.options.sixHours')).toBeOnTheScreen();
    expect(screen.getByText('lnInvoiceExpiry.options.oneDay')).toBeOnTheScreen();
    expect(screen.getByText('lnInvoiceExpiry.options.sevenDays')).toBeOnTheScreen();
    expect(screen.getByText('lnInvoiceExpiry.info_text')).toBeOnTheScreen();
  });

  it('marks only the stored value as selected and flags the default preset', () => {
    renderWithContext(3600);

    expect(screen.getAllByText('checkmark-circle')).toHaveLength(1);
    expect(screen.getByText('lnInvoiceExpiry.default_hint')).toBeOnTheScreen();
    expect(screen.getByTestId('ln-invoice-expiry-option-3600')).toHaveTextContent(/checkmark-circle/);
  });

  it('moves the checkmark to the stored non-default value', () => {
    renderWithContext(600);

    expect(screen.getAllByText('checkmark-circle')).toHaveLength(1);
    expect(screen.getByTestId('ln-invoice-expiry-option-600')).toHaveTextContent(/checkmark-circle/);
    expect(screen.getByTestId('ln-invoice-expiry-option-3600')).not.toHaveTextContent(/checkmark-circle/);
  });

  it('shows no checkmark when the stored value matches no preset', () => {
    renderWithContext(1234);

    expect(screen.queryByText('checkmark-circle')).toBeNull();
  });

  it('persists the selected preset in seconds when pressed', async () => {
    const { user } = renderWithContext(3600);

    await user.press(screen.getByText('lnInvoiceExpiry.options.sevenDays'));
    expect(mockSetLnInvoiceExpirySecs).toHaveBeenCalledWith(604800);

    await user.press(screen.getByText('lnInvoiceExpiry.options.tenMinutes'));
    expect(mockSetLnInvoiceExpirySecs).toHaveBeenCalledWith(600);
  });
});
