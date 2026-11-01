/**
 * Controllable fake of `@/lib/context/breez-context` for the Payment Input, Lightning send, Withdrawal and Lightning
 * Login tests. The Breez SDK is never imported in tests (AGENTS.md), so this module replaces the whole context module,
 * with the enums the screens read from it (same values as the SDK).
 * Use: jest.mock('@/lib/context/breez-context', () => require('@/lib/payment-input/__tests__/helpers/fake-breez-context'));
 *
 * `fakeBreez.set({ isBreezInitialized: true })` re-renders every screen that uses `useBreez()`, like the real provider.
 * The action mocks keep the same identity for the whole run, like the real `useCallback`s.
 */
import { useSyncExternalStore } from 'react';

export enum AppNetwork {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
}

export enum InputType_Tags {
  BitcoinAddress = 'BitcoinAddress',
  Bolt11Invoice = 'Bolt11Invoice',
  Bolt12Invoice = 'Bolt12Invoice',
  Bolt12Offer = 'Bolt12Offer',
  LightningAddress = 'LightningAddress',
  LnurlPay = 'LnurlPay',
  SilentPaymentAddress = 'SilentPaymentAddress',
  LnurlAuth = 'LnurlAuth',
  Url = 'Url',
  Bip21 = 'Bip21',
  Bolt12InvoiceRequest = 'Bolt12InvoiceRequest',
  LnurlWithdraw = 'LnurlWithdraw',
  SparkAddress = 'SparkAddress',
  SparkInvoice = 'SparkInvoice',
}

export enum LnurlCallbackStatus_Tags {
  Ok = 'Ok',
  ErrorStatus = 'ErrorStatus',
}

export enum PaymentStatus {
  Completed,
  Pending,
  Failed,
}

export enum PaymentType {
  Send,
  Receive,
}

export enum BitcoinNetwork {
  Bitcoin,
  Testnet3,
  Testnet4,
  Signet,
  Regtest,
}

type FakeBreezState = {
  isBreezInitialized: boolean;
  breezError: string | null;
  network: AppNetwork;
  balance: number;
};

const DEFAULT_STATE: FakeBreezState = {
  isBreezInitialized: true,
  breezError: null,
  network: AppNetwork.MAINNET,
  balance: 100_000,
};

const actions = {
  parseInput: jest.fn(),
  prepareSend: jest.fn(),
  executeSend: jest.fn(),
  prepareLnurlPay: jest.fn(),
  executeLnurlPay: jest.fn(),
  lnurlWithdraw: jest.fn(),
  lnurlAuth: jest.fn(),
};

let value = { ...DEFAULT_STATE, ...actions };
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useBreez = () => useSyncExternalStore(subscribe, () => value);

export const fakeBreez = {
  ...actions,
  /** Changes the state of the fake and re-renders the screens that use it. Wrap it in `act` after the first render. */
  set(state: Partial<FakeBreezState>) {
    value = { ...value, ...state };
    listeners.forEach((listener) => listener());
  },
  /** Back to a started Breez on mainnet with 100 000 sats, and actions with no calls and no implementation. */
  reset() {
    Object.values(actions).forEach((action) => action.mockReset());
    value = { ...DEFAULT_STATE, ...actions };
  },
};
