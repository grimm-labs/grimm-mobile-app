import { isRecoveryPhraseGrantValid } from '@/lib/app-lock/recovery-phrase-grant';

const NOW = Date.UTC(2026, 10, 1, 12);

describe('Recovery Phrase grant', () => {
  it('holds at 4 min 59 s and has expired at 5 min', () => {
    expect(isRecoveryPhraseGrantValid(NOW, NOW)).toBe(true);
    expect(isRecoveryPhraseGrantValid(NOW, NOW + 4 * 60_000 + 59_000)).toBe(true);
    expect(isRecoveryPhraseGrantValid(NOW, NOW + 5 * 60_000)).toBe(false);
  });

  it('is not valid without an authentication, or when the clock moved back', () => {
    expect(isRecoveryPhraseGrantValid(null, NOW)).toBe(false);
    expect(isRecoveryPhraseGrantValid(NOW, NOW - 1)).toBe(false);
  });
});
