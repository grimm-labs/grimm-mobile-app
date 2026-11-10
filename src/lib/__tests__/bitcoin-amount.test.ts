import { toKeypadAmount } from '@/lib/bitcoin-amount';
import { BitcoinUnit } from '@/types/enum';

describe('toKeypadAmount', () => {
  it('writes sats as a whole number in SATS', () => {
    expect(toKeypadAmount(10_000, BitcoinUnit.Sats)).toBe('10000');
    expect(toKeypadAmount(2_100_000_000_000_000, BitcoinUnit.Sats)).toBe('2100000000000000');
  });

  it('writes sats in BTC without trailing zeros', () => {
    expect(toKeypadAmount(10_000, BitcoinUnit.Btc)).toBe('0.0001');
    expect(toKeypadAmount(1, BitcoinUnit.Btc)).toBe('0.00000001');
    expect(toKeypadAmount(100_000_000, BitcoinUnit.Btc)).toBe('1');
    expect(toKeypadAmount(115_000_000, BitcoinUnit.Btc)).toBe('1.15');
  });

  it('writes 0 as the keypad does', () => {
    expect(toKeypadAmount(0, BitcoinUnit.Sats)).toBe('0');
    expect(toKeypadAmount(0, BitcoinUnit.Btc)).toBe('0');
  });
});
