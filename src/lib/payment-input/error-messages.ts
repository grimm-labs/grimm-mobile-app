import type { PaymentInputError } from './route-payment-input';

const MESSAGES = {
  unsupported: 'paymentInput.errors.unsupported',
  otherNetworkAddress: 'paymentInput.errors.otherNetworkAddress',
  otherNetworkInvoice: 'paymentInput.errors.otherNetworkInvoice',
  lightningNotReady: 'paymentInput.errors.lightningStarting',
} as const;

type EmptyMessage = 'lightningPayment.errors.invalidInvoice' | 'onchainSend.enterAddress.errors.invalidAddress' | (typeof MESSAGES)['unsupported'];

/** The translation key of a routing error; an empty Payment Input keeps the entry point's own message. */
export function paymentInputErrorKey(reason: PaymentInputError, emptyMessage: EmptyMessage) {
  // eslint-disable-next-line security/detect-object-injection
  return reason === 'empty' ? emptyMessage : MESSAGES[reason];
}
