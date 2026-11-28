import type { ClaimDepositResponse, DepositInfo, Payment } from '@breeztech/breez-sdk-spark-react-native';
import { ClaimDeferredReason_Tags, ClaimDepositOutcome_Tags, DepositClaimError_Tags, InstantClaimStatus_Tags, MaxFee, MaxOnchainFee, PaymentStatus } from '@breeztech/breez-sdk-spark-react-native';

/**
 * The most the SDK pays, on its own, to claim an on-chain deposit: 500 sats plus 0.1% of the deposit.
 * The SDK default (1 sat/vB, about 99 sats, plus 0.1%) is below what the Spark Service Provider usually charges,
 * so almost every deposit waited for a manual claim. 500 sats is Glow's default; the proportional part keeps large
 * deposits, whose provider fee grows with the amount, claimed automatically. Above it, the user approves the fee.
 */
export const AUTO_CLAIM_MAX_FEE_SATS = 500;
export const AUTO_CLAIM_MAX_FEE_PPM = 1_000;

export function autoClaimMaxFee(): MaxFee {
  return MaxFee.create({
    onchain: new MaxOnchainFee.Fixed({ amount: BigInt(AUTO_CLAIM_MAX_FEE_SATS) }),
    proportionalPpm: AUTO_CLAIM_MAX_FEE_PPM,
  });
}

/** A manual claim pays at most the fee the user approved. */
export function approvedClaimMaxFee(feeSats: bigint): MaxFee {
  return MaxFee.create({ onchain: new MaxOnchainFee.Fixed({ amount: feeSats }), proportionalPpm: undefined });
}

/**
 * Where an on-chain deposit to the Lightning wallet stands, as the user should see it:
 * - `confirming`: waiting for on-chain confirmations; the SDK claims it once it can
 * - `awaitingClaim`: confirmed, the SDK claims it on its next attempt
 * - `needsFeeApproval`: the claim costs more than the automatic limit; the user can approve the fee
 * - `claiming`: a claim was submitted and the funds are on their way to the balance
 * - `tooSmall`: the deposit is too small to cover any claim fee
 * - `failed`: the last claim attempt failed for another reason; the SDK tries again
 * - `refunding`: the deposit is being sent back to a Bitcoin address
 */
export type DepositState = 'confirming' | 'awaitingClaim' | 'needsFeeApproval' | 'claiming' | 'tooSmall' | 'failed' | 'refunding';

export function getDepositState(deposit: DepositInfo): DepositState {
  if (deposit.refundState) return 'refunding';
  const instantStatus = deposit.instantClaimStatus?.tag;
  if (instantStatus === InstantClaimStatus_Tags.Submitted || instantStatus === InstantClaimStatus_Tags.Claimed) return 'claiming';
  if (deposit.claimError?.tag === DepositClaimError_Tags.DepositTooSmall) return 'tooSmall';
  if (!deposit.isMature) return 'confirming';

  switch (deposit.claimError?.tag) {
    case undefined:
      return 'awaitingClaim';
    case DepositClaimError_Tags.MaxDepositClaimFeeExceeded:
      return 'needsFeeApproval';
    default:
      return 'failed';
  }
}

export function getDepositKey(deposit: Pick<DepositInfo, 'txid' | 'vout'>): string {
  return `${deposit.txid}:${deposit.vout}`;
}

/** The fee the provider asked for at the last automatic attempt, when it was above the limit. */
export function getRequiredClaimFeeSats(deposit: DepositInfo): bigint | null {
  if (deposit.claimError?.tag !== DepositClaimError_Tags.MaxDepositClaimFeeExceeded) return null;
  return deposit.claimError.inner.requiredFeeSats;
}

/** The message of a claim that failed for another reason than the fee. */
export function getClaimErrorMessage(deposit: DepositInfo): string | null {
  return deposit.claimError?.tag === DepositClaimError_Tags.Generic ? deposit.claimError.inner.message : null;
}

/** Deposits waiting for the user to approve the claim fee. */
export function getActionableDeposits(deposits: DepositInfo[]): DepositInfo[] {
  return deposits.filter((deposit) => getDepositState(deposit) === 'needsFeeApproval');
}

/**
 * Deposits to show in the transaction lists. The SDK keeps a claimed deposit listed until the provider spends its
 * output, but by then its credit is already a payment: showing both would count the deposit twice.
 */
export function getVisibleDeposits(deposits: DepositInfo[]): DepositInfo[] {
  return deposits.filter((deposit) => deposit.instantClaimStatus?.tag !== InstantClaimStatus_Tags.Claimed);
}

/**
 * What a manual claim did:
 * - `credited`: the payment is in the balance
 * - `crediting`: the claim went through, the payment is on its way to the balance (it can take until the next sync)
 * - `feeChanged`: the provider now asks more than the approved fee; `requiredFeeSats` is the new fee
 * - `notYet`: nothing was claimed yet; the SDK claims the deposit later (more confirmations, or the provider declined for now)
 * - `inProgress`: another claim of this deposit is already running
 * - `tooSmall`: the deposit cannot cover a claim fee
 */
export type ClaimResult =
  { kind: 'credited'; payment: Payment } | { kind: 'crediting'; payment?: Payment } | { kind: 'feeChanged'; requiredFeeSats: bigint } | { kind: 'notYet' } | { kind: 'inProgress' } | { kind: 'tooSmall' };

export function toClaimResult(response: ClaimDepositResponse): ClaimResult {
  const { outcome } = response;
  switch (outcome.tag) {
    case ClaimDepositOutcome_Tags.Settled: {
      const { payment } = outcome.inner;
      // A settled claim returns the payment as the SDK stored it: still Pending until the wallet claims the transfer
      return payment.status === PaymentStatus.Completed ? { kind: 'credited', payment } : { kind: 'crediting', payment };
    }
    case ClaimDepositOutcome_Tags.Submitted:
      return { kind: 'crediting' };
    case ClaimDepositOutcome_Tags.Deferred: {
      const { reason } = outcome.inner;
      if (reason.tag === ClaimDeferredReason_Tags.MaxFeeExceeded) return { kind: 'feeChanged', requiredFeeSats: reason.inner.requiredFeeSats };
      return { kind: 'notYet' };
    }
  }
}

type ThrownSdkError = { tag?: unknown; inner?: { requiredFeeSats?: unknown } } | null | undefined;

/** The claim errors that are an answer rather than a failure. Returns null for any other error, which the caller reports. */
export function claimErrorToResult(error: unknown): ClaimResult | null {
  const thrown = error as ThrownSdkError;
  switch (thrown?.tag) {
    case 'DepositClaimInProgress':
      return { kind: 'inProgress' };
    case 'DepositTooSmall':
      return { kind: 'tooSmall' };
    case 'MaxDepositClaimFeeExceeded': {
      const requiredFeeSats = thrown.inner?.requiredFeeSats;
      return typeof requiredFeeSats === 'bigint' ? { kind: 'feeChanged', requiredFeeSats } : null;
    }
    default:
      return null;
  }
}
