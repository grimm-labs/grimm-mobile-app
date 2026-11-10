jest.mock('bdk-rn', () => require('@/lib/bdk/__tests__/helpers/mock-bdk-rn'));

import React from 'react';

import { fakeBreez } from '@/lib/payment-input/__tests__/helpers/fake-breez-context';
import { fakeRouter } from '@/lib/payment-input/__tests__/helpers/fake-expo-router';
import { act, cleanup, fireEvent, render, screen } from '@/lib/test-utils';

import LightningPaymentScreen from '../enter-address';

// The routing of this screen is tested with the other entry points in src/lib/payment-input/__tests__/entry-points.test.tsx

const mockT = (key: string) => key;

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { Ionicons: (props: Record<string, unknown>) => <View {...props} /> };
});

jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props: Record<string, unknown>) => <View {...props} />;
});

jest.mock('@/components/ui/focus-aware-status-bar', () => ({
  FocusAwareStatusBar: () => null,
}));

jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: jest.fn() },
  useTranslation: () => ({ t: mockT }),
}));

jest.mock('@/lib/i18n', () => ({
  translate: (key: string) => key,
}));

jest.mock('expo-router', () => require('@/lib/payment-input/__tests__/helpers/fake-expo-router'));
jest.mock('@/lib/context/breez-context', () => require('@/lib/payment-input/__tests__/helpers/fake-breez-context'));

beforeEach(() => {
  fakeBreez.reset();
  fakeRouter.reset();
});

afterEach(cleanup);

describe('LightningPaymentScreen (send/enter-address)', () => {
  it('renders the input field and button', () => {
    render(<LightningPaymentScreen />);

    expect(screen.getByPlaceholderText('lightningPayment.placeholder')).toBeOnTheScreen();
    expect(screen.getByText('lightningPayment.payButton')).toBeOnTheScreen();
  });

  it('updates input value when typing', () => {
    render(<LightningPaymentScreen />);
    const input = screen.getByTestId('send-ln-address-input');

    fireEvent.changeText(input, 'new-input-value');

    expect(input.props.value).toBe('new-input-value');
  });

  it('is pre-filled with the input param', () => {
    fakeRouter.setParams({ input: 'alice@pay.usegrimm.app' });
    render(<LightningPaymentScreen />);

    expect(screen.getByTestId('send-ln-address-input').props.value).toBe('alice@pay.usegrimm.app');
  });

  it('shows "Processing..." while the Payment Input is read', async () => {
    let resolveParse: (value: unknown) => void = () => {};
    fakeBreez.parseInput.mockReturnValue(new Promise((resolve) => (resolveParse = resolve)));
    render(<LightningPaymentScreen />);

    fireEvent.changeText(screen.getByTestId('send-ln-address-input'), 'alice@pay.usegrimm.app');
    fireEvent.press(screen.getByTestId('send-ln-address-continue'));

    expect(await screen.findByText('lightningPayment.processing')).toBeOnTheScreen();
    await act(async () => resolveParse({ tag: 'LightningAddress', inner: [{ address: 'alice@pay.usegrimm.app', payRequest: {} }] }));
    expect(screen.getByText('lightningPayment.payButton')).toBeOnTheScreen();
  });
});
