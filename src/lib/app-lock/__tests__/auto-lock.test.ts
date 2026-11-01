import { nextBackgroundedAt, shouldLockOnResume } from '@/lib/app-lock/auto-lock';

const MINUTE = 60_000;
const NOW = Date.UTC(2026, 10, 1, 12);

describe('Auto-lock', () => {
  it('does not lock after 29 999 ms in background, locks after 30 001 ms', () => {
    const backgroundedAt = nextBackgroundedAt(null, 'background', NOW);

    expect(shouldLockOnResume(backgroundedAt, NOW + 29_999)).toBe(false);
    expect(shouldLockOnResume(backgroundedAt, NOW + 30_001)).toBe(true);
  });

  it('never locks without a background timestamp (inactive only)', () => {
    const backgroundedAt = nextBackgroundedAt(null, 'inactive', NOW);

    expect(backgroundedAt).toBeNull();
    expect(shouldLockOnResume(backgroundedAt, NOW + 10 * MINUTE)).toBe(false);
  });

  it('measures from the background event in the iOS sequence inactive → background → active', () => {
    let backgroundedAt = nextBackgroundedAt(null, 'inactive', NOW);
    backgroundedAt = nextBackgroundedAt(backgroundedAt, 'background', NOW + 5_000);

    expect(backgroundedAt).toBe(NOW + 5_000);
    // 34 999 ms after inactive, but 29 999 ms after background
    expect(shouldLockOnResume(backgroundedAt, NOW + 34_999)).toBe(false);
    expect(shouldLockOnResume(backgroundedAt, NOW + 35_001)).toBe(true);
  });

  it('keeps the first background timestamp, and forgets it once active', () => {
    let backgroundedAt = nextBackgroundedAt(null, 'background', NOW);
    backgroundedAt = nextBackgroundedAt(backgroundedAt, 'inactive', NOW + 10_000);
    backgroundedAt = nextBackgroundedAt(backgroundedAt, 'background', NOW + 20_000);

    expect(backgroundedAt).toBe(NOW);
    expect(nextBackgroundedAt(backgroundedAt, 'active', NOW + 40_000)).toBeNull();
  });
});
