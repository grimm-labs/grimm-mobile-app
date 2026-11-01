jest.mock('bdk-rn', () => require('@/lib/bdk/__tests__/helpers/mock-bdk-rn'));

import { AppNetwork } from '@/lib/payment-input/__tests__/helpers/fake-breez-context';

import { isValidAddress } from '../address-network';

// BIP173 test vectors
const MAINNET_ADDRESS = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
const TESTNET_ADDRESS = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';

describe('isValidAddress', () => {
  it('validates addresses with BDK for Network.Bitcoin on mainnet and Network.Testnet on testnet', () => {
    expect(isValidAddress(MAINNET_ADDRESS, AppNetwork.MAINNET)).toBe(true);
    expect(isValidAddress(TESTNET_ADDRESS, AppNetwork.MAINNET)).toBe(false);

    expect(isValidAddress(TESTNET_ADDRESS, AppNetwork.TESTNET)).toBe(true);
    expect(isValidAddress(MAINNET_ADDRESS, AppNetwork.TESTNET)).toBe(false);
  });

  it('accepts an address in uppercase, as QR codes write it', () => {
    expect(isValidAddress(MAINNET_ADDRESS.toUpperCase(), AppNetwork.MAINNET)).toBe(true);
  });

  it('refuses text that is not an address on either network', () => {
    expect(isValidAddress('alice@pay.usegrimm.app', AppNetwork.MAINNET)).toBe(false);
    expect(isValidAddress('lnbc1pvjluezpp5qqqsyqcvq0emrllfmrpzrzjqy2jjspuzt6nxq7gtss8qq4q0cqh2a', AppNetwork.TESTNET)).toBe(false);
  });
});
