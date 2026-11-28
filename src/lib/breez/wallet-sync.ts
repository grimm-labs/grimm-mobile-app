import type { BreezSdkInterface, Payment } from '@breeztech/breez-sdk-spark-react-native';

/** Longest wait for a forced Spark sync: past it, the stored balance stays on screen and the next refresh tries again. */
export const WALLET_SYNC_TIMEOUT_MS = 30_000;

/**
 * Asks the SDK for a full sync with the Spark operators. The SDK then rewrites the balance and the payments it stores,
 * which is all that `getInfo({ ensureSynced: false })` and `listPayments` return.
 * Resolves false when the sync fails or does not finish within `timeoutMs` (the native call is then cancelled).
 * Since SDK 0.28 a sync that could not refresh the balances resolves with `lastSyncError` instead of throwing.
 */
export async function syncSparkWallet(sdk: Pick<BreezSdkInterface, 'syncWallet'>, timeoutMs: number = WALLET_SYNC_TIMEOUT_MS): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const { lastSyncError } = await sdk.syncWallet({}, { signal: controller.signal });
    if (lastSyncError) {
      console.warn('[Breez SDK] Wallet sync failed:', lastSyncError.tag, lastSyncError.inner.message);
      return false;
    }
    return true;
  } catch (error) {
    console.warn('[Breez SDK] Wallet sync failed:', error);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** Changes when a payment appears or changes status. */
export function paymentsFingerprint(payments: Pick<Payment, 'id' | 'status'>[]): string {
  return payments.map((payment) => `${payment.id}:${payment.status}`).join('|');
}
