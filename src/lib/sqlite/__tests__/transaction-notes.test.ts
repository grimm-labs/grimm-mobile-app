const mockGetFirstAsync = jest.fn();
const mockRunAsync = jest.fn();

jest.mock('@/lib/sqlite/database', () => ({
  getAppDatabase: jest.fn(() =>
    Promise.resolve({
      getFirstAsync: mockGetFirstAsync,
      runAsync: mockRunAsync,
    }),
  ),
}));

import {
  buildTransactionNoteKey,
  deleteTransactionNote,
  getTransactionNote,
  MAX_TRANSACTION_NOTE_LENGTH,
  saveTransactionNote,
} from '../transaction-notes';

describe('buildTransactionNoteKey', () => {
  it('builds a namespaced key from type and transaction id', () => {
    expect(buildTransactionNoteKey('ln', 'abc123')).toBe('ln:abc123');
    expect(buildTransactionNoteKey('onchain', 'txid-456')).toBe('onchain:txid-456');
  });
});

describe('getTransactionNote', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null for an empty key', async () => {
    await expect(getTransactionNote('')).resolves.toBeNull();
    expect(mockGetFirstAsync).not.toHaveBeenCalled();
  });

  it('returns the stored note when found', async () => {
    mockGetFirstAsync.mockResolvedValueOnce({ note: 'Coffee payment' });

    await expect(getTransactionNote('ln:abc123')).resolves.toBe('Coffee payment');
    expect(mockGetFirstAsync).toHaveBeenCalledWith('SELECT note FROM transaction_notes WHERE transaction_key = ?', ['ln:abc123']);
  });

  it('returns null when no row exists', async () => {
    mockGetFirstAsync.mockResolvedValueOnce(null);

    await expect(getTransactionNote('ln:missing')).resolves.toBeNull();
  });
});

describe('saveTransactionNote', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does nothing for an empty key', async () => {
    await saveTransactionNote('', 'note');
    expect(mockRunAsync).not.toHaveBeenCalled();
  });

  it('deletes the note when the trimmed value is empty', async () => {
    await saveTransactionNote('ln:abc123', '   ');

    expect(mockRunAsync).toHaveBeenCalledWith('DELETE FROM transaction_notes WHERE transaction_key = ?', ['ln:abc123']);
  });

  it('persists a trimmed note', async () => {
    await saveTransactionNote('onchain:tx1', '  Rent payment  ');

    expect(mockRunAsync).toHaveBeenCalledWith(
      'INSERT OR REPLACE INTO transaction_notes (transaction_key, note, updated_at) VALUES (?, ?, ?)',
      ['onchain:tx1', 'Rent payment', expect.any(Number)],
    );
  });

  it('truncates notes longer than the max length', async () => {
    const longNote = 'a'.repeat(MAX_TRANSACTION_NOTE_LENGTH + 50);

    await saveTransactionNote('ln:abc123', longNote);

    expect(mockRunAsync).toHaveBeenCalledWith(
      'INSERT OR REPLACE INTO transaction_notes (transaction_key, note, updated_at) VALUES (?, ?, ?)',
      ['ln:abc123', 'a'.repeat(MAX_TRANSACTION_NOTE_LENGTH), expect.any(Number)],
    );
  });
});

describe('deleteTransactionNote', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does nothing for an empty key', async () => {
    await deleteTransactionNote('');
    expect(mockRunAsync).not.toHaveBeenCalled();
  });

  it('deletes the note for a valid key', async () => {
    await deleteTransactionNote('ln:abc123');

    expect(mockRunAsync).toHaveBeenCalledWith('DELETE FROM transaction_notes WHERE transaction_key = ?', ['ln:abc123']);
  });
});
