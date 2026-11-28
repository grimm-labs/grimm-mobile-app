import React from 'react';

import { cleanup, screen, setup } from '@/lib/test-utils';

jest.mock('@breeztech/breez-sdk-spark-react-native', () => require('@/lib/breez/__tests__/helpers/fake-breez-sdk'));
jest.mock('bdk-rn', () => require('@/lib/bdk/__tests__/helpers/mock-bdk-rn'));
jest.mock('@/api', () => ({ supportedBitcoinCurrencies: [] }));

const mockT = (key: string) => key;
jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: jest.fn() },
  useTranslation: () => ({ t: mockT }),
}));

const mockRouter = { push: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  return { Ionicons: (props: { name: string }) => <Text>{props.name}</Text> };
});

jest.mock('@/lib', () => ({ ...jest.requireActual('@/lib/bitcoin-amount') }));
jest.mock('@/lib/context', () => ({
  AppContext: require('react').createContext({ bitcoinUnit: 'SATS', hideBalance: false }),
}));

import { fakeDeposit, feeTooHigh } from '@/lib/breez/__tests__/helpers/fake-breez-sdk';
import { mapDepositToUnified } from '@/lib/utils';
import { TransactionSource, UnifiedTransactionStatus, UnifiedTransactionType } from '@/types/transaction';

import { TransactionItem } from '../transaction';

const payment = {
  id: 'payment-1',
  timestamp: Math.floor(Date.now() / 1000),
  amountSat: 2_000,
  feesSat: 0,
  type: UnifiedTransactionType.RECEIVE,
  status: UnifiedTransactionStatus.CONFIRMED,
  source: TransactionSource.LIGHTNING,
  lightningData: { id: 'payment-1' } as never,
};

describe('TransactionItem', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('shows a deposit not credited yet with its state instead of a date', () => {
    const deposit = fakeDeposit({ txid: 'abc', vout: 1, amountSats: BigInt(75_000), claimError: feeTooHigh(800) });
    setup(<TransactionItem transaction={mapDepositToUnified(deposit, 1_700_000_000)} />);

    expect(screen.getByText('deposits.rowLabel')).toBeOnTheScreen();
    expect(screen.getByText('deposits.state.needsFeeApproval')).toBeOnTheScreen();
    expect(screen.queryByText(/transactionItem\.date/)).not.toBeOnTheScreen();
    expect(screen.getByText('+75,000 SATS')).toBeOnTheScreen();
  });

  it('opens the deposits screen when a deposit is pressed', async () => {
    const deposit = fakeDeposit({ txid: 'abc', vout: 1, isMature: false });
    const { user } = setup(<TransactionItem transaction={mapDepositToUnified(deposit, 1_700_000_000)} />);

    await user.press(screen.getByTestId('transaction-deposit-abc-1'));

    expect(mockRouter.push).toHaveBeenCalledWith('/wallets/unclaimed-deposits');
  });

  it('still shows a payment with its date and status, and opens its details', async () => {
    const { user } = setup(<TransactionItem transaction={payment} />);

    expect(screen.getByText('transactionItem.received')).toBeOnTheScreen();
    expect(screen.getByText('transactionItem.date.today • transactionItem.status.confirmed')).toBeOnTheScreen();

    await user.press(screen.getByText('transactionItem.received'));

    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringMatching(/^\/transaction-details\/ln\?transactionData=/));
  });
});
