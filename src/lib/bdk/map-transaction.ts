import type { CanonicalTx, WalletInterface } from 'bdk-rn';
import { ChainPosition_Tags } from 'bdk-rn';

import { amountToNumber } from './balance';
import type { OnchainTransaction } from './types';

function confirmationFromChainPosition(chainPosition: CanonicalTx['chainPosition']): OnchainTransaction['confirmationTime'] {
  if (chainPosition.tag !== ChainPosition_Tags.Confirmed) {
    return undefined;
  }

  const { confirmationBlockTime } = chainPosition.inner;
  return {
    height: confirmationBlockTime.blockId.height,
    timestamp: Number(confirmationBlockTime.confirmationTime),
  };
}

export function mapCanonicalTxToOnchain(wallet: WalletInterface, canonicalTx: CanonicalTx): OnchainTransaction {
  const { sent, received } = wallet.sentAndReceived(canonicalTx.transaction);

  let fee: number | undefined;
  try {
    fee = amountToNumber(wallet.calculateFee(canonicalTx.transaction));
  } catch {
    fee = 0;
  }

  return {
    txid: canonicalTx.transaction.computeTxid().toString(),
    received: amountToNumber(received),
    sent: amountToNumber(sent),
    fee,
    confirmationTime: confirmationFromChainPosition(canonicalTx.chainPosition),
  };
}

export function mapWalletTransactions(wallet: WalletInterface): OnchainTransaction[] {
  return wallet.transactions().map((tx) => mapCanonicalTxToOnchain(wallet, tx));
}

export function sortOnchainTransactions(transactions: OnchainTransaction[]): OnchainTransaction[] {
  return [...transactions].sort((a, b) => (b.confirmationTime?.timestamp || 0) - (a.confirmationTime?.timestamp || 0));
}
