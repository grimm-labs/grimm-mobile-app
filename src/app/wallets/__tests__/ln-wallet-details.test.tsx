import React from 'react';
import { View } from 'react-native';

import { cleanup, fireEvent, screen, setup, waitFor } from '@/lib/test-utils';

// Native module mocks (must be before component import)
jest.mock('@breeztech/breez-sdk-spark-react-native', () => ({
  PaymentStatus: { Completed: 'completed' },
  PaymentType: { Receive: 'receive' },
}));

jest.mock('bdk-rn', () => ({
  Mnemonic: jest.fn(),
}));

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

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => ({ push: mockPush, back: mockBack }),
    Stack: {
      Screen: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    },
  };
});

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock('react-native-qrcode-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props: Record<string, unknown>) => <View testID="qr-code">{String(props.value)}</View>;
});

// Breez context mock
let mockBalance = 50000;
let mockPayments: any[] = [];
let mockNetwork = 'mainnet';
let mockLightningAddress: string | null = null;
const mockGetLightningAddressInfo = jest.fn();

jest.mock('@/lib/context/breez-context', () => ({
  useBreez: () => ({
    balance: mockBalance,
    payments: mockPayments,
    network: mockNetwork,
    lightningAddress: mockLightningAddress,
    getLightningAddressInfo: mockGetLightningAddressInfo,
  }),
  AppNetwork: {
    MAINNET: 'mainnet',
    TESTNET: 'testnet',
  },
}));

// Bitcoin prices context mock
const mockBitcoinPrices = {
  USD: { last: 60000, buy: 60000, sell: 60000, symbol: '$' },
  XAF: { last: 36000000, buy: 36000000, sell: 36000000, symbol: 'FCFA' },
};

jest.mock('@/lib/context/bitcoin-prices-context', () => ({
  useBitcoin: () => ({
    bitcoinPrices: mockBitcoinPrices,
  }),
}));

// AppContext mock
const mockSetHideBalance = jest.fn();
let mockHideBalance = false;

jest.mock('@/lib/context', () => ({
  AppContext: require('react').createContext({
    selectedCountry: { currency: 'XAF', name: 'Cameroon', isoCode: 'CM' },
    bitcoinUnit: 'SATS',
    hideBalance: false,
    setHideBalance: jest.fn(),
  }),
}));

// We need to override AppContext provider in tests, so let's re-mock with mutable values
// Actually, let's wrap the component with a provider
const AppContextModule = require('@/lib/context');
const originalContext = AppContextModule.AppContext;

jest.mock('@/lib', () => ({
  convertBitcoinToFiat: jest.fn((amount: number, _unit: string, currency: string) => {
    if (currency === 'XAF') return amount * 0.72;
    return amount * 0.0001;
  }),
  convertSatsToBtc: jest.fn((sats: number) => (sats / 100000000).toFixed(8)),
  getFiatCurrency: jest.fn(() => 'XAF'),
  mergeAndSortTransactions: jest.fn((payments: any[], _onchain: any[]) =>
    payments.map((p: any, i: number) => ({
      id: p.id || `tx-${i}`,
      timestamp: p.timestamp || Date.now(),
      amountSat: p.amountSat || 1000,
      feesSat: p.feesSat || 10,
      type: 'receive',
      status: 'confirmed',
      source: 'lightning',
    })),
  ),
}));

jest.mock('@/components/empty-transaction', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    EmptyTransactions: ({ type }: { type: string }) => <Text testID="empty-transactions">{`empty-${type}`}</Text>,
  };
});

jest.mock('@/components/transaction', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    TransactionItem: ({ transaction }: { transaction: any }) => <Text testID={`transaction-${transaction.id}`}>{transaction.id}</Text>,
  };
});

jest.mock('@/components/back-button', () => ({
  HeaderLeft: () => null,
}));

import LnWalletDetails from '../ln-wallet-details';

// Wrapper to provide AppContext
const renderWithContext = (overrides: Record<string, any> = {}) => {
  const contextValue = {
    selectedCountry: { currency: 'XAF', name: 'Cameroon', isoCode: 'CM' },
    bitcoinUnit: 'SATS',
    hideBalance: mockHideBalance,
    setHideBalance: mockSetHideBalance,
    ...overrides,
  };

  return setup(
    <originalContext.Provider value={contextValue}>
      <LnWalletDetails />
    </originalContext.Provider>,
  );
};

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
  mockBalance = 50000;
  mockPayments = [];
  mockNetwork = 'mainnet';
  mockLightningAddress = null;
  mockHideBalance = false;
});

describe('LnWalletDetails', () => {
  describe('Rendering', () => {
    it('renders the wallet details screen', () => {
      renderWithContext();

      expect(screen.getByText('lnWallet.available')).toBeOnTheScreen();
      expect(screen.getByText('lnWallet.currentPrice')).toBeOnTheScreen();
      expect(screen.getByText('lnWallet.actions')).toBeOnTheScreen();
      expect(screen.getByText('lnWallet.transactions')).toBeOnTheScreen();
    });

    it('renders balance in fiat and bitcoin unit', () => {
      renderWithContext();

      // convertBitcoinToFiat is mocked to return amount * 0.72 for XAF
      expect(screen.getAllByText(/XAF/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/SATS/).length).toBeGreaterThanOrEqual(1);
    });

    it('renders current bitcoin price', () => {
      renderWithContext();

      expect(screen.getByText('lnWallet.currentPrice')).toBeOnTheScreen();
    });

    it('renders empty transactions when no payments exist', () => {
      mockPayments = [];
      renderWithContext();

      expect(screen.getByTestId('empty-transactions')).toBeOnTheScreen();
      expect(screen.getByText('empty-ln')).toBeOnTheScreen();
    });

    it('renders transaction items when payments exist', () => {
      mockPayments = [
        { id: 'tx-1', timestamp: 1000, amountSat: 500, feesSat: 5 },
        { id: 'tx-2', timestamp: 2000, amountSat: 1000, feesSat: 10 },
      ];
      renderWithContext();

      expect(screen.getByTestId('transaction-tx-1')).toBeOnTheScreen();
      expect(screen.getByTestId('transaction-tx-2')).toBeOnTheScreen();
    });

    it('renders at most 4 transactions', () => {
      mockPayments = [
        { id: 'tx-1', timestamp: 1000 },
        { id: 'tx-2', timestamp: 2000 },
        { id: 'tx-3', timestamp: 3000 },
        { id: 'tx-4', timestamp: 4000 },
        { id: 'tx-5', timestamp: 5000 },
      ];
      renderWithContext();

      expect(screen.getByTestId('transaction-tx-1')).toBeOnTheScreen();
      expect(screen.getByTestId('transaction-tx-4')).toBeOnTheScreen();
      expect(screen.queryByTestId('transaction-tx-5')).not.toBeOnTheScreen();
    });

    it('shows "see all" link when more than 4 transactions', () => {
      mockPayments = [{ id: 'tx-1' }, { id: 'tx-2' }, { id: 'tx-3' }, { id: 'tx-4' }, { id: 'tx-5' }];
      renderWithContext();

      expect(screen.getByText('lnWallet.seeAll')).toBeOnTheScreen();
    });

    it('does not show "see all" link when 4 or fewer transactions', () => {
      mockPayments = [{ id: 'tx-1' }, { id: 'tx-2' }];
      renderWithContext();

      expect(screen.queryByText('lnWallet.seeAll')).not.toBeOnTheScreen();
    });

    it('renders receive onchain menu item', () => {
      renderWithContext();

      expect(screen.getByText('lnWallet.receiveOnchain')).toBeOnTheScreen();
    });
  });

  describe('Testnet banner', () => {
    it('shows testnet warning when on testnet', () => {
      mockNetwork = 'testnet';
      renderWithContext();

      expect(screen.getByText('home.networkWarning')).toBeOnTheScreen();
    });

    it('does not show testnet warning on mainnet', () => {
      mockNetwork = 'mainnet';
      renderWithContext();

      expect(screen.queryByText('home.networkWarning')).not.toBeOnTheScreen();
    });
  });

  describe('Hide balance', () => {
    it('shows masked balance when hideBalance is true', () => {
      mockHideBalance = true;
      renderWithContext();

      const stars = screen.getAllByText('********');
      expect(stars.length).toBe(2);
    });

    it('toggles hideBalance when balance is pressed', async () => {
      mockHideBalance = false;
      const { user } = renderWithContext();

      // The balance area is a TouchableOpacity, press the fiat amount
      const balanceTexts = screen.getAllByText(/XAF/);
      await user.press(balanceTexts[0]);

      expect(mockSetHideBalance).toHaveBeenCalledWith(true);
    });
  });

  describe('Lightning Address', () => {
    it('renders create LN address prompt when no address exists', () => {
      mockLightningAddress = null;
      renderWithContext();

      expect(screen.getByText('lnWallet.lnAddressTitle')).toBeOnTheScreen();
      expect(screen.getByText('lnWallet.lnAddressCreatePrompt')).toBeOnTheScreen();
    });

    it('navigates to LN address settings when create prompt is pressed', async () => {
      mockLightningAddress = null;
      const { user } = renderWithContext();

      await user.press(screen.getByText('lnWallet.lnAddressTitle'));

      expect(mockPush).toHaveBeenCalledWith('/settings/ln-address');
    });

    it('renders lightning address when it exists', () => {
      mockLightningAddress = 'satoshi@pay.usegrimm.app';
      renderWithContext();

      expect(screen.getByText('satoshi@pay.usegrimm.app')).toBeOnTheScreen();
    });

    it('opens QR modal when lightning address is pressed', async () => {
      mockLightningAddress = 'satoshi@pay.usegrimm.app';
      mockGetLightningAddressInfo.mockResolvedValue({
        lightningAddress: 'satoshi@pay.usegrimm.app',
      });
      const { user } = renderWithContext();

      await user.press(screen.getByText('satoshi@pay.usegrimm.app'));

      await waitFor(() => {
        expect(screen.getByText('lnWallet.lnAddressQr.lnAddressQrTitle')).toBeOnTheScreen();
      });
    });
  });

  describe('LN Address QR Modal', () => {
    const openModal = async () => {
      mockLightningAddress = 'satoshi@pay.usegrimm.app';
      mockGetLightningAddressInfo.mockResolvedValue({
        lightningAddress: 'satoshi@pay.usegrimm.app',
      });
      const result = renderWithContext();

      await result.user.press(screen.getByText('satoshi@pay.usegrimm.app'));

      await waitFor(() => {
        expect(screen.getByText('lnWallet.lnAddressQr.lnAddressQrTitle')).toBeOnTheScreen();
      });

      return result;
    };

    it('shows loading state while fetching address info', async () => {
      mockLightningAddress = 'satoshi@pay.usegrimm.app';
      let resolvePromise: (value: any) => void;
      mockGetLightningAddressInfo.mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
      );
      const { user } = renderWithContext();

      await user.press(screen.getByText('satoshi@pay.usegrimm.app'));

      expect(screen.getByText('common.loading')).toBeOnTheScreen();

      // Resolve to avoid act warning
      resolvePromise!({ lightningAddress: 'satoshi@pay.usegrimm.app' });
      await waitFor(() => {
        expect(screen.queryByText('common.loading')).not.toBeOnTheScreen();
      });
    });

    it('shows QR code and address after loading', async () => {
      await openModal();

      expect(screen.getByTestId('qr-code')).toBeOnTheScreen();
      // Address should be displayed in the modal
      expect(screen.getAllByText('satoshi@pay.usegrimm.app').length).toBeGreaterThanOrEqual(1);
    });

    it('copies address to clipboard when pressed', async () => {
      const Clipboard = require('expo-clipboard');
      const { user } = await openModal();

      // Find the copy button area in the modal (contains the address text and copy icon)
      const addressInModal = screen.getAllByText('satoshi@pay.usegrimm.app');
      // Press the one inside the modal (with the copy icon)
      await user.press(addressInModal[addressInModal.length - 1]);

      expect(Clipboard.setStringAsync).toHaveBeenCalledWith('satoshi@pay.usegrimm.app');
    });

    it('shows error when getLightningAddressInfo fails', async () => {
      mockLightningAddress = 'satoshi@pay.usegrimm.app';
      mockGetLightningAddressInfo.mockRejectedValue(new Error('Network error'));
      const { user } = renderWithContext();

      await user.press(screen.getByText('satoshi@pay.usegrimm.app'));

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeOnTheScreen();
      });
    });

    it('shows fallback error message when error has no message', async () => {
      mockLightningAddress = 'satoshi@pay.usegrimm.app';
      mockGetLightningAddressInfo.mockRejectedValue({});
      const { user } = renderWithContext();

      await user.press(screen.getByText('satoshi@pay.usegrimm.app'));

      await waitFor(() => {
        expect(screen.getByText('lnWallet.lnAddressQr.errorLoading')).toBeOnTheScreen();
      });
    });

    it('closes modal when close button is pressed', async () => {
      const { user } = await openModal();

      await user.press(screen.getByText('common.close'));

      await waitFor(() => {
        expect(screen.queryByText('lnWallet.lnAddressQr.lnAddressQrTitle')).not.toBeOnTheScreen();
      });
    });
  });

  describe('Navigation', () => {
    it('navigates to receive onchain when menu item is pressed', async () => {
      const { user } = renderWithContext();

      await user.press(screen.getByText('lnWallet.receiveOnchain'));

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/receive/ln-qrcode',
        params: { type: 'onchain' },
      });
    });

    it('navigates to transactions when "see all" is pressed', async () => {
      mockPayments = [{ id: 'tx-1' }, { id: 'tx-2' }, { id: 'tx-3' }, { id: 'tx-4' }, { id: 'tx-5' }];
      const { user } = renderWithContext();

      await user.press(screen.getByText('lnWallet.seeAll'));

      expect(mockPush).toHaveBeenCalledWith('/(app)/transactions');
    });
  });

  describe('Bitcoin unit display', () => {
    it('shows balance in BTC when bitcoinUnit is BTC', () => {
      renderWithContext({ bitcoinUnit: 'BTC' });

      expect(screen.getByText(/BTC/)).toBeOnTheScreen();
    });

    it('shows balance in SATS by default', () => {
      renderWithContext();

      expect(screen.getByText(/SATS/)).toBeOnTheScreen();
    });
  });
});
