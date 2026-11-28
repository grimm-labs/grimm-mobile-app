jest.mock('@breeztech/breez-sdk-spark-react-native', () => require('@/lib/breez/__tests__/helpers/fake-breez-sdk'));

import { formatDepositsSummary, logUnclaimedDeposits, UNCLAIMED_DEPOSITS_LOG_PREFIX } from '../unclaimed-deposits-log';
import { fakeDeposit, feeTooHigh, genericClaimError, instantStatus, InstantClaimStatus_Tags, tooSmall } from './helpers/fake-breez-sdk';

const needsFee = fakeDeposit({ txid: 'abc123def456', vout: 1, claimError: feeTooHigh(800) });

describe('formatDepositsSummary', () => {
  it('returns a friendly empty message', () => {
    expect(formatDepositsSummary([])).toBe('No unclaimed deposits');
  });

  it('lists each deposit with its amount, state and truncated outpoint', () => {
    const summary = formatDepositsSummary([needsFee, fakeDeposit({ txid: 'fedcba987654', isMature: false })]);

    expect(summary).toBe(['1. 100000 sats (needs fee approval) — abc123de…:1', '2. 100000 sats (waiting for confirmations) — fedcba98…:0'].join('\n'));
  });

  it('names every state', () => {
    const states = [
      fakeDeposit(),
      fakeDeposit({ claimError: tooSmall() }),
      fakeDeposit({ claimError: genericClaimError('boom') }),
      fakeDeposit({ instantClaimStatus: instantStatus(InstantClaimStatus_Tags.Submitted) }),
    ];

    const summary = formatDepositsSummary(states);

    expect(summary).toContain('(awaiting auto claim)');
    expect(summary).toContain('(too small to claim)');
    expect(summary).toContain('(claim failed)');
    expect(summary).toContain('(being credited)');
  });
});

describe('logUnclaimedDeposits', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('logs nothing for an empty list', () => {
    logUnclaimedDeposits([], 'test');

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('logs the count, then one line per deposit with its state and claim error', () => {
    logUnclaimedDeposits([needsFee], 'test');

    expect(warnSpy).toHaveBeenNthCalledWith(1, `${UNCLAIMED_DEPOSITS_LOG_PREFIX} [test] count: 1`);
    const line = warnSpy.mock.calls[1][0] as string;
    expect(line).toContain('abc123def456:1');
    expect(line).toContain('state=needsFeeApproval');
    expect(line).toContain('MaxDepositClaimFeeExceeded (required: 800 sats, max: 500 sats)');
  });
});
