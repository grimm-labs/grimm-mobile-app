export interface EsploraServer {
  id: string;
  mainnetBaseUrl: string;
  testnetBaseUrl: string;
}

// Default Esplora indexer used when nothing is stored yet (fresh install / first connection).
export const DEFAULT_SERVER_ID = 'blockstream.info';

/** Legacy Electrum host stored before the Esplora migration. */
export const LEGACY_ELECTRUM_SERVER_ID = 'electrum.blockstream.info';

// Esplora indexers (HTTPS/443) for on-chain sync; see bdk-context
export const DEFAULT_ESPLORA_SERVERS: EsploraServer[] = [
  {
    id: 'blockstream.info',
    mainnetBaseUrl: 'https://blockstream.info/api',
    testnetBaseUrl: 'https://blockstream.info/testnet/api',
  },
  {
    id: 'mempool.space',
    mainnetBaseUrl: 'https://mempool.space/api',
    testnetBaseUrl: 'https://mempool.space/testnet4/api',
  },
  {
    id: 'bitcoin.lu.ke',
    mainnetBaseUrl: 'https://bitcoin.lu.ke/api',
    testnetBaseUrl: 'https://bitcoin.lu.ke/testnet/api',
  },
];

export const GRIMM_APP_LN_URL_DOMAIN = 'pay.usegrimm.app';
