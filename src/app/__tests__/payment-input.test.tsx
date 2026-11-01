jest.mock('bdk-rn', () => require('@/lib/bdk/__tests__/helpers/mock-bdk-rn'));

import React from 'react';

import { aLightningAddress } from '@/lib/payment-input/__tests__/helpers/breez-results';
import { fakeBottomSheet } from '@/lib/payment-input/__tests__/helpers/fake-bottom-sheet';
import { fakeBreez } from '@/lib/payment-input/__tests__/helpers/fake-breez-context';
import { fakeRouter, router } from '@/lib/payment-input/__tests__/helpers/fake-expo-router';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@/lib/test-utils';

import PaymentInputScreen from '../payment-input';

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

jest.mock('@/lib/context', () => {
  const React = require('react');
  return { AppContext: React.createContext({}) };
});

jest.mock('expo-router', () => require('@/lib/payment-input/__tests__/helpers/fake-expo-router'));
jest.mock('@/lib/context/breez-context', () => require('@/lib/payment-input/__tests__/helpers/fake-breez-context'));
jest.mock('@gorhom/bottom-sheet', () => ({ ...require('@gorhom/bottom-sheet/mock'), ...require('@/lib/payment-input/__tests__/helpers/fake-bottom-sheet') }));

const ADDRESS = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
const LN_ADDRESS = 'alice@pay.usegrimm.app';
const LN_ADDRESS_DESTINATION = { pathname: '/send/enter-amount', params: { paymentInput: LN_ADDRESS } };
const ONCHAIN_URI = `bitcoin:${ADDRESS}?amount=0.0001`;
const ONCHAIN_DESTINATION = { pathname: '/send-onchain/enter-amount', params: { recipientAddress: ADDRESS, amountSats: '10000' } };

type AppState = { hasSeedPhrase?: boolean; isDataLoaded?: boolean };

function renderLink(input: string, app: AppState = {}) {
  fakeRouter.setParams({ input });
  const { AppContext } = require('@/lib/context');
  const ui = (state: AppState) => (
    <AppContext.Provider value={{ hasSeedPhrase: true, isDataLoaded: true, ...state }}>
      <PaymentInputScreen />
    </AppContext.Provider>
  );
  const view = render(ui(app));
  return { ...view, setApp: (state: AppState) => view.rerender(ui(state)) };
}

function expectGoneHome() {
  expect(router.dismissAll).toHaveBeenCalledTimes(1);
  expect(router.replace).toHaveBeenCalledWith('/');
  expect(router.dismissAll.mock.invocationCallOrder[0]).toBeLessThan(router.replace.mock.invocationCallOrder[0]);
}

beforeEach(() => {
  fakeBreez.reset();
  fakeRouter.reset();
  fakeBreez.parseInput.mockImplementation(async (input: string) => {
    if (input === LN_ADDRESS) return aLightningAddress({ address: LN_ADDRESS });
    throw new Error(`Unrecognized input: ${input}`);
  });
});

afterEach(() => {
  act(() => fakeBottomSheet.closeWithoutChoice());
  cleanup();
  jest.clearAllMocks();
});

describe('PaymentInputScreen (/payment-input)', () => {
  it('without a Recovery Phrase, replaces with / once the data is loaded', async () => {
    renderLink(LN_ADDRESS, { hasSeedPhrase: false });

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'));
    expect(fakeBreez.parseInput).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it('waits for the data to be loaded', async () => {
    const { setApp } = renderLink(ONCHAIN_URI, { isDataLoaded: false, hasSeedPhrase: false });
    await act(async () => {});

    expect(screen.getByTestId('payment-input-loading')).toBeOnTheScreen();
    expect(router.replace).not.toHaveBeenCalled();

    setApp({ isDataLoaded: true, hasSeedPhrase: true });

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith(ONCHAIN_DESTINATION));
  });

  it('shows "Reading…" while it routes', () => {
    fakeBreez.parseInput.mockReturnValue(new Promise(() => {}));
    renderLink(LN_ADDRESS);

    expect(screen.getByTestId('payment-input-screen')).toBeOnTheScreen();
    expect(screen.getByTestId('payment-input-loading')).toHaveTextContent('paymentInput.reading');
  });

  it('Breez starting, then started: routes once Breez is ready, once', async () => {
    fakeBreez.set({ isBreezInitialized: false });
    renderLink(`lightning:${LN_ADDRESS}`);
    await act(async () => {});

    expect(screen.getByTestId('payment-input-loading')).toBeOnTheScreen();
    expect(screen.queryByTestId('payment-input-error')).not.toBeOnTheScreen();
    expect(fakeBreez.parseInput).not.toHaveBeenCalled();

    await act(async () => fakeBreez.set({ isBreezInitialized: true }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith(LN_ADDRESS_DESTINATION));
    expect(fakeBreez.parseInput).toHaveBeenCalledTimes(1);
    expect(router.push).not.toHaveBeenCalled();
  });

  it('breezError with a Lightning format shows "could not start" with Back', async () => {
    fakeBreez.set({ isBreezInitialized: false, breezError: 'Initialization error' });
    renderLink(`lightning:${LN_ADDRESS}`);

    expect(await screen.findByTestId('payment-input-error')).toHaveTextContent('paymentInput.errors.lightningFailed');
    expect(screen.getByTestId('payment-input-back')).toBeOnTheScreen();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('Breez fails while the link waits for it: "could not start"', async () => {
    fakeBreez.set({ isBreezInitialized: false });
    renderLink(LN_ADDRESS);
    await act(async () => {});

    await act(async () => fakeBreez.set({ breezError: 'Initialization error' }));

    expect(screen.getByTestId('payment-input-error')).toHaveTextContent('paymentInput.errors.lightningFailed');
  });

  it('breezError with an on-chain Bitcoin URI still routes', async () => {
    fakeBreez.set({ isBreezInitialized: false, breezError: 'Initialization error' });
    renderLink(ONCHAIN_URI);

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith(ONCHAIN_DESTINATION));
    expect(screen.queryByTestId('payment-input-error')).not.toBeOnTheScreen();
  });

  it("Back runs dismissAll then replace('/')", async () => {
    renderLink('not-an-invoice');

    expect(await screen.findByTestId('payment-input-error')).toHaveTextContent('paymentInput.errors.unsupported');
    fireEvent.press(screen.getByTestId('payment-input-back'));

    expectGoneHome();
  });

  it('an empty link shows the "unsupported" error', async () => {
    renderLink('lightning:');

    expect(await screen.findByTestId('payment-input-error')).toHaveTextContent('paymentInput.errors.unsupported');
  });

  it("closing the method sheet runs dismissAll then replace('/')", async () => {
    renderLink(`bitcoin:${ADDRESS}?lightning=${LN_ADDRESS}`);
    expect(await screen.findByTestId('send-method-lightning')).toBeOnTheScreen();

    act(() => fakeBottomSheet.closeWithoutChoice());

    expectGoneHome();
  });

  it('replaces itself with the destination, never pushes', async () => {
    renderLink(ONCHAIN_URI);

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith(ONCHAIN_DESTINATION));
    expect(router.push).not.toHaveBeenCalled();
    expect(router.dismissAll).not.toHaveBeenCalled();
  });
});
