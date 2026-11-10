jest.mock('bdk-rn', () => require('@/lib/bdk/__tests__/helpers/mock-bdk-rn'));
jest.mock('@/lib/context/breez-context', () => require('@/lib/payment-input/__tests__/helpers/fake-breez-context'));

import type { InputType } from '@/lib/context/breez-context';

import { isValidAddress } from '../address-network';
import type { PaymentInputDeps } from '../route-payment-input';
import { routeLightningInput, routePaymentInput } from '../route-payment-input';
import { aBitcoinAddress, aLightningAddress, anInvoice, anLnurlAuth, anLnurlPay, anLnurlWithdraw, aParseResult } from './helpers/breez-results';
import { AppNetwork, BitcoinNetwork, InputType_Tags } from './helpers/fake-breez-context';

// BIP173 test vectors
const MAINNET_ADDRESS = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
const TESTNET_ADDRESS = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
const INVOICE_WITH_AMOUNT = 'lnbc10u1invoicewithamount';
const INVOICE_WITHOUT_AMOUNT = 'lnbc1invoicewithoutamount';
const LN_ADDRESS = 'alice@pay.usegrimm.app';
const LNURL_PAY = 'lnurl1dp68gurn8ghj7pay';

type Parse = jest.Mock<Promise<InputType>, [string]>;

/** A Breez parse that knows the given inputs and rejects anything else, like the SDK for unknown text. */
function parseOf(results: Record<string, InputType>): Parse {
  return jest.fn(async (input: string) => {
    const result = results[input];
    if (!result) throw new Error(`Unrecognized input: ${input}`);
    return result;
  });
}

function depsFor(network: AppNetwork, parse?: Parse): PaymentInputDeps {
  return { network, isValidAddress, parse };
}

describe.each([
  { network: AppNetwork.MAINNET, breezNetwork: BitcoinNetwork.Bitcoin, otherBreezNetwork: BitcoinNetwork.Regtest, address: MAINNET_ADDRESS, otherAddress: TESTNET_ADDRESS },
  { network: AppNetwork.TESTNET, breezNetwork: BitcoinNetwork.Regtest, otherBreezNetwork: BitcoinNetwork.Bitcoin, address: TESTNET_ADDRESS, otherAddress: MAINNET_ADDRESS },
])('routePaymentInput on $network', ({ network, breezNetwork, otherBreezNetwork, address, otherAddress }) => {
  const parse = parseOf({
    [INVOICE_WITH_AMOUNT]: anInvoice({ bolt11: INVOICE_WITH_AMOUNT, amountSats: 1000, network: breezNetwork }),
    [INVOICE_WITHOUT_AMOUNT]: anInvoice({ bolt11: INVOICE_WITHOUT_AMOUNT, network: breezNetwork }),
    [LN_ADDRESS]: aLightningAddress({ address: LN_ADDRESS }),
    [LNURL_PAY]: anLnurlPay(),
    lnurlwithdraw: anLnurlWithdraw(),
    lnurlauth: anLnurlAuth(),
    'invoice-other-network': anInvoice({ bolt11: 'invoice-other-network', amountSats: 1000, network: otherBreezNetwork }),
    'invoice-testnet3': anInvoice({ bolt11: 'invoice-testnet3', amountSats: 1000, network: BitcoinNetwork.Testnet3 }),
    'invoice-expired': anInvoice({ bolt11: 'invoice-expired', amountSats: 1000, network: breezNetwork, timestamp: 1_600_000_000, expirySecs: 3600 }),
    bolt12offer: aParseResult(InputType_Tags.Bolt12Offer),
    sparkaddress: aParseResult(InputType_Tags.SparkAddress),
    silentpayment: aParseResult(InputType_Tags.SilentPaymentAddress),
    'https://example.com': aParseResult(InputType_Tags.Url),
    'breez-bitcoin-address': aBitcoinAddress(),
    'breez-bip21': aParseResult(InputType_Tags.Bip21),
  });
  const deps = depsFor(network, parse);
  const route = (text: string) => routePaymentInput(text, deps);

  beforeEach(() => parse.mockClear());

  it('an Invoice with an Amount → lightningDetails', async () => {
    expect(await route(INVOICE_WITH_AMOUNT)).toEqual({ kind: 'lightningDetails', rawInvoice: INVOICE_WITH_AMOUNT });
  });

  it('an Invoice without an Amount → lightningAmount', async () => {
    expect(await route(INVOICE_WITHOUT_AMOUNT)).toEqual({ kind: 'lightningAmount', paymentInput: INVOICE_WITHOUT_AMOUNT });
  });

  it('a Lightning Address → lightningAmount', async () => {
    expect(await route(LN_ADDRESS)).toEqual({ kind: 'lightningAmount', paymentInput: LN_ADDRESS });
  });

  it('LNURL-pay → lightningAmount', async () => {
    expect(await route(LNURL_PAY)).toEqual({ kind: 'lightningAmount', paymentInput: LNURL_PAY });
  });

  it("an address of the app's network → onchainAmount", async () => {
    expect(await route(address)).toEqual({ kind: 'onchainAmount', address });
    expect(await route(address.toUpperCase())).toEqual({ kind: 'onchainAmount', address: address.toUpperCase() });
  });

  it('a Bitcoin URI without lightning= → onchainAmount, with amountSats when it has an amount', async () => {
    expect(await route(`bitcoin:${address}`)).toEqual({ kind: 'onchainAmount', address });
    expect(await route(`bitcoin:${address}?amount=0.0001&label=Shop`)).toEqual({ kind: 'onchainAmount', address, amountSats: 10_000 });
  });

  it('a Bitcoin URI with lightning= → chooseMethod', async () => {
    expect(await route(`bitcoin:${address}?amount=0.0001&lightning=${INVOICE_WITH_AMOUNT}`)).toEqual({
      kind: 'chooseMethod',
      onchain: { address, amountSats: 10_000 },
      lightning: INVOICE_WITH_AMOUNT,
    });
  });

  it('LNURL-withdraw → withdrawal', async () => {
    expect(await route('lnurlwithdraw')).toEqual({ kind: 'withdrawal', paymentInput: 'lnurlwithdraw' });
    expect(await route('LIGHTNING:lnurlwithdraw')).toEqual({ kind: 'withdrawal', paymentInput: 'lnurlwithdraw' });
  });

  it('LNURL-auth → unsupported (replaced in Part 4)', async () => {
    expect(await route('lnurlauth')).toEqual({ kind: 'error', reason: 'unsupported' });
  });

  it('an address of the other network → otherNetworkAddress', async () => {
    expect(await route(otherAddress)).toEqual({ kind: 'error', reason: 'otherNetworkAddress' });
    expect(parse).not.toHaveBeenCalled();
  });

  it('an Invoice of the other network → otherNetworkInvoice', async () => {
    expect(await route('invoice-other-network')).toEqual({ kind: 'error', reason: 'otherNetworkInvoice' });
  });

  it('a Testnet3 Invoice → otherNetworkInvoice (the app testnet is Breez Regtest)', async () => {
    expect(await route('invoice-testnet3')).toEqual({ kind: 'error', reason: 'otherNetworkInvoice' });
  });

  it('every Lightning format without the Breez parse → lightningNotReady', async () => {
    const withoutBreez = depsFor(network);
    for (const input of [INVOICE_WITH_AMOUNT, INVOICE_WITHOUT_AMOUNT, LN_ADDRESS, LNURL_PAY, 'lnurlwithdraw', 'lnurlauth', 'unknown text', `lightning:${INVOICE_WITH_AMOUNT}`]) {
      expect([input, await routePaymentInput(input, withoutBreez)]).toEqual([input, { kind: 'error', reason: 'lightningNotReady' }]);
    }
  });

  it.each(['bolt12offer', 'sparkaddress', 'silentpayment', 'https://example.com'])('%s → unsupported', async (input) => {
    expect(await route(input)).toEqual({ kind: 'error', reason: 'unsupported' });
  });

  it('unknown text (the Breez parse rejects it) → unsupported', async () => {
    expect(await route('not-an-invoice')).toEqual({ kind: 'error', reason: 'unsupported' });
    expect(parse).toHaveBeenCalledWith('not-an-invoice');
  });

  it('an expired Invoice is routed normally', async () => {
    expect(await route('invoice-expired')).toEqual({ kind: 'lightningDetails', rawInvoice: 'invoice-expired' });
  });

  it('the Breez results BitcoinAddress and Bip21 → unsupported', async () => {
    expect(await route('breez-bitcoin-address')).toEqual({ kind: 'error', reason: 'unsupported' });
    expect(await route('breez-bip21')).toEqual({ kind: 'error', reason: 'unsupported' });
  });

  it('an invalid Bitcoin URI → unsupported', async () => {
    expect(await route(`bitcoin:${address}?amount=1,5`)).toEqual({ kind: 'error', reason: 'unsupported' });
    expect(await route(`bitcoin:${address}?req-pop=1`)).toEqual({ kind: 'error', reason: 'unsupported' });
    expect(await route('bitcoin:not-an-address')).toEqual({ kind: 'error', reason: 'unsupported' });
  });

  it('a Bitcoin URI with an address of the other network → otherNetworkAddress', async () => {
    expect(await route(`bitcoin:${otherAddress}?amount=1`)).toEqual({ kind: 'error', reason: 'otherNetworkAddress' });
    expect(await route(`bitcoin:${otherAddress}?lightning=${INVOICE_WITH_AMOUNT}`)).toEqual({ kind: 'error', reason: 'otherNetworkAddress' });
  });

  it('bitcoin:?lightning=… → the Lightning route, no chooseMethod', async () => {
    expect(await route(`bitcoin:?lightning=${INVOICE_WITH_AMOUNT}`)).toEqual({ kind: 'lightningDetails', rawInvoice: INVOICE_WITH_AMOUNT });
    expect(await route(`BITCOIN:?LIGHTNING=lightning%3A${INVOICE_WITHOUT_AMOUNT}`)).toEqual({ kind: 'lightningAmount', paymentInput: INVOICE_WITHOUT_AMOUNT });
    expect(await routePaymentInput(`bitcoin:?lightning=${INVOICE_WITH_AMOUNT}`, depsFor(network))).toEqual({ kind: 'error', reason: 'lightningNotReady' });
  });

  it('a Bitcoin URI with lightning= still → chooseMethod while Breez is not started', async () => {
    expect(await routePaymentInput(`bitcoin:${address}?lightning=${INVOICE_WITH_AMOUNT}`, depsFor(network))).toEqual({
      kind: 'chooseMethod',
      onchain: { address },
      lightning: INVOICE_WITH_AMOUNT,
    });
  });

  it('an address and a Bitcoin URI without lightning= are routed while Breez is not started', async () => {
    const withoutBreez = depsFor(network);
    expect(await routePaymentInput(address, withoutBreez)).toEqual({ kind: 'onchainAmount', address });
    expect(await routePaymentInput(`bitcoin:${address}?amount=0.0001`, withoutBreez)).toEqual({ kind: 'onchainAmount', address, amountSats: 10_000 });
  });

  it('routeLightningInput (the Lightning choice of the method sheet): only the Lightning rows', async () => {
    expect(await routeLightningInput(`lightning:${INVOICE_WITH_AMOUNT}`, deps)).toEqual({ kind: 'lightningDetails', rawInvoice: INVOICE_WITH_AMOUNT });
    expect(await routeLightningInput(LN_ADDRESS, deps)).toEqual({ kind: 'lightningAmount', paymentInput: LN_ADDRESS });
    expect(await routeLightningInput('breez-bitcoin-address', deps)).toEqual({ kind: 'error', reason: 'unsupported' });
    expect(await routeLightningInput('', deps)).toEqual({ kind: 'error', reason: 'unsupported' });
    expect(await routeLightningInput(INVOICE_WITH_AMOUNT, depsFor(network))).toEqual({ kind: 'error', reason: 'lightningNotReady' });
  });
});

describe('routePaymentInput, order of the rules', () => {
  const parse = parseOf({ [INVOICE_WITH_AMOUNT]: anInvoice({ bolt11: INVOICE_WITH_AMOUNT, amountSats: 1000 }) });
  const deps = depsFor(AppNetwork.MAINNET, parse);

  beforeEach(() => parse.mockClear());

  it('trims the Payment Input', async () => {
    expect(await routePaymentInput(`  \n${MAINNET_ADDRESS}\t `, deps)).toEqual({ kind: 'onchainAmount', address: MAINNET_ADDRESS });
    expect(await routePaymentInput(` ${INVOICE_WITH_AMOUNT} `, deps)).toEqual({ kind: 'lightningDetails', rawInvoice: INVOICE_WITH_AMOUNT });
    expect(parse).toHaveBeenCalledWith(INVOICE_WITH_AMOUNT);
  });

  it.each(['lightning:', 'LIGHTNING:', 'LiGhTnInG:'])('removes a leading %s before the Breez parse', async (prefix) => {
    expect(await routePaymentInput(`${prefix}${INVOICE_WITH_AMOUNT}`, deps)).toEqual({ kind: 'lightningDetails', rawInvoice: INVOICE_WITH_AMOUNT });
    expect(parse).toHaveBeenCalledWith(INVOICE_WITH_AMOUNT);
  });

  it('an empty or blank Payment Input → empty, without the Breez parse', async () => {
    for (const input of ['', '   ', '\n', 'lightning:', ' LIGHTNING:  ']) {
      expect(await routePaymentInput(input, deps)).toEqual({ kind: 'error', reason: 'empty' });
    }
    expect(parse).not.toHaveBeenCalled();
  });

  it('a Bitcoin URI never reaches the Breez parse, even when Breez is started', async () => {
    await routePaymentInput(`bitcoin:${MAINNET_ADDRESS}?amount=1`, deps);
    await routePaymentInput(`bitcoin:${MAINNET_ADDRESS}?lightning=${INVOICE_WITH_AMOUNT}`, deps);
    await routePaymentInput('bitcoin:not-an-address', deps);
    expect(parse).not.toHaveBeenCalled();
  });

  it('a plain address never reaches the Breez parse, even when Breez is started', async () => {
    await routePaymentInput(MAINNET_ADDRESS, deps);
    await routePaymentInput(TESTNET_ADDRESS, deps);
    expect(parse).not.toHaveBeenCalled();
  });

  it('text that is not a Bitcoin address for either network goes to the Breez parse', async () => {
    await routePaymentInput('bc1-not-valid!', deps);
    expect(parse).toHaveBeenCalledWith('bc1-not-valid!');
  });
});
