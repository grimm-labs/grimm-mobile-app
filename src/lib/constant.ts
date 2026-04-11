export const MEMPOOL_SSL_URL_TESTNET = 'ssl://electrum.blockstream.info:60004';
export const MEMPOOL_SSL_URL = 'ssl://electrum.blockstream.info:60002';

export const DEFAULT_PORTS = { t: '50001', s: '50002' } as const;
export const DEFAULT_PORTS_TESTNET = { t: '51001', s: '51002' } as const;

// Electrum mainnet servers (SSL only)
export const DEFAULT_SERVERS = {
  'blockstream.info': { s: '700' },
  'electrum.blockstream.info': { s: '50002' },
  'electrum.diynodes.com': { s: '50022' },
  // 'bitcoin.lu.ke': { s: '50002' },
  // 'electrum.emzy.de': { s: '50002' },
  // 'electrum.bitaroo.net': { s: '50002' },
  // 'fulcrum.sethforprivacy.com': { s: '50002' },
} as const;

// Electrum testnet servers (SSL only)
export const DEFAULT_SERVERS_TESTNET = {
  'testnet.aranguren.org': { s: '51002' },
  'testnet.qtornado.com': { s: '51002' },
} as const;

export const GRIMM_APP_LN_URL_DOMAIN = 'pay.usegrimm.app';
