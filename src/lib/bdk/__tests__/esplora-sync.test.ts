jest.mock('bdk-rn', () => require('@/lib/bdk/__tests__/helpers/mock-bdk-rn'));

import { createMockEsploraClient, createMockTransaction, createMockWallet } from '@/lib/bdk/__tests__/helpers/mock-bdk-rn';
import { EsploraSyncAbortedError, EsploraSyncTimeoutError, FIRST_SYNC_TIMEOUT_MS, SYNC_TIMEOUT_MS, syncWalletWithEsplora } from '@/lib/bdk/esplora';

type NativeCallOptions = { signal: AbortSignal } | undefined;

/** A native indexer call that never answers, like a request the indexer never replies to. Records the signal it got. */
function neverAnswers(signals: AbortSignal[]) {
  return jest.fn((...args: unknown[]) => {
    const options = args[args.length - 1] as NativeCallOptions;
    if (options) {
      signals.push(options.signal);
    }
    return new Promise<object>(() => {});
  });
}

const neverSyncedWallet = () => createMockWallet({ latestCheckpoint: jest.fn(() => ({ height: 0 })) });
const syncedWallet = () => createMockWallet({ latestCheckpoint: jest.fn(() => ({ height: 850000 })) });

describe('syncWalletWithEsplora', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('runs fullScan when the wallet has never been synced (checkpoint at genesis)', async () => {
    const wallet = neverSyncedWallet();
    const persister = {};
    const client = createMockEsploraClient();

    await syncWalletWithEsplora({ wallet: wallet as never, persister: persister as never, client: client as never });

    expect(wallet.startFullScan).toHaveBeenCalled();
    expect(client.fullScan).toHaveBeenCalled();
    expect(wallet.startSyncWithRevealedSpks).toHaveBeenCalled();
    expect(client.sync).toHaveBeenCalled();
    expect(wallet.persist).toHaveBeenCalledWith(persister);
  });

  it('skips fullScan once the wallet has been synced, even without transactions', async () => {
    const wallet = createMockWallet({ latestCheckpoint: jest.fn(() => ({ height: 850000 })), transactions: jest.fn(() => []) });
    const persister = {};
    const client = createMockEsploraClient();

    await syncWalletWithEsplora({ wallet: wallet as never, persister: persister as never, client: client as never });

    expect(wallet.startFullScan).not.toHaveBeenCalled();
    expect(client.fullScan).not.toHaveBeenCalled();
    expect(client.sync).toHaveBeenCalled();
    expect(wallet.persist).toHaveBeenCalledWith(persister);
  });

  it('skips fullScan when the synced wallet has transactions', async () => {
    const wallet = createMockWallet({
      latestCheckpoint: jest.fn(() => ({ height: 850000 })),
      transactions: jest.fn(() => [{ transaction: createMockTransaction(), chainPosition: {} } as never]),
    });
    const client = createMockEsploraClient();

    await syncWalletWithEsplora({ wallet: wallet as never, persister: {} as never, client: client as never });

    expect(client.fullScan).not.toHaveBeenCalled();
    expect(client.sync).toHaveBeenCalled();
  });

  it('propagates sync errors', async () => {
    const client = createMockEsploraClient({
      sync: jest.fn(async () => {
        throw new Error('status=429, errorMessage=Too Many Requests');
      }),
    });

    await expect(syncWalletWithEsplora({ wallet: syncedWallet() as never, persister: {} as never, client: client as never })).rejects.toThrow('429');
  });

  it('gives the native calls a signal that cancels them', async () => {
    const client = createMockEsploraClient();

    await syncWalletWithEsplora({ wallet: neverSyncedWallet() as never, persister: {} as never, client: client as never });

    expect(client.fullScan).toHaveBeenCalledWith(expect.anything(), 30n, 6n, { signal: expect.any(Object) });
    expect(client.sync).toHaveBeenCalledWith(expect.anything(), 6n, { signal: expect.any(Object) });
  });

  it('gives up on the first sync of a wallet when the indexer does not answer in time, and cancels the native call', async () => {
    jest.useFakeTimers();
    const signals: AbortSignal[] = [];
    const wallet = neverSyncedWallet();
    const client = createMockEsploraClient({ fullScan: neverAnswers(signals) });

    const result = syncWalletWithEsplora({ wallet: wallet as never, persister: {} as never, client: client as never });
    const outcome = expect(result).rejects.toBeInstanceOf(EsploraSyncTimeoutError);

    await jest.advanceTimersByTimeAsync(FIRST_SYNC_TIMEOUT_MS - 1);
    expect(signals[0].aborted).toBe(false);
    await jest.advanceTimersByTimeAsync(1);

    await outcome;
    expect(signals[0].aborted).toBe(true);
    expect(wallet.applyUpdate).not.toHaveBeenCalled();
    expect(wallet.persist).not.toHaveBeenCalled();
  });

  it('gives a synced wallet less time than its first sync', async () => {
    jest.useFakeTimers();
    const signals: AbortSignal[] = [];
    const wallet = syncedWallet();
    const client = createMockEsploraClient({ sync: neverAnswers(signals) });

    const result = syncWalletWithEsplora({ wallet: wallet as never, persister: {} as never, client: client as never });
    const outcome = expect(result).rejects.toBeInstanceOf(EsploraSyncTimeoutError);

    await jest.advanceTimersByTimeAsync(SYNC_TIMEOUT_MS);

    await outcome;
    expect(SYNC_TIMEOUT_MS).toBeLessThan(FIRST_SYNC_TIMEOUT_MS);
    expect(signals[0].aborted).toBe(true);
    expect(wallet.persist).not.toHaveBeenCalled();
  });

  it('does not apply an update that arrives after the deadline', async () => {
    jest.useFakeTimers();
    let answerLate: (update: object) => void = () => {};
    const wallet = neverSyncedWallet();
    const client = createMockEsploraClient({
      fullScan: jest.fn(
        () =>
          new Promise<object>((resolve) => {
            answerLate = resolve;
          }),
      ),
    });

    const result = syncWalletWithEsplora({ wallet: wallet as never, persister: {} as never, client: client as never });
    const outcome = expect(result).rejects.toBeInstanceOf(EsploraSyncTimeoutError);
    await jest.advanceTimersByTimeAsync(FIRST_SYNC_TIMEOUT_MS);
    await outcome;

    answerLate({});
    await jest.advanceTimersByTimeAsync(0);

    expect(wallet.applyUpdate).not.toHaveBeenCalled();
    expect(client.sync).not.toHaveBeenCalled();
    expect(wallet.persist).not.toHaveBeenCalled();
  });

  it('stops at once when the caller aborts, and cancels the native call', async () => {
    const signals: AbortSignal[] = [];
    const wallet = neverSyncedWallet();
    const client = createMockEsploraClient({ fullScan: neverAnswers(signals) });
    const caller = new AbortController();

    const result = syncWalletWithEsplora({ wallet: wallet as never, persister: {} as never, client: client as never, signal: caller.signal });
    caller.abort();

    await expect(result).rejects.toBeInstanceOf(EsploraSyncAbortedError);
    expect(signals[0].aborted).toBe(true);
    expect(wallet.applyUpdate).not.toHaveBeenCalled();
  });

  it('does not call the indexer when the caller already aborted', async () => {
    const client = createMockEsploraClient();
    const caller = new AbortController();
    caller.abort();

    await expect(syncWalletWithEsplora({ wallet: neverSyncedWallet() as never, persister: {} as never, client: client as never, signal: caller.signal })).rejects.toBeInstanceOf(
      EsploraSyncAbortedError,
    );
    expect(client.fullScan).not.toHaveBeenCalled();
  });
});
