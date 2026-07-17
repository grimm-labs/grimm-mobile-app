/**
 * Shared Jest mock for bdk-rn 1.0 (bdk-ffi 3.0 API).
 * Use: jest.mock('bdk-rn', () => require('@/lib/bdk/__tests__/helpers/mock-bdk-rn'));
 */

export enum Network {
  Bitcoin = 0,
  Testnet = 1,
  Testnet4 = 2,
  Signet = 3,
  Regtest = 4,
}

export enum NetworkKind {
  Main = 0,
  Test = 1,
}

export enum KeychainKind {
  External = 0,
  Internal = 1,
}

export enum WordCount {
  Words12 = 0,
  Words15 = 1,
  Words18 = 2,
  Words21 = 3,
  Words24 = 4,
}

export enum ChainPosition_Tags {
  Confirmed = 'Confirmed',
  Unconfirmed = 'Unconfirmed',
}

export const ChainPosition = {
  Confirmed: {
    new: (inner: { confirmationBlockTime: { blockId: { height: number }; confirmationTime: bigint } }) => ({
      tag: ChainPosition_Tags.Confirmed,
      inner,
    }),
  },
  Unconfirmed: {
    new: () => ({
      tag: ChainPosition_Tags.Unconfirmed,
      inner: {},
    }),
  },
};

export type MockAmount = {
  toSat: () => bigint;
};

export type MockBalance = {
  confirmed: MockAmount;
  trustedPending: MockAmount;
  untrustedPending: MockAmount;
  total: MockAmount;
};

export type MockAddressInfo = {
  address: { toString: () => string };
  index: number;
};

export type MockTransaction = {
  computeTxid: jest.Mock<{ toString: () => string }>;
  vsize: jest.Mock<bigint>;
};

export type MockCanonicalTx = {
  transaction: MockTransaction;
  chainPosition: { tag: ChainPosition_Tags; inner?: { confirmationBlockTime: { blockId: { height: number }; confirmationTime: bigint } } };
};

export type MockWallet = {
  balance: jest.Mock<MockBalance>;
  transactions: jest.Mock<MockCanonicalTx[]>;
  sentAndReceived: jest.Mock<{ sent: MockAmount; received: MockAmount }>;
  calculateFee: jest.Mock<MockAmount>;
  startFullScan: jest.Mock<{ build: () => object }>;
  startSyncWithRevealedSpks: jest.Mock<{ build: () => object }>;
  applyUpdate: jest.Mock<void>;
  persist: jest.Mock<boolean>;
  revealNextAddress: jest.Mock<MockAddressInfo>;
  sign: jest.Mock<boolean>;
  finalizePsbt: jest.Mock<boolean>;
};

export type MockEsploraClient = {
  getHeight: jest.Mock<number>;
  fullScan: jest.Mock<Promise<object>>;
  sync: jest.Mock<Promise<object>>;
  broadcast: jest.Mock<void>;
};

export function amountSats(sats: number): MockAmount {
  return { toSat: () => BigInt(sats) };
}

export function createMockBalance(overrides?: Partial<{ confirmed: number; trustedPending: number; untrustedPending: number }>): MockBalance {
  const confirmed = overrides?.confirmed ?? 0;
  const trustedPending = overrides?.trustedPending ?? 0;
  const untrustedPending = overrides?.untrustedPending ?? 0;
  const total = confirmed + trustedPending + untrustedPending;
  return {
    confirmed: amountSats(confirmed),
    trustedPending: amountSats(trustedPending),
    untrustedPending: amountSats(untrustedPending),
    total: amountSats(total),
  };
}

export function createMockTransaction(overrides?: Partial<{ txid: string; vsize: number }>): MockTransaction {
  const txid = overrides?.txid ?? 'abc123';
  return {
    computeTxid: jest.fn(() => ({ toString: () => txid })),
    vsize: jest.fn(() => BigInt(overrides?.vsize ?? 140)),
  };
}

export function createMockWallet(overrides?: Partial<MockWallet>): MockWallet {
  return {
    balance: jest.fn(() => createMockBalance()),
    transactions: jest.fn(() => []),
    sentAndReceived: jest.fn(() => ({ sent: amountSats(0), received: amountSats(0) })),
    calculateFee: jest.fn(() => amountSats(0)),
    startFullScan: jest.fn(() => ({ build: () => ({}) })),
    startSyncWithRevealedSpks: jest.fn(() => ({ build: () => ({}) })),
    applyUpdate: jest.fn(),
    persist: jest.fn(() => true),
    revealNextAddress: jest.fn(() => ({
      address: { toString: () => 'tb1qtestaddress' },
      index: 0,
    })),
    sign: jest.fn(() => true),
    finalizePsbt: jest.fn(() => true),
    ...overrides,
  };
}

export function createMockEsploraClient(overrides?: Partial<MockEsploraClient>): MockEsploraClient {
  return {
    getHeight: jest.fn(() => 800000),
    fullScan: jest.fn(async () => ({})),
    sync: jest.fn(async () => ({})),
    broadcast: jest.fn(),
    ...overrides,
  };
}

export class Mnemonic {
  static fromString = jest.fn((phrase: string) => ({ toString: () => phrase }));
  constructor(_wordCount?: WordCount) {
    return { toString: () => 'word '.repeat(12).trim() };
  }
}

export class DescriptorSecretKey {
  constructor(_networkKind: NetworkKind, _mnemonic: unknown, _passphrase?: string) {}
}

export class Descriptor {
  static newBip84 = jest.fn((_key: unknown, _kind: KeychainKind, _networkKind: NetworkKind) => ({}));
  constructor(_desc: string, _networkKind: NetworkKind) {}
}

type MockWalletConstructor = jest.Mock & {
  load: jest.Mock;
  createSingle: jest.Mock;
};

export const Wallet = jest.fn().mockImplementation((_ext: unknown, _int: unknown, _network: Network, _persister: unknown) => createMockWallet()) as MockWalletConstructor;
Wallet.load = jest.fn((_ext: unknown, _int: unknown, _persister: unknown) => createMockWallet());
Wallet.createSingle = jest.fn((_desc: unknown, _network: Network, _persister: unknown) => createMockWallet());

export const Persister = {
  newSqlite: jest.fn((_path: string) => ({})),
  newInMemory: jest.fn(() => ({})),
};

export const EsploraClient = jest.fn((_url: string, _proxy?: string) => createMockEsploraClient());

export const TxBuilder = jest.fn().mockImplementation(() => ({
  addRecipient: jest.fn().mockReturnThis(),
  setExactSequence: jest.fn().mockReturnThis(),
  feeRate: jest.fn().mockReturnThis(),
  finish: jest.fn(() => new Psbt()),
}));

export class Address {
  constructor(_addr: string, _network: Network) {}
  scriptPubkey = jest.fn(() => ({}));
}

export class Amount {
  static fromSat = jest.fn((sats: bigint) => amountSats(Number(sats)));
}

export class FeeRate {
  static fromSatPerVb = jest.fn((_satVb: bigint) => ({}));
}

export const Psbt = jest.fn().mockImplementation(() => ({
  extractTx: jest.fn(() => createMockTransaction()),
}));
