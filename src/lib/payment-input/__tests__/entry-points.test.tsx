jest.mock('bdk-rn', () => require('@/lib/bdk/__tests__/helpers/mock-bdk-rn'));

import React from 'react';

import PaymentInputScreen from '@/app/payment-input';
import ScanQrScreen from '@/app/scan-qr/_layout';
import LightningPaymentScreen from '@/app/send/enter-address';
import OnchainAddressScreen from '@/app/send-onchain/enter-address';
import type { InputType } from '@/lib/context/breez-context';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@/lib/test-utils';

import { aBitcoinAddress, aLightningAddress, anInvoice, anLnurlAuth, anLnurlPay, anLnurlWithdraw, aParseResult } from './helpers/breez-results';
import { fakeBottomSheet } from './helpers/fake-bottom-sheet';
import { AppNetwork, BitcoinNetwork, fakeBreez, InputType_Tags } from './helpers/fake-breez-context';
import { fakeCamera } from './helpers/fake-expo-camera';
import { fakeRouter, router } from './helpers/fake-expo-router';

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

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { Ionicons: (props: Record<string, unknown>) => <View {...props} /> };
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

jest.mock('@/lib/context', () => {
  const React = require('react');
  return { AppContext: React.createContext({ hasSeedPhrase: true, isDataLoaded: true }) };
});

jest.mock('expo-router', () => require('@/lib/payment-input/__tests__/helpers/fake-expo-router'));
jest.mock('expo-camera', () => require('@/lib/payment-input/__tests__/helpers/fake-expo-camera'));
jest.mock('@/lib/context/breez-context', () => require('@/lib/payment-input/__tests__/helpers/fake-breez-context'));
jest.mock('@gorhom/bottom-sheet', () => ({ ...require('@gorhom/bottom-sheet/mock'), ...require('@/lib/payment-input/__tests__/helpers/fake-bottom-sheet') }));

// BIP173 test vectors
const MAINNET_ADDRESS = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
const TESTNET_ADDRESS = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
const INVOICE = 'lnbc10u1invoicewithamount';
const INVOICE_WITHOUT_AMOUNT = 'lnbc1invoicewithoutamount';
const REGTEST_INVOICE = 'lnbcrt10u1regtestinvoice';
const LN_ADDRESS = 'alice@pay.usegrimm.app';
const LNURL_PAY = 'lnurl1dp68gurn8ghj7pay';

// What the Breez parse returns for each Lightning format of the table; anything else is rejected, like unknown text
const BREEZ_RESULTS: Record<string, InputType> = {
  [INVOICE]: anInvoice({ bolt11: INVOICE, amountSats: 1000, network: BitcoinNetwork.Bitcoin }),
  [INVOICE_WITHOUT_AMOUNT]: anInvoice({ bolt11: INVOICE_WITHOUT_AMOUNT, network: BitcoinNetwork.Bitcoin }),
  [REGTEST_INVOICE]: anInvoice({ bolt11: REGTEST_INVOICE, amountSats: 1000, network: BitcoinNetwork.Regtest }),
  [LN_ADDRESS]: aLightningAddress({ address: LN_ADDRESS }),
  [LNURL_PAY]: anLnurlPay(),
  lnurlwithdraw: anLnurlWithdraw(),
  lnurlauth: anLnurlAuth(),
  lno1bolt12offer: aParseResult(InputType_Tags.Bolt12Offer),
  [`not-an-address-${MAINNET_ADDRESS}`]: aBitcoinAddress(),
};

type Destination = { pathname: string; params: Record<string, string> };
type Case = {
  name: string;
  input: string;
  network?: AppNetwork;
  destination?: Destination;
  error?: string;
  sheet?: boolean;
};

const transactionDetails = (rawInvoice: string): Destination => ({ pathname: '/send/transaction-details', params: { rawInvoice } });
const lightningAmount = (paymentInput: string): Destination => ({ pathname: '/send/enter-amount', params: { paymentInput } });
const onchainAmount = (params: Record<string, string>): Destination => ({ pathname: '/send-onchain/enter-amount', params });

// One table for the four entry points (spec, Part 2): add a row here and it runs against all of them
const CASES: Case[] = [
  { name: 'Invoice with an Amount', input: INVOICE, destination: transactionDetails(INVOICE) },
  { name: 'lightning:<Invoice> in any case', input: `LIGHTNING:${INVOICE}`, destination: transactionDetails(INVOICE) },
  { name: 'Invoice without an Amount', input: INVOICE_WITHOUT_AMOUNT, destination: lightningAmount(INVOICE_WITHOUT_AMOUNT) },
  { name: 'Lightning Address', input: LN_ADDRESS, destination: lightningAmount(LN_ADDRESS) },
  { name: 'LNURL-pay', input: LNURL_PAY, destination: lightningAmount(LNURL_PAY) },
  { name: "address of the app's network (mainnet)", input: MAINNET_ADDRESS, destination: onchainAmount({ recipientAddress: MAINNET_ADDRESS }) },
  { name: "address of the app's network (testnet)", input: TESTNET_ADDRESS, network: AppNetwork.TESTNET, destination: onchainAmount({ recipientAddress: TESTNET_ADDRESS }) },
  { name: 'Bitcoin URI with an amount', input: `bitcoin:${MAINNET_ADDRESS}?amount=0.0001&label=Shop`, destination: onchainAmount({ recipientAddress: MAINNET_ADDRESS, amountSats: '10000' }) },
  { name: 'Bitcoin URI without an amount', input: `BITCOIN:${MAINNET_ADDRESS}`, destination: onchainAmount({ recipientAddress: MAINNET_ADDRESS }) },
  { name: 'Bitcoin URI with lightning=', input: `bitcoin:${MAINNET_ADDRESS}?amount=0.0001&lightning=${INVOICE}`, sheet: true },
  { name: 'bitcoin:?lightning=<Invoice> (no sheet)', input: `bitcoin:?lightning=${INVOICE}`, destination: transactionDetails(INVOICE) },
  { name: 'Invoice on Regtest (testnet)', input: REGTEST_INVOICE, network: AppNetwork.TESTNET, destination: transactionDetails(REGTEST_INVOICE) },
  { name: 'address of the other network (mainnet)', input: TESTNET_ADDRESS, error: 'paymentInput.errors.otherNetworkAddress' },
  { name: 'address of the other network (testnet)', input: MAINNET_ADDRESS, network: AppNetwork.TESTNET, error: 'paymentInput.errors.otherNetworkAddress' },
  { name: 'Invoice of another network (Regtest on mainnet)', input: REGTEST_INVOICE, error: 'paymentInput.errors.otherNetworkInvoice' },
  { name: 'Invoice of another network (Bitcoin on testnet)', input: INVOICE, network: AppNetwork.TESTNET, error: 'paymentInput.errors.otherNetworkInvoice' },
  { name: 'invalid Bitcoin URI', input: `bitcoin:${MAINNET_ADDRESS}?amount=1,5`, error: 'paymentInput.errors.unsupported' },
  { name: 'LNURL-withdraw (until Part 3)', input: 'lnurlwithdraw', error: 'paymentInput.errors.unsupported' },
  { name: 'LNURL-auth (until Part 4)', input: 'lnurlauth', error: 'paymentInput.errors.unsupported' },
  { name: 'BOLT12 offer', input: 'lno1bolt12offer', error: 'paymentInput.errors.unsupported' },
  { name: 'unknown text', input: 'not-an-invoice', error: 'paymentInput.errors.unsupported' },
];

type EntryPoint = {
  name: string;
  navigation: 'push' | 'replace';
  /** Opens the entry point and gives it the Payment Input. */
  submit: (input: string) => Promise<void>;
  expectError: (message: string) => Promise<void>;
};

function renderPasteScreen(Screen: React.ComponentType, inputId: string, continueId: string) {
  return async (input: string) => {
    render(<Screen />);
    fireEvent.changeText(screen.getByTestId(inputId), input);
    await act(async () => fireEvent.press(screen.getByTestId(continueId)));
  };
}

const expectFlashMessage = async (message: string) => {
  await waitFor(() => expect(mockShowErrorMessage).toHaveBeenCalledWith(message));
};

const ENTRY_POINTS: EntryPoint[] = [
  {
    name: 'scanner',
    navigation: 'push',
    submit: async (input) => {
      render(<ScanQrScreen />);
      await act(() => fakeCamera.scan(input));
    },
    expectError: expectFlashMessage,
  },
  { name: 'Lightning paste screen', navigation: 'push', submit: renderPasteScreen(LightningPaymentScreen, 'send-ln-address-input', 'send-ln-address-continue'), expectError: expectFlashMessage },
  { name: 'on-chain paste screen', navigation: 'push', submit: renderPasteScreen(OnchainAddressScreen, 'send-onchain-address-input', 'send-onchain-address-continue'), expectError: expectFlashMessage },
  {
    name: '/payment-input',
    navigation: 'replace',
    submit: async (input) => {
      fakeRouter.setParams({ input });
      render(<PaymentInputScreen />);
      await act(async () => {});
    },
    expectError: async (message) => {
      expect(await screen.findByTestId('payment-input-error')).toHaveTextContent(message);
      expect(screen.getByTestId('payment-input-back')).toBeOnTheScreen();
    },
  },
];

const otherNavigation = (navigation: 'push' | 'replace') => (navigation === 'push' ? 'replace' : 'push');

beforeEach(() => {
  fakeBreez.reset();
  fakeRouter.reset();
  fakeCamera.reset();
  fakeBreez.parseInput.mockImplementation(async (input: string) => {
    const result = BREEZ_RESULTS[input];
    if (!result) throw new Error(`Unrecognized input: ${input}`);
    return result;
  });
});

afterEach(() => {
  act(() => fakeBottomSheet.closeWithoutChoice());
  cleanup();
  jest.clearAllMocks();
  jest.useRealTimers();
});

describe.each(ENTRY_POINTS)('$name', ({ name, navigation, submit, expectError }) => {
  describe('the routing table', () => {
    it.each(CASES)(`${name}: $name`, async ({ input, network, destination, error, sheet }) => {
      if (network) fakeBreez.set({ network });

      await submit(input);

      if (destination) {
        await waitFor(() => expect(router[navigation]).toHaveBeenCalledWith(destination));
        expect(router[navigation]).toHaveBeenCalledTimes(1);
        expect(router[otherNavigation(navigation)]).not.toHaveBeenCalled();
        expect(mockShowErrorMessage).not.toHaveBeenCalled();
      }
      if (error) {
        await expectError(error);
        expect(router.push).not.toHaveBeenCalled();
        expect(router.replace).not.toHaveBeenCalled();
      }
      if (sheet) {
        expect(await screen.findByTestId('send-method-lightning')).toBeOnTheScreen();
        expect(screen.getByTestId('send-method-onchain')).toBeOnTheScreen();
        expect(router.push).not.toHaveBeenCalled();
        expect(router.replace).not.toHaveBeenCalled();
      }
      // Opening a Payment Input never pays (P2-20)
      expect(fakeBreez.executeSend).not.toHaveBeenCalled();
      expect(fakeBreez.executeLnurlPay).not.toHaveBeenCalled();
    });
  });

  describe('the method sheet', () => {
    const URI_WITH_INVOICE = `bitcoin:${MAINNET_ADDRESS}?amount=0.0001&lightning=${INVOICE}`;

    it(`${name}: Lightning routes the lightning= value`, async () => {
      await submit(URI_WITH_INVOICE);

      fireEvent.press(await screen.findByTestId('send-method-lightning'));

      await waitFor(() => expect(router[navigation]).toHaveBeenCalledWith(transactionDetails(INVOICE)));
      expect(router.dismissAll).not.toHaveBeenCalled();
    });

    it(`${name}: on-chain keeps the address and the URI's amount`, async () => {
      await submit(URI_WITH_INVOICE);

      fireEvent.press(await screen.findByTestId('send-method-onchain'));

      await waitFor(() => expect(router[navigation]).toHaveBeenCalledWith(onchainAmount({ recipientAddress: MAINNET_ADDRESS, amountSats: '10000' })));
      expect(router.dismissAll).not.toHaveBeenCalled();
      expect(fakeBreez.parseInput).not.toHaveBeenCalled();
    });

    it(`${name}: Lightning with a value that is not a Lightning format → unsupported`, async () => {
      await submit(`bitcoin:${MAINNET_ADDRESS}?lightning=not-an-address-${MAINNET_ADDRESS}`);

      fireEvent.press(await screen.findByTestId('send-method-lightning'));

      await expectError('paymentInput.errors.unsupported');
      expect(router[navigation]).not.toHaveBeenCalled();
    });

    it(`${name}: Breez not started, the sheet still shows and Lightning gives the "starting" error`, async () => {
      fakeBreez.set({ isBreezInitialized: false });
      await submit(URI_WITH_INVOICE);

      fireEvent.press(await screen.findByTestId('send-method-lightning'));

      await expectError('paymentInput.errors.lightningStarting');
      expect(fakeBreez.parseInput).not.toHaveBeenCalled();
      expect(router[navigation]).not.toHaveBeenCalled();
    });
  });

  describe('Breez not started', () => {
    beforeEach(() => fakeBreez.set({ isBreezInitialized: false }));

    it.each([
      ['a plain address', MAINNET_ADDRESS, onchainAmount({ recipientAddress: MAINNET_ADDRESS })],
      ['a Bitcoin URI without lightning=', `bitcoin:${MAINNET_ADDRESS}?amount=0.0001`, onchainAmount({ recipientAddress: MAINNET_ADDRESS, amountSats: '10000' })],
    ])(`${name}: %s still reaches send-onchain/enter-amount`, async (_case, input, destination) => {
      await submit(input);

      await waitFor(() => expect(router[navigation]).toHaveBeenCalledWith(destination));
      expect(fakeBreez.parseInput).not.toHaveBeenCalled();
    });
  });
});

describe.each(ENTRY_POINTS.filter(({ name }) => name !== '/payment-input'))('$name, Breez not started', ({ name, submit, expectError }) => {
  // /payment-input waits for Breez instead (src/app/__tests__/payment-input.test.tsx)
  it.each([INVOICE, `lightning:${INVOICE}`, INVOICE_WITHOUT_AMOUNT, LN_ADDRESS, LNURL_PAY, 'lnurlwithdraw', 'lnurlauth', 'not-an-invoice'])(`${name}: %s gives the "starting" error`, async (input) => {
    fakeBreez.set({ isBreezInitialized: false });

    await submit(input);

    await expectError('paymentInput.errors.lightningStarting');
    expect(fakeBreez.parseInput).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });
});

describe('scanner', () => {
  it('shows the error as a flash message, then scans again after the 3-second pause', async () => {
    jest.useFakeTimers();
    render(<ScanQrScreen />);

    await act(() => fakeCamera.scan('not-an-invoice'));

    expect(mockShowErrorMessage).toHaveBeenCalledWith('paymentInput.errors.unsupported');
    expect(fakeCamera.isScanning()).toBe(false);
    act(() => jest.advanceTimersByTime(2999));
    expect(fakeCamera.isScanning()).toBe(false);
    act(() => jest.advanceTimersByTime(1));
    expect(fakeCamera.isScanning()).toBe(true);

    await act(() => fakeCamera.scan(INVOICE));
    expect(router.push).toHaveBeenCalledWith(transactionDetails(INVOICE));
  });

  it('an unknown QR code never navigates', async () => {
    render(<ScanQrScreen />);

    await act(() => fakeCamera.scan('https://example.com/not-a-payment'));

    expect(router.push).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
    expect(mockShowErrorMessage).toHaveBeenCalledWith('paymentInput.errors.unsupported');
  });

  it('does not scan while the method sheet is open, and scans again once it is closed without a choice', async () => {
    jest.useFakeTimers();
    render(<ScanQrScreen />);

    await act(() => fakeCamera.scan(`bitcoin:${MAINNET_ADDRESS}?lightning=${INVOICE}`));
    act(() => jest.advanceTimersByTime(5000));
    expect(screen.getByTestId('send-method-lightning')).toBeOnTheScreen();
    expect(fakeCamera.isScanning()).toBe(false);

    act(() => fakeBottomSheet.closeWithoutChoice());

    expect(fakeCamera.isScanning()).toBe(true);
    expect(router.push).not.toHaveBeenCalled();
  });

  it('pushes the destination', async () => {
    render(<ScanQrScreen />);

    await act(() => fakeCamera.scan(LN_ADDRESS));

    expect(router.push).toHaveBeenCalledWith(lightningAmount(LN_ADDRESS));
    expect(router.replace).not.toHaveBeenCalled();
  });
});

describe.each([
  { name: 'Lightning paste screen', Screen: LightningPaymentScreen, inputId: 'send-ln-address-input', continueId: 'send-ln-address-continue', emptyMessage: 'lightningPayment.errors.invalidInvoice' },
  { name: 'on-chain paste screen', Screen: OnchainAddressScreen, inputId: 'send-onchain-address-input', continueId: 'send-onchain-address-continue', emptyMessage: 'onchainSend.enterAddress.errors.invalidAddress' },
])('$name', ({ Screen, inputId, continueId, emptyMessage }) => {
  async function pasteAndContinue(input: string) {
    render(<Screen />);
    fireEvent.changeText(screen.getByTestId(inputId), input);
    await act(async () => fireEvent.press(screen.getByTestId(continueId)));
  }

  it('an empty Payment Input shows its own message, without the Breez parse', async () => {
    await pasteAndContinue('   ');

    expect(mockShowErrorMessage).toHaveBeenCalledWith(emptyMessage);
    expect(fakeBreez.parseInput).not.toHaveBeenCalled();
  });

  it('shows the error as a flash message and keeps the input', async () => {
    await pasteAndContinue('not-an-invoice');

    expect(mockShowErrorMessage).toHaveBeenCalledWith('paymentInput.errors.unsupported');
    expect(screen.getByTestId(inputId).props.value).toBe('not-an-invoice');
    expect(router.push).not.toHaveBeenCalled();
  });

  it('closing the method sheet keeps the input and does not navigate', async () => {
    const input = `bitcoin:${MAINNET_ADDRESS}?lightning=${INVOICE}`;
    await pasteAndContinue(input);
    expect(screen.getByTestId('send-method-lightning')).toBeOnTheScreen();

    act(() => fakeBottomSheet.closeWithoutChoice());

    expect(screen.queryByTestId('send-method-lightning')).not.toBeOnTheScreen();
    expect(screen.getByTestId(inputId).props.value).toBe(input);
    expect(router.push).not.toHaveBeenCalled();
    expect(router.back).not.toHaveBeenCalled();
    expect(router.dismissAll).not.toHaveBeenCalled();
  });
});
