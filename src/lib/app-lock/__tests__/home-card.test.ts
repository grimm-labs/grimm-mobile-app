import { shouldShowAppLockCard } from '@/lib/app-lock/home-card';

describe('App Lock home card', () => {
  it('shows the card in exactly one of the 8 combinations', () => {
    const shown = [false, true].flatMap((isAppLockEnabled) =>
      [false, true].flatMap((isCardDismissed) =>
        [false, true].filter((isRecoveryPhraseBackedUp) => shouldShowAppLockCard({ isAppLockEnabled, isCardDismissed, isRecoveryPhraseBackedUp })).map((isRecoveryPhraseBackedUp) => ({ isAppLockEnabled, isCardDismissed, isRecoveryPhraseBackedUp })),
      ),
    );

    expect(shown).toEqual([{ isAppLockEnabled: false, isCardDismissed: false, isRecoveryPhraseBackedUp: true }]);
  });
});
