import { isInsufficientFundsError } from '@/lib/bdk/errors';

// Shaped like the bdk-rn CreateTxError variants (uniffi errors: an Error with a tag and an inner)
function createTxError(tag: string, inner: Record<string, unknown> = {}) {
  return Object.assign(new Error(`CreateTxError.${tag}`), { tag, inner });
}

describe('isInsufficientFundsError', () => {
  it('recognises both BDK insufficient-funds errors and nothing else', () => {
    expect(isInsufficientFundsError(createTxError('InsufficientFunds', { needed: 30000n, available: 26000n }))).toBe(true);
    expect(isInsufficientFundsError(createTxError('CoinSelection', { errorMessage: 'Insufficient funds: 26000 sat available of 30000 sat needed' }))).toBe(true);

    expect(isInsufficientFundsError(createTxError('CoinSelection', { errorMessage: 'some other coin selection failure' }))).toBe(false);
    expect(isInsufficientFundsError(createTxError('OutputBelowDustLimit', { index: 0n }))).toBe(false);
    expect(isInsufficientFundsError(new Error('Wallet ou blockchain not initialized'))).toBe(false);
    expect(isInsufficientFundsError(undefined)).toBe(false);
    expect(isInsufficientFundsError(null)).toBe(false);
    expect(isInsufficientFundsError('InsufficientFunds')).toBe(false);
  });
});
