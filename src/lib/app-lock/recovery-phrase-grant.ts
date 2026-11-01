/** One authentication for the Recovery Phrase grants access for this long, or until the app goes to the background. */
export const RECOVERY_PHRASE_GRANT_MS = 5 * 60_000;

export const isRecoveryPhraseGrantValid = (grantedAt: number | null, now: number) => grantedAt !== null && now >= grantedAt && now - grantedAt < RECOVERY_PHRASE_GRANT_MS;
