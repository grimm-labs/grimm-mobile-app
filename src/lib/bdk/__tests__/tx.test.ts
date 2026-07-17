jest.mock('bdk-rn', () => require('@/lib/bdk/__tests__/helpers/mock-bdk-rn'));

import { Network } from 'bdk-rn';

import { createMockTransaction, createMockWallet } from '@/lib/bdk/__tests__/helpers/mock-bdk-rn';
import { buildAndSignTransaction, estimateTransactionFee } from '@/lib/bdk/tx';

describe('tx helpers', () => {
  it('builds, signs and extracts a transaction', () => {
    const wallet = createMockWallet();
    const persister = {};
    const tx = createMockTransaction({ txid: 'signed-tx' });
    const { Psbt } = require('@/lib/bdk/__tests__/helpers/mock-bdk-rn');
    (Psbt as jest.Mock).mockImplementationOnce(() => ({
      extractTx: jest.fn(() => tx),
    }));

    const result = buildAndSignTransaction(wallet as never, persister as never, 'tb1qtest', 1000, 2, Network.Testnet);

    expect(wallet.sign).toHaveBeenCalled();
    expect(wallet.finalizePsbt).toHaveBeenCalled();
    expect(wallet.persist).toHaveBeenCalledWith(persister);
    expect(result.computeTxid().toString()).toBe('signed-tx');
  });

  it('estimates fee from vsize and fee rate', () => {
    const wallet = createMockWallet();
    const persister = {};
    const tx = createMockTransaction({ vsize: 200 });
    const { Psbt } = require('@/lib/bdk/__tests__/helpers/mock-bdk-rn');
    (Psbt as jest.Mock).mockImplementationOnce(() => ({
      extractTx: jest.fn(() => tx),
    }));

    expect(estimateTransactionFee(wallet as never, persister as never, 'tb1qtest', 1000, 2, Network.Testnet)).toBe(400);
  });
});
