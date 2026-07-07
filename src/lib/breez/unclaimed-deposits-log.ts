import type { DepositInfo } from '@breeztech/breez-sdk-spark-react-native';
import { DepositClaimError_Tags } from '@breeztech/breez-sdk-spark-react-native';

export const UNCLAIMED_DEPOSITS_LOG_PREFIX = '[Breez SDK] Unclaimed deposits';

function formatClaimError(claimError: DepositInfo['claimError']): string {
  if (!claimError) return 'none';

  switch (claimError.tag) {
    case DepositClaimError_Tags.MaxDepositClaimFeeExceeded:
      return `MaxDepositClaimFeeExceeded (required: ${claimError.inner.requiredFeeSats.toString()} sats, rate: ${claimError.inner.requiredFeeRateSatPerVbyte.toString()} sat/vB)`;
    case DepositClaimError_Tags.MissingUtxo:
      return 'MissingUtxo';
    case DepositClaimError_Tags.Generic:
      return `Generic: ${claimError.inner.message}`;
    default: {
      const _exhaustive: never = claimError;
      return String(_exhaustive);
    }
  }
}

export function getDepositStatus(deposit: DepositInfo): string {
  if (!deposit.isMature) return 'pending_confirmations';
  if (deposit.claimError) return 'claim_failed';
  return 'mature_awaiting_auto_claim';
}

export function getDepositKey(deposit: DepositInfo): string {
  return `${deposit.txid}:${deposit.vout}`;
}

export function getRequiredClaimFeeSats(deposit: DepositInfo): bigint | null {
  if (deposit.claimError?.tag !== DepositClaimError_Tags.MaxDepositClaimFeeExceeded) {
    return null;
  }

  return deposit.claimError.inner.requiredFeeSats;
}

export function getActionableDeposits(deposits: DepositInfo[]): DepositInfo[] {
  return deposits.filter((deposit) => deposit.isMature && deposit.claimError?.tag === DepositClaimError_Tags.MaxDepositClaimFeeExceeded);
}

function formatDepositForLog(deposit: DepositInfo, index: number): string {
  return [
    `#${index + 1} ${deposit.txid}:${deposit.vout}`,
    `amount=${deposit.amountSats.toString()} sats`,
    `status=${getDepositStatus(deposit)}`,
    `isMature=${deposit.isMature}`,
    `claimError=${formatClaimError(deposit.claimError)}`,
  ].join(' | ');
}

export function formatDepositsSummary(deposits: DepositInfo[]): string {
  if (deposits.length === 0) return 'No unclaimed deposits';

  return deposits
    .map((deposit, index) => {
      const status = getDepositStatus(deposit);
      const statusLabel = status === 'pending_confirmations' ? 'pending' : status === 'claim_failed' ? 'claim failed' : 'awaiting auto claim';
      return `${index + 1}. ${deposit.amountSats.toString()} sats (${statusLabel}) — ${deposit.txid.slice(0, 8)}…:${deposit.vout}`;
    })
    .join('\n');
}

export function logUnclaimedDeposits(deposits: DepositInfo[], source: string): void {
  console.warn(`${UNCLAIMED_DEPOSITS_LOG_PREFIX} [${source}] count: ${deposits.length}`);

  if (deposits.length === 0) {
    console.warn(`${UNCLAIMED_DEPOSITS_LOG_PREFIX} [${source}] none pending or unclaimed`);
    return;
  }

  deposits.forEach((deposit, index) => {
    console.warn(`${UNCLAIMED_DEPOSITS_LOG_PREFIX} [${source}] ${formatDepositForLog(deposit, index)}`);
  });

  const pending = deposits.filter((deposit) => !deposit.isMature);
  const failed = deposits.filter((deposit) => deposit.isMature && deposit.claimError);
  const awaitingAutoClaim = deposits.filter((deposit) => deposit.isMature && !deposit.claimError);

  console.warn(`${UNCLAIMED_DEPOSITS_LOG_PREFIX} [${source}] summary — pending: ${pending.length}, claim failed: ${failed.length}, awaiting auto claim: ${awaitingAutoClaim.length}`);
}
