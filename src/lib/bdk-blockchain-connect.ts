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

const INDEXER_REQUEST_TIMEOUT_MS = 10_000;

async function fetchFromIndexer(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), INDEXER_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${url}`);
    }
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Current block height of an Esplora indexer.
 * bdk-rn's `EsploraClient.getHeight()` is a synchronous network call: it blocks the JS thread (the whole UI)
 * until the indexer answers, indefinitely when it doesn't. Indexers are queried with `fetch` instead.
 */
export async function fetchEsploraTipHeight(baseUrl: string): Promise<number> {
  const response = await fetchFromIndexer(`${baseUrl}/blocks/tip/height`);
  const height = Number((await response.text()).trim());
  if (!Number.isInteger(height) || height <= 0) {
    throw new Error(`Invalid tip height from ${baseUrl}`);
  }
  return height;
}

export type IndexerFeeRates = {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
};

const areValidFeeRates = (rates: IndexerFeeRates): boolean => Object.values(rates).every((rate) => Number.isFinite(rate) && rate > 0);

/**
 * Fee rates (sat/vB) from an indexer: mempool-based indexers expose `/v1/fees/recommended`,
 * plain Esplora indexers expose `/fee-estimates` (confirmation target in blocks → sat/vB).
 */
export async function fetchIndexerFeeRates(baseUrl: string): Promise<IndexerFeeRates> {
  try {
    const recommended = await (await fetchFromIndexer(`${baseUrl}/v1/fees/recommended`)).json();
    const rates = { fastestFee: Number(recommended.fastestFee), halfHourFee: Number(recommended.halfHourFee), hourFee: Number(recommended.hourFee) };
    if (areValidFeeRates(rates)) {
      return rates;
    }
  } catch {
    // Not a mempool-based indexer: use the Esplora endpoint below
  }

  const estimates: Record<string, number> = await (await fetchFromIndexer(`${baseUrl}/fee-estimates`)).json();
  // eslint-disable-next-line security/detect-object-injection
  const rateFor = (blocks: '1' | '3' | '6') => Math.max(1, Math.ceil(Number(estimates[blocks])));
  const rates = { fastestFee: rateFor('1'), halfHourFee: rateFor('3'), hourFee: rateFor('6') };
  if (!areValidFeeRates(rates)) {
    throw new Error(`Invalid fee estimates from ${baseUrl}`);
  }
  return rates;
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
  const serversToTry = opts.manualSelection ? candidates.slice(0, 1) : candidates;
  let lastError: unknown = null;

  for (const server of serversToTry) {
    const baseUrl = getEsploraBaseUrl(server, onchainNetwork);
    try {
      console.log(`[BDK init] Trying Esplora → ${baseUrl}`);
      await fetchEsploraTipHeight(baseUrl);
      const client = createEsploraClient(baseUrl);
      console.log(`[BDK init] Esplora connected → ${baseUrl}`);
      return { backend: 'esplora', client, serverId: server.id, baseUrl };
    } catch (error) {
      lastError = error;
      console.warn(`[BDK init] Esplora failed → ${baseUrl}:`, formatUnknownError(error));
    }
  }

  throw lastError ?? new Error('ESPLORA_CONNECTION_FAILED');
}
