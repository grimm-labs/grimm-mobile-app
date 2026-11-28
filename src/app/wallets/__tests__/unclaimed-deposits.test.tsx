import React from 'react';
import { Alert } from 'react-native';

import { act, cleanup, screen, setup, waitFor } from '@/lib/test-utils';

jest.mock('@breeztech/breez-sdk-spark-react-native', () => require('@/lib/breez/__tests__/helpers/fake-breez-sdk'));

const mockT = (key: string, options?: Record<string, unknown>) => (options ? `${key} ${JSON.stringify(options)}` : key);
jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: jest.fn() },
  useTranslation: () => ({ t: mockT }),
}));

jest.mock('react-native-flash-message', () => ({ showMessage: jest.fn() }));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
}));

jest.mock('@/components/back-button', () => ({ HeaderLeft: () => null }));
jest.mock('@/components/ui/focus-aware-status-bar', () => ({ FocusAwareStatusBar: () => null }));
jest.mock('@/lib/stack-screen-options', () => ({ useStackScreenOptions: () => ({}) }));

// The real useUnclaimedDeposits hook runs on this controllable Breez context
const mockBreez = {
  unclaimedDeposits: [] as unknown[],
  refreshUnclaimedDeposits: jest.fn(async () => []),
  claimDeposit: jest.fn(),
  isBreezInitialized: true,
};
jest.mock('@/lib/context/breez-context', () => ({ useBreez: () => mockBreez }));

import { showMessage } from 'react-native-flash-message';

import { fakeDeposit, fakePayment, feeTooHigh, genericClaimError, instantStatus, InstantClaimStatus_Tags, PaymentStatus, tooSmall } from '@/lib/breez/__tests__/helpers/fake-breez-sdk';

import UnclaimedDepositsScreen from '../unclaimed-deposits';

const needsFee = fakeDeposit({ txid: 'needsfee', amountSats: BigInt(100_000), claimError: feeTooHigh(812) });
const confirming = fakeDeposit({ txid: 'confirming', amountSats: BigInt(50_000), isMature: false });
const credited = fakeDeposit({ txid: 'credited', instantClaimStatus: instantStatus(InstantClaimStatus_Tags.Claimed) });

/** Presses the confirm button of the claim alert */
function confirmAlert(alertSpy: jest.SpyInstance) {
  const buttons = alertSpy.mock.calls[0][2] as { text: string; onPress?: () => void }[];
  buttons.find((button) => button.text === 'lnWallet.manualClaimConfirm.ok')?.onPress?.();
}

describe('UnclaimedDepositsScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBreez.unclaimedDeposits = [];
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    alertSpy.mockRestore();
  });

  it('says when no deposit is in progress', async () => {
    setup(<UnclaimedDepositsScreen />);

    expect(await screen.findByTestId('deposits-empty')).toBeOnTheScreen();
  });

  it('lists every deposit not credited yet with its state, and hides the credited ones', async () => {
    mockBreez.unclaimedDeposits = [needsFee, confirming, credited, fakeDeposit({ txid: 'small', claimError: tooSmall() }), fakeDeposit({ txid: 'failed', claimError: genericClaimError('boom') })];
    setup(<UnclaimedDepositsScreen />);

    expect(await screen.findByTestId('deposits-item-needsfee-0-state')).toHaveTextContent('deposits.state.needsFeeApproval');
    expect(screen.getByTestId('deposits-item-confirming-0-state')).toHaveTextContent('deposits.state.confirming');
    expect(screen.getByTestId('deposits-item-small-0-state')).toHaveTextContent('deposits.state.tooSmall');
    expect(screen.getByTestId('deposits-item-failed-0-state')).toHaveTextContent('deposits.state.failed');
    expect(screen.getByTestId('deposits-item-confirming-0-amount')).toHaveTextContent('50,000 sats');
    expect(screen.queryByTestId('deposits-item-credited-0')).not.toBeOnTheScreen();
  });

  it('offers a claim only for a deposit waiting for the fee approval, with the fee and the net amount', async () => {
    mockBreez.unclaimedDeposits = [needsFee, confirming];
    setup(<UnclaimedDepositsScreen />);

    expect(await screen.findByTestId('deposits-item-needsfee-0-claim')).toBeOnTheScreen();
    expect(screen.getByTestId('deposits-item-needsfee-0-fee')).toHaveTextContent('812 sats');
    expect(screen.getByTestId('deposits-item-needsfee-0-net')).toHaveTextContent('99,188 sats');
    expect(screen.queryByTestId('deposits-item-confirming-0-claim')).not.toBeOnTheScreen();
  });

  it('claims after the user confirms the fee, and says the credit is on its way while the payment is pending', async () => {
    mockBreez.unclaimedDeposits = [needsFee];
    mockBreez.claimDeposit.mockResolvedValue({ kind: 'crediting', payment: fakePayment(PaymentStatus.Pending) });
    const { user } = setup(<UnclaimedDepositsScreen />);

    await user.press(await screen.findByTestId('deposits-item-needsfee-0-claim'));
    expect(alertSpy).toHaveBeenCalledWith('lnWallet.manualClaimConfirm.title', expect.stringContaining('"fee":"812"'), expect.any(Array));
    expect(mockBreez.claimDeposit).not.toHaveBeenCalled();

    await act(async () => {
      confirmAlert(alertSpy);
    });

    await waitFor(() => expect(mockBreez.claimDeposit).toHaveBeenCalledWith('needsfee', 0, BigInt(812)));
    expect(showMessage).toHaveBeenCalledWith({ message: 'lnWallet.claimResult.crediting', type: 'info', duration: 4000 });
  });

  it('does not claim when the user cancels', async () => {
    mockBreez.unclaimedDeposits = [needsFee];
    const { user } = setup(<UnclaimedDepositsScreen />);

    await user.press(await screen.findByTestId('deposits-item-needsfee-0-claim'));
    const buttons = alertSpy.mock.calls[0][2] as { text: string; style?: string; onPress?: () => void }[];
    expect(buttons.find((button) => button.text === 'lnWallet.manualClaimConfirm.cancel')?.style).toBe('cancel');

    expect(mockBreez.claimDeposit).not.toHaveBeenCalled();
  });
});
