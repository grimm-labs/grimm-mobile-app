import i18n from '@/lib/i18n';

import en from '../en.json';
import fr from '../fr.json';

// The copy of the spec's "Translations" table, by key
const PART_1 = {
  'paymentDetails.errors.sendFailed': ['The payment could not be sent. Please try again.', "Le paiement n'a pas pu être envoyé. Veuillez réessayer."],
  'transaction.pending.sentTitle': ['Payment in progress', 'Paiement en cours'],
  'transaction.pending.receivedTitle': ['Withdrawal in progress', 'Retrait en cours'],
  'transaction.pending.note': ['It will appear in your transactions once it completes.', 'Il apparaîtra dans vos transactions une fois terminé.'],
  'enterAmount.limits': ['Enter an amount between {{min}} and {{max}}', 'Saisissez un montant entre {{min}} et {{max}}'],
};

function valueAt(translations: object, key: string): unknown {
  return key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], translations);
}

describe('Lightning compatibility translations', () => {
  it('EN and FR have the same Part 1 keys, with the spec copy', () => {
    Object.entries(PART_1).forEach(([key, [english, french]]) => {
      expect([key, valueAt(en, key)]).toEqual([key, english]);
      expect([key, valueAt(fr, key)]).toEqual([key, french]);
    });
  });

  it('fills in the limits in both languages', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('enterAmount.limits', { min: '2 SATS', max: '5,000 SATS' })).toBe('Enter an amount between 2 SATS and 5,000 SATS');

    await i18n.changeLanguage('fr');
    expect(i18n.t('enterAmount.limits', { min: '2 SATS', max: '5,000 SATS' })).toBe('Saisissez un montant entre 2 SATS et 5,000 SATS');
    await i18n.changeLanguage('en');
  });
});
