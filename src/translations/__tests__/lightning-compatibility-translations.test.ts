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

const PART_2 = {
  'paymentInput.errors.unsupported': ['Sorry, we do not support this Bitcoin or Lightning address', 'Désolé, nous ne prenons pas en charge cette adresse Bitcoin ou Lightning'],
  'paymentInput.errors.otherNetworkAddress': ['This address belongs to another Bitcoin network', 'Cette adresse appartient à un autre réseau Bitcoin'],
  'paymentInput.errors.otherNetworkInvoice': ['This invoice belongs to another Bitcoin network', 'Cette facture appartient à un autre réseau Bitcoin'],
  'paymentInput.errors.lightningStarting': ['The Lightning wallet is starting. Please try again in a moment.', 'Le portefeuille Lightning démarre. Veuillez réessayer dans un instant.'],
  'paymentInput.errors.lightningFailed': ['The Lightning wallet could not start', "Le portefeuille Lightning n'a pas pu démarrer"],
  'paymentInput.reading': ['Reading…', 'Lecture…'],
  'enterAmount.lightningInvoice': ['Lightning invoice', 'Facture Lightning'],
};

const PART_3 = {
  'withdrawal.title': ['Withdrawal', 'Retrait'],
  'withdrawal.confirm': ['Withdraw', 'Retirer'],
  'withdrawal.errors.failed': ['The withdrawal could not be completed. Please try again.', "Le retrait n'a pas pu aboutir. Veuillez réessayer."],
};

const PART_4 = {
  'lightningLogin.title.signIn': ['Sign in to {{domain}}?', 'Se connecter à {{domain}} ?'],
  'lightningLogin.title.register': ['Create an account on {{domain}}?', 'Créer un compte sur {{domain}} ?'],
  'lightningLogin.title.link': ['Link your account on {{domain}}?', 'Lier votre compte sur {{domain}} ?'],
  'lightningLogin.note': [
    '{{domain}} will receive an identity that Grimm App creates for this website only. It cannot see your funds or your other logins.',
    '{{domain}} recevra une identité que Grimm App crée pour ce site uniquement. Il ne peut voir ni vos fonds ni vos autres connexions.',
  ],
  'lightningLogin.confirm': ['Sign in', 'Se connecter'],
  'lightningLogin.cancel': ['Cancel', 'Annuler'],
  'lightningLogin.success': ['Signed in to {{domain}}', 'Connecté à {{domain}}'],
  'lightningLogin.errors.refused': ['{{domain}} refused the sign-in: {{reason}}', '{{domain}} a refusé la connexion : {{reason}}'],
  'lightningLogin.errors.failed': ['The sign-in could not be completed. Please try again.', "La connexion n'a pas pu aboutir. Veuillez réessayer."],
};

// No screen uses them any more once every entry point routes through usePaymentInput
const REMOVED_IN_PART_2 = [
  'lightningPayment.errors.bitcoinNotSupported',
  'lightningPayment.errors.zeroAmountNotSupported',
  'lightningPayment.errors.unsupportedAddress',
  'lightningPayment.errors.lightningAddressNotSupported',
  'onchainSend.enterAddress.errors.unsupportedAddress',
  'onchainSend.enterAddress.errors.addressVerificationFailed',
];

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

  it('EN and FR have the same Part 2 keys, with the spec copy', () => {
    Object.entries(PART_2).forEach(([key, [english, french]]) => {
      expect([key, valueAt(en, key)]).toEqual([key, english]);
      expect([key, valueAt(fr, key)]).toEqual([key, french]);
    });
  });

  it('EN and FR have the same Part 3 keys, with the spec copy', () => {
    Object.entries(PART_3).forEach(([key, [english, french]]) => {
      expect([key, valueAt(en, key)]).toEqual([key, english]);
      expect([key, valueAt(fr, key)]).toEqual([key, french]);
    });
  });

  it('EN and FR have the same Part 4 keys, with the spec copy', () => {
    Object.entries(PART_4).forEach(([key, [english, french]]) => {
      expect([key, valueAt(en, key)]).toEqual([key, english]);
      expect([key, valueAt(fr, key)]).toEqual([key, french]);
    });
  });

  it('FR puts a space before ? and :', () => {
    [fr.lightningLogin.title.signIn, fr.lightningLogin.title.register, fr.lightningLogin.title.link].forEach((title) => expect(title).toMatch(/ \?$/));
    expect(fr.lightningLogin.errors.refused).toContain(' : ');
  });

  it('the keys Part 2 replaces are gone from EN and FR', () => {
    REMOVED_IN_PART_2.forEach((key) => {
      expect([key, valueAt(en, key)]).toEqual([key, undefined]);
      expect([key, valueAt(fr, key)]).toEqual([key, undefined]);
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
