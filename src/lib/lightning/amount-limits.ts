// LNURL services give their limits in millisats; a payment or a Withdrawal is made in whole sats
export type SatLimits = { minSats: number; maxSats: number };

const MSAT_PER_SAT = 1000n;

/** Rounds the minimum up and the maximum down, so that every Amount within the sat limits is accepted by the service. */
export function toSatLimits(minMsat: bigint, maxMsat: bigint): SatLimits {
  return {
    minSats: Number((minMsat + MSAT_PER_SAT - 1n) / MSAT_PER_SAT),
    maxSats: Number(maxMsat / MSAT_PER_SAT),
  };
}

export function isWithinLimits(amountSats: number, { minSats, maxSats }: SatLimits): boolean {
  return amountSats >= minSats && amountSats <= maxSats;
}

export function isFixedAmount({ minSats, maxSats }: SatLimits): boolean {
  return minSats === maxSats;
}
