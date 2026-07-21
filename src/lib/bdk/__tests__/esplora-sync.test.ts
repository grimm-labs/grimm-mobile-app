jest.mock('bdk-rn', () => require('@/lib/bdk/__tests__/helpers/mock-bdk-rn'));

import { createMockEsploraClient, createMockTransaction, createMockWallet } from '@/lib/bdk/__tests__/helpers/mock-bdk-rn';
import { syncWalletWithEsplora } from '@/lib/bdk/esplora';

describe('syncWalletWithEsplora', () => {
  it('runs fullScan when wallet has no transactions', async () => {
    const wallet = createMockWallet({ transactions: jest.fn(() => []) });
    const persister = {};
    const client = createMockEsploraClient();

    await syncWalletWithEsplora(wallet as never, persister as never, client as never);

    expect(wallet.startFullScan).toHaveBeenCalled();
    expect(client.fullScan).toHaveBeenCalled();
    expect(wallet.startSyncWithRevealedSpks).toHaveBeenCalled();
    expect(client.sync).toHaveBeenCalled();
    expect(wallet.persist).toHaveBeenCalledWith(persister);
  });

  it('skips fullScan when wallet already has transactions', async () => {
    const wallet = createMockWallet({
      transactions: jest.fn(() => [{ transaction: createMockTransaction(), chainPosition: {} } as never]),
    });
    const persister = {};
    const client = createMockEsploraClient();

    await syncWalletWithEsplora(wallet as never, persister as never, client as never);

    expect(wallet.startFullScan).not.toHaveBeenCalled();
    expect(client.fullScan).not.toHaveBeenCalled();
    expect(client.sync).toHaveBeenCalled();
    expect(wallet.persist).toHaveBeenCalledWith(persister);
  });

  it('propagates sync errors', async () => {
    const wallet = createMockWallet({ transactions: jest.fn(() => [{ transaction: createMockTransaction(), chainPosition: {} } as never]) });
    const client = createMockEsploraClient({
      sync: jest.fn(async () => {
        throw new Error('status=429, errorMessage=Too Many Requests');
      }),
    });

    await expect(syncWalletWithEsplora(wallet as never, {} as never, client as never)).rejects.toThrow('429');
  });
});
