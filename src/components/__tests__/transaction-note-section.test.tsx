import React from 'react';

import { cleanup, screen, setup, waitFor } from '@/lib/test-utils';

jest.mock('react-i18next', () => ({
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('react-native-flash-message', () => ({
  showMessage: jest.fn(),
}));

const mockSaveNote = jest.fn();
let mockNote: string | null = null;
let mockIsLoading = true;

jest.mock('@/lib/hooks/use-transaction-note', () => ({
  useTransactionNote: () => ({
    note: mockNote,
    isLoading: mockIsLoading,
    saveNote: mockSaveNote,
  }),
}));

jest.mock('@/components/modal/transaction-note-bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    TransactionNoteBottomSheet: React.forwardRef((_props: unknown, ref: React.Ref<{ present: () => void }>) => {
      React.useImperativeHandle(ref, () => ({
        present: jest.fn(),
      }));

      return <View testID="transaction-note-bottom-sheet" />;
    }),
  };
});

import { TransactionNoteSection } from '../transaction-note-section';

afterEach(() => {
  cleanup();
  mockNote = null;
  mockIsLoading = true;
  mockSaveNote.mockReset();
});

describe('TransactionNoteSection', () => {
  it('renders nothing when transactionId is empty', () => {
    setup(<TransactionNoteSection type="ln" transactionId="" />);

    expect(screen.queryByText('transactionNote.addButton')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('transaction-note-loading')).not.toBeOnTheScreen();
  });

  it('shows a loading indicator while the note is loading', () => {
    mockIsLoading = true;

    setup(<TransactionNoteSection type="ln" transactionId="tx-1" />);

    expect(screen.getByTestId('transaction-note-loading')).toBeOnTheScreen();
  });

  it('shows the add note button when no note exists', async () => {
    mockIsLoading = false;
    mockNote = null;

    setup(<TransactionNoteSection type="onchain" transactionId="tx-2" />);

    await waitFor(() => {
      expect(screen.getByText('transactionNote.addButton')).toBeOnTheScreen();
    });
    expect(screen.getByTestId('transaction-note-bottom-sheet')).toBeOnTheScreen();
  });

  it('shows the stored note when one exists', async () => {
    mockIsLoading = false;
    mockNote = 'Coffee with Alice';

    setup(<TransactionNoteSection type="ln" transactionId="tx-3" />);

    await waitFor(() => {
      expect(screen.getByText('Coffee with Alice')).toBeOnTheScreen();
    });
    expect(screen.getByText('transactionNote.title')).toBeOnTheScreen();
  });
});
