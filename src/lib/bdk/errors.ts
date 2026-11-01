// bdk-rn throws CreateTxError instances (uniffi errors carrying a `tag` and an `inner`). Insufficient funds comes either as
// the InsufficientFunds variant or, from BDK's coin selection, as a CoinSelection variant whose message says so.
// Matched on the tags so this module does not load the native bdk-rn library.
type TaggedError = { tag?: unknown; inner?: { errorMessage?: unknown } };

export function isInsufficientFundsError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const { tag, inner } = error as TaggedError;
  if (tag === 'InsufficientFunds') return true;
  return tag === 'CoinSelection' && typeof inner?.errorMessage === 'string' && /insufficient funds/i.test(inner.errorMessage);
}
