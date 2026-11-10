import React from 'react';

import { fakeRouter, router } from '@/lib/payment-input/__tests__/helpers/fake-expo-router';
import { cleanup, fireEvent, render, screen } from '@/lib/test-utils';
import { BitcoinUnit } from '@/types/enum';

import PendingScreen from '../pending-screen';

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

jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: jest.fn() },
  useTranslation: () => ({ t: mockT }),
}));

jest.mock('expo-router', () => require('@/lib/payment-input/__tests__/helpers/fake-expo-router'));

jest.mock('@/lib/context', () => {
  const React = require('react');
  return { AppContext: React.createContext({}) };
});

jest.mock('@/lib/stack-screen-options', () => ({
  useStackScreenOptions: () => ({}),
}));

jest.mock('@/lib', () => jest.requireActual('@/lib/bitcoin-amount'));

function renderPending(params: { transactionType: string; satsAmount: string }, bitcoinUnit = BitcoinUnit.Sats) {
  fakeRouter.setParams(params);
  const { AppContext } = require('@/lib/context');
  return render(
    <AppContext.Provider value={{ bitcoinUnit }}>
      <PendingScreen />
    </AppContext.Provider>,
  );
}

beforeEach(() => fakeRouter.reset());

afterEach(cleanup);

describe('PendingScreen (transaction-result/pending-screen)', () => {
  it('sent mode: "Payment in progress", the Amount, then the note', () => {
    renderPending({ transactionType: 'sent', satsAmount: '21000' });

    expect(screen.getByTestId('transaction-pending-screen')).toBeOnTheScreen();
    expect(screen.getByTestId('transaction-pending-title')).toHaveTextContent('transaction.pending.sentTitle');
    expect(screen.getByTestId('transaction-pending-amount')).toHaveTextContent('21,000 SATS');
    expect(screen.getByText('transaction.pending.note')).toBeOnTheScreen();
    expect(screen.queryByText('transaction.pending.receivedTitle')).not.toBeOnTheScreen();
  });

  it('received mode: "Withdrawal in progress", the Amount, then the note', () => {
    renderPending({ transactionType: 'received', satsAmount: '5000' });

    expect(screen.getByTestId('transaction-pending-title')).toHaveTextContent('transaction.pending.receivedTitle');
    expect(screen.getByTestId('transaction-pending-amount')).toHaveTextContent('5,000 SATS');
    expect(screen.getByText('transaction.pending.note')).toBeOnTheScreen();
    expect(screen.queryByText('transaction.pending.sentTitle')).not.toBeOnTheScreen();
  });

  it("shows the Amount in the user's unit (BTC)", () => {
    renderPending({ transactionType: 'sent', satsAmount: '10000' }, BitcoinUnit.Btc);

    expect(screen.getByTestId('transaction-pending-amount')).toHaveTextContent('0.00010000 BTC');
  });

  it("OK runs dismissAll then replace('/')", () => {
    renderPending({ transactionType: 'sent', satsAmount: '21000' });

    fireEvent.press(screen.getByTestId('transaction-pending-ok'));

    expect(router.dismissAll).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith('/');
    expect(router.dismissAll.mock.invocationCallOrder[0]).toBeLessThan(router.replace.mock.invocationCallOrder[0]);
    expect(router.push).not.toHaveBeenCalled();
  });
});
