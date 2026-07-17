jest.mock('bdk-rn', () => require('@/lib/bdk/__tests__/helpers/mock-bdk-rn'));

import { EsploraClient, Network } from 'bdk-rn';

import { createMockEsploraClient } from '@/lib/bdk/__tests__/helpers/mock-bdk-rn';
import { connectEsploraBackend } from '@/lib/bdk-blockchain-connect';
import { DEFAULT_ESPLORA_SERVERS } from '@/lib/constant';

describe('connectEsploraBackend', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('connects to the first reachable server', async () => {
    const client = createMockEsploraClient();
    (EsploraClient as unknown as jest.Mock).mockImplementationOnce(() => client);

    const result = await connectEsploraBackend([DEFAULT_ESPLORA_SERVERS[0]], Network.Testnet, { manualSelection: true });

    expect(result.serverId).toBe(DEFAULT_ESPLORA_SERVERS[0].id);
    expect(client.getHeight).toHaveBeenCalled();
  });

  it('tries the next server when the first fails', async () => {
    (EsploraClient as unknown as jest.Mock)
      .mockImplementationOnce(() =>
        createMockEsploraClient({
          getHeight: jest.fn(() => {
            throw new Error('network timeout');
          }),
        }),
      )
      .mockImplementationOnce(() => createMockEsploraClient());

    const result = await connectEsploraBackend(DEFAULT_ESPLORA_SERVERS.slice(0, 2), Network.Testnet, { manualSelection: false });

    expect(result.serverId).toBe(DEFAULT_ESPLORA_SERVERS[1].id);
  });

  it('throws when manual selection server fails', async () => {
    (EsploraClient as unknown as jest.Mock).mockImplementationOnce(() =>
      createMockEsploraClient({
        getHeight: jest.fn(() => {
          throw new Error('ESPLORA_CONNECTION_FAILED');
        }),
      }),
    );

    await expect(connectEsploraBackend([DEFAULT_ESPLORA_SERVERS[0]], Network.Testnet, { manualSelection: true })).rejects.toThrow('ESPLORA_CONNECTION_FAILED');
  });
});
