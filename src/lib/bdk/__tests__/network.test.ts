jest.mock('bdk-rn', () => require('@/lib/bdk/__tests__/helpers/mock-bdk-rn'));

import { Network } from 'bdk-rn';

import { toBdkNetwork, toNetworkKind } from '@/lib/bdk/network';

describe('network mapping', () => {
  it('maps mainnet to Network.Bitcoin and NetworkKind.Main', () => {
    expect(toBdkNetwork('mainnet')).toBe(Network.Bitcoin);
    expect(toNetworkKind('mainnet')).toBe(0);
  });

  it('maps testnet to Network.Testnet and NetworkKind.Test', () => {
    expect(toBdkNetwork('testnet')).toBe(Network.Testnet);
    expect(toNetworkKind('testnet')).toBe(1);
  });
});
