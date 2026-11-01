import { parseBitcoinUri } from '../bitcoin-uri';

const ADDRESS = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
const INVOICE = 'lnbc1pvjluezpp5qqqsyqcvq0emrllfmrpzrzjqy2jjspuzt6nxq7gtss8qq4q0cqh2a';

describe('parseBitcoinUri', () => {
  it('matches bitcoin: and BITCOIN:', () => {
    expect(parseBitcoinUri(`bitcoin:${ADDRESS}`)).toEqual({ address: ADDRESS });
    expect(parseBitcoinUri(`BITCOIN:${ADDRESS.toUpperCase()}`)).toEqual({ address: ADDRESS.toUpperCase() });
    expect(parseBitcoinUri(`BitCoin:${ADDRESS}`)).toEqual({ address: ADDRESS });
  });

  it('returns null for text that is not a Bitcoin URI', () => {
    expect(parseBitcoinUri(ADDRESS)).toBeNull();
    expect(parseBitcoinUri(`lightning:${INVOICE}`)).toBeNull();
    expect(parseBitcoinUri('bitcoincash:qq')).toBeNull();
  });

  it('the address is the part before ?', () => {
    expect(parseBitcoinUri(`bitcoin:${ADDRESS}?amount=1`)).toEqual({ address: ADDRESS, amountSats: 100_000_000 });
  });

  it('an empty address is valid only with lightning=', () => {
    expect(parseBitcoinUri('bitcoin:')).toBeNull();
    expect(parseBitcoinUri('bitcoin:?amount=1')).toBeNull();
    expect(parseBitcoinUri('bitcoin:?lightning=')).toBeNull();
    expect(parseBitcoinUri(`bitcoin:?lightning=${INVOICE}`)).toEqual({ address: '', lightning: INVOICE });
  });

  it('parameter names match in any case', () => {
    expect(parseBitcoinUri(`bitcoin:${ADDRESS}?AMOUNT=0.0001&Lightning=${INVOICE}`)).toEqual({ address: ADDRESS, amountSats: 10_000, lightning: INVOICE });
  });

  it('percent-decodes the values', () => {
    expect(parseBitcoinUri(`bitcoin:${ADDRESS}?lightning=lightning%3A${INVOICE}&amount=0%2E5`)).toEqual({ address: ADDRESS, amountSats: 50_000_000, lightning: `lightning:${INVOICE}` });
  });

  it('an invalid percent-encoding makes the URI invalid', () => {
    expect(parseBitcoinUri(`bitcoin:${ADDRESS}?lightning=%E0%A4%A`)).toBeNull();
  });

  it.each([
    ['1', 100_000_000],
    ['0.0001', 10_000],
    ['0.00000001', 1],
    ['21000000', 2_100_000_000_000_000],
  ])('amount %s gives %d sats', (amount, sats) => {
    expect(parseBitcoinUri(`bitcoin:${ADDRESS}?amount=${amount}`)?.amountSats).toBe(sats);
  });

  it.each([
    // Each of these is wrong with Math.round(Number(amount) * 1e8) or with a float multiplication
    ['0.3', 30_000_000],
    ['1.15', 115_000_000],
    ['0.29', 29_000_000],
    ['20999999.99999999', 2_099_999_999_999_999],
    ['0.10000000', 10_000_000],
    ['1.', 100_000_000],
  ])('converts %s BTC to %d sats without float rounding', (amount, sats) => {
    expect(parseBitcoinUri(`bitcoin:${ADDRESS}?amount=${amount}`)?.amountSats).toBe(sats);
  });

  it.each(['0', '0.0', '-1', '1e-8', '0.000000001', '1,5', '.', '', ' 1', '0x10', '1.2.3'])('amount "%s" makes the URI invalid', (amount) => {
    expect(parseBitcoinUri(`bitcoin:${ADDRESS}?amount=${amount}`)).toBeNull();
  });

  it('an unknown req- parameter makes the URI invalid, in any case', () => {
    expect(parseBitcoinUri(`bitcoin:${ADDRESS}?req-somethingyoudontunderstand=50`)).toBeNull();
    expect(parseBitcoinUri(`bitcoin:${ADDRESS}?amount=1&REQ-pop=1`)).toBeNull();
  });

  it('a parameter without = is ignored, unless it is a req- parameter', () => {
    expect(parseBitcoinUri(`bitcoin:${ADDRESS}?flag&amount=1`)).toEqual({ address: ADDRESS, amountSats: 100_000_000 });
    expect(parseBitcoinUri(`bitcoin:${ADDRESS}?req-flag`)).toBeNull();
    expect(parseBitcoinUri(`bitcoin:${ADDRESS}?amount`)).toBeNull();
  });

  it('an amount without whole part is read as 0.x BTC', () => {
    expect(parseBitcoinUri(`bitcoin:${ADDRESS}?amount=.5`)?.amountSats).toBe(50_000_000);
  });

  it('label, message and other unknown parameters are ignored', () => {
    expect(parseBitcoinUri(`bitcoin:${ADDRESS}?label=Luke-Jr&message=Donation%20for%20project%20xyz&somethingyoudontunderstand=50&pj=https://example.com`)).toEqual({ address: ADDRESS });
  });

  it('when a parameter appears twice, the first one wins (amount, lightning)', () => {
    expect(parseBitcoinUri(`bitcoin:${ADDRESS}?amount=0.0001&amount=2`)).toEqual({ address: ADDRESS, amountSats: 10_000 });
    expect(parseBitcoinUri(`bitcoin:${ADDRESS}?lightning=${INVOICE}&LIGHTNING=lnbc1other`)).toEqual({ address: ADDRESS, lightning: INVOICE });
  });

  it('a duplicated parameter is first-wins even when the second one is invalid, but never hides a req- parameter', () => {
    expect(parseBitcoinUri(`bitcoin:${ADDRESS}?amount=0.0001&amount=-1`)).toEqual({ address: ADDRESS, amountSats: 10_000 });
    expect(parseBitcoinUri(`bitcoin:${ADDRESS}?amount=0.0001&req-x=1&amount=2`)).toBeNull();
  });
});
