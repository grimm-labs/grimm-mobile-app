import { act, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import { emitAppState, installAppStateEmitter } from '@/lib/app-lock/__tests__/helpers/app-state';
import { fakeDeposit, feeTooHigh, initLogging, MaxOnchainFee_Tags, PaymentStatus, sdkError, settled } from '@/lib/breez/__tests__/helpers/fake-breez-sdk';
import { resetSdkLoggingForTests } from '@/lib/breez/sdk-logs';
import { BreezProvider, useBreez } from '@/lib/context/breez-context';

type StoredPayment = { id: string; status: number; paymentType: number; amount: bigint };
type SdkEventLike = { tag: string; inner?: unknown };

// What the SDK has stored: getInfo({ ensureSynced: false }) and listPayments read it, a sync rewrites it
const mockStore = { balanceSats: 0, payments: [] as StoredPayment[] };
let mockSdkListener: { onEvent: (event: SdkEventLike) => Promise<void> } | null = null;

const mockSdk = {
  getInfo: jest.fn(),
  listPayments: jest.fn(),
  syncWallet: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(async () => true),
  getLightningAddress: jest.fn(async () => undefined),
  listUnclaimedDeposits: jest.fn(async () => ({ deposits: [] as unknown[] })),
  claimDeposit: jest.fn(),
  prepareSendPayment: jest.fn(async (request: unknown) => ({ request })),
  receivePayment: jest.fn(async () => ({ paymentRequest: 'lnbc1invoice', fee: BigInt(0) })),
  disconnect: jest.fn(async () => {}),
};

// The deposit and log enums come from the shared fake (SDK 0.28.6 values); the rest is what connecting needs
jest.mock('@breeztech/breez-sdk-spark-react-native', () => ({
  ...require('@/lib/breez/__tests__/helpers/fake-breez-sdk'),
  connect: jest.fn(async () => mockSdk),
  defaultConfig: jest.fn(() => ({})),
  Seed: { Mnemonic: { new: jest.fn(() => ({})) } },
  Network: { Mainnet: 0, Regtest: 3 },
  SdkEvent_Tags: {
    Synced: 'Synced',
    UnclaimedDeposits: 'UnclaimedDeposits',
    ClaimedDeposits: 'ClaimedDeposits',
    PaymentSucceeded: 'PaymentSucceeded',
    PaymentPending: 'PaymentPending',
    PaymentFailed: 'PaymentFailed',
    NewDeposits: 'NewDeposits',
  },
  PaymentRequest: {
    Input: function MockInput(this: { tag: string; inner: unknown }, mockInner: { input: string }) {
      this.tag = 'Input';
      this.inner = mockInner;
    },
  },
  PrepareSendPaymentRequest: { new: (fields: object) => fields },
  ReceivePaymentMethod: { Bolt11Invoice: { new: (inner: object) => ({ tag: 'Bolt11Invoice', inner }) } },
}));

const { connect: mockConnect } = jest.requireMock('@breeztech/breez-sdk-spark-react-native') as { connect: jest.Mock };

jest.mock('@env', () => ({ Env: { BREEZ_API_KEY: 'test-api-key' } }));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock/documents/',
  cacheDirectory: 'file:///mock/cache/',
  getInfoAsync: jest.fn(async () => ({ exists: true })),
  makeDirectoryAsync: jest.fn(async () => {}),
}));

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

jest.mock('@/lib/hooks/use-secure-storage', () => ({
  useSecureStorage: () => ({ getItem: async () => 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about' }),
}));

const PAYMENT_COMPLETED = 0;
const PAYMENT_SEND = 0;

function wrapper({ children }: { children: React.ReactNode }) {
  return <BreezProvider>{children}</BreezProvider>;
}

function storedInfo(balanceSats: number) {
  return { identityPubkey: 'pubkey', balanceSats: BigInt(balanceSats), tokenBalances: new Map() };
}

async function connectWallet() {
  const hook = renderHook(() => useBreez(), { wrapper });
  await waitFor(() => expect(hook.result.current.isDataLoaded).toBe(true));
  await act(async () => {
    await hook.result.current.initializeBreez();
  });
  return hook;
}

async function emitSdkEvent(event: SdkEventLike) {
  await act(async () => {
    await mockSdkListener?.onEvent(event);
  });
}

describe('BreezProvider wallet balance', () => {
  let appStateSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    appStateSpy = installAppStateEmitter();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockStore.balanceSats = 1000;
    mockStore.payments = [];
    mockSdkListener = null;
    mockSdk.getInfo.mockImplementation(async () => storedInfo(mockStore.balanceSats));
    mockSdk.listPayments.mockImplementation(async () => ({ payments: [...mockStore.payments] }));
    mockSdk.syncWallet.mockImplementation(async () => ({}));
    mockSdk.addEventListener.mockImplementation(async (listener) => {
      mockSdkListener = listener;
      return 'listener-id';
    });
  });

  afterEach(() => {
    appStateSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('shows the stored balance once connected', async () => {
    const { result } = await connectWallet();

    expect(result.current.balance).toBe(1000);
    expect(mockSdk.syncWallet).not.toHaveBeenCalled();
  });

  it('syncs with Spark before showing the balance on refresh', async () => {
    const { result } = await connectWallet();
    mockSdk.syncWallet.mockImplementation(async () => {
      mockStore.balanceSats = 5000;
      return {};
    });

    await act(async () => {
      await result.current.refreshWalletInfo();
    });

    expect(mockSdk.syncWallet).toHaveBeenCalledTimes(1);
    expect(result.current.balance).toBe(5000);
  });

  it('syncs with Spark when a payment appears while the stored balance is still the old one', async () => {
    const { result } = await connectWallet();
    // The SDK stored the new payment but not yet the balance that goes with it
    mockStore.payments = [{ id: 'payment-1', status: PAYMENT_COMPLETED, paymentType: PAYMENT_SEND, amount: BigInt(400) }];
    mockSdk.syncWallet.mockImplementation(async () => {
      mockStore.balanceSats = 600;
      return {};
    });

    await emitSdkEvent({ tag: 'Synced' });

    await waitFor(() => expect(result.current.balance).toBe(600));
    expect(result.current.payments).toHaveLength(1);
    expect(mockSdk.syncWallet).toHaveBeenCalledTimes(1);
  });

  it('does not sync with Spark when the payments did not change', async () => {
    const { result } = await connectWallet();
    mockStore.balanceSats = 1200;

    await emitSdkEvent({ tag: 'Synced' });

    await waitFor(() => expect(result.current.balance).toBe(1200));
    expect(mockSdk.syncWallet).not.toHaveBeenCalled();
  });

  it('keeps the newer balance when an older read finishes last', async () => {
    const { result } = await connectWallet();
    let finishOlderRead: () => void = () => {};
    mockSdk.getInfo.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishOlderRead = () => resolve(storedInfo(1000));
        }),
    );

    await emitSdkEvent({ tag: 'Synced' });
    await waitFor(() => expect(mockSdk.getInfo).toHaveBeenCalledTimes(2));
    mockStore.balanceSats = 2000;
    await emitSdkEvent({ tag: 'Synced' });
    await waitFor(() => expect(result.current.balance).toBe(2000));

    await act(async () => {
      finishOlderRead();
    });

    expect(result.current.balance).toBe(2000);
  });

  it('syncs with Spark when the app comes back from the background', async () => {
    const { result } = await connectWallet();
    mockSdk.syncWallet.mockImplementation(async () => {
      mockStore.balanceSats = 3000;
      return {};
    });

    emitAppState('background');
    emitAppState('active');

    await waitFor(() => expect(result.current.balance).toBe(3000));
    expect(mockSdk.syncWallet).toHaveBeenCalledTimes(1);
  });

  it('does not sync with Spark after a brief inactive state', async () => {
    await connectWallet();

    emitAppState('inactive');
    emitAppState('active');

    expect(mockSdk.syncWallet).not.toHaveBeenCalled();
  });
});

describe('BreezProvider with SDK 0.28', () => {
  let appStateSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    appStateSpy = installAppStateEmitter();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockStore.balanceSats = 1000;
    mockStore.payments = [];
    mockSdk.getInfo.mockImplementation(async () => storedInfo(mockStore.balanceSats));
    mockSdk.listPayments.mockImplementation(async () => ({ payments: [...mockStore.payments] }));
    mockSdk.syncWallet.mockImplementation(async () => ({}));
    mockSdk.listUnclaimedDeposits.mockImplementation(async () => ({ deposits: [] }));
    mockSdk.addEventListener.mockImplementation(async (listener) => {
      mockSdkListener = listener;
      return 'listener-id';
    });
  });

  afterEach(() => {
    appStateSpy.mockRestore();
    logSpy.mockRestore();
  });

  describe('connecting', () => {
    it('starts the SDK logs before connecting, in the app documents', async () => {
      // The logs start once per app process: start this one fresh
      resetSdkLoggingForTests();

      await connectWallet();

      expect(initLogging).toHaveBeenCalledTimes(1);
      expect(initLogging).toHaveBeenCalledWith('/mock/documents/breez-sdk-logs', undefined, undefined);
      expect((initLogging as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(mockConnect.mock.invocationCallOrder[0]);
    });

    it('claims deposits automatically up to 500 sats plus 0.1%', async () => {
      await connectWallet();

      const { config } = mockConnect.mock.calls[0][0];
      expect(config.maxDepositClaimFee).toEqual({ onchain: expect.objectContaining({ tag: MaxOnchainFee_Tags.Fixed, inner: { amount: BigInt(500) } }), proportionalPpm: 1_000 });
      expect(config.apiKey).toBe('test-api-key');
    });

    it('shows the deposits the SDK stored', async () => {
      const deposit = fakeDeposit({ isMature: false });
      mockSdk.listUnclaimedDeposits.mockImplementation(async () => ({ deposits: [deposit] }));

      const { result } = await connectWallet();

      await waitFor(() => expect(result.current.unclaimedDeposits).toEqual([deposit]));
    });
  });

  describe('payments', () => {
    it('sends what the user entered as a payment request input', async () => {
      const { result } = await connectWallet();

      await act(async () => {
        await result.current.prepareSend('lnbc1invoice', 2_000);
      });

      expect(mockSdk.prepareSendPayment).toHaveBeenCalledWith(expect.objectContaining({ paymentRequest: expect.objectContaining({ tag: 'Input', inner: { input: 'lnbc1invoice' } }), amount: BigInt(2_000) }));
    });

    it('creates an invoice without a caller preimage or receiver key', async () => {
      const { result } = await connectWallet();

      await act(async () => {
        await result.current.receiveBolt11('coffee', 1_500);
      });

      expect(mockSdk.receivePayment).toHaveBeenCalledWith({
        paymentMethod: {
          tag: 'Bolt11Invoice',
          inner: { description: 'coffee', amountSats: BigInt(1_500), expirySecs: expect.any(Number), paymentHash: undefined, receiverIdentityPublicKey: undefined, preimage: undefined },
        },
      });
    });
  });

  describe('claiming a deposit', () => {
    const deposit = fakeDeposit({ claimError: feeTooHigh(812) });

    async function claim(result: { current: ReturnType<typeof useBreez> }) {
      let claimResult: Awaited<ReturnType<ReturnType<typeof useBreez>['claimDeposit']>> | undefined;
      await act(async () => {
        claimResult = await result.current.claimDeposit(deposit.txid, deposit.vout, BigInt(812));
      });
      return claimResult;
    }

    it('claims for at most the approved fee, then reports a payment still pending as on its way and syncs to finish it', async () => {
      const { result } = await connectWallet();
      mockSdk.listUnclaimedDeposits.mockClear();
      mockSdk.claimDeposit.mockResolvedValue(settled(PaymentStatus.Pending));

      const claimResult = await claim(result);

      expect(mockSdk.claimDeposit).toHaveBeenCalledWith({
        txid: deposit.txid,
        vout: 0,
        maxFee: { onchain: expect.objectContaining({ tag: MaxOnchainFee_Tags.Fixed, inner: { amount: BigInt(812) } }), proportionalPpm: undefined },
      });
      expect(claimResult).toEqual({ kind: 'crediting', payment: expect.objectContaining({ status: PaymentStatus.Pending }) });
      expect(mockSdk.listUnclaimedDeposits).toHaveBeenCalled();
      // The sync claims the incoming transfer: the step that never happened with SDK 0.15.1
      await waitFor(() => expect(mockSdk.syncWallet).toHaveBeenCalled());
    });

    it('reports a credited deposit', async () => {
      const { result } = await connectWallet();
      mockSdk.claimDeposit.mockResolvedValue(settled(PaymentStatus.Completed));

      expect(await claim(result)).toEqual({ kind: 'credited', payment: expect.objectContaining({ status: PaymentStatus.Completed }) });
    });

    it('answers a claim already running instead of failing', async () => {
      const { result } = await connectWallet();
      mockSdk.claimDeposit.mockRejectedValue(sdkError('DepositClaimInProgress', { tx: deposit.txid, vout: 0 }));

      expect(await claim(result)).toEqual({ kind: 'inProgress' });
    });

    it('reports the new fee and refreshes the deposits when the provider asks more', async () => {
      const { result } = await connectWallet();
      mockSdk.listUnclaimedDeposits.mockClear();
      mockSdk.claimDeposit.mockRejectedValue(sdkError('MaxDepositClaimFeeExceeded', { tx: deposit.txid, vout: 0, requiredFeeSats: BigInt(990), maxFeeSats: BigInt(812) }));

      expect(await claim(result)).toEqual({ kind: 'feeChanged', requiredFeeSats: BigInt(990) });
      expect(mockSdk.listUnclaimedDeposits).toHaveBeenCalled();
    });

    it('rejects on an unexpected error', async () => {
      const { result } = await connectWallet();
      mockSdk.claimDeposit.mockRejectedValue(sdkError('NetworkError'));

      await act(async () => {
        await expect(result.current.claimDeposit(deposit.txid, deposit.vout, BigInt(812))).rejects.toMatchObject({ tag: 'NetworkError' });
      });
    });
  });
});
