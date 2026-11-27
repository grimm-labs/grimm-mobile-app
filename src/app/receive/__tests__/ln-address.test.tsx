import '@/lib/i18n';

import React from 'react';

import { router } from '@/lib/payment-input/__tests__/helpers/fake-expo-router';
import { cleanup, fireEvent, render, screen, waitFor } from '@/lib/test-utils';

import LnAddressScreen from '../ln-address';

const LIGHTNING_ADDRESS = 'swift-bolt-42@pay.usegrimm.app';
let mockLightningAddress: string | null = LIGHTNING_ADDRESS;

jest.mock('expo-router', () => require('@/lib/payment-input/__tests__/helpers/fake-expo-router'));
jest.mock('@/lib/context/breez-context', () => ({ useBreez: () => ({ lightningAddress: mockLightningAddress }) }));
jest.mock('@/lib/stack-screen-options', () => ({ useStackScreenOptions: () => ({}) }));
jest.mock('@/components/ui/focus-aware-status-bar', () => ({ FocusAwareStatusBar: () => null }));
jest.mock('@/components/back-button', () => ({ HeaderLeft: () => null }));

const mockSetStringAsync = jest.fn();
jest.mock('expo-clipboard', () => ({ setStringAsync: (...args: unknown[]) => mockSetStringAsync(...args) }));

const mockShowMessage = jest.fn();
jest.mock('react-native-flash-message', () => ({ showMessage: (...args: unknown[]) => mockShowMessage(...args) }));

jest.mock('react-native-qrcode-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props: Record<string, unknown>) => <View testID="qr-code">{String(props.value)}</View>;
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

describe('Lightning Address screen (receive/ln-address)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLightningAddress = LIGHTNING_ADDRESS;
  });

  afterEach(cleanup);

  it('shows the Lightning Address and its QR code', () => {
    render(<LnAddressScreen />);

    expect(screen.getByTestId('ln-address-value')).toHaveTextContent(LIGHTNING_ADDRESS);
    expect(screen.getByTestId('qr-code')).toHaveTextContent(LIGHTNING_ADDRESS);
  });

  it('Copy puts the Lightning Address in the clipboard', async () => {
    render(<LnAddressScreen />);

    fireEvent.press(screen.getByTestId('ln-address-copy'));

    await waitFor(() => expect(mockShowMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' })));
    expect(mockSetStringAsync).toHaveBeenCalledWith(LIGHTNING_ADDRESS);
  });

  it('Add Details opens the amount and description screen for Lightning', () => {
    render(<LnAddressScreen />);

    fireEvent.press(screen.getByTestId('ln-address-add-details'));

    expect(router.push).toHaveBeenCalledWith({ pathname: '/receive/amount-description', params: { type: 'lightning' } });
  });

  it('the custom address link opens the Lightning Address settings', () => {
    render(<LnAddressScreen />);

    fireEvent.press(screen.getByTestId('ln-address-custom'));

    expect(router.push).toHaveBeenCalledWith('/settings/ln-address');
  });

  it('without a Lightning Address: no QR code and no actions', () => {
    mockLightningAddress = null;
    render(<LnAddressScreen />);

    expect(screen.getByTestId('ln-address-screen')).toBeOnTheScreen();
    expect(screen.queryByTestId('qr-code')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('ln-address-copy')).not.toBeOnTheScreen();
  });
});
