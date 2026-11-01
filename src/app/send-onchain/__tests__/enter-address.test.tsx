jest.mock('bdk-rn', () => require('@/lib/bdk/__tests__/helpers/mock-bdk-rn'));

import React from 'react';

import { fakeBreez } from '@/lib/payment-input/__tests__/helpers/fake-breez-context';
import { fakeRouter, router } from '@/lib/payment-input/__tests__/helpers/fake-expo-router';
import { act, cleanup, fireEvent, render, screen } from '@/lib/test-utils';

import EnterAddressScreen from '../enter-address';

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
  const { Pressable } = require('react-native');
  return (props: Record<string, unknown>) => <Pressable {...props} />;
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

describe('EnterAddressScreen (send-onchain/enter-address)', () => {
  it('the scan button opens the scanner', () => {
    render(<EnterAddressScreen />);

    fireEvent.press(screen.getByTestId('send-onchain-address-scan'));

    expect(router.push).toHaveBeenCalledWith('/scan-qr');
  });

  it('is pre-filled with the input param, trimmed', () => {
    fakeRouter.setParams({ input: '  bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4 ' });
    render(<EnterAddressScreen />);

    expect(screen.getByTestId('send-onchain-address-input').props.value).toBe('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4');
  });

  it('updates the input value when typing', () => {
    render(<EnterAddressScreen />);

    fireEvent.changeText(screen.getByTestId('send-onchain-address-input'), 'bc1qnew');

    expect(screen.getByTestId('send-onchain-address-input').props.value).toBe('bc1qnew');
  });

  it('disables Continue while the Payment Input is read', async () => {
    let resolveParse: (value: unknown) => void = () => {};
    fakeBreez.parseInput.mockReturnValue(new Promise((resolve) => (resolveParse = resolve)));
    render(<EnterAddressScreen />);

    fireEvent.changeText(screen.getByTestId('send-onchain-address-input'), 'alice@pay.usegrimm.app');
    fireEvent.press(screen.getByTestId('send-onchain-address-continue'));

    expect(await screen.findByTestId('send-onchain-address-continue')).toBeDisabled();
    await act(async () => resolveParse({ tag: 'LightningAddress', inner: [{ address: 'alice@pay.usegrimm.app', payRequest: {} }] }));
    expect(screen.getByTestId('send-onchain-address-continue')).toBeEnabled();
  });
});
