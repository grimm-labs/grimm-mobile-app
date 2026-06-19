import { Network } from 'bdk-rn/lib/lib/enums';

import { DEFAULT_ESPLORA_SERVERS } from '@/lib/constant';
import { getEsploraBaseUrl, migrateLegacyServerId, orderEsploraServers } from '@/lib/bdk-blockchain-connect';

describe('migrateLegacyServerId', () => {
  it('maps electrum.blockstream.info to blockstream.info', () => {
    expect(migrateLegacyServerId('electrum.blockstream.info')).toBe('blockstream.info');
  });

  it('returns other ids unchanged', () => {
    expect(migrateLegacyServerId('mempool.space')).toBe('mempool.space');
  });

  it('returns null when input is null', () => {
    expect(migrateLegacyServerId(null)).toBeNull();
  });
});

describe('orderEsploraServers', () => {
  it('puts blockstream.info first when preferred', () => {
    expect(orderEsploraServers(DEFAULT_ESPLORA_SERVERS, 'blockstream.info').map((s) => s.id)).toEqual(['blockstream.info', 'mempool.space', 'bitcoin.lu.ke']);
  });

  it('returns the original list when preferred id is unknown', () => {
    expect(orderEsploraServers(DEFAULT_ESPLORA_SERVERS, 'unknown.example')).toEqual(DEFAULT_ESPLORA_SERVERS);
  });

  it('returns the original list when preferred id is null', () => {
    expect(orderEsploraServers(DEFAULT_ESPLORA_SERVERS, null)).toEqual(DEFAULT_ESPLORA_SERVERS);
  });
});

describe('getEsploraBaseUrl', () => {
  const blockstream = DEFAULT_ESPLORA_SERVERS[0];

  it('builds mainnet API URL', () => {
    expect(getEsploraBaseUrl(blockstream, Network.Bitcoin)).toBe('https://blockstream.info/api');
  });

  it('builds testnet API URL', () => {
    expect(getEsploraBaseUrl(blockstream, Network.Testnet)).toBe('https://blockstream.info/testnet/api');
  });
});
