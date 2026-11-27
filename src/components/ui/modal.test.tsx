import React from 'react';
import { Text } from 'react-native';

import { cleanup, render } from '@/lib/test-utils';

import { Modal } from './modal';

// Records the props the sheet receives from Modal
const mockSheetProps = jest.fn();
jest.mock('@gorhom/bottom-sheet', () => {
  const { forwardRef } = require('react');
  const actual = jest.requireActual('@gorhom/bottom-sheet/mock');
  return {
    ...actual,
    BottomSheetModal: forwardRef((props: Record<string, unknown>, _ref: unknown) => {
      mockSheetProps(props);
      return null;
    }),
  };
});

// jest-setup mocks useSheetBottomPadding with 16: a phone with a home indicator (34) gives 50
jest.mock('@/lib/use-sheet-bottom-padding', () => ({ SHEET_CONTENT_SPACING: 16, useSheetBottomPadding: () => 50 }));

const lastSheetProps = () => mockSheetProps.mock.calls[mockSheetProps.mock.calls.length - 1][0];

describe('Modal (bottom sheet)', () => {
  beforeEach(() => mockSheetProps.mockClear());
  afterEach(cleanup);

  it('starts at the bottom edge of the screen, over the tab bar', () => {
    render(
      <Modal>
        <Text>content</Text>
      </Modal>,
    );

    expect(lastSheetProps().bottomInset).toBe(0);
  });

  it('a detached sheet floats above the home indicator', () => {
    render(
      <Modal detached>
        <Text>content</Text>
      </Modal>,
    );

    expect(lastSheetProps().bottomInset).toBe(50);
  });

  it('an explicit bottomInset still wins', () => {
    render(
      <Modal bottomInset={12}>
        <Text>content</Text>
      </Modal>,
    );

    expect(lastSheetProps().bottomInset).toBe(12);
  });
});
