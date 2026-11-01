import type { InputType } from '@/lib/context/breez-context';
import { AppNetwork, BitcoinNetwork, InputType_Tags } from '@/lib/context/breez-context';

import { parseBitcoinUri } from './bitcoin-uri';

export type PaymentInputError = 'empty' | 'unsupported' | 'otherNetworkAddress' | 'otherNetworkInvoice' | 'lightningNotReady';

export type OnchainDestination = { address: string; amountSats?: number };

/** Where a Payment Input leads: a screen, the method sheet, or an error the entry point shows. */
export type PaymentInputRoute =
  | { kind: 'lightningDetails'; rawInvoice: string }
  | { kind: 'lightningAmount'; paymentInput: string }
  | ({ kind: 'onchainAmount' } & OnchainDestination)
  | { kind: 'chooseMethod'; onchain: OnchainDestination; lightning: string }
  | { kind: 'withdrawal'; paymentInput: string }
  | { kind: 'lightningLogin'; paymentInput: string }
  | { kind: 'error'; reason: PaymentInputError };

export type PaymentInputDeps = {
  network: AppNetwork;
  /** Local BDK validation: works while Breez is not started. */
  isValidAddress: (address: string, network: AppNetwork) => boolean;
  /** The Breez parse, absent while Breez is not started. */
  parse?: (input: string) => Promise<InputType>;
};

const LIGHTNING_PREFIX = /^lightning:/i;
const BITCOIN_URI = /^bitcoin:/i;

// The app's testnet is Breez Regtest (AGENTS.md, "Wallets and networks")
const BREEZ_NETWORK: Record<AppNetwork, BitcoinNetwork> = {
  [AppNetwork.MAINNET]: BitcoinNetwork.Bitcoin,
  [AppNetwork.TESTNET]: BitcoinNetwork.Regtest,
};

const error = (reason: PaymentInputError): PaymentInputRoute => ({ kind: 'error', reason });

const clean = (text: string) => text.trim().replace(LIGHTNING_PREFIX, '').trim();

/**
 * The rules every entry point applies, in order: empty, Bitcoin URI, Bitcoin address (all three without Breez), then
 * the Breez parse for the Lightning formats.
 */
export async function routePaymentInput(text: string, deps: PaymentInputDeps): Promise<PaymentInputRoute> {
  const input = clean(text);
  if (!input) return error('empty');
  if (BITCOIN_URI.test(input)) return routeBitcoinUri(input, deps);

  const addressNetwork = findAddressNetwork(input, deps);
  if (addressNetwork === 'app') return { kind: 'onchainAmount', address: input };
  if (addressNetwork === 'other') return error('otherNetworkAddress');
  return routeLightningInput(input, deps);
}

/** Only the Lightning rows: for the lightning= value of a Bitcoin URI. Anything else is unsupported. */
export async function routeLightningInput(text: string, deps: PaymentInputDeps): Promise<PaymentInputRoute> {
  const input = clean(text);
  if (!input) return error('unsupported');
  if (!deps.parse) return error('lightningNotReady');

  let parsed: InputType;
  try {
    parsed = await deps.parse(input);
  } catch {
    return error('unsupported');
  }

  switch (parsed.tag) {
    case InputType_Tags.Bolt11Invoice: {
      const invoice = parsed.inner[0];
      if (invoice.network !== BREEZ_NETWORK[deps.network]) return error('otherNetworkInvoice');
      const bolt11 = invoice.invoice.bolt11;
      return invoice.amountMsat === undefined ? { kind: 'lightningAmount', paymentInput: bolt11 } : { kind: 'lightningDetails', rawInvoice: bolt11 };
    }
    case InputType_Tags.LightningAddress:
    case InputType_Tags.LnurlPay:
      return { kind: 'lightningAmount', paymentInput: input };
    case InputType_Tags.LnurlWithdraw:
      return { kind: 'withdrawal', paymentInput: input };
    case InputType_Tags.LnurlAuth:
      return { kind: 'lightningLogin', paymentInput: input };
    default:
      // On-chain formats are decided before the Breez parse: a BitcoinAddress or Bip21 result here is unsupported
      return error('unsupported');
  }
}

async function routeBitcoinUri(input: string, deps: PaymentInputDeps): Promise<PaymentInputRoute> {
  const uri = parseBitcoinUri(input);
  if (!uri) return error('unsupported');
  // bitcoin:?lightning=… names no address: only the Invoice can be paid
  if (!uri.address && uri.lightning) return routeLightningInput(uri.lightning, deps);

  const addressNetwork = findAddressNetwork(uri.address, deps);
  if (addressNetwork === 'other') return error('otherNetworkAddress');
  if (addressNetwork === 'none') return error('unsupported');

  const onchain: OnchainDestination = uri.amountSats === undefined ? { address: uri.address } : { address: uri.address, amountSats: uri.amountSats };
  return uri.lightning ? { kind: 'chooseMethod', onchain, lightning: uri.lightning } : { kind: 'onchainAmount', ...onchain };
}

function findAddressNetwork(address: string, { network, isValidAddress }: PaymentInputDeps): 'app' | 'other' | 'none' {
  if (isValidAddress(address, network)) return 'app';
  const otherNetwork = network === AppNetwork.MAINNET ? AppNetwork.TESTNET : AppNetwork.MAINNET;
  return isValidAddress(address, otherNetwork) ? 'other' : 'none';
}
