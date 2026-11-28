/**
 * Stand-in for `@breeztech/breez-sdk-spark-react-native` in the deposit, claim and SDK log tests: the real module is
 * native and Jest does not transform it (AGENTS.md). Enum values match SDK 0.28.6.
 * Use: jest.mock('@breeztech/breez-sdk-spark-react-native', () => require('@/lib/breez/__tests__/helpers/fake-breez-sdk'));
 *
 * The builders (`fakeDeposit`, `settled`, `submitted`, `deferred`, `sdkError`) return objects shaped like the SDK records.
 */
import type { DepositInfo } from '@breeztech/breez-sdk-spark-react-native';

export enum PaymentStatus {
  Completed,
  Pending,
  Failed,
}

export enum PaymentType {
  Send,
  Receive,
}

export enum DepositClaimError_Tags {
  MaxDepositClaimFeeExceeded = 'MaxDepositClaimFeeExceeded',
  MissingUtxo = 'MissingUtxo',
  DepositTooSmall = 'DepositTooSmall',
  Generic = 'Generic',
}

export enum InstantClaimStatus_Tags {
  Declined = 'Declined',
  Submitted = 'Submitted',
  Claimed = 'Claimed',
}

export enum RefundState_Tags {
  BroadcastPending = 'BroadcastPending',
  Broadcast = 'Broadcast',
}

export enum ClaimDepositOutcome_Tags {
  Settled = 'Settled',
  Submitted = 'Submitted',
  Deferred = 'Deferred',
}

export enum ClaimDeferredReason_Tags {
  MaxFeeExceeded = 'MaxFeeExceeded',
  NoEarlyClaimAvailable = 'NoEarlyClaimAvailable',
  ProviderDeclined = 'ProviderDeclined',
}

export enum MaxOnchainFee_Tags {
  Fixed = 'Fixed',
  Rate = 'Rate',
  NetworkRecommended = 'NetworkRecommended',
}

export const MaxOnchainFee = {
  Fixed: class {
    readonly tag = MaxOnchainFee_Tags.Fixed;
    readonly inner: { amount: bigint };
    constructor(inner: { amount: bigint }) {
      this.inner = inner;
    }
  },
};

export const MaxFee = {
  create: (fields: { onchain: unknown; proportionalPpm: number | undefined }) => ({ ...fields }),
};

export const initLogging = jest.fn();

type DepositOverrides = Partial<Omit<DepositInfo, 'claimError' | 'instantClaimStatus' | 'refundState'>> & {
  claimError?: unknown;
  instantClaimStatus?: unknown;
  refundState?: unknown;
};

/** A confirmed deposit with no claim attempt yet; override any field. */
export function fakeDeposit(overrides: DepositOverrides = {}): DepositInfo {
  return {
    txid: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
    vout: 0,
    amountSats: BigInt(100_000),
    isMature: true,
    refundTx: undefined,
    refundTxId: undefined,
    refundState: undefined,
    claimError: undefined,
    instantClaimStatus: undefined,
    maxClaimFee: undefined,
    ...overrides,
  } as DepositInfo;
}

export const feeTooHigh = (requiredFeeSats: number) => ({
  tag: DepositClaimError_Tags.MaxDepositClaimFeeExceeded,
  inner: { tx: 'tx', vout: 0, maxFeeSats: BigInt(500), requiredFeeSats: BigInt(requiredFeeSats) },
});
export const tooSmall = () => ({ tag: DepositClaimError_Tags.DepositTooSmall, inner: { tx: 'tx', vout: 0 } });
export const missingUtxo = () => ({ tag: DepositClaimError_Tags.MissingUtxo, inner: { tx: 'tx', vout: 0 } });
export const genericClaimError = (message: string) => ({ tag: DepositClaimError_Tags.Generic, inner: { message } });
export const instantStatus = (tag: InstantClaimStatus_Tags) => ({ tag, inner: tag === InstantClaimStatus_Tags.Declined ? { message: 'declined' } : { claimId: 'claim-1' } });
export const refundBroadcast = () => ({ tag: RefundState_Tags.Broadcast, inner: { txId: 'refund-tx' } });

export function fakePayment(status: PaymentStatus, amountSats = 99_500) {
  return { id: 'deposit-payment', paymentType: PaymentType.Receive, status, amount: BigInt(amountSats), fees: BigInt(500), timestamp: BigInt(1_700_000_000) };
}

export const settled = (status: PaymentStatus) => ({ outcome: { tag: ClaimDepositOutcome_Tags.Settled, inner: { payment: fakePayment(status) } } });
export const submitted = () => ({ outcome: { tag: ClaimDepositOutcome_Tags.Submitted } });
export const deferred = (reason: { tag: ClaimDeferredReason_Tags; inner?: unknown }) => ({ outcome: { tag: ClaimDepositOutcome_Tags.Deferred, inner: { reason } } });

/** A thrown SdkError: the SDK rejects with an object whose `tag` names the error. */
export function sdkError(tag: string, inner: Record<string, unknown> = {}) {
  return Object.assign(new Error(tag), { tag, inner: { docsUrl: 'https://sdk-doc-spark.breez.technology', ...inner } });
}
