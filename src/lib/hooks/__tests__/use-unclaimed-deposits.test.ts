import { act, renderHook, waitFor } from '@testing-library/react-native';

jest.mock('@breeztech/breez-sdk-spark-react-native', () => require('@/lib/breez/__tests__/helpers/fake-breez-sdk'));

const mockT = (key: string, options?: Record<string, unknown>) => (options ? `${key} ${JSON.stringify(options)}` : key);
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mockT }),
}));

jest.mock('react-native-flash-message', () => ({
  showMessage: jest.fn(),
}));

const mockBreez = {
  unclaimedDeposits: [] as unknown[],
  refreshUnclaimedDeposits: jest.fn(),
  claimDeposit: jest.fn(),
  isBreezInitialized: true,
};
jest.mock('@/lib/context/breez-context', () => ({
  useBreez: () => mockBreez,
}));

import { showMessage } from 'react-native-flash-message';

import type { ClaimResult } from '@/lib/breez/deposits';
import { fakeDeposit, fakePayment, feeTooHigh, instantStatus, InstantClaimStatus_Tags, PaymentStatus } from '@/lib/breez/__tests__/helpers/fake-breez-sdk';

import { useUnclaimedDeposits } from '../use-unclaimed-deposits';

const needsFee = fakeDeposit({ txid: 'needs-fee', claimError: feeTooHigh(500) });
const confirming = fakeDeposit({ txid: 'confirming', isMature: false });
const claimed = fakeDeposit({ txid: 'claimed', instantClaimStatus: instantStatus(InstantClaimStatus_Tags.Claimed) });

async function renderLoaded() {
  const hook = renderHook(() => useUnclaimedDeposits());
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  return hook;
}

async function claimWith(result: ClaimResult | Error) {
  if (result instanceof Error) mockBreez.claimDeposit.mockRejectedValue(result);
  else mockBreez.claimDeposit.mockResolvedValue(result);

  const { result: hook } = await renderLoaded();
  await act(async () => {
    await hook.current.claimDeposit(needsFee);
  });
  return hook;
}

describe('useUnclaimedDeposits', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBreez.unclaimedDeposits = [needsFee, confirming, claimed];
    mockBreez.refreshUnclaimedDeposits.mockResolvedValue([]);
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('refreshes the deposits once Breez is initialized', async () => {
    await renderLoaded();

    expect(mockBreez.refreshUnclaimedDeposits).toHaveBeenCalled();
  });

  it('lists every deposit not credited yet, and the ones waiting for a fee approval', async () => {
    const { result } = await renderLoaded();

    expect(result.current.deposits).toEqual([needsFee, confirming]);
    expect(result.current.actionableDeposits).toEqual([needsFee]);
  });

  it('claims a deposit for the fee the provider asked for', async () => {
    const hook = await claimWith({ kind: 'credited', payment: fakePayment(PaymentStatus.Completed) as never });

    expect(mockBreez.claimDeposit).toHaveBeenCalledWith('needs-fee', 0, BigInt(500));
    expect(hook.current.claimingKey).toBeNull();
  });

  it('does not claim a deposit that needs no fee approval', async () => {
    const { result } = await renderLoaded();

    await act(async () => {
      await result.current.claimDeposit(confirming);
    });

    expect(mockBreez.claimDeposit).not.toHaveBeenCalled();
  });

  it.each([
    [{ kind: 'credited', payment: fakePayment(PaymentStatus.Completed) }, 'lnWallet.manualClaimModal.success', 'success'],
    [{ kind: 'crediting', payment: fakePayment(PaymentStatus.Pending) }, 'lnWallet.claimResult.crediting', 'info'],
    [{ kind: 'crediting' }, 'lnWallet.claimResult.crediting', 'info'],
    [{ kind: 'feeChanged', requiredFeeSats: BigInt(1_250) }, 'lnWallet.claimResult.feeChanged {"fee":"1,250"}', 'warning'],
    [{ kind: 'notYet' }, 'lnWallet.claimResult.notYet', 'info'],
    [{ kind: 'inProgress' }, 'lnWallet.claimResult.inProgress', 'info'],
    [{ kind: 'tooSmall' }, 'lnWallet.claimResult.tooSmall', 'warning'],
  ])('tells the user what the claim did: %o', async (result, message, type) => {
    await claimWith(result as ClaimResult);

    expect(showMessage).toHaveBeenCalledWith({ message, type, duration: 4000 });
  });

  it('never announces a credit while the payment is still pending', async () => {
    await claimWith({ kind: 'crediting', payment: fakePayment(PaymentStatus.Pending) as never });

    expect(showMessage).not.toHaveBeenCalledWith(expect.objectContaining({ message: 'lnWallet.manualClaimModal.success' }));
  });

  it('reports an unexpected error', async () => {
    const hook = await claimWith(new Error('operator unreachable'));

    expect(showMessage).toHaveBeenCalledWith({ message: 'lnWallet.manualClaimModal.error', type: 'danger', duration: 3000 });
    expect(hook.current.claimingKey).toBeNull();
  });
});
