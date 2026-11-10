import type { LnurlWithdrawRequestDetails } from '@/lib/context/breez-context';

import { toWithdrawRequest } from '../withdrawal-request';

const DETAILS = { callback: 'https://faucet.example.com/cb', k1: 'k1', defaultDescription: 'Faucet', minWithdrawable: 1000n, maxWithdrawable: 10_000_000n } as LnurlWithdrawRequestDetails;

describe('toWithdrawRequest', () => {
  // Jest workers cannot report a failed deep equality on BigInt values: compare them as strings
  it('the request has the Amount in sats and completionTimeoutSecs 60', () => {
    const request = toWithdrawRequest(2100, DETAILS);

    expect(String(request.amountSats)).toBe('2100');
    expect(typeof request.amountSats).toBe('bigint');
    expect(request.completionTimeoutSecs).toBe(60);
    expect(request.withdrawRequest).toBe(DETAILS);
  });
});
