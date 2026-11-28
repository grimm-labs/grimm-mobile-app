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

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});
jest.mock('@/components/ui/focus-aware-status-bar', () => ({ FocusAwareStatusBar: () => null }));
jest.mock('@/components/transaction', () => {
  const { Text } = require('react-native');
  return { TransactionItem: ({ transaction }: { transaction: { id: string } }) => <Text testID={`row-${transaction.id}`}>{transaction.id}</Text> };
});

// The real merge, without the rest of @/lib
jest.mock('@/lib', () => ({ mergeAndSortTransactions: jest.requireActual('@/lib/utils').mergeAndSortTransactions }));

const mockBreez = { payments: [] as unknown[], unclaimedDeposits: [] as unknown[] };
jest.mock('@/lib/context/breez-context', () => ({ useBreez: () => mockBreez }));
const mockBdk = { transactions: [] as unknown[] };
jest.mock('@/lib/context', () => ({ useBdk: () => mockBdk }));

import { fakeDeposit, instantStatus, InstantClaimStatus_Tags, PaymentStatus, PaymentType } from '@/lib/breez/__tests__/helpers/fake-breez-sdk';

import Transactions from '../transactions';

const completedPayment = { id: 'ln-paid', timestamp: BigInt(200), amount: BigInt(500), fees: BigInt(0), paymentType: PaymentType.Receive, status: PaymentStatus.Completed };
const onchainTx = { txid: 'onchain-tx', received: 2_000, sent: 0, confirmationTime: { timestamp: 300 } };

describe('Transactions tab with on-chain deposits', () => {
  beforeEach(() => {
    mockBreez.payments = [completedPayment];
    mockBreez.unclaimedDeposits = [fakeDeposit({ txid: 'confirming', isMature: false }), fakeDeposit({ txid: 'credited', instantClaimStatus: instantStatus(InstantClaimStatus_Tags.Claimed) })];
    mockBdk.transactions = [onchainTx];
  });

  afterEach(() => {
    cleanup();
  });

  it('lists a deposit not credited yet first, and never a credited one', () => {
    setup(<Transactions />);

    const rows = screen.getAllByTestId(/^row-/).map((row) => row.props.testID);
    expect(rows).toEqual(['row-deposit:confirming:0', 'row-onchain-tx', 'row-ln-paid']);
  });

  it.each([
    ['pending', ['row-deposit:confirming:0']],
    ['lightning', ['row-deposit:confirming:0', 'row-ln-paid']],
    ['confirmed', ['row-onchain-tx', 'row-ln-paid']],
    ['onchain', ['row-onchain-tx']],
  ])('keeps the deposit in the Lightning and Pending filters only (%s)', async (filter, expected) => {
    const { user } = setup(<Transactions />);

    await user.press(screen.getByTestId(`transactions-filter-${filter}`));

    expect(screen.getAllByTestId(/^row-/).map((row) => row.props.testID)).toEqual(expected);
  });
});
