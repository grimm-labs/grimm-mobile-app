import React from 'react';

import { cleanup, render, screen } from '@/lib/test-utils';

import TransactionResultScreen from '../transaction-result';

const mockT = (key: string) => key;

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
  return { Ionicons: (props: Record<string, unknown>) => <View {...props} /> };
});

jest.mock('lottie-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return React.forwardRef(() => <View />);
});

jest.mock('@/components/ui', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    colors: { primary: { 600: '#000' } },
    Image: () => <View />,
    SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: jest.fn() },
  useTranslation: () => ({ t: mockT }),
}));

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => ({ dismissAll: jest.fn(), replace: jest.fn() }),
    useLocalSearchParams: () => ({ satsAmount: '25000', txId: 'txid-123' }),
    Stack: {
      Screen: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    },
  };
});

jest.mock('@/lib/context', () => {
  const React = require('react');
  return {
    AppContext: React.createContext({ bitcoinUnit: 'SATS', selectedCountry: { currency: 'USD' } }),
    useBreez: () => ({ network: 'mainnet' }),
  };
});

jest.mock('@/lib/context/bitcoin-prices-context', () => ({
  useBitcoin: () => ({ bitcoinPrices: { BTC: { USD: 50000 } } }),
}));

jest.mock('@/lib/stack-screen-options', () => ({
  useStackScreenOptions: () => ({}),
}));

jest.mock('@/lib', () => ({
  convertBitcoinToFiat: () => 12.5,
  convertSatsToBtc: (sats: number) => (sats / 100_000_000).toFixed(8),
  generateTxUrl: () => 'https://mempool.space/tx/txid-123',
  getFiatCurrency: () => 'USD',
}));

afterEach(() => {
  cleanup();
});

describe('TransactionResultScreen (send-onchain/transaction-result)', () => {
  it('displays the Amount it receives under the unchanged title', () => {
    render(<TransactionResultScreen />);

    expect(screen.getByText('onchainSend.transactionResult.sent')).toBeOnTheScreen();
    expect(screen.getByText('25000 SATS')).toBeOnTheScreen();
  });
});
