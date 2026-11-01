import { toPaymentInputPath } from '../deep-link';

const INVOICE = 'lnbc1pvjluezpp5qqqsyqcvq0emrllfmrpzrzjqy2jjspuzt6nxq7gtss8qq4q0cqh2a';
const ADDRESS = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';

// What /payment-input reads back from the path
function inputOf(path: string) {
  const [pathname, query] = path.split('?');
  expect(pathname).toBe('/payment-input');
  expect(query.startsWith('input=')).toBe(true);
  return decodeURIComponent(query.slice('input='.length));
}

describe('toPaymentInputPath', () => {
  it.each([`lightning:${INVOICE}`, `LIGHTNING:${INVOICE}`, `bitcoin:${ADDRESS}`, `BITCOIN:${ADDRESS.toUpperCase()}`, `Bitcoin:${ADDRESS}`])('%s becomes /payment-input?input=<encoded URL>', (url) => {
    expect(toPaymentInputPath(url)).toBe(`/payment-input?input=${encodeURIComponent(url)}`);
  });

  it('the encoded URL survives a round trip (?, &, =, %)', () => {
    const url = `bitcoin:${ADDRESS}?amount=0.0001&label=Caf%C3%A9%20%26%20co&message=a=b&lightning=${INVOICE}`;

    const path = toPaymentInputPath(url) as string;

    expect(path.indexOf('?')).toBe(path.lastIndexOf('?'));
    expect(path).not.toMatch(/&|=.*=/);
    expect(inputOf(path)).toBe(url);
  });

  it.each(['/settings', '/(app)', 'GrimmApp://wallets', 'https://pay.usegrimm.app', 'lnurlw://example.com', 'bitcoincash:qq', ''])('leaves %s to the router (null)', (path) => {
    expect(toPaymentInputPath(path)).toBeNull();
  });
});
