/* eslint-disable max-params */
import type { Network } from 'bdk-rn';
import { Address, Amount, FeeRate, KeychainKind, type PersisterInterface, TxBuilder, type WalletInterface } from 'bdk-rn';

/** BIP125 opt-in RBF sequence value. */
const RBF_SEQUENCE = 0xfffffffd;

export function buildAndSignTransaction(wallet: WalletInterface, persister: PersisterInterface, recipientAddress: string, amountSats: number, feeRateSatVb: number, network: Network) {
  const addressInstance = new Address(recipientAddress, network);
  const script = addressInstance.scriptPubkey();
  const feeRate = FeeRate.fromSatPerVb(BigInt(Math.max(1, Math.round(feeRateSatVb))));

  const psbt = new TxBuilder()
    .addRecipient(script, Amount.fromSat(BigInt(amountSats)))
    .setExactSequence(RBF_SEQUENCE)
    .feeRate(feeRate)
    .finish(wallet);

  wallet.sign(psbt, undefined);
  wallet.finalizePsbt(psbt, undefined);
  wallet.persist(persister);

  return psbt.extractTx();
}

export function estimateTransactionFee(wallet: WalletInterface, persister: PersisterInterface, recipientAddress: string, amountSats: number, feeRateSatVb: number, network: Network): number {
  const tx = buildAndSignTransaction(wallet, persister, recipientAddress, amountSats, feeRateSatVb, network);
  return Number(tx.vsize()) * feeRateSatVb;
}

export function revealReceiveAddress(wallet: WalletInterface, persister: PersisterInterface): string {
  const addressInfo = wallet.revealNextAddress(KeychainKind.External);
  wallet.persist(persister);
  return addressInfo.address.toString();
}
