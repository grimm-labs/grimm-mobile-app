import { isFixedAmount, isWithinLimits, toSatLimits } from '../amount-limits';

describe('amount-limits', () => {
  it('converts a 1 500 msat minimum to 2 sats (rounds up)', () => {
    expect(toSatLimits(1500n, 10_000_000n).minSats).toBe(2);
  });

  it('converts a 1 999 msat maximum to 1 sat (rounds down)', () => {
    expect(toSatLimits(1000n, 1999n).maxSats).toBe(1);
  });

  it('converts whole sats exactly', () => {
    expect(toSatLimits(1000n, 100_000_000_000n)).toEqual({ minSats: 1, maxSats: 100_000_000 });
    expect(toSatLimits(0n, 0n)).toEqual({ minSats: 0, maxSats: 0 });
  });

  it('an Amount at min − 1 or max + 1 is outside, at min or max is inside', () => {
    const limits = toSatLimits(1500n, 5_000_999n); // 2 to 5 000 sats

    expect(isWithinLimits(1, limits)).toBe(false);
    expect(isWithinLimits(2, limits)).toBe(true);
    expect(isWithinLimits(5000, limits)).toBe(true);
    expect(isWithinLimits(5001, limits)).toBe(false);
  });

  it('equal limits: the limits are fixed and only that Amount is inside', () => {
    const limits = toSatLimits(21_000n, 21_000n);

    expect(isFixedAmount(limits)).toBe(true);
    expect(isWithinLimits(20, limits)).toBe(false);
    expect(isWithinLimits(21, limits)).toBe(true);
    expect(isWithinLimits(22, limits)).toBe(false);
    expect(isFixedAmount(toSatLimits(21_000n, 22_000n))).toBe(false);
  });
});
