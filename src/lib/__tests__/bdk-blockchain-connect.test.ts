import { Network } from 'bdk-rn/lib/lib/enums';

import { DEFAULT_ESPLORA_SERVERS } from '@/lib/constant';
import { getEsploraBaseUrl, isEsploraRateLimitError, migrateLegacyServerId, orderEsploraServers } from '@/lib/bdk-blockchain-connect';

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
  it('puts mempool.bitdevsyde.org first when preferred', () => {
    expect(orderEsploraServers(DEFAULT_ESPLORA_SERVERS, 'mempool.bitdevsyde.org').map((s) => s.id)).toEqual(['mempool.bitdevsyde.org', 'mempool.space', 'blockstream.info', 'bitcoin.lu.ke']);
  });

  it('returns the original list when preferred id is unknown', () => {
    expect(orderEsploraServers(DEFAULT_ESPLORA_SERVERS, 'unknown.example')).toEqual(DEFAULT_ESPLORA_SERVERS);
  });

  it('returns the original list when preferred id is null', () => {
    expect(orderEsploraServers(DEFAULT_ESPLORA_SERVERS, null)).toEqual(DEFAULT_ESPLORA_SERVERS);
  });
});

describe('getEsploraBaseUrl', () => {
  const grimmMempool = DEFAULT_ESPLORA_SERVERS[0];

  it('builds mainnet API URL', () => {
    expect(getEsploraBaseUrl(grimmMempool, Network.Bitcoin)).toBe('https://mempool.bitdevsyde.org/api');
  });

  it('builds testnet API URL', () => {
    expect(getEsploraBaseUrl(grimmMempool, Network.Testnet)).toBe('https://mempool.bitdevsyde.org/testnet4/api');
  });
});

describe('isEsploraRateLimitError', () => {
  it('detects HTTP 429 errors', () => {
    expect(isEsploraRateLimitError(new Error('status=429, errorMessage=Too Many Requests'))).toBe(true);
  });

  it('returns false for other errors', () => {
    expect(isEsploraRateLimitError(new Error('network timeout'))).toBe(false);
  });
});
