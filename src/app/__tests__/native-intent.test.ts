import { redirectSystemPath } from '@/app/+native-intent';

const INVOICE = 'lnbc1pvjluezpp5qqqsyqcvq0emrllfmrpzrzjqy2jjspuzt6nxq7gtss8qq4q0cqh2a';
const ADDRESS = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';

describe('redirectSystemPath', () => {
  it.each([`lightning:${INVOICE}`, `LIGHTNING:${INVOICE}`, `bitcoin:${ADDRESS}?amount=0.0001`, `BITCOIN:${ADDRESS}`])('sends %s to /payment-input', (path) => {
    expect(redirectSystemPath({ path, initial: true })).toBe(`/payment-input?input=${encodeURIComponent(path)}`);
    expect(redirectSystemPath({ path, initial: false })).toBe(`/payment-input?input=${encodeURIComponent(path)}`);
  });

  it('leaves the other paths', () => {
    expect(redirectSystemPath({ path: '/settings', initial: false })).toBe('/settings');
    expect(redirectSystemPath({ path: 'GrimmApp://wallets', initial: true })).toBe('GrimmApp://wallets');
  });

  it('falls back to /(app) when the path cannot be read', () => {
    expect(redirectSystemPath({ path: undefined as unknown as string, initial: true })).toBe('/(app)');
  });
});
