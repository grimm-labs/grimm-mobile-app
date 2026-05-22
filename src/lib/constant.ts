export const MEMPOOL_SSL_URL_TESTNET = 'ssl://electrum.blockstream.info:60004';
export const MEMPOOL_SSL_URL = 'ssl://electrum.blockstream.info:60002';

export const DEFAULT_PORTS = { t: '50001', s: '50002' } as const;
export const DEFAULT_PORTS_TESTNET = { t: '51001', s: '51002' } as const;

// Electrum clearnet (used when Tor is off for on-chain sync; see bdk-context)
export const DEFAULT_SERVERS = {
  'electrum.blockstream.info': { s: '50002' },
  'bitcoin.lu.ke': { s: '50002' },
  'electrum.emzy.de': { s: '50002' },
  'fulcrum.sethforprivacy.com': { s: '50002' },
  'electrum.bitaroo.net': { s: '50002' },
  'blockstream.info': { s: '700' },
  'electrum.diynodes.com': { s: '50022' },
} as const;

// Electrum mainnet onion — plain TCP (no TLS) over Tor, see bdk-context electrumUrl (tcp://)
export const DEFAULT_SERVERS_ONION = {
  // eslint-disable-next-line no-secrets/no-secrets -- public Electrum v3 hidden service hostname, not a secret
  'g2hkrtvnf3xtmuxm4js2zyj73lazf7x27jgw37ciaqvjcw3573svb5yd.onion': { t: '50001' },
} as const;

// Electrum testnet clearnet (used when Tor is off)
export const DEFAULT_SERVERS_TESTNET = {
  'electrum.blockstream.info': { s: '60002' },
  'testnet.aranguren.org': { s: '51002' },
  'testnet.qtornado.com': { s: '51002' },
} as const;

// Electrum testnet onion — add at least one v3 .onion for testnet + Tor-only mode
export const DEFAULT_SERVERS_TESTNET_ONION = {} as const;

export const GRIMM_APP_LN_URL_DOMAIN = 'pay.usegrimm.app';
