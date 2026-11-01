import { BitcoinUnit } from '@/types/enum';

const SATS_PER_BTC = 100_000_000n;

export const convertSatsToBtc = (sats: number): string => {
  return (sats / 100_000_000).toFixed(8);
};

export const convertBtcToSats = (btc: number): number => {
  return Math.round(btc * 1e8);
};

export const formatBalance = (total: number, unit: BitcoinUnit): string => {
  if (unit === BitcoinUnit.Sats) {
    if (total === 0) {
      return '0 SATS';
    }
    return `${total.toLocaleString('en-US')} SATS`;
  }

  if (unit === BitcoinUnit.Btc) {
    return `${convertSatsToBtc(total)} BTC`;
  }
  return total.toLocaleString();
};

/** An Amount in sats written the way the NumericKeypad writes it in the user's unit, to pre-fill an amount screen. */
export const toKeypadAmount = (sats: number, unit: BitcoinUnit): string => {
  if (unit !== BitcoinUnit.Btc) return String(sats);

  // Integer arithmetic: 10 000 sats is exactly 0.0001, with no float rounding and no trailing zeros
  const whole = BigInt(sats) / SATS_PER_BTC;
  const fraction = (BigInt(sats) % SATS_PER_BTC).toString().padStart(8, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : `${whole}`;
};
