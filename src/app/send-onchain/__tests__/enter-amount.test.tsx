import React from 'react';

import { cleanup, fireEvent, render, screen } from '@/lib/test-utils';

import OnchainSendAmountScreen from '../enter-amount';

const mockPush = jest.fn();
const mockT = (key: string) => key;
const mockGetIndexerFeeRates = jest.fn();
const BALANCE = 30000;

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
  return { MaterialCommunityIcons: (props: Record<string, unknown>) => <View {...props} /> };
});

jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props: Record<string, unknown>) => <View {...props} />;
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
    useLocalSearchParams: () => ({ recipientAddress: 'bc1qrecipient' }),
    Stack: {
      Screen: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    },
  };
});

const mockGetFees = (_variables: unknown, { onSuccess }: { onSuccess: (fees: Record<string, number>) => void }) => onSuccess({ fastestFee: 20, halfHourFee: 12, hourFee: 5 });
jest.mock('@/api/mempool', () => ({
  useBitcoinRecommendedFees: () => ({ mutate: mockGetFees, isPending: false }),
}));

jest.mock('@/lib/context', () => {
  const React = require('react');
  return {
    AppContext: React.createContext({ bitcoinUnit: 'SATS', selectedCountry: { currency: 'USD' } }),
    useBdk: () => ({ balance: 30000, getIndexerFeeRates: mockGetIndexerFeeRates }),
  };
});

jest.mock('@/lib/context/bitcoin-prices-context', () => ({
  useBitcoin: () => ({ bitcoinPrices: { BTC: { USD: 50000 } } }),
}));

jest.mock('@/lib', () => ({
  convertBitcoinToFiat: () => 1,
  convertBtcToSats: (btc: number) => Math.round(btc * 1e8),
  getFiatCurrency: () => 'USD',
}));

function typeAmount(amount: string) {
  for (const digit of amount) {
    fireEvent.press(screen.getByTestId(`numeric-pad-key-${digit}`));
  }
}

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe('OnchainSendAmountScreen (send-onchain/enter-amount)', () => {
  it('keeps Continue enabled for an Amount below the balance, even when Amount + Network Fee exceeds it', () => {
    render(<OnchainSendAmountScreen />);

    // 29 990 sats + a 12 sat/vB fee is more than the 30 000 sats balance: BDK decides on the summary
    typeAmount(String(BALANCE - 10));

    expect(screen.getByTestId('send-onchain-amount-continue')).toBeEnabled();
    expect(screen.queryByTestId('send-onchain-amount-invalid')).not.toBeOnTheScreen();

    fireEvent.press(screen.getByTestId('send-onchain-amount-continue'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/send-onchain/summary',
      params: { recipientAddress: 'bc1qrecipient', satsAmount: '29990', feeSpeed: 'medium', feeSatsPerVbyte: '12' },
    });
  });

  it('disables Continue when the Amount is greater than or equal to the balance', () => {
    render(<OnchainSendAmountScreen />);

    typeAmount(String(BALANCE));

    expect(screen.getByTestId('send-onchain-amount-continue')).toBeDisabled();
    expect(screen.getByTestId('send-onchain-amount-invalid')).toBeOnTheScreen();
  });
});
