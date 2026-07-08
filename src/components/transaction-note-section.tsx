import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator } from 'react-native';
import { showMessage } from 'react-native-flash-message';

import { TransactionNoteBottomSheet } from '@/components/modal/transaction-note-bottom-sheet';
import { Button, Text, TouchableOpacity, View } from '@/components/ui';
import { useTransactionNote } from '@/lib/hooks/use-transaction-note';
import type { TransactionNoteType } from '@/lib/sqlite/transaction-notes';
import { theme } from '@/lib/theme-classes';

type TransactionNoteSectionProps = {
  type: TransactionNoteType;
  transactionId: string;
};

export function TransactionNoteSection({ type, transactionId }: TransactionNoteSectionProps) {
  const { t } = useTranslation();
  const modalRef = useRef<BottomSheetModal>(null);
  const { note, isLoading, saveNote } = useTransactionNote({ type, transactionId });

  const openModal = () => {
    modalRef.current?.present();
  };

  const handleSave = async (text: string) => {
    try {
      await saveNote(text);
    } catch {
      showMessage({
        message: t('transactionNote.saveError'),
        type: 'danger',
        duration: 3000,
      });
      throw new Error('Failed to save transaction note');
    }
  };

  if (!transactionId) {
    return null;
  }

  if (isLoading) {
    return (
      <View className="mb-4 h-12 items-center justify-center" testID="transaction-note-loading">
        <ActivityIndicator size="small" />
      </View>
    );
  }

  return (
    <>
      <View className="mb-4">
        {note ? (
          <TouchableOpacity className={`rounded-lg p-4 ${theme.card}`} activeOpacity={0.7} onPress={openModal}>
            <Text className={`mb-1 text-sm font-medium ${theme.textMuted}`}>{t('transactionNote.title')}</Text>
            <Text className={`text-base ${theme.textPrimary}`}>{note}</Text>
          </TouchableOpacity>
        ) : (
          <Button label={t('transactionNote.addButton')} fullWidth={false} size="sm" variant="link" onPress={openModal} />
        )}
      </View>

      <TransactionNoteBottomSheet ref={modalRef} initialNote={note ?? ''} onSave={handleSave} />
    </>
  );
}
