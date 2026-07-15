/* eslint-disable max-params */
import { Descriptor, DescriptorSecretKey, KeychainKind, Persister, Wallet, type WalletInterface } from 'bdk-rn';

import { balanceToSats } from './balance';
import { mapWalletTransactions, sortOnchainTransactions } from './map-transaction';
import { parseMnemonic } from './mnemonic';
import { type BreezNetwork, toBdkNetwork, toNetworkKind } from './network';
import type { WalletSession, WalletSnapshot } from './types';

export function formatUnknownError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message?.trim();
    if (msg) return msg;
    const stack = typeof error.stack === 'string' ? error.stack.trim() : '';
    if (stack) return stack;
  }
  const asStr = String(error).trim();
  return asStr || 'Unknown error';
}

export function isWalletPersistenceError(error: unknown): boolean {
  const message = formatUnknownError(error);
  return message.includes('CouldNotLoad') || message.includes('DataAlreadyExists') || message.includes('LoadWithPersist') || message.includes('CreateWithPersist');
}

export function buildDescriptorsFromSeed(seedPhrase: string, breezNetwork: BreezNetwork) {
  const networkKind = toNetworkKind(breezNetwork);
  const mnemonic = parseMnemonic(seedPhrase);
  const secretKey = new DescriptorSecretKey(networkKind, mnemonic, undefined);
  const externalDescriptor = Descriptor.newBip84(secretKey, KeychainKind.External, networkKind);
  const internalDescriptor = Descriptor.newBip84(secretKey, KeychainKind.Internal, networkKind);
  const network = toBdkNetwork(breezNetwork);

  return { externalDescriptor, internalDescriptor, network };
}

export type CreateWalletDeps = {
  hasExistingDb: (dbPath: string) => Promise<boolean>;
  deleteDb: () => Promise<void>;
};

export async function createOrLoadWallet(seedPhrase: string, breezNetwork: BreezNetwork, dbPath: string, deps: CreateWalletDeps): Promise<WalletSession> {
  const { externalDescriptor, internalDescriptor, network } = buildDescriptorsFromSeed(seedPhrase, breezNetwork);
  let persister = Persister.newSqlite(dbPath);
  const loadExisting = await deps.hasExistingDb(dbPath);

  try {
    const wallet = loadExisting ? Wallet.load(externalDescriptor, internalDescriptor, persister) : new Wallet(externalDescriptor, internalDescriptor, network, persister);
    return { wallet, persister };
  } catch (error) {
    if (!isWalletPersistenceError(error)) {
      throw error;
    }
    await deps.deleteDb();
    persister = Persister.newSqlite(dbPath);
    const wallet = new Wallet(externalDescriptor, internalDescriptor, network, persister);
    return { wallet, persister };
  }
}

export function readWalletSnapshot(wallet: WalletInterface): WalletSnapshot {
  const { total, confirmed, unconfirmed } = balanceToSats(wallet.balance());
  return {
    balance: total,
    confirmedBalance: confirmed,
    unconfirmedBalance: unconfirmed,
    transactions: sortOnchainTransactions(mapWalletTransactions(wallet)),
  };
}
