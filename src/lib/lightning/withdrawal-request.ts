import type { LnurlWithdrawRequest, LnurlWithdrawRequestDetails } from '@/lib/context/breez-context';

import { PAYMENT_COMPLETION_TIMEOUT_MS } from './wait-for-payment';

// The SDK waits this long for the service to pay the Invoice, like a send; after it, the Withdrawal shows as in progress
const WITHDRAWAL_TIMEOUT_SECS = PAYMENT_COMPLETION_TIMEOUT_MS / 1000;

export function toWithdrawRequest(amountSats: number, withdrawRequest: LnurlWithdrawRequestDetails): LnurlWithdrawRequest {
  return { amountSats: BigInt(amountSats), withdrawRequest, completionTimeoutSecs: WITHDRAWAL_TIMEOUT_SECS };
}
