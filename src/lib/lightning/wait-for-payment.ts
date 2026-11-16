/** How long a send waits for a Pending payment to complete, like `completionTimeoutSecs: 60` on `sendPayment`. */
export const PAYMENT_COMPLETION_TIMEOUT_MS = 60_000;
export const PAYMENT_POLL_INTERVAL_MS = 1_000;

type WaitOptions<T> = {
  initial: T;
  isPending: (payment: T) => boolean;
  /** Reads the payment again; an error keeps the last known payment and the wait goes on. */
  refresh: (payment: T) => Promise<T>;
  timeoutMs?: number;
  intervalMs?: number;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
};

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Reads a payment again until it is no longer Pending, or until the timeout: then it returns it still Pending.
 * `lnurlPay` has no completion timeout and returns as soon as the payment starts, so the send waits here instead.
 */
export async function waitWhilePending<T>({
  initial,
  isPending,
  refresh,
  timeoutMs = PAYMENT_COMPLETION_TIMEOUT_MS,
  intervalMs = PAYMENT_POLL_INTERVAL_MS,
  sleep = defaultSleep,
  now = Date.now,
}: WaitOptions<T>): Promise<T> {
  const deadline = now() + timeoutMs;
  let payment = initial;
  while (isPending(payment) && now() < deadline) {
    await sleep(intervalMs);
    try {
      payment = await refresh(payment);
    } catch {
      // Keep the last known payment: a failed read is not a failed payment
    }
  }
  return payment;
}
