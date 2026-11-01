import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import React from 'react';

import { fakeBottomSheet } from '@/lib/payment-input/__tests__/helpers/fake-bottom-sheet';
import { act, cleanup, fireEvent, render, screen } from '@/lib/test-utils';

import { PaymentMethodBottomSheet } from '../payment-method-bottom-sheet';

const mockT = (key: string) => key;

jest.mock('@gorhom/bottom-sheet', () => ({ ...require('@gorhom/bottom-sheet/mock'), ...require('@/lib/payment-input/__tests__/helpers/fake-bottom-sheet') }));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { Ionicons: (props: Record<string, unknown>) => <View {...props} /> };
});

jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: jest.fn() },
  useTranslation: () => ({ t: mockT }),
}));

const onSelect = jest.fn();
const onDismiss = jest.fn();

function renderSheet() {
  const ref = React.createRef<BottomSheetModal>();
  render(<PaymentMethodBottomSheet ref={ref} mode="send" onSelect={onSelect} onDismiss={onDismiss} />);
  act(() => ref.current?.present());
  return ref;
}

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe('PaymentMethodBottomSheet', () => {
  it('closing it without a choice calls onDismiss', () => {
    renderSheet();
    expect(screen.getByTestId('send-method-lightning')).toBeOnTheScreen();

    act(() => fakeBottomSheet.closeWithoutChoice());

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.queryByTestId('send-method-lightning')).not.toBeOnTheScreen();
  });

  it.each(['lightning', 'onchain'])('choosing %s calls onSelect and never onDismiss', (method) => {
    renderSheet();

    fireEvent.press(screen.getByTestId(`send-method-${method}`));

    expect(onSelect).toHaveBeenCalledWith(method);
    expect(onDismiss).not.toHaveBeenCalled();
    expect(fakeBottomSheet.isOpen()).toBe(false);
  });

  it('a choice does not hide a later close without a choice', () => {
    const ref = renderSheet();
    fireEvent.press(screen.getByTestId('send-method-onchain'));

    act(() => ref.current?.present());
    act(() => fakeBottomSheet.closeWithoutChoice());

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
