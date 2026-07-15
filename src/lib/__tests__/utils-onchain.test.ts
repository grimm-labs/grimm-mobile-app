jest.mock('bdk-rn', () => require('@/lib/bdk/__tests__/helpers/mock-bdk-rn'));

jest.mock('@breeztech/breez-sdk-spark-react-native', () => ({
  PaymentStatus: { Completed: 'completed' },
  PaymentType: { Receive: 'receive', Send: 'send' },
}));

jest.mock('@/api', () => ({
  supportedBitcoinCurrencies: [],
}));

import { PaymentStatus, PaymentType } from '@breeztech/breez-sdk-spark-react-native';

import type { OnchainTransaction } from '@/lib/bdk';
import { mapOnchainToUnified, mergeAndSortTransactions } from '@/lib/utils';
import { TransactionSource, UnifiedTransactionStatus, UnifiedTransactionType } from '@/types/transaction';

describe('mapOnchainToUnified', () => {
  it('maps receive transactions', () => {
    const tx: OnchainTransaction = {
      txid: 'receive-1',
      received: 5000,
      sent: 0,
      fee: 100,
      confirmationTime: { timestamp: 1700000000, height: 100 },
    };

    const unified = mapOnchainToUnified(tx);
    expect(unified).toMatchObject({
      id: 'receive-1',
      amountSat: 5000,
      feesSat: 100,
      type: UnifiedTransactionType.RECEIVE,
      status: UnifiedTransactionStatus.CONFIRMED,
      source: TransactionSource.ONCHAIN,
    });
  });

  it('maps send transactions', () => {
    const tx: OnchainTransaction = {
      txid: 'send-1',
      received: 0,
      sent: 3000,
      fee: 250,
      confirmationTime: { timestamp: 0 },
    };

    const unified = mapOnchainToUnified(tx);
    expect(unified.type).toBe(UnifiedTransactionType.SEND);
    expect(unified.amountSat).toBe(3250);
    expect(unified.status).toBe(UnifiedTransactionStatus.PENDING);
  });
});

describe('mergeAndSortTransactions', () => {
  it('merges and sorts lightning and on-chain transactions', () => {
    const onchain: OnchainTransaction[] = [
      { txid: 'onchain-old', received: 1000, sent: 0, confirmationTime: { timestamp: 100 } },
      { txid: 'onchain-new', received: 2000, sent: 0, confirmationTime: { timestamp: 300 } },
    ];

    const lightning = [
      {
        id: 'ln-1',
        timestamp: 200n,
        amount: 500n,
        fees: 1n,
        paymentType: PaymentType.Receive,
        status: PaymentStatus.Completed,
      },
    ] as never;

    const merged = mergeAndSortTransactions(lightning, onchain);
    expect(merged.map((tx) => tx.id)).toEqual(['onchain-new', 'ln-1', 'onchain-old']);
  });
});
