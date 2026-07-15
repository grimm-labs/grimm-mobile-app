import type { EsploraClient, PersisterInterface, WalletInterface } from 'bdk-rn';

const STOP_GAP = 30n;
const PARALLEL_REQUESTS = 6n;

type BroadcastTx = Parameters<EsploraClient['broadcast']>[0];

export async function syncWalletWithEsplora(wallet: WalletInterface, persister: PersisterInterface, client: EsploraClient): Promise<void> {
  if (wallet.transactions().length === 0) {
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

export async function getEsploraHeight(client: EsploraClient): Promise<number> {
  return client.getHeight();
}
