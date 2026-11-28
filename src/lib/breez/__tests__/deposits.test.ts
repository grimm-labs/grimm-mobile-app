jest.mock('@breeztech/breez-sdk-spark-react-native', () => require('@/lib/breez/__tests__/helpers/fake-breez-sdk'));

import {
  approvedClaimMaxFee,
  AUTO_CLAIM_MAX_FEE_PPM,
  AUTO_CLAIM_MAX_FEE_SATS,
  autoClaimMaxFee,
  claimErrorToResult,
  getActionableDeposits,
  getClaimErrorMessage,
  getDepositKey,
  getDepositState,
  getRequiredClaimFeeSats,
  getVisibleDeposits,
  toClaimResult,
} from '../deposits';
import {
  ClaimDeferredReason_Tags,
  deferred,
  fakeDeposit,
  feeTooHigh,
  genericClaimError,
  instantStatus,
  InstantClaimStatus_Tags,
  MaxOnchainFee_Tags,
  missingUtxo,
  PaymentStatus,
  refundBroadcast,
  sdkError,
  settled,
  submitted,
  tooSmall,
} from './helpers/fake-breez-sdk';

describe('getDepositState', () => {
  it('is confirming while the deposit does not have enough confirmations', () => {
    expect(getDepositState(fakeDeposit({ isMature: false }))).toBe('confirming');
  });

  it('stays confirming when an early claim attempt failed before maturity: the SDK claims it at maturity', () => {
    expect(getDepositState(fakeDeposit({ isMature: false, claimError: genericClaimError('provider unreachable') }))).toBe('confirming');
    expect(getDepositState(fakeDeposit({ isMature: false, instantClaimStatus: instantStatus(InstantClaimStatus_Tags.Declined) }))).toBe('confirming');
  });

  it('is awaitingClaim once confirmed with no claim error', () => {
    expect(getDepositState(fakeDeposit())).toBe('awaitingClaim');
  });

  it('needs fee approval when the claim costs more than the automatic limit', () => {
    expect(getDepositState(fakeDeposit({ claimError: feeTooHigh(800) }))).toBe('needsFeeApproval');
  });

  it('is claiming once a claim was submitted or credited', () => {
    expect(getDepositState(fakeDeposit({ isMature: false, instantClaimStatus: instantStatus(InstantClaimStatus_Tags.Submitted) }))).toBe('claiming');
    expect(getDepositState(fakeDeposit({ instantClaimStatus: instantStatus(InstantClaimStatus_Tags.Claimed), claimError: feeTooHigh(800) }))).toBe('claiming');
  });

  it('is tooSmall whatever its depth', () => {
    expect(getDepositState(fakeDeposit({ claimError: tooSmall() }))).toBe('tooSmall');
    expect(getDepositState(fakeDeposit({ isMature: false, claimError: tooSmall() }))).toBe('tooSmall');
  });

  it('is failed after another claim error on a confirmed deposit', () => {
    expect(getDepositState(fakeDeposit({ claimError: missingUtxo() }))).toBe('failed');
    expect(getDepositState(fakeDeposit({ claimError: genericClaimError('boom') }))).toBe('failed');
  });

  it('is refunding as soon as a refund exists, before any other state', () => {
    expect(getDepositState(fakeDeposit({ refundState: refundBroadcast(), claimError: feeTooHigh(800) }))).toBe('refunding');
  });
});

describe('deposit details', () => {
  it('keys a deposit by its outpoint', () => {
    expect(getDepositKey({ txid: 'abc', vout: 2 })).toBe('abc:2');
  });

  it('returns the fee the provider asked for, only for a fee above the limit', () => {
    expect(getRequiredClaimFeeSats(fakeDeposit({ claimError: feeTooHigh(812) }))).toBe(BigInt(812));
    expect(getRequiredClaimFeeSats(fakeDeposit({ claimError: missingUtxo() }))).toBeNull();
    expect(getRequiredClaimFeeSats(fakeDeposit())).toBeNull();
  });

  it('returns the message of a generic claim error only', () => {
    expect(getClaimErrorMessage(fakeDeposit({ claimError: genericClaimError('provider unreachable') }))).toBe('provider unreachable');
    expect(getClaimErrorMessage(fakeDeposit({ claimError: feeTooHigh(800) }))).toBeNull();
  });
});

describe('deposit lists', () => {
  const confirming = fakeDeposit({ txid: 'confirming', isMature: false });
  const needsFee = fakeDeposit({ txid: 'needs-fee', claimError: feeTooHigh(800) });
  const needsFeeButClaimed = fakeDeposit({ txid: 'claimed', claimError: feeTooHigh(800), instantClaimStatus: instantStatus(InstantClaimStatus_Tags.Claimed) });
  const submittedDeposit = fakeDeposit({ txid: 'submitted', instantClaimStatus: instantStatus(InstantClaimStatus_Tags.Submitted) });

  it('offers a manual claim only for deposits waiting for the fee approval', () => {
    expect(getActionableDeposits([confirming, needsFee, needsFeeButClaimed, submittedDeposit])).toEqual([needsFee]);
  });

  it('hides the deposits whose credit is already a payment, and keeps the others', () => {
    expect(getVisibleDeposits([confirming, needsFee, needsFeeButClaimed, submittedDeposit])).toEqual([confirming, needsFee, submittedDeposit]);
  });
});

describe('claim fee ceilings', () => {
  it('claims automatically up to 500 sats plus 0.1% of the deposit', () => {
    expect(AUTO_CLAIM_MAX_FEE_SATS).toBe(500);
    expect(AUTO_CLAIM_MAX_FEE_PPM).toBe(1_000);
    expect(autoClaimMaxFee()).toEqual({ onchain: expect.objectContaining({ tag: MaxOnchainFee_Tags.Fixed, inner: { amount: BigInt(500) } }), proportionalPpm: 1_000 });
  });

  it('caps a manual claim at the fee the user approved, with no proportional share', () => {
    expect(approvedClaimMaxFee(BigInt(812))).toEqual({ onchain: expect.objectContaining({ tag: MaxOnchainFee_Tags.Fixed, inner: { amount: BigInt(812) } }), proportionalPpm: undefined });
  });
});

describe('toClaimResult', () => {
  it('reports a credit when the claim settled with a completed payment', () => {
    expect(toClaimResult(settled(PaymentStatus.Completed) as never)).toEqual({ kind: 'credited', payment: expect.objectContaining({ status: PaymentStatus.Completed }) });
  });

  it('reports the credit as on its way when the settled payment is still pending (the stuck-deposit case)', () => {
    expect(toClaimResult(settled(PaymentStatus.Pending) as never)).toEqual({ kind: 'crediting', payment: expect.objectContaining({ status: PaymentStatus.Pending }) });
  });

  it('reports the credit as on its way when an early claim was submitted', () => {
    expect(toClaimResult(submitted() as never)).toEqual({ kind: 'crediting' });
  });

  it('reports the new fee when the claim was deferred over the fee', () => {
    const reason = { tag: ClaimDeferredReason_Tags.MaxFeeExceeded, inner: { requiredFeeSats: BigInt(950), maxFeeSats: BigInt(812) } };
    expect(toClaimResult(deferred(reason) as never)).toEqual({ kind: 'feeChanged', requiredFeeSats: BigInt(950) });
  });

  it('reports nothing claimed yet for the other deferrals', () => {
    expect(toClaimResult(deferred({ tag: ClaimDeferredReason_Tags.NoEarlyClaimAvailable }) as never)).toEqual({ kind: 'notYet' });
    expect(toClaimResult(deferred({ tag: ClaimDeferredReason_Tags.ProviderDeclined, inner: { message: 'busy' } }) as never)).toEqual({ kind: 'notYet' });
  });
});

describe('claimErrorToResult', () => {
  it('turns the expected claim errors into answers', () => {
    expect(claimErrorToResult(sdkError('DepositClaimInProgress', { tx: 'tx', vout: 0 }))).toEqual({ kind: 'inProgress' });
    expect(claimErrorToResult(sdkError('DepositTooSmall', { tx: 'tx', vout: 0 }))).toEqual({ kind: 'tooSmall' });
    expect(claimErrorToResult(sdkError('MaxDepositClaimFeeExceeded', { requiredFeeSats: BigInt(1_200) }))).toEqual({ kind: 'feeChanged', requiredFeeSats: BigInt(1_200) });
  });

  it('leaves any other error to the caller', () => {
    expect(claimErrorToResult(sdkError('NetworkError'))).toBeNull();
    expect(claimErrorToResult(new Error('boom'))).toBeNull();
    expect(claimErrorToResult(undefined)).toBeNull();
    expect(claimErrorToResult(sdkError('MaxDepositClaimFeeExceeded', { requiredFeeSats: 'not a bigint' }))).toBeNull();
  });
});
