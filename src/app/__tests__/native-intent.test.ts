import { redirectSystemPath } from '@/app/+native-intent';

const MAINNET_INVOICE = 'lnbc1pvjluezpp5qqqsyqcvq0emrllfmrpzrzjqy2jjspuzt6nxq7gtss8qq4q0cqh2a';

describe('redirectSystemPath', () => {
  it('redirects lightning: URI to transaction-details with rawInvoice', () => {
    const result = redirectSystemPath({
      path: `lightning:${MAINNET_INVOICE}`,
      initial: true,
    });

    expect(result).toBe(`/send/transaction-details?rawInvoice=${encodeURIComponent(MAINNET_INVOICE)}`);
  });

  it('passes through unrecognized paths', () => {
    expect(redirectSystemPath({ path: '/settings', initial: false })).toBe('/settings');
    expect(redirectSystemPath({ path: 'bitcoin:bc1qtest', initial: true })).toBe('bitcoin:bc1qtest');
  });
});
