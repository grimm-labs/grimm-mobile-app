jest.mock('bdk-rn', () => require('@/lib/bdk/__tests__/helpers/mock-bdk-rn'));

import { Persister, Wallet } from 'bdk-rn';

import { createMockWallet } from '@/lib/bdk/__tests__/helpers/mock-bdk-rn';
import { createOrLoadWallet, isWalletPersistenceError, readWalletSnapshot } from '@/lib/bdk/wallet';

describe('createOrLoadWallet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a fresh wallet when no db exists', async () => {
    const mockWallet = createMockWallet();
    (Wallet as unknown as jest.Mock).mockImplementationOnce(() => mockWallet);

    const session = await createOrLoadWallet('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about', 'testnet', '/tmp/wallet.db', {
      hasExistingDb: async () => false,
      deleteDb: async () => undefined,
    });

    expect(Persister.newSqlite).toHaveBeenCalledWith('/tmp/wallet.db');
    expect(Wallet.load).not.toHaveBeenCalled();
    expect(session.wallet).toBe(mockWallet);
  });

  it('loads an existing wallet when db exists', async () => {
    const mockWallet = createMockWallet();
    (Wallet.load as unknown as jest.Mock).mockReturnValueOnce(mockWallet);

    const session = await createOrLoadWallet('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about', 'testnet', '/tmp/wallet.db', {
      hasExistingDb: async () => true,
      deleteDb: async () => undefined,
    });

    expect(Wallet.load).toHaveBeenCalled();
    expect(session.wallet).toBe(mockWallet);
  });

  it('falls back to fresh wallet when load fails with persistence error', async () => {
    const mockWallet = createMockWallet();
    (Wallet.load as unknown as jest.Mock).mockImplementationOnce(() => {
      throw new Error('CouldNotLoad');
    });
    (Wallet as unknown as jest.Mock).mockImplementationOnce(() => mockWallet);
    const deleteDb = jest.fn(async () => undefined);

    const session = await createOrLoadWallet('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about', 'testnet', '/tmp/wallet.db', {
      hasExistingDb: async () => true,
      deleteDb,
    });

    expect(deleteDb).toHaveBeenCalled();
    expect(session.wallet).toBe(mockWallet);
  });
});

describe('isWalletPersistenceError', () => {
  it('detects persistence-related errors', () => {
    expect(isWalletPersistenceError(new Error('CouldNotLoad'))).toBe(true);
    expect(isWalletPersistenceError(new Error('LoadWithPersistException'))).toBe(true);
    expect(isWalletPersistenceError(new Error('network timeout'))).toBe(false);
  });
});

describe('readWalletSnapshot', () => {
  it('reads balance and transactions from wallet', () => {
    const wallet = createMockWallet({
      balance: jest.fn(() => ({
        confirmed: { toSat: () => 1000n },
        trustedPending: { toSat: () => 100n },
        untrustedPending: { toSat: () => 50n },
        total: { toSat: () => 1150n },
      })),
      transactions: jest.fn(() => []),
    });

    const snapshot = readWalletSnapshot(wallet as never);
    expect(snapshot.balance).toBe(1150);
    expect(snapshot.confirmedBalance).toBe(1000);
    expect(snapshot.unconfirmedBalance).toBe(150);
    expect(snapshot.transactions).toEqual([]);
  });
});
