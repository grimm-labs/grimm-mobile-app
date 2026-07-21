type BalanceLike = {
  confirmed: { toSat: () => bigint };
  trustedPending: { toSat: () => bigint };
  untrustedPending: { toSat: () => bigint };
  total: { toSat: () => bigint };
};

export function amountToNumber(amount: { toSat: () => bigint }): number {
  return Number(amount.toSat());
}

export function balanceToSats(balance: BalanceLike): {
  total: number;
  confirmed: number;
  unconfirmed: number;
} {
  const confirmed = amountToNumber(balance.confirmed);
  const unconfirmed = amountToNumber(balance.trustedPending) + amountToNumber(balance.untrustedPending);
  return {
    total: amountToNumber(balance.total),
    confirmed,
    unconfirmed,
  };
}
