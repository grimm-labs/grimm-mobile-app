/**
 * Builders for what the Breez SDK returns: parse results (`InputType`) and payments, shaped like the SDK records.
 * Their enums come from the fake context module, so use them with `fake-breez-context`.
 */
import type { InputType, Payment } from '@/lib/context/breez-context';

import { BitcoinNetwork, InputType_Tags, PaymentStatus, PaymentType } from './fake-breez-context';

export const MAINNET_INVOICE = 'lnbc1invoice';

type InvoiceOptions = {
  bolt11?: string;
  /** In sats; leave it out for an Invoice without an Amount. */
  amountSats?: number;
  network?: BitcoinNetwork;
  description?: string;
  /** Seconds since the epoch. Defaults to now, with a one-hour expiry. */
  timestamp?: number;
  expirySecs?: number;
};

export function anInvoice({ bolt11 = MAINNET_INVOICE, amountSats, network = BitcoinNetwork.Bitcoin, description, timestamp = Math.floor(Date.now() / 1000), expirySecs = 3600 }: InvoiceOptions = {}) {
  return {
    tag: InputType_Tags.Bolt11Invoice,
    inner: [
      {
        amountMsat: amountSats === undefined ? undefined : BigInt(amountSats) * 1000n,
        description,
        descriptionHash: undefined,
        expiry: BigInt(expirySecs),
        invoice: { bolt11, source: {} },
        minFinalCltvExpiryDelta: 18n,
        network,
        payeePubkey: '03payee',
        paymentHash: 'hash',
        paymentSecret: 'secret',
        routingHints: [],
        timestamp: BigInt(timestamp),
      },
    ],
  } as unknown as InputType;
}

type PayRequestOptions = {
  minSendableMsat?: bigint;
  maxSendableMsat?: bigint;
  domain?: string;
  address?: string;
};

function aPayRequest({ minSendableMsat = 1000n, maxSendableMsat = 100_000_000_000n, domain = 'pay.usegrimm.app', address }: PayRequestOptions) {
  return {
    callback: `https://${domain}/lnurlp/callback`,
    minSendable: minSendableMsat,
    maxSendable: maxSendableMsat,
    metadataStr: '[["text/plain","Pay"]]',
    commentAllowed: 0,
    domain,
    url: `https://${domain}/lnurlp`,
    address,
    allowsNostr: undefined,
    nostrPubkey: undefined,
  };
}

export function aLightningAddress({ address = 'alice@pay.usegrimm.app', ...options }: PayRequestOptions = {}) {
  const domain = options.domain ?? address.split('@')[1];
  return {
    tag: InputType_Tags.LightningAddress,
    inner: [{ address, payRequest: aPayRequest({ ...options, domain, address }) }],
  } as unknown as InputType;
}

export function anLnurlPay(options: PayRequestOptions = {}) {
  return {
    tag: InputType_Tags.LnurlPay,
    inner: [aPayRequest({ domain: 'shop.example.com', ...options })],
  } as unknown as InputType;
}

export function aBitcoinAddress(address = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4') {
  return {
    tag: InputType_Tags.BitcoinAddress,
    inner: [{ address, network: BitcoinNetwork.Bitcoin, source: {} }],
  } as unknown as InputType;
}

export function aPayment({ status = PaymentStatus.Completed, amountSats = 1000 }: { status?: PaymentStatus; amountSats?: number } = {}) {
  return {
    id: 'payment-id',
    paymentType: PaymentType.Send,
    status,
    amount: BigInt(amountSats),
    fees: 0n,
    timestamp: BigInt(Math.floor(Date.now() / 1000)),
    method: 0,
    details: undefined,
    conversionDetails: undefined,
  } as unknown as Payment;
}
