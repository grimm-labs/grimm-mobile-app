import React from 'react';

import { act, cleanup, fireEvent, render, screen, waitFor } from '@/lib/test-utils';

import OnchainSendAmountScreen from '../enter-amount';

const mockPush = jest.fn();
const mockT = (key: string) => key;
const mockGetIndexerFeeRates = jest.fn();
const BALANCE = 30000;
let mockSearchParams: Record<string, string> = { recipientAddress: 'bc1qrecipient' };

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
    useLocalSearchParams: () => mockSearchParams,
    Stack: {
      Screen: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    },
  };
});

let mockMempoolAnswer: 'fees' | 'invalid' | 'unreachable' = 'fees';
const mockGetFees = (_variables: unknown, { onSuccess, onError }: { onSuccess: (fees: Record<string, number>) => void; onError: (error: Error) => void }) => {
  if (mockMempoolAnswer === 'unreachable') onError(new Error('Network Error'));
  else onSuccess(mockMempoolAnswer === 'invalid' ? { fastestFee: 0, halfHourFee: 0, hourFee: 0 } : { fastestFee: 20, halfHourFee: 12, hourFee: 5 });
};
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
  ...jest.requireActual('@/lib/bitcoin-amount'),
  convertBitcoinToFiat: () => 1,
  getFiatCurrency: () => 'USD',
}));

function typeAmount(amount: string) {
  for (const digit of amount) {
    fireEvent.press(screen.getByTestId(`numeric-pad-key-${digit}`));
  }
}

function renderWithAmount(amountSats: string, bitcoinUnit: 'SATS' | 'BTC') {
  mockSearchParams = { recipientAddress: 'bc1qrecipient', amountSats };
  const { AppContext } = require('@/lib/context');
  return render(
    <AppContext.Provider value={{ bitcoinUnit, selectedCountry: { currency: 'USD' } }}>
      <OnchainSendAmountScreen />
    </AppContext.Provider>,
  );
}

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
  mockSearchParams = { recipientAddress: 'bc1qrecipient' };
  mockMempoolAnswer = 'fees';
  jest.restoreAllMocks();
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

  describe('Amount from a Bitcoin URI (P2-10)', () => {
    it('amountSats=10000 shows 10000 in SATS', () => {
      renderWithAmount('10000', 'SATS');

      expect(screen.getByTestId('send-onchain-amount-value')).toHaveTextContent('10000');
      expect(screen.getByTestId('send-onchain-amount-continue')).toBeEnabled();
    });

    it('amountSats=10000 shows 0.0001 in BTC', () => {
      renderWithAmount('10000', 'BTC');

      expect(screen.getByTestId('send-onchain-amount-value')).toHaveTextContent('0.0001');
    });

    it('the pre-filled Amount can be changed, and Continue sends the changed Amount with the chosen Network Fee', () => {
      renderWithAmount('10000', 'SATS');

      fireEvent.press(screen.getByTestId('delete-key'));
      fireEvent.press(screen.getByTestId('numeric-pad-key-5'));
      fireEvent.press(screen.getByTestId('send-onchain-fee-fast'));
      fireEvent.press(screen.getByTestId('send-onchain-amount-continue'));

      expect(screen.getByTestId('send-onchain-amount-value')).toHaveTextContent('10005');
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/send-onchain/summary',
        params: { recipientAddress: 'bc1qrecipient', satsAmount: '10005', feeSpeed: 'fast', feeSatsPerVbyte: '20' },
      });
    });

    it('an invalid amountSats is ignored', () => {
      renderWithAmount('abc', 'SATS');

      expect(screen.getByTestId('send-onchain-amount-value')).toHaveTextContent('0');
    });
  });

  describe('Network Fee options', () => {
    it.each(['unreachable', 'invalid'] as const)('falls back to the indexer fees when the mempool API is %s', async (answer) => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockMempoolAnswer = answer;
      mockGetIndexerFeeRates.mockResolvedValue({ fastestFee: 9, halfHourFee: 6, hourFee: 3 });
      render(<OnchainSendAmountScreen />);

      expect(await screen.findByText('6 sat/vB')).toBeOnTheScreen();
      expect(mockGetIndexerFeeRates).toHaveBeenCalledTimes(1);
    });

    it('shows the fees error when the indexer fails too, and Retry asks the mempool API again', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockMempoolAnswer = 'unreachable';
      mockGetIndexerFeeRates.mockRejectedValue(new Error('indexer down'));
      render(<OnchainSendAmountScreen />);

      expect(await screen.findByTestId('send-onchain-fees-error')).toBeOnTheScreen();
      expect(screen.getByTestId('send-onchain-amount-continue')).toBeDisabled();

      mockMempoolAnswer = 'fees';
      await act(async () => fireEvent.press(screen.getByTestId('send-onchain-fees-retry')));

      await waitFor(() => expect(screen.getByText('12 sat/vB')).toBeOnTheScreen());
      expect(screen.queryByTestId('send-onchain-fees-error')).not.toBeOnTheScreen();
    });
  });
});
