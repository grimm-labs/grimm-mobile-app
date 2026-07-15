import { EsploraClient, Network } from 'bdk-rn';

import { type EsploraServer, LEGACY_ELECTRUM_SERVER_ID } from '@/lib/constant';

export { Network };

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

export function isEsploraRateLimitError(error: unknown): boolean {
  const message = formatUnknownError(error);
  return message.includes('429') || message.includes('Too Many Requests');
}

function createEsploraClient(baseUrl: string): EsploraClient {
  return new EsploraClient(baseUrl, undefined);
}

function probeEsploraConnection(client: EsploraClient): void {
  client.getHeight();
}

export type EsploraConnectResult = {
  backend: 'esplora';
  client: EsploraClient;
  serverId: string;
  baseUrl: string;
};

/**
 * Tries Esplora indexers in order. Manual selection tries only the requested server.
 */
export async function connectEsploraBackend(candidates: EsploraServer[], onchainNetwork: Network, opts: { manualSelection: boolean }): Promise<EsploraConnectResult> {
  void opts.manualSelection;
  let lastError: unknown = null;

  for (const server of candidates) {
    const baseUrl = getEsploraBaseUrl(server, onchainNetwork);
    try {
      console.log(`[BDK init] Trying Esplora → ${baseUrl}`);
      const client = createEsploraClient(baseUrl);
      probeEsploraConnection(client);
      console.log(`[BDK init] Esplora connected → ${baseUrl}`);
      return { backend: 'esplora', client, serverId: server.id, baseUrl };
    } catch (error) {
      lastError = error;
      console.warn(`[BDK init] Esplora failed → ${baseUrl}:`, formatUnknownError(error));
    }
  }

  throw lastError ?? new Error('ESPLORA_CONNECTION_FAILED');
}
