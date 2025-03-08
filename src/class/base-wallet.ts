import BigNumber from 'bignumber.js';

import type { TAddress, TBalance, TBaseWalletArgs, TDescriptorObject } from '@/types';
import type { ENet } from '@/types/enum';

export class BaseWallet {
  // Use static method to create wallet from JSON
  static fromJSON(json: string): BaseWallet {
    const obj = JSON.parse(json);

    const wallet = new BaseWallet({
      xprv: obj.xprv,
      xpub: obj.xpub,
      mnemonic: obj.mnemonic,
      network: obj.network as ENet,
      restored: obj.restored,
    });

    wallet.id = obj.id;
    wallet.restored = obj.restored;

    wallet.externalDescriptor = obj.externalDescriptor;
    wallet.internalDescriptor = obj.internalDescriptor;
    wallet.privateDescriptor = obj.privateDescriptor;

    wallet.balance = {
      onchain: new BigNumber(obj.balance.onchain),
      lightning: new BigNumber(obj.balance.lightning),
    };
    return wallet;
  }

  id: string;
  restored: boolean;

  externalDescriptor: string;
  internalDescriptor: string;
  privateDescriptor: string;

  mnemonic: string;
  xprv: string;
  xpub: string;

  balance: TBalance;

  constructor(args: TBaseWalletArgs) {
    this.id = this._generateID(); // Unique wallet ID
    this.restored = args.restored; // Whether wallet is restored

    this.balance = { onchain: new BigNumber(0), lightning: new BigNumber(0) }; // By default the balance is in sats

    this.internalDescriptor = ''; // Wallet internal descriptor
    this.externalDescriptor = ''; // Wallet external descriptor
    this.privateDescriptor = ''; // Wallet external private descriptor (default to external public descriptor if no private key material)

    this.xprv = args.xprv ? args.xprv : '';
    this.xpub = args.xpub ? args.xpub : '';
    this.mnemonic = args.mnemonic ? args.mnemonic : '';
  }

  async generateNewAddress(/*index?: number */): Promise<TAddress> {
    throw new Error('Not implemented');
  }

  protected _generateID(): string {
    return crypto.randomUUID();
  }

  updateBalance(balances: TBalance) {
    this.balance = balances;
  }

  buildTx() {
    throw new Error('Not implemented');
  }

  updatedTransaction() {
    throw new Error('Not implemented');
  }

  setXprv(xprv: string) {
    this.xprv = xprv;
  }

  setXpub(xpub: string) {
    this.xpub = xpub;
  }

  async setDescriptor(descriptor: TDescriptorObject) {
    this.internalDescriptor = await descriptor.internal.asString();
    this.externalDescriptor = await descriptor.external.asString();

    // The external descriptor with private key
    this.privateDescriptor = await descriptor.priv.asString();
  }
}
