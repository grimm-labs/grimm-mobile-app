import { act, renderHook, waitFor } from '@testing-library/react-native';

const mockGetTransactionNote = jest.fn();
const mockSaveTransactionNote = jest.fn();

jest.mock('@/lib/sqlite/transaction-notes', () => ({
  buildTransactionNoteKey: (type: string, id: string) => `${type}:${id}`,
  getTransactionNote: (...args: unknown[]) => mockGetTransactionNote(...args),
  saveTransactionNote: (...args: unknown[]) => mockSaveTransactionNote(...args),
}));

import { useTransactionNote } from '../use-transaction-note';

describe('useTransactionNote', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads an existing note for the transaction key', async () => {
    mockGetTransactionNote.mockResolvedValueOnce('Lunch');

    const { result } = renderHook(() => useTransactionNote({ type: 'ln', transactionId: 'tx-1' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetTransactionNote).toHaveBeenCalledWith('ln:tx-1');
    expect(result.current.note).toBe('Lunch');
  });

  it('returns null note when no transaction id is provided', async () => {
    const { result } = renderHook(() => useTransactionNote({ type: 'onchain', transactionId: '' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetTransactionNote).not.toHaveBeenCalled();
    expect(result.current.note).toBeNull();
  });

  it('saves a note and updates local state', async () => {
    mockGetTransactionNote.mockResolvedValueOnce(null);
    mockSaveTransactionNote.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useTransactionNote({ type: 'ln', transactionId: 'tx-2' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.saveNote('Groceries');
    });

    expect(mockSaveTransactionNote).toHaveBeenCalledWith('ln:tx-2', 'Groceries');
    expect(result.current.note).toBe('Groceries');
  });

  it('clears local state when saving an empty note', async () => {
    mockGetTransactionNote.mockResolvedValueOnce('Old note');
    mockSaveTransactionNote.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useTransactionNote({ type: 'ln', transactionId: 'tx-3' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.saveNote('   ');
    });

    expect(mockSaveTransactionNote).toHaveBeenCalledWith('ln:tx-3', '   ');
    expect(result.current.note).toBeNull();
  });

  it('rethrows when saving fails', async () => {
    mockGetTransactionNote.mockResolvedValueOnce(null);
    mockSaveTransactionNote.mockRejectedValueOnce(new Error('db error'));

    const { result } = renderHook(() => useTransactionNote({ type: 'ln', transactionId: 'tx-4' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.saveNote('Broken save');
      }),
    ).rejects.toThrow('db error');
  });
});
