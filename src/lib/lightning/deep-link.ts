// lightning: and bitcoin: links, in any case, as the OS hands them to the app
const PAYMENT_SCHEME = /^(lightning|bitcoin):/i;

/** The /payment-input path for a lightning: or bitcoin: link (the whole URL, encoded), or null for any other path. */
export function toPaymentInputPath(url: string): string | null {
  const trimmed = url.trim();
  if (!PAYMENT_SCHEME.test(trimmed)) return null;
  return `/payment-input?input=${encodeURIComponent(trimmed)}`;
}
