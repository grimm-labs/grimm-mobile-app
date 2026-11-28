import type { BreezSdkInterface } from '@breeztech/breez-sdk-spark-react-native';

import { paymentsFingerprint, syncSparkWallet, WALLET_SYNC_TIMEOUT_MS } from '../wallet-sync';

type SyncWallet = BreezSdkInterface['syncWallet'];

const synced = { lastSyncError: undefined, lastSyncedAt: BigInt(1_700_000_000) };

describe('syncSparkWallet', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    jest.useRealTimers();
  });

  it('resolves true once the SDK has synced', async () => {
    const sdk = { syncWallet: jest.fn<ReturnType<SyncWallet>, Parameters<SyncWallet>>(async () => synced) };

    await expect(syncSparkWallet(sdk)).resolves.toBe(true);
    expect(sdk.syncWallet).toHaveBeenCalledWith({}, { signal: expect.any(Object) });
  });

  it('resolves false when the sync fails', async () => {
    const sdk = { syncWallet: jest.fn<ReturnType<SyncWallet>, Parameters<SyncWallet>>(async () => Promise.reject(new Error('operator unreachable'))) };

    await expect(syncSparkWallet(sdk)).resolves.toBe(false);
  });

  it('resolves false when the SDK reports that the sync could not refresh the balances', async () => {
    const lastSyncError = { tag: 'Network', inner: { message: 'operator unreachable' } } as unknown as NonNullable<Awaited<ReturnType<SyncWallet>>['lastSyncError']>;
    const sdk = { syncWallet: jest.fn<ReturnType<SyncWallet>, Parameters<SyncWallet>>(async () => ({ lastSyncError, lastSyncedAt: undefined })) };

    await expect(syncSparkWallet(sdk)).resolves.toBe(false);
    expect(warnSpy).toHaveBeenCalledWith('[Breez SDK] Wallet sync failed:', 'Network', 'operator unreachable');
  });

  it('cancels a sync that does not finish in time', async () => {
    jest.useFakeTimers();
    let signal: AbortSignal | undefined;
    // Like the native call: it only settles when its signal aborts
    const sdk = {
      syncWallet: jest.fn<ReturnType<SyncWallet>, Parameters<SyncWallet>>(
        (_request, opts) =>
          new Promise((_resolve, reject) => {
            signal = opts?.signal;
            opts?.signal.addEventListener('abort', () => reject(new Error('AbortError')));
          }),
      ),
    };

    const result = syncSparkWallet(sdk);
    jest.advanceTimersByTime(WALLET_SYNC_TIMEOUT_MS - 1);
    expect(signal?.aborted).toBe(false);

    jest.advanceTimersByTime(1);

    await expect(result).resolves.toBe(false);
    expect(signal?.aborted).toBe(true);
  });
});

describe('paymentsFingerprint', () => {
  const pending = { id: 'a', status: 1 };
  const completed = { id: 'a', status: 0 };

  it('changes when a payment appears', () => {
    expect(paymentsFingerprint([pending])).not.toBe(paymentsFingerprint([]));
  });

  it('changes when a payment changes status', () => {
    expect(paymentsFingerprint([completed])).not.toBe(paymentsFingerprint([pending]));
  });

  it('stays the same for the same payments', () => {
    expect(paymentsFingerprint([{ id: 'a', status: 0 }])).toBe(paymentsFingerprint([completed]));
  });
});
