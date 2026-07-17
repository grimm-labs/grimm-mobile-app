import type { PersisterInterface, WalletInterface } from 'bdk-rn';

export type OnchainTransaction = {
  txid: string;
  received: number;
  sent: number;
  fee?: number;
  confirmationTime?: { height?: number; timestamp?: number };
};

export type WalletSnapshot = {
  balance: number;
  confirmedBalance: number;
  unconfirmedBalance: number;
  transactions: OnchainTransaction[];
};

export type WalletSession = {
  wallet: WalletInterface;
  persister: PersisterInterface;
};
