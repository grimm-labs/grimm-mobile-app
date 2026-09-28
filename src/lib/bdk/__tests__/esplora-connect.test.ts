jest.mock('bdk-rn', () => require('@/lib/bdk/__tests__/helpers/mock-bdk-rn'));

import { EsploraClient, Network } from 'bdk-rn';

import { createMockEsploraClient } from '@/lib/bdk/__tests__/helpers/mock-bdk-rn';
import { connectEsploraBackend, fetchEsploraTipHeight, fetchIndexerFeeRates } from '@/lib/bdk-blockchain-connect';
import { DEFAULT_ESPLORA_SERVERS } from '@/lib/constant';

const mockFetch = jest.fn();

const okResponse = (body: string) => ({ ok: true, status: 200, text: async () => body, json: async () => JSON.parse(body) });
const errorResponse = (status: number) => ({ ok: false, status, text: async () => '', json: async () => ({}) });

beforeAll(() => {
  global.fetch = mockFetch as unknown as typeof fetch;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockReset();
});

describe('connectEsploraBackend', () => {
  it('connects to the first reachable server without the blocking getHeight call', async () => {
    const client = createMockEsploraClient();
    (EsploraClient as unknown as jest.Mock).mockImplementationOnce(() => client);
    mockFetch.mockResolvedValueOnce(okResponse('850000'));

    const result = await connectEsploraBackend([DEFAULT_ESPLORA_SERVERS[0]], Network.Testnet, { manualSelection: true });

    expect(result.serverId).toBe(DEFAULT_ESPLORA_SERVERS[0].id);
    expect(result.baseUrl).toBe(DEFAULT_ESPLORA_SERVERS[0].testnetBaseUrl);
    expect(mockFetch).toHaveBeenCalledWith(`${DEFAULT_ESPLORA_SERVERS[0].testnetBaseUrl}/blocks/tip/height`, expect.objectContaining({ signal: expect.anything() }));
    expect(client.getHeight).not.toHaveBeenCalled();
  });

  it('tries the next server when the first fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network timeout')).mockResolvedValueOnce(okResponse('850000'));

    const result = await connectEsploraBackend(DEFAULT_ESPLORA_SERVERS.slice(0, 2), Network.Testnet, { manualSelection: false });

    expect(result.serverId).toBe(DEFAULT_ESPLORA_SERVERS[1].id);
  });

  it('throws when manual selection server fails', async () => {
    mockFetch.mockResolvedValueOnce(errorResponse(503));

    await expect(connectEsploraBackend([DEFAULT_ESPLORA_SERVERS[0]], Network.Testnet, { manualSelection: true })).rejects.toThrow('HTTP 503');
  });

  it('keeps the status code in the error so rate limits are detected', async () => {
    mockFetch.mockResolvedValueOnce(errorResponse(429));

    await expect(connectEsploraBackend([DEFAULT_ESPLORA_SERVERS[0]], Network.Bitcoin, { manualSelection: true })).rejects.toThrow('429');
  });
});

describe('fetchEsploraTipHeight', () => {
  it('returns the tip height', async () => {
    mockFetch.mockResolvedValueOnce(okResponse('850123\n'));

    await expect(fetchEsploraTipHeight('https://indexer/api')).resolves.toBe(850123);
  });

  it('rejects a non numeric answer (e.g. an HTML error page)', async () => {
    mockFetch.mockResolvedValueOnce(okResponse('<!doctype html>'));

    await expect(fetchEsploraTipHeight('https://indexer/api')).rejects.toThrow('Invalid tip height');
  });
});

describe('fetchIndexerFeeRates', () => {
  it('uses the mempool recommended fees when available', async () => {
    mockFetch.mockResolvedValueOnce(okResponse(JSON.stringify({ fastestFee: 12, halfHourFee: 8, hourFee: 5, economyFee: 2, minimumFee: 1 })));

    await expect(fetchIndexerFeeRates('https://indexer/api')).resolves.toEqual({ fastestFee: 12, halfHourFee: 8, hourFee: 5 });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('https://indexer/api/v1/fees/recommended', expect.anything());
  });

  it('falls back to the Esplora fee estimates, rounded up', async () => {
    mockFetch.mockResolvedValueOnce(errorResponse(404)).mockResolvedValueOnce(okResponse(JSON.stringify({ '1': 10.2, '3': 6.5, '6': 0.3, '144': 0.1 })));

    await expect(fetchIndexerFeeRates('https://indexer/api')).resolves.toEqual({ fastestFee: 11, halfHourFee: 7, hourFee: 1 });
    expect(mockFetch).toHaveBeenLastCalledWith('https://indexer/api/fee-estimates', expect.anything());
  });

  it('throws when no valid fee rate is available', async () => {
    mockFetch.mockResolvedValueOnce(errorResponse(404)).mockResolvedValueOnce(okResponse(JSON.stringify({})));

    await expect(fetchIndexerFeeRates('https://indexer/api')).rejects.toThrow('Invalid fee estimates');
  });
});
