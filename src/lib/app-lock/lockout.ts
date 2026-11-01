const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

/** Wrong PINs in a row before the first Lockout. */
export const ATTEMPTS_BEFORE_LOCKOUT = 5;

/** Lockout for the 5th, 6th, 7th, 8th wrong PIN, then 1 h for each one after. */
const LOCKOUT_STEPS_MS = [30 * SECOND, MINUTE, 5 * MINUTE, 15 * MINUTE, HOUR];

export type LockoutState = { failedAttempts: number; lockoutUntil: number | null };

export const lockoutDurationMs = (failedAttempts: number) => {
  if (failedAttempts < ATTEMPTS_BEFORE_LOCKOUT) return 0;
  return LOCKOUT_STEPS_MS[Math.min(failedAttempts - ATTEMPTS_BEFORE_LOCKOUT, LOCKOUT_STEPS_MS.length - 1)];
};

export const attemptsLeftBeforeLockout = (failedAttempts: number) => Math.max(0, ATTEMPTS_BEFORE_LOCKOUT - failedAttempts);

export const registerFailedAttempt = (failedAttempts: number, now: number): LockoutState => {
  const next = failedAttempts + 1;
  const duration = lockoutDurationMs(next);
  return { failedAttempts: next, lockoutUntil: duration > 0 ? now + duration : null };
};

export const isLockedOut = (lockoutUntil: number | null, now: number) => lockoutUntil !== null && now < lockoutUntil;

/** If the device clock moved back so that the Lockout lasts longer than its step, the step restarts from now. */
export const normalizeLockoutUntil = ({ failedAttempts, lockoutUntil }: LockoutState, now: number) => {
  if (lockoutUntil === null) return null;
  const duration = lockoutDurationMs(failedAttempts);
  return lockoutUntil - now > duration ? now + duration : lockoutUntil;
};
