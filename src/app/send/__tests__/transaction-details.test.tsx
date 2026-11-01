import React from 'react';

import { aLightningAddress, anInvoice, anLnurlPay, aPayment, MAINNET_INVOICE } from '@/lib/payment-input/__tests__/helpers/breez-results';
import { fakeBreez, PaymentStatus } from '@/lib/payment-input/__tests__/helpers/fake-breez-context';
import { fakeRouter, router } from '@/lib/payment-input/__tests__/helpers/fake-expo-router';
import { cleanup, screen, setup, waitFor } from '@/lib/test-utils';

import PaymentDetailsScreen from '../transaction-details';

const mockShowErrorMessage = jest.fn();
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

jest.mock('@expo/vector-icons/build/Ionicons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props: Record<string, unknown>) => <View {...props} />;
});

jest.mock('@/components/ui/focus-aware-status-bar', () => ({
  FocusAwareStatusBar: () => null,
}));

jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: jest.fn() },
  useTranslation: () => ({ t: mockT }),
}));

jest.mock('@/lib/i18n', () => ({
  translate: (key: string) => key,
}));

jest.mock('expo-router', () => require('@/lib/payment-input/__tests__/helpers/fake-expo-router'));
jest.mock('@/lib/context/breez-context', () => require('@/lib/payment-input/__tests__/helpers/fake-breez-context'));

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
  ...jest.requireActual('@/components/ui/utils'),
  showErrorMessage: (...args: unknown[]) => mockShowErrorMessage(...args),
}));

// The slider is a gesture; the tests only need "confirm unless loading"
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

const SEND_ERROR = 'paymentDetails.errors.sendFailed';

beforeEach(() => {
  fakeBreez.reset();
  fakeRouter.reset();
});

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

function renderDetails(params: Record<string, string | undefined>) {
  fakeRouter.setParams(params);
  return setup(<PaymentDetailsScreen />);
}

const PREPARED_INVOICE = { paymentMethod: { inner: { sparkTransferFeeSats: 0n, lightningFeeSats: 0n } } };
const PREPARED_LNURL = { amountSats: 1000n, feeSats: 0n };

// Every kind of Lightning payment follows the same outcome rules (P1-1); only the SDK calls differ
const KINDS = [
  {
    kind: 'Invoice',
    params: { rawInvoice: MAINNET_INVOICE },
    arrange: () => {
      fakeBreez.parseInput.mockResolvedValue(anInvoice({ amountSats: 1000 }));
      fakeBreez.prepareSend.mockResolvedValue(PREPARED_INVOICE);
    },
    prepared: PREPARED_INVOICE,
    execute: fakeBreez.executeSend,
    // executeSend resolves a SendPaymentResponse, executeLnurlPay the Payment itself
    answer: (payment: unknown) => ({ payment }),
  },
  {
    kind: 'Lightning Address',
    params: { paymentInput: 'alice@pay.usegrimm.app', amountSats: '1000' },
    arrange: () => {
      fakeBreez.parseInput.mockResolvedValue(aLightningAddress());
      fakeBreez.prepareLnurlPay.mockResolvedValue(PREPARED_LNURL);
    },
    prepared: PREPARED_LNURL,
    execute: fakeBreez.executeLnurlPay,
    answer: (payment: unknown) => payment,
  },
  {
    kind: 'LNURL-pay',
    params: { paymentInput: 'lnurl1shop', amountSats: '1000' },
    arrange: () => {
      fakeBreez.parseInput.mockResolvedValue(anLnurlPay());
      fakeBreez.prepareLnurlPay.mockResolvedValue(PREPARED_LNURL);
    },
    prepared: PREPARED_LNURL,
    execute: fakeBreez.executeLnurlPay,
    answer: (payment: unknown) => payment,
  },
];

describe('PaymentDetailsScreen (transaction-details)', () => {
  describe.each(KINDS)('Outcome of the slide to confirm: $kind', ({ kind, params, arrange, prepared, execute, answer }) => {
    async function slide(user: ReturnType<typeof setup>['user']) {
      await user.press(await screen.findByTestId('slide-to-confirm'));
    }

    beforeEach(arrange);

    it(`${kind}: \`Completed\` opens the success screen with the payment's Amount`, async () => {
      execute.mockResolvedValueOnce(answer(aPayment({ status: PaymentStatus.Completed, amountSats: 1000 })));
      const { user } = renderDetails(params);

      await slide(user);

      await waitFor(() =>
        expect(router.push).toHaveBeenCalledWith({
          pathname: '/transaction-result/success-screen',
          params: { transactionType: 'sent', satsAmount: '1000' },
        }),
      );
      expect(mockShowErrorMessage).not.toHaveBeenCalled();
    });

    it(`${kind}: \`Pending\` opens the pending screen in sent mode with the payment's Amount`, async () => {
      execute.mockResolvedValueOnce(answer(aPayment({ status: PaymentStatus.Pending, amountSats: 1000 })));
      const { user } = renderDetails(params);

      await slide(user);

      await waitFor(() =>
        expect(router.push).toHaveBeenCalledWith({
          pathname: '/transaction-result/pending-screen',
          params: { transactionType: 'sent', satsAmount: '1000' },
        }),
      );
      expect(router.push).toHaveBeenCalledTimes(1);
      expect(mockShowErrorMessage).not.toHaveBeenCalled();
    });

    it.each([
      ['`Failed`', () => execute.mockResolvedValueOnce(answer(aPayment({ status: PaymentStatus.Failed })))],
      ['no Payment', () => execute.mockResolvedValueOnce(answer(undefined))],
      ['an exception', () => execute.mockRejectedValueOnce(new Error('route not found'))],
    ])(`${kind}: %s shows the send error and stays on the screen`, async (_outcome, arrangeOutcome) => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      arrangeOutcome();
      const { user } = renderDetails(params);

      await slide(user);

      await waitFor(() => expect(mockShowErrorMessage).toHaveBeenCalledWith(SEND_ERROR));
      expect(router.push).not.toHaveBeenCalled();
      expect(router.replace).not.toHaveBeenCalled();
      expect(screen.getByTestId('send-ln-details-screen')).toBeOnTheScreen();
    });

    it(`${kind}: the slider works again after a failure`, async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      let rejectPayment: (error: Error) => void = () => {};
      execute.mockReturnValueOnce(new Promise((_resolve, reject) => (rejectPayment = reject)));
      const { user } = renderDetails(params);

      await slide(user);
      await waitFor(() => expect(screen.getByTestId('slide-to-confirm')).toBeDisabled());

      rejectPayment(new Error('route not found'));

      await waitFor(() => expect(screen.getByTestId('slide-to-confirm')).toBeEnabled());
      expect(mockShowErrorMessage).toHaveBeenCalledWith(SEND_ERROR);
    });

    it(`${kind}: a second slide after a failure pays the same prepared payment again`, async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      execute.mockRejectedValueOnce(new Error('route not found')).mockResolvedValueOnce(answer(aPayment({ status: PaymentStatus.Completed, amountSats: 1000 })));
      const { user } = renderDetails(params);

      await slide(user);
      await waitFor(() => expect(mockShowErrorMessage).toHaveBeenCalledWith(SEND_ERROR));
      await slide(user);

      await waitFor(() => expect(router.push).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/transaction-result/success-screen' })));
      expect(execute).toHaveBeenCalledTimes(2);
      expect(execute.mock.calls[0][0]).toBe(prepared);
      expect(execute.mock.calls[1][0]).toBe(prepared);
    });
  });

  describe('Bolt11 Invoice flow', () => {
    it('shows loading state initially', () => {
      fakeBreez.parseInput.mockReturnValue(new Promise(() => {})); // never resolves

      renderDetails({ rawInvoice: MAINNET_INVOICE });

      expect(screen.getByText('paymentDetails.loading')).toBeOnTheScreen();
      expect(screen.getByText('paymentDetails.loadingSubtitle')).toBeOnTheScreen();
    });

    it('displays invoice details after parsing', async () => {
      fakeBreez.parseInput.mockResolvedValueOnce(anInvoice({ amountSats: 5000, description: 'Test payment' }));
      fakeBreez.prepareSend.mockResolvedValueOnce({ paymentMethod: { inner: { sparkTransferFeeSats: 10n, lightningFeeSats: 5n } } });

      renderDetails({ rawInvoice: MAINNET_INVOICE });

      await waitFor(() => {
        expect(screen.getByText('paymentDetails.amount')).toBeOnTheScreen();
      });

      expect(screen.getByText('5000 SAT')).toBeOnTheScreen();
      expect(screen.getByText('03payee')).toBeOnTheScreen();
      expect(screen.getByText('Test payment')).toBeOnTheScreen();
      expect(screen.getByText('paymentDetails.networkFee')).toBeOnTheScreen();
      expect(fakeBreez.prepareSend).toHaveBeenCalledWith(MAINNET_INVOICE);
    });

    it('shows decode error when invoice parsing fails', async () => {
      fakeBreez.parseInput.mockResolvedValueOnce(anInvoice());

      renderDetails({ rawInvoice: MAINNET_INVOICE });

      await waitFor(() => {
        expect(screen.getByText('paymentDetails.errorMessage')).toBeOnTheScreen();
      });
    });

    it('shows not enough funds error', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      fakeBreez.parseInput.mockResolvedValueOnce(anInvoice({ amountSats: 5000 }));
      fakeBreez.prepareSend.mockRejectedValueOnce(new Error('not enough funds'));

      renderDetails({ rawInvoice: MAINNET_INVOICE });

      await waitFor(() => {
        expect(screen.getByText('paymentDetails.errorMessage')).toBeOnTheScreen();
      });
      expect(screen.getByText('paymentDetails.errors.notEnoughFunds')).toBeOnTheScreen();
    });

    it('shows the error screen with invalidData on generic parse failure', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      fakeBreez.parseInput.mockRejectedValueOnce(new Error('something else'));

      renderDetails({ rawInvoice: MAINNET_INVOICE });

      await waitFor(() => {
        expect(screen.getByText('paymentDetails.errorMessage')).toBeOnTheScreen();
      });
      expect(screen.getByText('paymentDetails.errors.invalidData')).toBeOnTheScreen();
      expect(mockShowErrorMessage).not.toHaveBeenCalled();
    });
  });

  describe('Lightning Address flow', () => {
    it('displays LN address as destination', async () => {
      fakeBreez.parseInput.mockResolvedValueOnce(aLightningAddress({ address: 'bob@pay.usegrimm.app' }));
      fakeBreez.prepareLnurlPay.mockResolvedValueOnce({ amountSats: 5000n, feeSats: 10n });

      renderDetails({ paymentInput: 'bob@pay.usegrimm.app', amountSats: '5000' });

      await waitFor(() => {
        expect(screen.getByText('bob@pay.usegrimm.app')).toBeOnTheScreen();
      });

      expect(screen.getByText('5000 SAT')).toBeOnTheScreen();
    });

    it('handles LnurlPay input type', async () => {
      fakeBreez.parseInput.mockResolvedValueOnce(anLnurlPay());
      fakeBreez.prepareLnurlPay.mockResolvedValueOnce({ amountSats: 3000n, feeSats: 5n });

      renderDetails({ paymentInput: 'lnurl1shop', amountSats: '3000' });

      await waitFor(() => {
        expect(screen.getByText('3000 SAT')).toBeOnTheScreen();
      });
    });

    it('shows decode error for unsupported parsed type', async () => {
      fakeBreez.parseInput.mockResolvedValueOnce({ tag: 'BitcoinAddress', inner: [{ address: 'bc1q...' }] });

      renderDetails({ paymentInput: 'bad@pay.usegrimm.app', amountSats: '1000' });

      await waitFor(() => {
        expect(screen.getByText('paymentDetails.errorMessage')).toBeOnTheScreen();
      });
    });

    it('shows not enough funds error for LN address', async () => {
      fakeBreez.parseInput.mockResolvedValueOnce(aLightningAddress());
      fakeBreez.prepareLnurlPay.mockRejectedValueOnce(new Error('not enough funds'));

      renderDetails({ paymentInput: 'alice@pay.usegrimm.app', amountSats: '5000' });

      await waitFor(() => {
        expect(screen.getByText('paymentDetails.errorMessage')).toBeOnTheScreen();
      });
    });

    it('shows invalidData error for generic LN address failure', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      fakeBreez.parseInput.mockResolvedValueOnce(aLightningAddress());
      fakeBreez.prepareLnurlPay.mockRejectedValueOnce(new Error('generic failure'));

      renderDetails({ paymentInput: 'alice@pay.usegrimm.app', amountSats: '5000' });

      await waitFor(() => {
        expect(screen.getByText('paymentDetails.errorMessage')).toBeOnTheScreen();
      });
    });

    it('does not show expiry timer for LN address', async () => {
      fakeBreez.parseInput.mockResolvedValueOnce(aLightningAddress());
      fakeBreez.prepareLnurlPay.mockResolvedValueOnce({ amountSats: 5000n, feeSats: 0n });

      renderDetails({ paymentInput: 'alice@pay.usegrimm.app', amountSats: '5000' });

      await waitFor(() => {
        expect(screen.getByText('alice@pay.usegrimm.app')).toBeOnTheScreen();
      });

      expect(screen.queryByText('paymentDetails.expiresIn')).not.toBeOnTheScreen();
    });
  });

  describe('Insufficient balance', () => {
    it('shows insufficient balance for bolt11 when total exceeds balance', async () => {
      fakeBreez.parseInput.mockResolvedValueOnce(anInvoice({ amountSats: 200_000 }));
      fakeBreez.prepareSend.mockResolvedValueOnce(PREPARED_INVOICE);

      renderDetails({ rawInvoice: MAINNET_INVOICE });

      await waitFor(() => {
        expect(screen.getByText('paymentDetails.errors.notEnoughFunds')).toBeOnTheScreen();
      });
    });
  });

  describe('Invalid payment guard', () => {
    it('shows the error screen instead of a payable screen when the payment cannot be prepared (bolt11 path)', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      fakeBreez.parseInput.mockResolvedValueOnce(anInvoice({ amountSats: 1000 }));
      // prepareSend fails so no savedPrepareResponse: nothing can be paid
      fakeBreez.prepareSend.mockRejectedValueOnce(new Error('some error'));

      renderDetails({ rawInvoice: MAINNET_INVOICE });

      await waitFor(() => {
        expect(screen.getByText('paymentDetails.errorMessage')).toBeOnTheScreen();
      });
      expect(screen.getByText('paymentDetails.errors.invalidData')).toBeOnTheScreen();
      expect(screen.queryByText('paymentDetails.amount')).not.toBeOnTheScreen();
    });
  });

  describe('Error screen', () => {
    it('renders go back button on error screen', async () => {
      fakeBreez.parseInput.mockResolvedValueOnce(anInvoice());

      const { user } = renderDetails({ rawInvoice: MAINNET_INVOICE });

      await waitFor(() => {
        expect(screen.getByText('paymentDetails.goBack')).toBeOnTheScreen();
      });

      await user.press(screen.getByText('paymentDetails.goBack'));

      expect(router.back).toHaveBeenCalled();
    });
  });
});
