import { extractBolt11FromLightningUri } from '../deep-link';

const MAINNET_INVOICE = 'lnbc1pvjluezpp5qqqsyqcvq0emrllfmrpzrzjqy2jjspuzt6nxq7gtss8qq4q0cqh2a';
const TESTNET_INVOICE = 'lntb1pvjluezpp5qqqsyqcvq0emrllfmrpzrzjqy2jjspuzt6nxq7gtss8qq4q0cqh2a';
const REGTEST_INVOICE = 'lnbcrt1pvjluezpp5qqqsyqcvq0emrllfmrpzrzjqy2jjspuzt6nxq7gtss8qq4q0cqh2a';

describe('extractBolt11FromLightningUri', () => {
  it('extracts mainnet BOLT11 from lightning: URI', () => {
    expect(extractBolt11FromLightningUri(`lightning:${MAINNET_INVOICE}`)).toBe(MAINNET_INVOICE);
  });

  it('extracts testnet BOLT11 from lightning: URI', () => {
    expect(extractBolt11FromLightningUri(`lightning:${TESTNET_INVOICE}`)).toBe(TESTNET_INVOICE);
  });

  it('extracts regtest BOLT11 from lightning: URI', () => {
    expect(extractBolt11FromLightningUri(`lightning:${REGTEST_INVOICE}`)).toBe(REGTEST_INVOICE);
  });

  it('ignores query params', () => {
    expect(extractBolt11FromLightningUri(`lightning:${MAINNET_INVOICE}?amount=1000`)).toBe(MAINNET_INVOICE);
  });

  it('handles uppercase LIGHTNING: scheme', () => {
    expect(extractBolt11FromLightningUri(`LIGHTNING:${MAINNET_INVOICE}`)).toBe(MAINNET_INVOICE);
  });

  it('trims surrounding whitespace', () => {
    expect(extractBolt11FromLightningUri(`  lightning:${MAINNET_INVOICE}  `)).toBe(MAINNET_INVOICE);
  });

  it('returns null for non-lightning URIs', () => {
    expect(extractBolt11FromLightningUri('bitcoin:bc1qtest')).toBeNull();
  });

  it('returns null for empty lightning URI', () => {
    expect(extractBolt11FromLightningUri('lightning:')).toBeNull();
    expect(extractBolt11FromLightningUri('lightning:   ')).toBeNull();
  });
});
