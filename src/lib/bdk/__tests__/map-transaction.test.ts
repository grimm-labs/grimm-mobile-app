jest.mock('bdk-rn', () => require('@/lib/bdk/__tests__/helpers/mock-bdk-rn'));

import { ChainPosition, ChainPosition_Tags } from 'bdk-rn';

import { amountSats, createMockTransaction, createMockWallet } from '@/lib/bdk/__tests__/helpers/mock-bdk-rn';
import { mapCanonicalTxToOnchain } from '@/lib/bdk/map-transaction';

describe('mapCanonicalTxToOnchain', () => {
  it('maps receive transactions', () => {
    const tx = createMockTransaction({ txid: 'receive-tx' });
    const wallet = createMockWallet({
      sentAndReceived: jest.fn(() => ({ sent: amountSats(0), received: amountSats(5000) })),
      calculateFee: jest.fn(() => amountSats(100)),
    });

    const canonical = {
      transaction: tx,
      chainPosition: ChainPosition.Confirmed.new({
        confirmationBlockTime: {
          blockId: { height: 100, hash: {} as never },
          confirmationTime: 1700000000n,
        },
      } as never),
    };

    const result = mapCanonicalTxToOnchain(wallet as never, canonical as never);
    expect(result).toEqual({
      txid: 'receive-tx',
      received: 5000,
      sent: 0,
      fee: 100,
      confirmationTime: { height: 100, timestamp: 1700000000 },
    });
  });

  it('maps send transactions', () => {
    const tx = createMockTransaction({ txid: 'send-tx' });
    const wallet = createMockWallet({
      sentAndReceived: jest.fn(() => ({ sent: amountSats(3000), received: amountSats(0) })),
      calculateFee: jest.fn(() => amountSats(250)),
    });

    const result = mapCanonicalTxToOnchain(wallet as never, {
      transaction: tx,
      chainPosition: (ChainPosition.Unconfirmed.new as (arg?: unknown) => unknown)({}),
    } as never);

    expect(result.sent).toBe(3000);
    expect(result.received).toBe(0);
    expect(result.confirmationTime).toBeUndefined();
  });

  it('defaults fee to 0 when calculateFee throws', () => {
    const tx = createMockTransaction();
    const wallet = createMockWallet({
      sentAndReceived: jest.fn(() => ({ sent: amountSats(1000), received: amountSats(0) })),
      calculateFee: jest.fn(() => {
        throw new Error('fee unavailable');
      }),
    });

    const result = mapCanonicalTxToOnchain(wallet as never, {
      transaction: tx,
      chainPosition: { tag: ChainPosition_Tags.Unconfirmed, inner: {} },
    } as never);

    expect(result.fee).toBe(0);
  });
});
