import type { EsploraClient, PersisterInterface, WalletInterface } from 'bdk-rn';

const STOP_GAP = 30n;
const PARALLEL_REQUESTS = 6n;

/**
 * Deadlines of a sync. The native Esplora client has no timeout of its own: a request the indexer never answers,
 * or an indexer that keeps answering HTTP 429 (the client retries with a backoff), left the sync pending forever
 * and the wallet "syncing" until the app restarts. The first sync of a wallet runs a full scan (60+ requests),
 * so it gets more time than the following ones.
 */
export const FIRST_SYNC_TIMEOUT_MS = 90_000;
export const SYNC_TIMEOUT_MS = 60_000;

export class EsploraSyncTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`The Esplora indexer did not complete the synchronization within ${timeoutMs / 1000} s`);
    this.name = 'EsploraSyncTimeoutError';
  }
}

/** The caller stopped the sync (another sync replaced it, or the wallet disconnected). */
export class EsploraSyncAbortedError extends Error {
  constructor() {
    super('Esplora synchronization aborted');
    this.name = 'EsploraSyncAbortedError';
  }
}

type BroadcastTx = Parameters<EsploraClient['broadcast']>[0];

export type SyncWalletWithEsploraParams = {
  wallet: WalletInterface;
  persister: PersisterInterface;
  client: EsploraClient;
  /** Stops the sync and cancels its native calls. */
  signal?: AbortSignal;
};

/**
 * Runs `run` until it settles, the deadline passes or `signal` aborts, whichever comes first.
 * `run` gets its own signal, aborted when the sync stops early: the native calls take it (aborting cancels the Rust
 * future) and `run` checks it before changing the wallet, so a late answer is never applied.
 * The race settles the promise on time even if a native call ignores the cancellation.
 */
async function runWithDeadline(run: (signal: AbortSignal) => Promise<void>, options: { timeoutMs: number; signal?: AbortSignal }): Promise<void> {
  const { timeoutMs, signal } = options;
  if (signal?.aborted) {
    throw new EsploraSyncAbortedError();
  }

  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort: (() => void) | undefined;
  const stop = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new EsploraSyncTimeoutError(timeoutMs)), timeoutMs);
    onAbort = () => reject(new EsploraSyncAbortedError());
    signal?.addEventListener('abort', onAbort);
  });

  const running = run(controller.signal);
  // Once the sync stopped early nobody awaits `running` any more: keep its rejection from going unhandled
  running.catch(() => {});

  try {
    await Promise.race([running, stop]);
  } catch (error) {
    controller.abort();
    throw error;
  } finally {
    clearTimeout(timer);
    if (onAbort) {
      signal?.removeEventListener('abort', onAbort);
    }
  }
}

function throwIfStopped(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new EsploraSyncAbortedError();
  }
}

export async function syncWalletWithEsplora({ wallet, persister, client, signal }: SyncWalletWithEsploraParams): Promise<void> {
  // A full scan discovers the addresses used beyond the revealed ones: it is needed once, when the wallet has never
  // been synced (checkpoint still at genesis). It used to run on every sync while the wallet had no transaction,
  // i.e. 60+ indexer requests every minute for every new user, during which the UI dropped taps.
  const needsFullScan = wallet.latestCheckpoint().height === 0;

  await runWithDeadline(
    async (stopSignal) => {
      if (needsFullScan) {
        const fullScanRequest = wallet.startFullScan().build();
        const fullScanUpdate = await client.fullScan(fullScanRequest, STOP_GAP, PARALLEL_REQUESTS, { signal: stopSignal });
        throwIfStopped(stopSignal);
        wallet.applyUpdate(fullScanUpdate);
      }

      const syncRequest = wallet.startSyncWithRevealedSpks().build();
      const syncUpdate = await client.sync(syncRequest, PARALLEL_REQUESTS, { signal: stopSignal });
      throwIfStopped(stopSignal);
      wallet.applyUpdate(syncUpdate);
      wallet.persist(persister);
    },
    { timeoutMs: needsFullScan ? FIRST_SYNC_TIMEOUT_MS : SYNC_TIMEOUT_MS, signal },
  );
}

export async function broadcastTransaction(client: EsploraClient, tx: BroadcastTx): Promise<void> {
  client.broadcast(tx);
}
