jest.mock('bdk-rn', () => require('@/lib/bdk/__tests__/helpers/mock-bdk-rn'));

import { createMockBalance, createMockWallet } from '@/lib/bdk/__tests__/helpers/mock-bdk-rn';
import { balanceToSats } from '@/lib/bdk/balance';

describe('balanceToSats', () => {
  it('converts balance amounts to sats', () => {
    const wallet = createMockWallet({
      balance: jest.fn(() => createMockBalance({ confirmed: 1000, trustedPending: 200, untrustedPending: 50 })),
    });

    const result = balanceToSats(wallet.balance());
    expect(result).toEqual({
      total: 1250,
      confirmed: 1000,
      unconfirmed: 250,
    });
  });
});
