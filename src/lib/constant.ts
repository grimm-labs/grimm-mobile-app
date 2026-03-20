export const MEMPOOL_SSL_URL_TESTNET = 'ssl://electrum.blockstream.info:60004';
export const MEMPOOL_SSL_URL = 'ssl://electrum.blockstream.info:60002';

export const DEFAULT_PORTS = { t: '50001', s: '50002' } as const;
export const DEFAULT_PORTS_TESTNET = { t: '51001', s: '51002' } as const;

export const DEFAULT_SERVERS = {
  'blockstream.info': { s: '700', t: '110' },
} as const;

export const DEFAULT_SERVERS_TESTNET = {
  'blockstream.info': { s: '993', t: '143' },
  'electrum.blockstream.info': { s: '60002', t: '60001' },
} as const;
