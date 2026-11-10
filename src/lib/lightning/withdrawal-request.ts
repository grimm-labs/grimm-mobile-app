import type { LnurlWithdrawRequest, LnurlWithdrawRequestDetails } from '@/lib/context/breez-context';

// The SDK waits this long for the service to pay the Invoice; after it, the Withdrawal shows as in progress
const WITHDRAWAL_TIMEOUT_SECS = 60;

export function toWithdrawRequest(amountSats: number, withdrawRequest: LnurlWithdrawRequestDetails): LnurlWithdrawRequest {
  return { amountSats: BigInt(amountSats), withdrawRequest, completionTimeoutSecs: WITHDRAWAL_TIMEOUT_SECS };
}
