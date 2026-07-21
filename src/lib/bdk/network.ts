import { Network, NetworkKind } from 'bdk-rn';

export type BreezNetwork = 'mainnet' | 'testnet' | string;

export function toBdkNetwork(breezNetwork: BreezNetwork): Network {
  return breezNetwork === 'mainnet' ? Network.Bitcoin : Network.Testnet;
}

export function toNetworkKind(breezNetwork: BreezNetwork): NetworkKind {
  return breezNetwork === 'mainnet' ? NetworkKind.Main : NetworkKind.Test;
}
