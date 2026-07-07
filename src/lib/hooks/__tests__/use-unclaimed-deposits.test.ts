import { act, renderHook, waitFor } from '@testing-library/react-native';

const mockRefreshUnclaimedDeposits = jest.fn();
const mockClaimDeposit = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('react-native-flash-message', () => ({
  showMessage: jest.fn(),
}));

jest.mock('@/lib/context/breez-context', () => ({
  useBreez: () => ({
    unclaimedDeposits: [],
    refreshUnclaimedDeposits: mockRefreshUnclaimedDeposits,
    claimDeposit: mockClaimDeposit,
    isBreezInitialized: true,
  }),
}));

jest.mock('@breeztech/breez-sdk-spark-react-native', () => ({
  DepositClaimError_Tags: {
    MaxDepositClaimFeeExceeded: 'MaxDepositClaimFeeExceeded',
  },
}));

import type { DepositInfo } from '@breeztech/breez-sdk-spark-react-native';
import { DepositClaimError_Tags } from '@breeztech/breez-sdk-spark-react-native';

import { useUnclaimedDeposits } from '../use-unclaimed-deposits';

const actionableDeposit = {
  txid: 'abc123',
  vout: 0,
  amountSats: BigInt(100_000),
  isMature: true,
  claimError: {
    tag: DepositClaimError_Tags.MaxDepositClaimFeeExceeded,
    inner: { requiredFeeSats: BigInt(500) },
  },
} as DepositInfo;

describe('useUnclaimedDeposits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefreshUnclaimedDeposits.mockResolvedValue([]);
    mockClaimDeposit.mockResolvedValue(undefined);
  });

  it('refreshes deposits when breez is initialized', async () => {
    const { result } = renderHook(() => useUnclaimedDeposits());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockRefreshUnclaimedDeposits).toHaveBeenCalled();
  });

  it('claims a deposit with the required fee', async () => {
    const { result } = renderHook(() => useUnclaimedDeposits());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.claimDeposit(actionableDeposit);
    });

    expect(mockClaimDeposit).toHaveBeenCalledWith('abc123', 0, BigInt(500));
    expect(result.current.claimingKey).toBeNull();
  });
});
