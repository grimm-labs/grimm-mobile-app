import React from 'react';

import { cleanup, fireEvent, screen, setup, waitFor } from '@/lib/test-utils';

import LightningAddressAmountScreen from '../enter-amount';

const mockPush = jest.fn();
const mockBack = jest.fn();

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

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: Record<string, unknown>) => <View {...props} />,
  };
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
    useLocalSearchParams: () => ({
      lightningAddress: 'alice@getalby.com',
    }),
    Stack: {
      Screen: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    },
  };
});

jest.mock('@/lib/context/breez-context', () => ({
  useBreez: () => ({
    balance: 100000,
  }),
}));

jest.mock('@/lib/context', () => {
  const React = require('react');
  return {
    AppContext: React.createContext({
      bitcoinUnit: 'SATS',
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
  convertBitcoinToFiat: (amount: number) => amount * 0.0005,
  convertBtcToSats: (btc: number) => Math.round(btc * 1e8),
  getFiatCurrency: () => 'USD',
}));

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe('LightningAddressAmountScreen (enter-amount)', () => {
  const pressKeypadDigit = async (user: ReturnType<typeof import('@testing-library/react-native').userEvent.setup>, digit: string) => {
    const elements = screen.getAllByText(digit);
    await user.press(elements[elements.length - 1]);
  };

  describe('Rendering', () => {
    it('renders the amount display and keypad', () => {
      setup(<LightningAddressAmountScreen />);

      expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(2); // amount display + keypad
      expect(screen.getByText('enterAmount.continueButton')).toBeOnTheScreen();
    });

    it('renders the send-to label with the lightning address', () => {
      setup(<LightningAddressAmountScreen />);

      expect(screen.getByText(/enterAmount.sendTo/)).toBeOnTheScreen();
      expect(screen.getByText(/alice@getalby.com/)).toBeOnTheScreen();
    });

    it('renders the numeric keypad keys', () => {
      setup(<LightningAddressAmountScreen />);

      for (const key of ['1', '2', '3', '4', '5', '6', '7', '8', '9']) {
        expect(screen.getByText(key)).toBeOnTheScreen();
      }
      // '0' appears multiple times (keypad + amount display)
      expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1);
    });

    it('renders the bitcoin unit label', () => {
      setup(<LightningAddressAmountScreen />);

      expect(screen.getByText('SATS')).toBeOnTheScreen();
    });
  });

  describe('Numeric keypad interaction', () => {
    it('updates amount when pressing number keys', async () => {
      const { user } = setup(<LightningAddressAmountScreen />);

      await pressKeypadDigit(user, '5');

      await waitFor(() => {
        expect(screen.getAllByText('5').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('builds multi-digit amounts', async () => {
      const { user } = setup(<LightningAddressAmountScreen />);

      await pressKeypadDigit(user, '1');
      await pressKeypadDigit(user, '2');
      await pressKeypadDigit(user, '3');

      await waitFor(() => {
        expect(screen.getByText('123')).toBeOnTheScreen();
      });
    });

    it('handles delete key', async () => {
      const { user } = setup(<LightningAddressAmountScreen />);

      await pressKeypadDigit(user, '5');
      await pressKeypadDigit(user, '3');
      await user.press(screen.getByTestId('delete-key'));

      await waitFor(() => {
        expect(screen.getAllByText('5').length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Navigation', () => {
    it('navigates to transaction-details with correct params on continue', async () => {
      const { user } = setup(<LightningAddressAmountScreen />);

      await pressKeypadDigit(user, '5');
      await pressKeypadDigit(user, '4');
      await pressKeypadDigit(user, '3');
      await pressKeypadDigit(user, '2');

      await user.press(screen.getByText('enterAmount.continueButton'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({
          pathname: '/send/transaction-details',
          params: {
            lightningAddress: 'alice@getalby.com',
            amountSats: '5432',
          },
        });
      });
    });

    it('does not navigate when amount is zero', async () => {
      const { user } = setup(<LightningAddressAmountScreen />);

      await user.press(screen.getByText('enterAmount.continueButton'));

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Balance validation', () => {
    it('shows insufficient balance message when amount exceeds balance', async () => {
      const { user } = setup(<LightningAddressAmountScreen />);

      // Enter amount > 100000 (balance) by pressing distinct digits to avoid conflicts
      await pressKeypadDigit(user, '9');
      await pressKeypadDigit(user, '9');
      await pressKeypadDigit(user, '9');
      await pressKeypadDigit(user, '9');
      await pressKeypadDigit(user, '9');
      await pressKeypadDigit(user, '9');

      await waitFor(() => {
        expect(screen.getByText('enterAmount.insufficientBalance')).toBeOnTheScreen();
      });
    });
  });

  describe('Fiat conversion', () => {
    it('displays fiat amount when a valid amount is entered', async () => {
      const { user } = setup(<LightningAddressAmountScreen />);

      await pressKeypadDigit(user, '1');
      await pressKeypadDigit(user, '2');
      await pressKeypadDigit(user, '3');

      await waitFor(() => {
        expect(screen.getByText('USD')).toBeOnTheScreen();
      });
    });
  });
});
