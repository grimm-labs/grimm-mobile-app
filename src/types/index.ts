import type * as BDK from 'bdk-rn';
import type BigNumber from 'bignumber.js';

import type { ENet } from './enum';

export type TBalance = {
  onchain: BigNumber;
  lightning: BigNumber;
};

// Address type
export type TAddress = {
  address: string; // Address
  path: string; // Address derivation path
  index: number; // Address derivation index
  change: boolean; // Whether address is change
  memo: string; // Address memo
};

export type TBaseWalletArgs = {
  restored: boolean;
  mnemonic?: string;
  xprv?: string;
  xpub?: string;
  network?: ENet;
  fingerprint?: string;
};

export type TDescriptorObject = {
  external: BDK.Descriptor;
  internal: BDK.Descriptor;
  priv: BDK.Descriptor;
};
