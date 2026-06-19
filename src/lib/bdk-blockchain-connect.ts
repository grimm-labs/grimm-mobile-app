/* eslint-disable max-params */
import type { Blockchain, Wallet as BdkWallet } from 'bdk-rn';
import { Blockchain as BdkBlockchain } from 'bdk-rn';
import { BlockChainNames, Network } from 'bdk-rn/lib/lib/enums';

import { type EsploraServer, LEGACY_ELECTRUM_SERVER_ID } from '@/lib/constant';

const ESPLORA_TIMEOUT_AUTO_SEC = 15;
const ESPLORA_TIMEOUT_MANUAL_SEC = 60;
const ESPLORA_CONCURRENCY = 4;
const STOP_GAP = 100;

export interface EsploraServerOption {
  id: string;
  baseUrl: string;
}

export function migrateLegacyServerId(storedId: string | null): string | null {
  if (storedId === LEGACY_ELECTRUM_SERVER_ID) {
    return 'blockstream.info';
  }
  return storedId;
}

export function getEsploraBaseUrl(server: EsploraServer, onchainNetwork: Network): string {
  return onchainNetwork === Network.Bitcoin ? server.mainnetBaseUrl : server.testnetBaseUrl;
}

export function toEsploraServerOptions(servers: EsploraServer[], onchainNetwork: Network): EsploraServerOption[] {
  return servers.map((server) => ({
    id: server.id,
    baseUrl: getEsploraBaseUrl(server, onchainNetwork),
  }));
}

export function orderEsploraServers(servers: EsploraServer[], preferredId: string | null): EsploraServer[] {
  if (!preferredId) {
    return servers;
  }
  const preferred = servers.find((server) => server.id === preferredId);
  if (!preferred) {
    return servers;
  }
  return [preferred, ...servers.filter((server) => server.id !== preferredId)];
}

function formatUnknownError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message?.trim();
    if (msg) return msg;
  }
  const asStr = String(error).trim();
  return asStr || 'Unknown error';
}

async function createEsploraBlockchain(baseUrl: string, timeoutSec: number): Promise<Blockchain> {
  return new BdkBlockchain().create(
    {
      baseUrl,
      proxy: null,
      concurrency: ESPLORA_CONCURRENCY,
      stopGap: STOP_GAP,
      timeout: timeoutSec,
    },
    BlockChainNames.Esplora,
  );
}

async function probeWalletSync(wallet: BdkWallet, blockchain: Blockchain): Promise<void> {
  await wallet.sync(blockchain);
}

export type EsploraConnectResult = {
  backend: 'esplora';
  blockchain: Blockchain;
  serverId: string;
  baseUrl: string;
};

/**
 * Tries Esplora indexers in order. Manual selection tries only the requested server.
 */
export async function connectEsploraBackend(wallet: BdkWallet, candidates: EsploraServer[], onchainNetwork: Network, opts: { manualSelection: boolean }): Promise<EsploraConnectResult> {
  const timeoutSec = opts.manualSelection ? ESPLORA_TIMEOUT_MANUAL_SEC : ESPLORA_TIMEOUT_AUTO_SEC;
  let lastError: unknown = null;

  for (const server of candidates) {
    const baseUrl = getEsploraBaseUrl(server, onchainNetwork);
    try {
      console.log(`[BDK init] Trying Esplora → ${baseUrl}`);
      const blockchain = await createEsploraBlockchain(baseUrl, timeoutSec);
      await probeWalletSync(wallet, blockchain);
      console.log(`[BDK init] Esplora connected → ${baseUrl}`);
      return { backend: 'esplora', blockchain, serverId: server.id, baseUrl };
    } catch (error) {
      lastError = error;
      console.warn(`[BDK init] Esplora failed → ${baseUrl}:`, formatUnknownError(error));
    }
  }

  throw lastError ?? new Error('ESPLORA_CONNECTION_FAILED');
}
