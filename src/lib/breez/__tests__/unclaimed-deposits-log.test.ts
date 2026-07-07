jest.mock('@breeztech/breez-sdk-spark-react-native', () => ({
  DepositClaimError_Tags: {
    MaxDepositClaimFeeExceeded: 'MaxDepositClaimFeeExceeded',
    MissingUtxo: 'MissingUtxo',
    Generic: 'Generic',
  },
}));

import type { DepositInfo } from '@breeztech/breez-sdk-spark-react-native';
import { DepositClaimError_Tags } from '@breeztech/breez-sdk-spark-react-native';

import {
  formatDepositsSummary,
  getActionableDeposits,
  getDepositKey,
  getDepositStatus,
  getRequiredClaimFeeSats,
} from '../unclaimed-deposits-log';

const actionableDeposit = {
  txid: 'abc123def456',
  vout: 1,
  amountSats: BigInt(100_000),
  isMature: true,
  claimError: {
    tag: DepositClaimError_Tags.MaxDepositClaimFeeExceeded,
    inner: { requiredFeeSats: BigInt(500), requiredFeeRateSatPerVbyte: BigInt(10) },
  },
} as DepositInfo;

describe('getDepositKey', () => {
  it('builds a stable key from txid and vout', () => {
    expect(getDepositKey(actionableDeposit)).toBe('abc123def456:1');
  });
});

describe('getDepositStatus', () => {
  it('returns pending when the deposit is not mature', () => {
    expect(getDepositStatus({ ...actionableDeposit, isMature: false, claimError: undefined })).toBe('pending_confirmations');
  });

  it('returns claim_failed when mature with a claim error', () => {
    expect(getDepositStatus(actionableDeposit)).toBe('claim_failed');
  });

  it('returns awaiting auto claim when mature without error', () => {
    expect(getDepositStatus({ ...actionableDeposit, claimError: undefined })).toBe('mature_awaiting_auto_claim');
  });
});

describe('getRequiredClaimFeeSats', () => {
  it('returns the required fee for MaxDepositClaimFeeExceeded', () => {
    expect(getRequiredClaimFeeSats(actionableDeposit)).toBe(BigInt(500));
  });

  it('returns null for other claim errors', () => {
    expect(
      getRequiredClaimFeeSats({
        ...actionableDeposit,
        claimError: { tag: DepositClaimError_Tags.MissingUtxo, inner: { tx: 'tx', vout: 0 } },
      } as DepositInfo),
    ).toBeNull();
  });
});

describe('getActionableDeposits', () => {
  it('returns only mature deposits with MaxDepositClaimFeeExceeded', () => {
    const deposits = [
      actionableDeposit,
      { ...actionableDeposit, isMature: false } as DepositInfo,
      {
        ...actionableDeposit,
        claimError: { tag: DepositClaimError_Tags.MissingUtxo, inner: { tx: 'tx', vout: 0 } },
      } as DepositInfo,
    ];

    expect(getActionableDeposits(deposits)).toEqual([actionableDeposit]);
  });
});

describe('formatDepositsSummary', () => {
  it('returns a friendly empty message', () => {
    expect(formatDepositsSummary([])).toBe('No unclaimed deposits');
  });

  it('formats actionable deposits with status and truncated txid', () => {
    const summary = formatDepositsSummary([actionableDeposit]);

    expect(summary).toContain('100000 sats');
    expect(summary).toContain('claim failed');
    expect(summary).toContain('abc123de');
  });
});
