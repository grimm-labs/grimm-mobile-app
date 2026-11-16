import { attemptsLeftBeforeLockout, isLockedOut, normalizeLockoutUntil, registerFailedAttempt } from '@/lib/app-lock/lockout';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const NOW = Date.UTC(2026, 10, 1, 12);

describe('Lockout', () => {
  it('1 to 4 wrong PINs: no Lockout and the attempts left', () => {
    [1, 2, 3, 4].forEach((wrongPins) => {
      expect(registerFailedAttempt(wrongPins - 1, NOW)).toEqual({ failedAttempts: wrongPins, lockoutUntil: null });
      expect(attemptsLeftBeforeLockout(wrongPins)).toBe(5 - wrongPins);
    });
    expect(attemptsLeftBeforeLockout(0)).toBe(5);
    expect(attemptsLeftBeforeLockout(5)).toBe(0);
    expect(attemptsLeftBeforeLockout(9)).toBe(0);
  });

  it('5th to 10th wrong PIN: 30 s, 1 min, 5 min, 15 min, 1 h, 1 h', () => {
    const schedule: [number, number][] = [
      [5, 30 * SECOND],
      [6, MINUTE],
      [7, 5 * MINUTE],
      [8, 15 * MINUTE],
      [9, HOUR],
      [10, HOUR],
      [25, HOUR],
    ];

    schedule.forEach(([wrongPins, duration]) => {
      expect(registerFailedAttempt(wrongPins - 1, NOW)).toEqual({ failedAttempts: wrongPins, lockoutUntil: NOW + duration });
    });
  });

  it('is locked out until the end, exclusive (29 999 ms locked, 30 000 ms free)', () => {
    const { lockoutUntil } = registerFailedAttempt(4, NOW);

    expect(isLockedOut(lockoutUntil, NOW)).toBe(true);
    expect(isLockedOut(lockoutUntil, NOW + 29_999)).toBe(true);
    expect(isLockedOut(lockoutUntil, NOW + 30_000)).toBe(false);
    expect(isLockedOut(null, NOW)).toBe(false);
  });

  it('restarts the current step from now when the clock moved back beyond it', () => {
    const movedBack = NOW - HOUR;

    expect(normalizeLockoutUntil({ failedAttempts: 5, lockoutUntil: NOW + 30 * SECOND }, movedBack)).toBe(movedBack + 30 * SECOND);
    expect(normalizeLockoutUntil({ failedAttempts: 7, lockoutUntil: NOW + 5 * MINUTE }, movedBack)).toBe(movedBack + 5 * MINUTE);
  });

  it('keeps the stored end when the clock did not move back', () => {
    expect(normalizeLockoutUntil({ failedAttempts: 5, lockoutUntil: NOW + 30 * SECOND }, NOW)).toBe(NOW + 30 * SECOND);
    expect(normalizeLockoutUntil({ failedAttempts: 5, lockoutUntil: NOW + 30 * SECOND }, NOW + 10 * SECOND)).toBe(NOW + 30 * SECOND);
    expect(normalizeLockoutUntil({ failedAttempts: 5, lockoutUntil: NOW - 10 * SECOND }, NOW)).toBe(NOW - 10 * SECOND);
    expect(normalizeLockoutUntil({ failedAttempts: 3, lockoutUntil: null }, NOW)).toBeNull();
  });
});
