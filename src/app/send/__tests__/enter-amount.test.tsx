import React from 'react';

import { aBitcoinAddress, aLightningAddress, anLnurlPay } from '@/lib/payment-input/__tests__/helpers/breez-results';
import { fakeBreez } from '@/lib/payment-input/__tests__/helpers/fake-breez-context';
import { fakeRouter, router } from '@/lib/payment-input/__tests__/helpers/fake-expo-router';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@/lib/test-utils';
import { BitcoinUnit } from '@/types/enum';

import LightningAddressAmountScreen from '../enter-amount';

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
  return { AppContext: React.createContext({}) };
});

jest.mock('@/lib/context/bitcoin-prices-context', () => ({
  useBitcoin: () => ({
    bitcoinPrices: { BTC: { USD: 50000 } },
  }),
}));

jest.mock('@/lib', () => ({
  ...jest.requireActual('@/lib/bitcoin-amount'),
  convertBitcoinToFiat: (amount: number) => amount * 0.0005,
  getFiatCurrency: () => 'USD',
}));

const LN_ADDRESS = 'alice@pay.usegrimm.app';
// 1 500 msat and 5 000 999 msat: the screen must round to 2 and 5 000 sats
const LIMITS = { minSendableMsat: 1500n, maxSendableMsat: 5_000_999n };

function renderAmount({ paymentInput = LN_ADDRESS, bitcoinUnit = BitcoinUnit.Sats } = {}) {
  fakeRouter.setParams({ paymentInput });
  const { AppContext } = require('@/lib/context');
  return render(
    <AppContext.Provider value={{ bitcoinUnit, selectedCountry: { name: 'United States', code: 'US', currency: 'USD' } }}>
      <LightningAddressAmountScreen />
    </AppContext.Provider>,
  );
}

async function renderParsed(options?: Parameters<typeof renderAmount>[0]) {
  const view = renderAmount(options);
  await screen.findByTestId('send-ln-amount-send-to');
  return view;
}

function typeAmount(amount: string) {
  for (const key of amount) {
    fireEvent.press(screen.getByTestId(`numeric-pad-key-${key === '.' ? 'dot' : key}`));
  }
}

function clearAmount() {
  while (screen.getByTestId('send-ln-amount-value').props.children !== '0') {
    fireEvent.press(screen.getByTestId('delete-key'));
  }
}

beforeEach(() => {
  fakeBreez.reset();
  fakeRouter.reset();
  fakeBreez.parseInput.mockResolvedValue(aLightningAddress());
});

afterEach(cleanup);

describe('LightningAddressAmountScreen (enter-amount)', () => {
  describe('Rendering', () => {
    it('renders the amount display and keypad', async () => {
      await renderParsed();

      expect(screen.getByTestId('send-ln-amount-value')).toHaveTextContent('0');
      expect(screen.getByText('enterAmount.continueButton')).toBeOnTheScreen();
      for (const key of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']) {
        expect(screen.getByTestId(`numeric-pad-key-${key}`)).toBeOnTheScreen();
      }
    });

    it('renders the bitcoin unit label', async () => {
      await renderParsed();

      expect(screen.getByText('SATS')).toBeOnTheScreen();
    });

    it('displays fiat amount when a valid amount is entered', async () => {
      await renderParsed();

      typeAmount('1000');

      expect(screen.getByText('0.50')).toBeOnTheScreen();
      expect(screen.getByText('USD')).toBeOnTheScreen();
    });
  });

  describe('Send to (P1-5)', () => {
    it('"Send to" shows the Lightning Address', async () => {
      fakeBreez.parseInput.mockResolvedValue(aLightningAddress({ address: LN_ADDRESS }));
      renderAmount();

      expect(await screen.findByTestId('send-ln-amount-send-to')).toHaveTextContent(`enterAmount.sendTo ${LN_ADDRESS}`);
      expect(fakeBreez.parseInput).toHaveBeenCalledWith(LN_ADDRESS);
    });

    it('"Send to" shows the domain for LNURL-pay', async () => {
      fakeBreez.parseInput.mockResolvedValue(anLnurlPay({ domain: 'shop.example.com' }));
      renderAmount({ paymentInput: 'lnurl1dp68gurn8ghj7um9wfmxjcm99e3k7mf0v9cxj0m385ekvcenxc6r2c35xvukxefcv5mkvv34x5ekzd3ev56nyd3hxqurzepexejxxepnxscrvwfnv9nxzcn9xq6xyefhvgcxxcmyxymnserxfq5fns' });

      expect(await screen.findByTestId('send-ln-amount-send-to')).toHaveTextContent('enterAmount.sendTo shop.example.com');
    });
  });

  describe('Parse (P1-4)', () => {
    it('Continue is disabled while Breez is not started (the parse cannot start)', () => {
      fakeBreez.set({ isBreezInitialized: false });
      renderAmount();

      typeAmount('5');

      expect(fakeBreez.parseInput).not.toHaveBeenCalled();
      expect(screen.getByTestId('send-ln-amount-continue')).toBeDisabled();
      expect(screen.queryByTestId('send-ln-amount-send-to')).not.toBeOnTheScreen();
    });

    it('parses the Payment Input once Breez is started', async () => {
      fakeBreez.set({ isBreezInitialized: false });
      renderAmount();

      act(() => fakeBreez.set({ isBreezInitialized: true }));

      expect(await screen.findByTestId('send-ln-amount-send-to')).toHaveTextContent(`enterAmount.sendTo ${LN_ADDRESS}`);
    });

    it('Continue is disabled while the parse is pending', () => {
      fakeBreez.parseInput.mockReturnValue(new Promise(() => {}));
      renderAmount();

      typeAmount('5');

      expect(fakeBreez.parseInput).toHaveBeenCalledWith(LN_ADDRESS);
      expect(screen.getByTestId('send-ln-amount-continue')).toBeDisabled();
      expect(screen.queryByTestId('send-ln-amount-send-to')).not.toBeOnTheScreen();
      expect(screen.queryByTestId('send-ln-amount-limits')).not.toBeOnTheScreen();
    });

    it.each([
      ['a failed parse', () => fakeBreez.parseInput.mockRejectedValue(new Error('invalid input'))],
      ['a parse result that is neither a Lightning Address nor LNURL-pay', () => fakeBreez.parseInput.mockResolvedValue(aBitcoinAddress())],
    ])('%s shows preparePaymentFailed and Continue stays disabled', async (_case, arrange) => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      arrange();
      renderAmount();

      expect(await screen.findByTestId('send-ln-amount-error')).toHaveTextContent('lightningPayment.errors.preparePaymentFailed');
      typeAmount('5');
      expect(screen.getByTestId('send-ln-amount-continue')).toBeDisabled();
      expect(screen.queryByTestId('send-ln-amount-send-to')).not.toBeOnTheScreen();
    });
  });

  describe('Amount limits (P1-4)', () => {
    describe.each([
      [BitcoinUnit.Sats, { belowMin: '1', min: '2', max: '5000', aboveMax: '5001' }],
      [BitcoinUnit.Btc, { belowMin: '0.00000001', min: '0.00000002', max: '0.00005', aboveMax: '0.00005001' }],
    ])('in %s', (bitcoinUnit, amounts) => {
      beforeEach(() => {
        fakeBreez.parseInput.mockResolvedValue(aLightningAddress(LIMITS));
      });

      it.each([
        ['min − 1', false, 'belowMin'],
        ['min', true, 'min'],
        ['max', true, 'max'],
        ['max + 1', false, 'aboveMax'],
      ] as const)('at %s, Continue enabled: %s, with the limits message when disabled', async (_label, enabled, amountKey) => {
        await renderParsed({ bitcoinUnit });

        typeAmount(amounts[amountKey]);

        expect(screen.getByTestId('send-ln-amount-value')).toHaveTextContent(amounts[amountKey]);
        if (enabled) {
          expect(screen.getByTestId('send-ln-amount-continue')).toBeEnabled();
          expect(screen.queryByTestId('send-ln-amount-limits')).not.toBeOnTheScreen();
        } else {
          expect(screen.getByTestId('send-ln-amount-continue')).toBeDisabled();
          expect(screen.getByTestId('send-ln-amount-limits')).toBeOnTheScreen();
        }
      });
    });

    it.each([
      [BitcoinUnit.Sats, { min: '2 SATS', max: '5,000 SATS' }],
      [BitcoinUnit.Btc, { min: '0.00000002 BTC', max: '0.00005000 BTC' }],
    ])("the limits message shows min and max in the user's unit (%s), from the start", async (bitcoinUnit, formatted) => {
      fakeBreez.parseInput.mockResolvedValue(aLightningAddress(LIMITS));
      await renderParsed({ bitcoinUnit });

      expect(screen.getByTestId('send-ln-amount-limits')).toHaveTextContent(`enterAmount.limits ${JSON.stringify(formatted)}`);
    });

    it('reads the limits of LNURL-pay too', async () => {
      fakeBreez.parseInput.mockResolvedValue(anLnurlPay(LIMITS));
      await renderParsed({ paymentInput: 'lnurl1shop' });

      typeAmount('5001');
      expect(screen.getByTestId('send-ln-amount-continue')).toBeDisabled();
      expect(screen.getByTestId('send-ln-amount-limits')).toBeOnTheScreen();

      fireEvent.press(screen.getByTestId('delete-key'));
      typeAmount('0');
      expect(screen.getByTestId('send-ln-amount-value')).toHaveTextContent('5000');
      expect(screen.getByTestId('send-ln-amount-continue')).toBeEnabled();
    });

    it.each([
      [BitcoinUnit.Sats, '21000', '210001'],
      [BitcoinUnit.Btc, '0.00021', '0.000211'],
    ])('equal limits pre-fill the Amount (%s); the keypad stays enabled and any other value is outside the limits', async (bitcoinUnit, prefilled, changed) => {
      fakeBreez.parseInput.mockResolvedValue(aLightningAddress({ minSendableMsat: 21_000_000n, maxSendableMsat: 21_000_000n }));
      await renderParsed({ bitcoinUnit });

      await waitFor(() => expect(screen.getByTestId('send-ln-amount-value')).toHaveTextContent(prefilled));
      expect(screen.getByTestId('send-ln-amount-continue')).toBeEnabled();
      expect(screen.queryByTestId('send-ln-amount-limits')).not.toBeOnTheScreen();

      typeAmount('1');

      expect(screen.getByTestId('send-ln-amount-value')).toHaveTextContent(changed);
      expect(screen.getByTestId('send-ln-amount-continue')).toBeDisabled();
      expect(screen.getByTestId('send-ln-amount-limits')).toBeOnTheScreen();

      clearAmount();
      typeAmount(prefilled);
      expect(screen.getByTestId('send-ln-amount-continue')).toBeEnabled();
    });
  });

  describe('Balance validation', () => {
    it('an Amount within the limits but above the Lightning balance shows the insufficient balance message', async () => {
      await renderParsed();

      typeAmount('100001');

      expect(screen.getByTestId('send-ln-amount-insufficient')).toHaveTextContent('enterAmount.insufficientBalance');
      expect(screen.getByTestId('send-ln-amount-continue')).toBeDisabled();
      expect(screen.queryByTestId('send-ln-amount-limits')).not.toBeOnTheScreen();
    });

    it('accepts an Amount equal to the Lightning balance (the Total is checked on the next screen)', async () => {
      await renderParsed();

      typeAmount('100000');

      expect(screen.queryByTestId('send-ln-amount-insufficient')).not.toBeOnTheScreen();
      expect(screen.getByTestId('send-ln-amount-continue')).toBeEnabled();
    });
  });

  describe('Navigation', () => {
    it('Continue opens transaction-details with the Payment Input and the Amount in sats', async () => {
      await renderParsed();

      typeAmount('5432');
      fireEvent.press(screen.getByTestId('send-ln-amount-continue'));

      expect(router.push).toHaveBeenCalledWith({
        pathname: '/send/transaction-details',
        params: { paymentInput: LN_ADDRESS, amountSats: '5432' },
      });
    });

    it('Continue sends the Amount in sats when it is entered in BTC', async () => {
      await renderParsed({ bitcoinUnit: BitcoinUnit.Btc });

      typeAmount('0.00005432');
      fireEvent.press(screen.getByTestId('send-ln-amount-continue'));

      expect(router.push).toHaveBeenCalledWith({
        pathname: '/send/transaction-details',
        params: { paymentInput: LN_ADDRESS, amountSats: '5432' },
      });
    });

    it('does not navigate when amount is zero', async () => {
      await renderParsed();

      fireEvent.press(screen.getByTestId('send-ln-amount-continue'));

      expect(router.push).not.toHaveBeenCalled();
    });
  });
});
