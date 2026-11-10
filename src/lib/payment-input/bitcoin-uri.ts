// A Bitcoin URI (BIP21): the bitcoin: scheme, an address, then parameters such as amount (in BTC) and lightning (an Invoice)
export type BitcoinUri = { address: string; amountSats?: number; lightning?: string };

const SCHEME = /^bitcoin:/i;
const DIGITS = /^\d*$/;
const SATS_PER_BTC = 100_000_000n;

/** The Bitcoin URI read from a Payment Input, or null when it is not a valid Bitcoin URI. */
export function parseBitcoinUri(text: string): BitcoinUri | null {
  if (!SCHEME.test(text)) return null;

  const rest = text.replace(SCHEME, '');
  const queryStart = rest.indexOf('?');
  const address = queryStart === -1 ? rest : rest.slice(0, queryStart);
  const params = readParams(queryStart === -1 ? '' : rest.slice(queryStart + 1));
  if (!params) return null;

  const uri: BitcoinUri = { address };
  const amount = params.get('amount');
  if (amount !== undefined) {
    const amountSats = btcToSats(amount);
    if (amountSats === null) return null;
    uri.amountSats = amountSats;
  }
  const lightning = params.get('lightning');
  if (lightning) uri.lightning = lightning;

  // Without an address, only the Invoice can be paid
  if (!address && !uri.lightning) return null;
  return uri;
}

/** The decoded parameters by lowercase name, the first occurrence winning; null when the URI is invalid. */
function readParams(query: string): Map<string, string> | null {
  const params = new Map<string, string>();
  for (const pair of query.split('&').filter(Boolean)) {
    const separator = pair.indexOf('=');
    const name = (separator === -1 ? pair : pair.slice(0, separator)).toLowerCase();
    // A req- parameter is one the app must understand to pay: none is supported
    if (name.startsWith('req-')) return null;

    let value: string;
    try {
      value = decodeURIComponent(separator === -1 ? '' : pair.slice(separator + 1));
    } catch {
      return null;
    }
    if (!params.has(name)) params.set(name, value);
  }
  return params;
}

/** Exact conversion with integer arithmetic: as floats, 1.15 × 100 000 000 is 114 999 999.99999999. */
function btcToSats(amount: string): number | null {
  // Decimal BTC: digits, at most one dot, at most 8 decimals (no sign, no exponent, no comma)
  const [whole, fraction = '', ...extraDots] = amount.split('.');
  if (extraDots.length || !DIGITS.test(whole) || !DIGITS.test(fraction) || fraction.length > 8 || !(whole + fraction)) return null;

  const sats = BigInt(whole || '0') * SATS_PER_BTC + BigInt(fraction.padEnd(8, '0'));
  return sats > 0n ? Number(sats) : null;
}
