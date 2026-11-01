type HomeCardState = { isAppLockEnabled: boolean; isCardDismissed: boolean; isRecoveryPhraseBackedUp: boolean };

/** Backing up the Recovery Phrase comes first, so this card never stacks with the backup card. */
export const shouldShowAppLockCard = ({ isAppLockEnabled, isCardDismissed, isRecoveryPhraseBackedUp }: HomeCardState) => !isAppLockEnabled && !isCardDismissed && isRecoveryPhraseBackedUp;
