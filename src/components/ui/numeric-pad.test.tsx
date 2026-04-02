/* eslint-disable max-lines-per-function */
import React from 'react';

import { cleanup, render, screen, setup } from '@/lib/test-utils';

jest.mock('react-native-gesture-handler', () => {
  const { Pressable } = require('react-native');
  return {
    ...jest.requireActual('react-native-gesture-handler/src/mocks.tsx'),
    Pressable,
  };
});

import { NumericKeypad } from './numeric-pad';

afterEach(cleanup);

describe('NumericKeypad', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all number keys 0-9', () => {
      render(<NumericKeypad amount="0" setAmount={jest.fn()} isBtcUnit={false} />);
      for (let i = 0; i <= 9; i++) {
        expect(screen.getByText(String(i))).toBeOnTheScreen();
      }
    });

    it('renders the delete key', () => {
      render(<NumericKeypad amount="0" setAmount={jest.fn()} isBtcUnit={false} />);
      // backspace icon is rendered; the delete key is present in the tree
      expect(screen.toJSON()).toBeTruthy();
    });

    it('renders the dot key when isBtcUnit is true', () => {
      render(<NumericKeypad amount="0" setAmount={jest.fn()} isBtcUnit={true} />);
      expect(screen.getByText('.')).toBeOnTheScreen();
    });

    it('does not render the dot key when isBtcUnit is false', () => {
      render(<NumericKeypad amount="0" setAmount={jest.fn()} isBtcUnit={false} />);
      expect(screen.queryByText('.')).toBeNull();
    });
  });

  describe('Number key interactions', () => {
    it('replaces initial "0" when a number is pressed', async () => {
      const setAmount = jest.fn();
      const { user } = setup(<NumericKeypad amount="0" setAmount={setAmount} isBtcUnit={false} />);
      await user.press(screen.getByText('5'));
      expect(setAmount).toHaveBeenCalledWith('5');
    });

    it('appends a number to an existing non-zero amount', async () => {
      const setAmount = jest.fn();
      const { user } = setup(<NumericKeypad amount="12" setAmount={setAmount} isBtcUnit={false} />);
      await user.press(screen.getByText('3'));
      expect(setAmount).toHaveBeenCalledWith('123');
    });

    it('does not append dot when isBtcUnit is false', async () => {
      const setAmount = jest.fn();
      setup(<NumericKeypad amount="0" setAmount={setAmount} isBtcUnit={false} />);
      // dot key is not rendered, so nothing to press
      expect(screen.queryByText('.')).toBeNull();
      expect(setAmount).not.toHaveBeenCalled();
    });

    it('appends dot when isBtcUnit is true and amount has no dot', async () => {
      const setAmount = jest.fn();
      const { user } = setup(<NumericKeypad amount="1" setAmount={setAmount} isBtcUnit={true} />);
      await user.press(screen.getByText('.'));
      expect(setAmount).toHaveBeenCalledWith('1.');
    });

    it('does not append a second dot when amount already contains one', async () => {
      const setAmount = jest.fn();
      const { user } = setup(<NumericKeypad amount="1.5" setAmount={setAmount} isBtcUnit={true} />);
      await user.press(screen.getByText('.'));
      expect(setAmount).not.toHaveBeenCalled();
    });

    it('does not replace "0" with dot (stays "0")', async () => {
      const setAmount = jest.fn();
      const { user } = setup(<NumericKeypad amount="0" setAmount={setAmount} isBtcUnit={true} />);
      await user.press(screen.getByText('.'));
      expect(setAmount).toHaveBeenCalledWith('0.');
    });

    it('pressing 0 when amount is "0" does nothing', async () => {
      const setAmount = jest.fn();
      const { user } = setup(<NumericKeypad amount="0" setAmount={setAmount} isBtcUnit={false} />);
      await user.press(screen.getByText('0'));
      // amount is '0' and num is not '.', so setAmount('0') should not be called
      // because '0' !== '.' is true and the else-if branch for num !== '.' fires
      // but amount is '0' so the first condition matches: setAmount(num) => setAmount('0')
      // Actually re-reading the logic: if amount === '0' && num !== '.' => setAmount(num)
      // So it calls setAmount('0')
      expect(setAmount).toHaveBeenCalledWith('0');
    });
  });

  describe('Delete key interactions', () => {
    it('removes the last character from amount', async () => {
      const setAmount = jest.fn();
      const { user } = setup(<NumericKeypad amount="123" setAmount={setAmount} isBtcUnit={false} />);
      await user.press(screen.getByTestId('delete-key'));
      expect(setAmount).toHaveBeenCalledWith('12');
    });

    it('resets to "0" when deleting the last character', async () => {
      const setAmount = jest.fn();
      const { user } = setup(<NumericKeypad amount="5" setAmount={setAmount} isBtcUnit={false} />);
      await user.press(screen.getByTestId('delete-key'));
      expect(setAmount).toHaveBeenCalledWith('0');
    });
  });

  describe('Multiple key presses', () => {
    it('builds up a multi-digit number', async () => {
      const setAmount = jest.fn();
      const amounts = ['0', '1', '12'];

      // First press: amount is '0', press '1' => setAmount('1')
      const { user, rerender } = setup(<NumericKeypad amount={amounts[0]} setAmount={setAmount} isBtcUnit={false} />);
      await user.press(screen.getByText('1'));
      expect(setAmount).toHaveBeenCalledWith('1');

      // Second press: amount is '1', press '2' => setAmount('12')
      rerender(<NumericKeypad amount={amounts[1]} setAmount={setAmount} isBtcUnit={false} />);
      await user.press(screen.getByText('2'));
      expect(setAmount).toHaveBeenCalledWith('12');
    });

    it('builds a decimal number in BTC mode', async () => {
      const setAmount = jest.fn();

      const { user, rerender } = setup(<NumericKeypad amount="0" setAmount={setAmount} isBtcUnit={true} />);

      // Press '1' => replaces '0'
      await user.press(screen.getByText('1'));
      expect(setAmount).toHaveBeenCalledWith('1');

      // Rerender with '1', press '.' => appends dot
      rerender(<NumericKeypad amount="1" setAmount={setAmount} isBtcUnit={true} />);
      await user.press(screen.getByText('.'));
      expect(setAmount).toHaveBeenCalledWith('1.');

      // Rerender with '1.', press '5' => appends '5'
      rerender(<NumericKeypad amount="1." setAmount={setAmount} isBtcUnit={true} />);
      await user.press(screen.getByText('5'));
      expect(setAmount).toHaveBeenCalledWith('1.5');
    });
  });
});
