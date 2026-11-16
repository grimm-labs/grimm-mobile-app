import '@/lib/i18n';

import React from 'react';

import { PinPad } from '@/components/pin-pad';
import { act, cleanup, fireEvent, render, screen } from '@/lib/test-utils';

jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props: Record<string, unknown>) => <View {...props} />;
});

const PREFIX = 'test-pin-pad';

/** Presses each digit of `keys`, or the delete key for 'delete'. */
function press(keys: string) {
  for (const key of keys === 'delete' ? [keys] : keys) {
    fireEvent.press(screen.getByTestId(`${PREFIX}-key-${key}`));
  }
}

function filledDots() {
  return [0, 1, 2, 3, 4, 5].filter((index) => screen.getByTestId(`${PREFIX}-dot-${index}`).props.accessibilityValue?.text === 'filled').length;
}

afterEach(() => {
  cleanup();
});

describe('PinPad', () => {
  it('has the 10 digits and a delete key, with the prefix in their testIDs', () => {
    render(<PinPad testID={PREFIX} onComplete={jest.fn()} />);

    ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'delete'].forEach((key) => expect(screen.getByTestId(`${PREFIX}-key-${key}`)).toBeOnTheScreen());
    expect(screen.getByLabelText('Delete')).toBeOnTheScreen();
  });

  it('fills the dots and submits automatically at the 6th digit', async () => {
    const onComplete = jest.fn();
    render(<PinPad testID={PREFIX} onComplete={onComplete} />);

    press('48291');
    expect(filledDots()).toBe(5);
    expect(onComplete).not.toHaveBeenCalled();

    await act(async () => press('5'));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('482915');
    expect(filledDots()).toBe(0);
  });

  it('the delete key removes the last digit', async () => {
    const onComplete = jest.fn();
    render(<PinPad testID={PREFIX} onComplete={onComplete} />);

    press('123');
    press('delete');
    expect(filledDots()).toBe(2);
    press('delete');
    press('delete');
    press('delete');
    expect(filledDots()).toBe(0);

    await act(async () => press('987654'));
    expect(onComplete).toHaveBeenCalledWith('987654');
  });

  it('ignores the keys when disabled', () => {
    const onComplete = jest.fn();
    render(<PinPad testID={PREFIX} onComplete={onComplete} disabled />);

    press('123456');

    expect(filledDots()).toBe(0);
    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByTestId(`${PREFIX}-key-1`)).toBeDisabled();
  });

  it('ignores the keys while a submission is pending', async () => {
    let finish: () => void = () => {};
    const onComplete = jest.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    render(<PinPad testID={PREFIX} onComplete={onComplete} />);

    await act(async () => press('111111'));
    press('2');
    expect(filledDots()).toBe(0);

    await act(async () => finish());
    press('2');
    expect(filledDots()).toBe(1);
  });

  it('ignores fast taps that land after the 6th digit, before the keypad re-renders', async () => {
    let finish: () => void = () => {};
    const onComplete = jest.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    render(<PinPad testID={PREFIX} onComplete={onComplete} />);
    const keys = ['1', '2', '3', '4', '5', '6', '7', 'delete'].map((key) => screen.getByTestId(`${PREFIX}-key-${key}`));

    // One batch: the elements keep the props of the first render, as during very fast taps
    await act(async () => keys.forEach((key) => fireEvent.press(key)));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('123456');
    expect(filledDots()).toBe(0);
    await act(async () => finish());
  });

  it('shows an extra key at the bottom left', () => {
    const { Text } = require('react-native');
    render(<PinPad testID={PREFIX} onComplete={jest.fn()} bottomLeftKey={<Text testID="extra-key">bio</Text>} />);

    expect(screen.getByTestId('extra-key')).toBeOnTheScreen();
  });
});
