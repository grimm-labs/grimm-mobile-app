import React from 'react';

import { aLightningAddress, anLnurlWithdraw, aPayment } from '@/lib/payment-input/__tests__/helpers/breez-results';
import { fakeBreez, PaymentStatus } from '@/lib/payment-input/__tests__/helpers/fake-breez-context';
import { fakeRouter, router } from '@/lib/payment-input/__tests__/helpers/fake-expo-router';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@/lib/test-utils';
import { BitcoinUnit } from '@/types/enum';

import WithdrawalScreen from '../withdrawal';

const mockShowErrorMessage = jest.fn();
// Shows the interpolation values, so the tests can check what the screen puts in a message
const mockT = (key: string, options?: Record<string, unknown>) => (options ? `${key} ${JSON.stringify(options)}` : key);

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
  initReactI18next: { type: '3rdParty', init: jest.fn() },
  useTranslation: () => ({ t: mockT }),
}));

jest.mock('@/lib/i18n', () => ({
  translate: (key: string) => key,
}));

jest.mock('@/components/ui/utils', () => ({
  ...jest.requireActual('@/components/ui/utils'),
  showErrorMessage: (...args: unknown[]) => mockShowErrorMessage(...args),
}));

jest.mock('expo-router', () => require('@/lib/payment-input/__tests__/helpers/fake-expo-router'));
jest.mock('@/lib/context/breez-context', () => require('@/lib/payment-input/__tests__/helpers/fake-breez-context'));

jest.mock('@/lib/context', () => {
  const React = require('react');
  return { AppContext: React.createContext({}) };
});

jest.mock('@/lib', () => jest.requireActual('@/lib/bitcoin-amount'));

const LNURL = 'lnurl1dp68gurn8ghj7withdraw';
// 1 500 msat and 5 000 999 msat: the screen must round to 2 and 5 000 sats
const RANGE = { minWithdrawableMsat: 1500n, maxWithdrawableMsat: 5_000_999n };
const VOUCHER = { minWithdrawableMsat: 21_000_000n, maxWithdrawableMsat: 21_000_000n };
const WITHDRAW_ERROR = 'withdrawal.errors.failed';

function renderWithdrawal({ bitcoinUnit = BitcoinUnit.Sats } = {}) {
  fakeRouter.setParams({ paymentInput: LNURL });
  const { AppContext } = require('@/lib/context');
  return render(
    <AppContext.Provider value={{ bitcoinUnit }}>
      <WithdrawalScreen />
    </AppContext.Provider>,
  );
}

async function renderParsed(options?: Parameters<typeof renderWithdrawal>[0]) {
  const view = renderWithdrawal(options);
  await screen.findByTestId('withdrawal-confirm');
  return view;
}

function typeAmount(amount: string) {
  for (const key of amount) {
    fireEvent.press(screen.getByTestId(`numeric-pad-key-${key === '.' ? 'dot' : key}`));
  }
}

function clearAmount() {
  while (screen.getByTestId('withdrawal-amount').props.children !== '0') {
    fireEvent.press(screen.getByTestId('delete-key'));
  }
}

const withdraw = () => fireEvent.press(screen.getByTestId('withdrawal-confirm'));

beforeEach(() => {
  fakeBreez.reset();
  fakeRouter.reset();
  fakeBreez.parseInput.mockResolvedValue(anLnurlWithdraw({ callback: 'https://faucet.example.com:8443/lnurlw/callback?k1=abc', defaultDescription: 'Grimm faucet', ...RANGE }));
});

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe('WithdrawalScreen (receive/withdrawal)', () => {
  describe('What it shows (P3-1, P3-2)', () => {
    it('parses the Payment Input again with Breez, once Breez is started', async () => {
      fakeBreez.set({ isBreezInitialized: false });
      renderWithdrawal();

      expect(screen.getByTestId('withdrawal-screen')).toBeOnTheScreen();
      expect(screen.queryByTestId('withdrawal-confirm')).not.toBeOnTheScreen();
      expect(fakeBreez.parseInput).not.toHaveBeenCalled();

      act(() => fakeBreez.set({ isBreezInitialized: true }));

      expect(await screen.findByTestId('withdrawal-confirm')).toBeOnTheScreen();
      expect(fakeBreez.parseInput).toHaveBeenCalledWith(LNURL);
    });

    it('shows the domain of the callback and defaultDescription', async () => {
      await renderParsed();

      expect(screen.getByTestId('withdrawal-domain')).toHaveTextContent('faucet.example.com');
      expect(screen.getByTestId('withdrawal-description')).toHaveTextContent('Grimm faucet');
    });

    it.each([
      ['a failed parse', () => fakeBreez.parseInput.mockRejectedValue(new Error('invalid input'))],
      ['a parse result that is not LNURL-withdraw', () => fakeBreez.parseInput.mockResolvedValue(aLightningAddress())],
    ])('%s shows an error and no Withdraw button', async (_case, arrange) => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      arrange();
      renderWithdrawal();

      expect(await screen.findByTestId('withdrawal-error')).toHaveTextContent('paymentInput.errors.unsupported');
      expect(screen.queryByTestId('withdrawal-confirm')).not.toBeOnTheScreen();
    });
  });

  describe('Amount and limits (P3-3)', () => {
    it.each([
      [BitcoinUnit.Sats, '21000'],
      [BitcoinUnit.Btc, '0.00021'],
    ])('equal limits show the Amount without a keypad (%s)', async (bitcoinUnit, shown) => {
      fakeBreez.parseInput.mockResolvedValue(anLnurlWithdraw(VOUCHER));
      await renderParsed({ bitcoinUnit });

      expect(screen.getByTestId('withdrawal-amount')).toHaveTextContent(shown);
      expect(screen.queryByTestId('numeric-pad-key-1')).not.toBeOnTheScreen();
      expect(screen.queryByTestId('withdrawal-limits')).not.toBeOnTheScreen();
      expect(screen.getByTestId('withdrawal-confirm')).toBeEnabled();
    });

    it.each([
      [BitcoinUnit.Sats, '5000'],
      [BitcoinUnit.Btc, '0.00005'],
    ])('a range is pre-filled with the maximum (%s) and editable', async (bitcoinUnit, maximum) => {
      await renderParsed({ bitcoinUnit });

      expect(screen.getByTestId('withdrawal-amount')).toHaveTextContent(maximum);
      expect(screen.getByTestId('withdrawal-confirm')).toBeEnabled();
      fireEvent.press(screen.getByTestId('delete-key'));
      expect(screen.getByTestId('withdrawal-amount')).toHaveTextContent(maximum.slice(0, -1));
    });

    describe.each([
      [BitcoinUnit.Sats, { belowMin: '1', min: '2', max: '5000', aboveMax: '5001' }],
      [BitcoinUnit.Btc, { belowMin: '0.00000001', min: '0.00000002', max: '0.00005', aboveMax: '0.00005001' }],
    ])('in %s', (bitcoinUnit, amounts) => {
      it.each([
        ['min − 1', false, 'belowMin'],
        ['min', true, 'min'],
        ['max', true, 'max'],
        ['max + 1', false, 'aboveMax'],
      ] as const)('at %s, Withdraw enabled: %s, with the limits message when disabled', async (_label, enabled, amountKey) => {
        await renderParsed({ bitcoinUnit });
        clearAmount();

        typeAmount(amounts[amountKey]);

        expect(screen.getByTestId('withdrawal-amount')).toHaveTextContent(amounts[amountKey]);
        if (enabled) {
          expect(screen.getByTestId('withdrawal-confirm')).toBeEnabled();
          expect(screen.queryByTestId('withdrawal-limits')).not.toBeOnTheScreen();
        } else {
          expect(screen.getByTestId('withdrawal-confirm')).toBeDisabled();
          expect(screen.getByTestId('withdrawal-limits')).toBeOnTheScreen();
        }
      });
    });

    it.each([
      [BitcoinUnit.Sats, { min: '2 SATS', max: '5,000 SATS' }],
      [BitcoinUnit.Btc, { min: '0.00000002 BTC', max: '0.00005000 BTC' }],
    ])("the limits message shows min and max in the user's unit (%s)", async (bitcoinUnit, formatted) => {
      await renderParsed({ bitcoinUnit });
      clearAmount();

      expect(screen.getByTestId('withdrawal-limits')).toHaveTextContent(`enterAmount.limits ${JSON.stringify(formatted)}`);
      expect(screen.getByTestId('withdrawal-confirm')).toBeDisabled();
    });
  });

  describe('Withdraw (P3-4, P3-6)', () => {
    it('one tap on Withdraw calls lnurlWithdraw with the Amount in sats and the parsed request, with no confirmation step', async () => {
      fakeBreez.lnurlWithdraw.mockResolvedValue(aPayment({ status: PaymentStatus.Completed, amountSats: 5000 }));
      await renderParsed();
      const parsed = await fakeBreez.parseInput.mock.results[0].value;

      await act(async () => withdraw());

      expect(fakeBreez.lnurlWithdraw).toHaveBeenCalledTimes(1);
      expect(fakeBreez.lnurlWithdraw).toHaveBeenCalledWith(5000, parsed.inner[0]);
    });

    it('sends the Amount in sats when it is entered in BTC', async () => {
      fakeBreez.lnurlWithdraw.mockResolvedValue(aPayment({ status: PaymentStatus.Completed }));
      await renderParsed({ bitcoinUnit: BitcoinUnit.Btc });
      clearAmount();
      typeAmount('0.00002100');

      await act(async () => withdraw());

      expect(fakeBreez.lnurlWithdraw).toHaveBeenCalledWith(2100, expect.anything());
    });

    it('a double tap on Withdraw calls lnurlWithdraw once; the button shows its loading state', async () => {
      fakeBreez.lnurlWithdraw.mockReturnValue(new Promise(() => {}));
      await renderParsed();

      act(() => {
        withdraw();
        withdraw();
      });

      expect(fakeBreez.lnurlWithdraw).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('withdrawal-confirm')).toBeDisabled();
      fireEvent.press(screen.getByTestId('withdrawal-confirm'));
      expect(fakeBreez.lnurlWithdraw).toHaveBeenCalledTimes(1);
    });
  });

  describe('Outcome (P3-5)', () => {
    it('`Completed` opens the success screen with transactionType received and the Amount', async () => {
      fakeBreez.lnurlWithdraw.mockResolvedValue(aPayment({ status: PaymentStatus.Completed, amountSats: 5000 }));
      await renderParsed();

      await act(async () => withdraw());

      expect(router.push).toHaveBeenCalledWith({ pathname: '/transaction-result/success-screen', params: { transactionType: 'received', satsAmount: '5000' } });
      expect(mockShowErrorMessage).not.toHaveBeenCalled();
    });

    it.each([
      ['no Payment (not received after 60 s)', () => fakeBreez.lnurlWithdraw.mockResolvedValue(undefined)],
      ['`Pending`', () => fakeBreez.lnurlWithdraw.mockResolvedValue(aPayment({ status: PaymentStatus.Pending, amountSats: 5000 }))],
    ])('%s opens the pending screen in received mode', async (_case, arrange) => {
      arrange();
      await renderParsed();

      await act(async () => withdraw());

      expect(router.push).toHaveBeenCalledWith({ pathname: '/transaction-result/pending-screen', params: { transactionType: 'received', satsAmount: '5000' } });
      expect(router.push).toHaveBeenCalledTimes(1);
      expect(mockShowErrorMessage).not.toHaveBeenCalled();
    });

    it.each([
      ['`Failed`', () => fakeBreez.lnurlWithdraw.mockResolvedValueOnce(aPayment({ status: PaymentStatus.Failed }))],
      ['an exception', () => fakeBreez.lnurlWithdraw.mockRejectedValueOnce(new Error('service refused'))],
    ])('%s shows the withdrawal error and stays on the screen', async (_case, arrange) => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      arrange();
      await renderParsed();

      await act(async () => withdraw());

      expect(mockShowErrorMessage).toHaveBeenCalledWith(WITHDRAW_ERROR);
      expect(router.push).not.toHaveBeenCalled();
      expect(screen.getByTestId('withdrawal-confirm')).toBeEnabled();
    });

    it('a retry after an error calls lnurlWithdraw again', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      fakeBreez.lnurlWithdraw.mockRejectedValueOnce(new Error('service refused')).mockResolvedValueOnce(aPayment({ status: PaymentStatus.Completed, amountSats: 5000 }));
      await renderParsed();

      await act(async () => withdraw());
      await waitFor(() => expect(screen.getByTestId('withdrawal-confirm')).toBeEnabled());
      await act(async () => withdraw());

      expect(fakeBreez.lnurlWithdraw).toHaveBeenCalledTimes(2);
      expect(router.push).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/transaction-result/success-screen' }));
    });
  });
});
