/* eslint-disable max-lines-per-function */
import { useCallback, useEffect, useMemo, useState } from 'react';

import { buildTransactionNoteKey, getTransactionNote, saveTransactionNote, type TransactionNoteType } from '@/lib/sqlite/transaction-notes';

type UseTransactionNoteParams = {
  type: TransactionNoteType;
  transactionId: string;
};

export function useTransactionNote({ type, transactionId }: UseTransactionNoteParams) {
  const [note, setNote] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const transactionKey = useMemo(() => {
    if (!transactionId) {
      return null;
    }

    return buildTransactionNoteKey(type, transactionId);
  }, [type, transactionId]);

  useEffect(() => {
    let isMounted = true;

    async function loadNote() {
      if (!transactionKey) {
        if (isMounted) {
          setNote(null);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);

      try {
        const storedNote = await getTransactionNote(transactionKey);
        if (isMounted) {
          setNote(storedNote);
        }
      } catch (error) {
        console.error('[TransactionNotes] Failed to load note:', error);
        if (isMounted) {
          setNote(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadNote();

    return () => {
      isMounted = false;
    };
  }, [transactionKey]);

  const saveNote = useCallback(
    async (text: string) => {
      if (!transactionKey) {
        return;
      }

      const trimmed = text.trim();

      try {
        await saveTransactionNote(transactionKey, text);
        setNote(trimmed || null);
      } catch (error) {
        console.error('[TransactionNotes] Failed to save note:', error);
        throw error;
      }
    },
    [transactionKey],
  );

  return { note, isLoading, saveNote };
}
