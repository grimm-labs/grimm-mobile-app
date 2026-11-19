jest.mock('bdk-rn', () => require('@/lib/bdk/__tests__/helpers/mock-bdk-rn'));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import { createMockEsploraClient, createMockWallet } from '@/lib/bdk/__tests__/helpers/mock-bdk-rn';
import { BdkProvider, useBdk } from '@/lib/context/bdk-context';

const mockGetSeedPhrase = jest.fn();
jest.mock('@/lib/hooks/use-secure-storage', () => ({
  useSecureStorage: () => ({ getItem: mockGetSeedPhrase }),
}));

let mockBreezNetwork = 'testnet';
jest.mock('@/lib/context/breez-context', () => ({
  useBreez: () => ({ network: mockBreezNetwork }),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock/documents/',
  getInfoAsync: jest.fn(async () => ({ exists: false })),
  deleteAsync: jest.fn(async () => {}),
}));

const mockCreateOrLoadWallet = jest.fn();
const mockReadWalletSnapshot = jest.fn();
const mockSyncWalletWithEsplora = jest.fn();

jest.mock('@/lib/bdk', () => ({
  toBdkNetwork: jest.fn((network: string) => (network === 'mainnet' ? 0 : 1)),
  formatUnknownError: (error: unknown) => (error instanceof Error ? error.message : String(error)),
  createOrLoadWallet: (...args: unknown[]) => mockCreateOrLoadWallet(...args),
  readWalletSnapshot: (...args: unknown[]) => mockReadWalletSnapshot(...args),
  syncWalletWithEsplora: (...args: unknown[]) => mockSyncWalletWithEsplora(...args),
  buildAndSignTransaction: jest.fn(),
  broadcastTransaction: jest.fn(),
  estimateTransactionFee: jest.fn(),
  revealReceiveAddress: jest.fn(),
  getEsploraHeight: jest.fn(),
}));

const mockConnectEsploraBackend = jest.fn();
jest.mock('@/lib/bdk-blockchain-connect', () => {
  const actual = jest.requireActual('@/lib/bdk-blockchain-connect');
  return {
    ...actual,
    connectEsploraBackend: (...args: unknown[]) => mockConnectEsploraBackend(...args),
  };
});

const TEST_SEED = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

function wrapper({ children }: { children: React.ReactNode }) {
  return <BdkProvider>{children}</BdkProvider>;
}

/** A sync that stays pending until the test settles it, and rejects like the real one when its signal aborts. */
function pendingSync() {
  const controls = { signal: undefined as AbortSignal | undefined, finish: () => {} };
  mockSyncWalletWithEsplora.mockImplementationOnce(
    ({ signal }: { signal: AbortSignal }) =>
      new Promise<void>((resolve, reject) => {
        controls.signal = signal;
        controls.finish = resolve;
        signal.addEventListener('abort', () => reject(new Error('Esplora synchronization aborted')));
      }),
  );
  return controls;
}

describe('BdkProvider', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    mockBreezNetwork = 'testnet';
    mockGetSeedPhrase.mockResolvedValue(TEST_SEED);

    const wallet = createMockWallet();
    mockCreateOrLoadWallet.mockResolvedValue({ wallet, persister: {} });
    mockReadWalletSnapshot.mockReturnValue({
      balance: 0,
      confirmedBalance: 0,
      unconfirmedBalance: 0,
      transactions: [],
    });
    mockSyncWalletWithEsplora.mockResolvedValue(undefined);
    mockConnectEsploraBackend.mockResolvedValue({
      backend: 'esplora',
      client: createMockEsploraClient(),
      serverId: 'mempool.bitdevsyde.org',
      baseUrl: 'https://mempool.bitdevsyde.org/testnet4/api',
    });
  });

  it('restores persisted snapshot on mount', async () => {
    await AsyncStorage.setItem(
      'bdkWalletSnapshot_testnet',
      JSON.stringify({
        balance: 42000,
        confirmedBalance: 40000,
        unconfirmedBalance: 2000,
        transactions: [{ txid: 'abc', received: 42000, sent: 0 }],
        updatedAt: Date.now(),
      }),
    );

    const { result } = renderHook(() => useBdk(), { wrapper });

    await waitFor(() => {
      expect(result.current.balance).toBe(42000);
    });
    expect(result.current.transactions).toHaveLength(1);
  });

  it('persists snapshot after sync', async () => {
    const syncSnapshot = {
      balance: 100000,
      confirmedBalance: 100000,
      unconfirmedBalance: 0,
      transactions: [{ txid: 'sync-tx', received: 100000, sent: 0 }],
    };
    mockReadWalletSnapshot.mockReturnValue(syncSnapshot);

    const { result } = renderHook(() => useBdk(), { wrapper });

    await act(async () => {
      const ok = await result.current.initializeBdk(true);
      expect(ok).toBe(true);
    });

    await waitFor(() => expect(mockSyncWalletWithEsplora).toHaveBeenCalled());
    // The sync started by the init must be over: a sync requested while it runs would wait for it instead of running
    await waitFor(() => expect(result.current.isSyncing).toBe(false));

    await act(async () => {
      await result.current.syncWallet(undefined, { skipServerFallback: true, rethrowOnError: true });
    });

    const stored = await AsyncStorage.getItem('bdkWalletSnapshot_testnet');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!) as { balance: number; transactions: unknown[] };
    expect(parsed.balance).toBe(100000);
    expect(parsed.transactions).toHaveLength(1);
  });

  it('keeps cached balance visible while reconnecting (stale-while-revalidate)', async () => {
    await AsyncStorage.setItem(
      'bdkWalletSnapshot_testnet',
      JSON.stringify({
        balance: 50000,
        confirmedBalance: 50000,
        unconfirmedBalance: 0,
        transactions: [{ txid: 'cached', received: 50000, sent: 0 }],
        updatedAt: Date.now(),
      }),
    );

    mockReadWalletSnapshot.mockReturnValue({
      balance: 50000,
      confirmedBalance: 50000,
      unconfirmedBalance: 0,
      transactions: [{ txid: 'cached', received: 50000, sent: 0 }],
    });

    let resolveConnect: (value: unknown) => void = () => {};
    mockConnectEsploraBackend.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveConnect = resolve;
        }),
    );

    const { result } = renderHook(() => useBdk(), { wrapper });

    await waitFor(() => {
      expect(result.current.balance).toBe(50000);
    });

    act(() => {
      void result.current.initializeBdk(true);
    });

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(true);
    });
    expect(result.current.balance).toBe(50000);

    await act(async () => {
      resolveConnect({
        backend: 'esplora',
        client: createMockEsploraClient(),
        serverId: 'mempool.bitdevsyde.org',
        baseUrl: 'https://mempool.bitdevsyde.org/testnet4/api',
      });
    });

    await waitFor(() => {
      expect(result.current.isBdkInitialized).toBe(true);
    });
    expect(result.current.balance).toBe(50000);
  });

  it('falls back to another Esplora server on HTTP 429 during sync', async () => {
    const wallet = createMockWallet();
    mockCreateOrLoadWallet.mockResolvedValue({ wallet, persister: {} });
    mockReadWalletSnapshot.mockReturnValue({
      balance: 55000,
      confirmedBalance: 55000,
      unconfirmedBalance: 0,
      transactions: [{ txid: 'after-fallback', received: 55000, sent: 0 }],
    });

    mockSyncWalletWithEsplora
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('status=429, errorMessage=Too Many Requests'))
      .mockResolvedValueOnce(undefined);

    const fallbackClient = createMockEsploraClient();
    mockConnectEsploraBackend
      .mockResolvedValueOnce({
        backend: 'esplora',
        client: createMockEsploraClient(),
        serverId: 'mempool.bitdevsyde.org',
        baseUrl: 'https://mempool.bitdevsyde.org/testnet4/api',
      })
      .mockResolvedValueOnce({
        backend: 'esplora',
        client: fallbackClient,
        serverId: 'mempool.space',
        baseUrl: 'https://mempool.space/testnet4/api',
      });

    const { result } = renderHook(() => useBdk(), { wrapper });

    await act(async () => {
      await result.current.initializeBdk(true);
    });

    await waitFor(() => expect(mockSyncWalletWithEsplora).toHaveBeenCalled());
    // The sync started by the init must be over: a sync requested while it runs would wait for it instead of running
    await waitFor(() => expect(result.current.isSyncing).toBe(false));

    await act(async () => {
      await result.current.syncWallet(undefined, { rethrowOnError: true });
    });

    expect(mockConnectEsploraBackend).toHaveBeenCalledTimes(2);
    expect(mockSyncWalletWithEsplora).toHaveBeenCalledTimes(3);
    await waitFor(() => {
      expect(result.current.balance).toBe(55000);
      expect(result.current.error).toBeNull();
    });
  });

  it('runs one sync at a time: a sync requested meanwhile waits for the running one', async () => {
    const running = pendingSync();
    const { result } = renderHook(() => useBdk(), { wrapper });

    await act(async () => {
      await result.current.initializeBdk(true);
    });
    await waitFor(() => expect(mockSyncWalletWithEsplora).toHaveBeenCalledTimes(1));

    let waitingSyncsDone = 0;
    act(() => {
      void result.current.syncWallet().then(() => waitingSyncsDone++);
      void result.current.syncWallet().then(() => waitingSyncsDone++);
    });
    expect(mockSyncWalletWithEsplora).toHaveBeenCalledTimes(1);

    await act(async () => {
      running.finish();
    });
    await waitFor(() => expect(waitingSyncsDone).toBe(2));
    expect(mockSyncWalletWithEsplora).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.isSyncing).toBe(false));

    await act(async () => {
      await result.current.syncWallet();
    });
    expect(mockSyncWalletWithEsplora).toHaveBeenCalledTimes(2);
  });

  it('gives the sync a signal, and a reconnection aborts the running sync and starts a new one', async () => {
    const stale = pendingSync();
    const { result } = renderHook(() => useBdk(), { wrapper });

    await act(async () => {
      await result.current.initializeBdk(true);
    });
    await waitFor(() => expect(mockSyncWalletWithEsplora).toHaveBeenCalledTimes(1));
    expect(stale.signal?.aborted).toBe(false);

    await act(async () => {
      await result.current.initializeBdk(true);
    });

    expect(stale.signal?.aborted).toBe(true);
    await waitFor(() => expect(mockSyncWalletWithEsplora).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.isSyncing).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.isConnected).toBe(true);
  });

  it('aborts the running sync when the wallet disconnects', async () => {
    const running = pendingSync();
    const { result } = renderHook(() => useBdk(), { wrapper });

    await act(async () => {
      await result.current.initializeBdk(true);
    });
    await waitFor(() => expect(mockSyncWalletWithEsplora).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.disconnectBdk();
    });

    expect(running.signal?.aborted).toBe(true);
    expect(result.current.isSyncing).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('ends the syncing state with an error when the sync times out, without switching server', async () => {
    mockSyncWalletWithEsplora.mockRejectedValueOnce(new Error('The Esplora indexer did not complete the synchronization within 90 s'));
    const { result } = renderHook(() => useBdk(), { wrapper });

    await act(async () => {
      await result.current.initializeBdk(true);
    });

    await waitFor(() => expect(result.current.isSyncing).toBe(false));
    expect(result.current.error).toContain('did not complete the synchronization');
    expect(result.current.isConnected).toBe(true);
    expect(mockConnectEsploraBackend).toHaveBeenCalledTimes(1);
  });
});
