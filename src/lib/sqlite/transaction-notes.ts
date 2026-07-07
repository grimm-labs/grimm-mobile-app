import { getAppDatabase } from '@/lib/sqlite/database';

export const MAX_TRANSACTION_NOTE_LENGTH = 500;

export type TransactionNoteType = 'ln' | 'onchain';

export function buildTransactionNoteKey(type: TransactionNoteType, transactionId: string): string {
  return `${type}:${transactionId}`;
}

export async function getTransactionNote(transactionKey: string): Promise<string | null> {
  if (!transactionKey) {
    return null;
  }

  const db = await getAppDatabase();
  const row = await db.getFirstAsync<{ note: string }>('SELECT note FROM transaction_notes WHERE transaction_key = ?', [transactionKey]);
  return row?.note ?? null;
}

export async function saveTransactionNote(transactionKey: string, note: string): Promise<void> {
  if (!transactionKey) {
    return;
  }

  const trimmed = note.trim().slice(0, MAX_TRANSACTION_NOTE_LENGTH);

  if (!trimmed) {
    await deleteTransactionNote(transactionKey);
    return;
  }

  const db = await getAppDatabase();
  await db.runAsync('INSERT OR REPLACE INTO transaction_notes (transaction_key, note, updated_at) VALUES (?, ?, ?)', [transactionKey, trimmed, Date.now()]);
}

export async function deleteTransactionNote(transactionKey: string): Promise<void> {
  if (!transactionKey) {
    return;
  }

  const db = await getAppDatabase();
  await db.runAsync('DELETE FROM transaction_notes WHERE transaction_key = ?', [transactionKey]);
}
