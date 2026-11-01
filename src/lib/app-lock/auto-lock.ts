import type { AppStateStatus } from 'react-native';

/** The app locks when it comes back after more than this in the `background` state. */
export const AUTO_LOCK_DELAY_MS = 30_000;

/**
 * When the app went to the background. Only `background` counts: `inactive` (biometric prompt, permission dialogs,
 * share sheet, the iOS app switcher) never starts the delay.
 */
export const nextBackgroundedAt = (backgroundedAt: number | null, state: AppStateStatus, now: number) => {
  if (state === 'background') return backgroundedAt ?? now;
  if (state === 'active') return null;
  return backgroundedAt;
};

export const shouldLockOnResume = (backgroundedAt: number | null, now: number) => backgroundedAt !== null && now - backgroundedAt > AUTO_LOCK_DELAY_MS;
