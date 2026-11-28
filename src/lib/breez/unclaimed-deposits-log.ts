import type { DepositInfo } from '@breeztech/breez-sdk-spark-react-native';
import { DepositClaimError_Tags } from '@breeztech/breez-sdk-spark-react-native';

import type { DepositState } from './deposits';
import { getDepositKey, getDepositState } from './deposits';

export const UNCLAIMED_DEPOSITS_LOG_PREFIX = '[Breez SDK] Unclaimed deposits';

const STATE_LABELS: Record<DepositState, string> = {
  confirming: 'waiting for confirmations',
  awaitingClaim: 'awaiting auto claim',
  needsFeeApproval: 'needs fee approval',
  claiming: 'being credited',
  tooSmall: 'too small to claim',
  failed: 'claim failed',
  refunding: 'refunding',
};

function formatClaimError(claimError: DepositInfo['claimError']): string {
  if (!claimError) return 'none';

  switch (claimError.tag) {
    case DepositClaimError_Tags.MaxDepositClaimFeeExceeded:
      return `MaxDepositClaimFeeExceeded (required: ${claimError.inner.requiredFeeSats.toString()} sats, max: ${claimError.inner.maxFeeSats?.toString() ?? 'none'} sats)`;
    case DepositClaimError_Tags.MissingUtxo:
      return 'MissingUtxo';
    case DepositClaimError_Tags.DepositTooSmall:
      return 'DepositTooSmall';
    case DepositClaimError_Tags.Generic:
      return `Generic: ${claimError.inner.message}`;
    default: {
      const _exhaustive: never = claimError;
      return String(_exhaustive);
    }
  }
}

function formatDepositForLog(deposit: DepositInfo, index: number): string {
  return [
    `#${index + 1} ${getDepositKey(deposit)}`,
    `amount=${deposit.amountSats.toString()} sats`,
    `state=${getDepositState(deposit)}`,
    `isMature=${deposit.isMature}`,
    `claimError=${formatClaimError(deposit.claimError)}`,
    `instantClaimStatus=${deposit.instantClaimStatus?.tag ?? 'none'}`,
    `refundState=${deposit.refundState?.tag ?? 'none'}`,
  ].join(' | ');
}

export function formatDepositsSummary(deposits: DepositInfo[]): string {
  if (deposits.length === 0) return 'No unclaimed deposits';

  return deposits.map((deposit, index) => `${index + 1}. ${deposit.amountSats.toString()} sats (${STATE_LABELS[getDepositState(deposit)]}) — ${deposit.txid.slice(0, 8)}…:${deposit.vout}`).join('\n');
}

export function logUnclaimedDeposits(deposits: DepositInfo[], source: string): void {
  // Skip empty refreshes — they run on a timer and spam the console.
  if (deposits.length === 0) return;

  console.warn(`${UNCLAIMED_DEPOSITS_LOG_PREFIX} [${source}] count: ${deposits.length}`);
  deposits.forEach((deposit, index) => {
    console.warn(`${UNCLAIMED_DEPOSITS_LOG_PREFIX} [${source}] ${formatDepositForLog(deposit, index)}`);
  });
}
