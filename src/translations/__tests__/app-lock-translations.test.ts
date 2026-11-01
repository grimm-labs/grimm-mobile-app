import i18n from '@/lib/i18n';

import en from '../en.json';
import fr from '../fr.json';

function keysOf(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => (typeof child === 'object' && child !== null ? keysOf(child, `${prefix}${key}.`) : [`${prefix}${key}`]));
}

function valuesOf(value: object): string[] {
  return Object.values(value).flatMap((child) => (typeof child === 'object' && child !== null ? valuesOf(child) : [String(child)]));
}

describe('App Lock translations', () => {
  it('EN and FR have the same appLock keys', () => {
    expect(keysOf(fr.appLock).sort()).toEqual(keysOf(en.appLock).sort());
    expect(Object.keys(fr.settings.security.appLock).sort()).toEqual(Object.keys(en.settings.security.appLock).sort());
  });

  it('FR uses the glossary terms and says "portefeuille", never "wallet"', () => {
    const frenchCopy = [...valuesOf(fr.appLock), ...valuesOf(fr.settings.security.appLock)];

    frenchCopy.forEach((text) => expect(text.toLowerCase()).not.toContain('wallet'));
    expect(fr.settings.security.appLock.title).toBe("Verrouillage de l'app");
    expect(fr.appLock.lockScreen.title).toBe('Saisissez votre code PIN');
    expect(fr.appLock.lockScreen.forgotPin).toBe('Code PIN oublié ?');
    expect(fr.appLock.settings.biometricUnlock).toBe('Déverrouillage biométrique');
    expect(fr.appLock.homeCard.title).toBe('Protégez votre portefeuille');
  });

  it('EN uses the spec copy', () => {
    expect(en.settings.security.appLock.title).toBe('App Lock');
    expect(en.appLock.lockScreen.title).toBe('Enter your PIN');
    expect(en.appLock.lockScreen.forgotPin).toBe('Forgot PIN?');
    expect(en.appLock.homeCard.title).toBe('Protect your wallet');
  });

  it('counts the attempts left in the singular and the plural', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('appLock.lockScreen.wrongPin', { count: 1 })).toBe('Wrong PIN. 1 attempt left before a 30-second wait.');
    expect(i18n.t('appLock.lockScreen.wrongPin', { count: 4 })).toBe('Wrong PIN. 4 attempts left before a 30-second wait.');

    await i18n.changeLanguage('fr');
    expect(i18n.t('appLock.lockScreen.wrongPin', { count: 1 })).toBe('Code PIN incorrect. Encore 1 essai avant une attente de 30 secondes.');
    expect(i18n.t('appLock.lockScreen.wrongPin', { count: 2 })).toBe('Code PIN incorrect. Encore 2 essais avant une attente de 30 secondes.');
    await i18n.changeLanguage('en');
  });
});
