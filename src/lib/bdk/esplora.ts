import type { EsploraClient, PersisterInterface, WalletInterface } from 'bdk-rn';

const STOP_GAP = 30n;
const PARALLEL_REQUESTS = 6n;

type BroadcastTx = Parameters<EsploraClient['broadcast']>[0];

export async function syncWalletWithEsplora(wallet: WalletInterface, persister: PersisterInterface, client: EsploraClient): Promise<void> {
  // A full scan discovers the addresses used beyond the revealed ones: it is needed once, when the wallet has never
  // been synced (checkpoint still at genesis). It used to run on every sync while the wallet had no transaction,
  // i.e. 60+ indexer requests every minute for every new user, during which the UI dropped taps.
  if (wallet.latestCheckpoint().height === 0) {
    const fullScanRequest = wallet.startFullScan().build();
    const fullScanUpdate = await client.fullScan(fullScanRequest, STOP_GAP, PARALLEL_REQUESTS);
    wallet.applyUpdate(fullScanUpdate);
  }

  const syncRequest = wallet.startSyncWithRevealedSpks().build();
  const syncUpdate = await client.sync(syncRequest, PARALLEL_REQUESTS);
  wallet.applyUpdate(syncUpdate);
  wallet.persist(persister);
}

export async function broadcastTransaction(client: EsploraClient, tx: BroadcastTx): Promise<void> {
  client.broadcast(tx);
}
