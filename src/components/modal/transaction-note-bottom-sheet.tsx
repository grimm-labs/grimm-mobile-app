/* eslint-disable max-lines-per-function */
import { Ionicons } from '@expo/vector-icons';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useColorScheme } from 'nativewind';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { NativeSyntheticEvent, TextInputContentSizeChangeEventData, TextInputProps } from 'react-native';
import { I18nManager, Keyboard, Platform, StyleSheet, TextInput, View } from 'react-native';
import { useKeyboardState } from 'react-native-keyboard-controller';

import { Button, colors, Modal, useModal } from '@/components/ui';
import { MAX_TRANSACTION_NOTE_LENGTH } from '@/lib/sqlite/transaction-notes';
import { clampTransactionNoteInputHeight, getTransactionNoteSheetBottomInset, getTransactionNoteSheetContentHeight, NOTE_MAX_HEIGHT, NOTE_MIN_HEIGHT, NOTE_VERTICAL_PADDING } from '@/lib/transaction-notes/sheet-layout';
import { useModalBottomInset } from '@/lib/use-modal-bottom-inset';

interface TransactionNoteBottomSheetProps {
  initialNote?: string;
  onSave: (note: string) => Promise<void>;
}

function NoteTextInput(props: TextInputProps) {
  if (Platform.OS === 'ios') {
    return <BottomSheetTextInput {...props} />;
  }

  return <TextInput {...props} />;
}

export const TransactionNoteBottomSheet = React.forwardRef<BottomSheetModal, TransactionNoteBottomSheetProps>(({ initialNote = '', onSave }, forwardedRef) => {
  const { ref, present, dismiss } = useModal();
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === 'dark' ? colors.charcoal[300] : colors.neutral[500];
  const bottomInset = useModalBottomInset();
  const { height: keyboardHeight, isVisible: isKeyboardVisible } = useKeyboardState();
  const [note, setNote] = useState(initialNote);
  const [inputHeight, setInputHeight] = useState(NOTE_MIN_HEIGHT);
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = Boolean(initialNote);
  const isIOS = Platform.OS === 'ios';

  const snapPoints = useMemo(() => [getTransactionNoteSheetContentHeight(inputHeight)], [inputHeight]);

  const effectiveBottomInset = useMemo(
    () =>
      getTransactionNoteSheetBottomInset({
        isIOS,
        isKeyboardVisible,
        keyboardHeight,
        bottomInset,
      }),
    [bottomInset, isIOS, isKeyboardVisible, keyboardHeight],
  );

  React.useEffect(() => {
    ref.current?.snapToIndex(0);
  }, [snapPoints, effectiveBottomInset, ref]);

  React.useEffect(() => {
    if (isIOS) {
      return undefined;
    }

    const subscription = Keyboard.addListener('keyboardDidHide', () => {
      ref.current?.snapToIndex(0);
    });

    return () => subscription.remove();
  }, [isIOS, ref]);

  React.useEffect(() => {
    setNote(initialNote);
    setInputHeight(NOTE_MIN_HEIGHT);
  }, [initialNote]);

  React.useImperativeHandle(
    forwardedRef,
    () =>
      ({
        present: () => {
          setNote(initialNote);
          setInputHeight(NOTE_MIN_HEIGHT);
          present();
        },
        dismiss,
        close: dismiss,
        snapToIndex: () => {},
        snapToPosition: () => {},
        expand: () => {},
        collapse: () => {},
        forceClose: dismiss,
      }) as BottomSheetModal,
  );

  const handleContentSizeChange = useCallback((event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
    const contentHeight = event.nativeEvent.contentSize.height + NOTE_VERTICAL_PADDING * 2;
    setInputHeight(clampTransactionNoteInputHeight(contentHeight));
  }, []);

  const inputStyle = StyleSheet.flatten([
    {
      height: inputHeight,
      minHeight: NOTE_MIN_HEIGHT,
      maxHeight: NOTE_MAX_HEIGHT,
      lineHeight: 20,
      writingDirection: I18nManager.isRTL ? ('rtl' as const) : ('ltr' as const),
      textAlign: I18nManager.isRTL ? ('right' as const) : ('left' as const),
    },
  ]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      await onSave(note);
      dismiss();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      ref={ref}
      snapPoints={snapPoints}
      bottomInset={effectiveBottomInset}
      {...(isIOS ? { keyboardBehavior: 'interactive' as const, keyboardBlurBehavior: 'restore' as const } : { keyboardBlurBehavior: 'none' as const, android_keyboardInputMode: 'adjustResize' as const })}
    >
      <View className="px-6 pb-4">
        <View className="mb-4 flex-row items-start rounded-xl bg-neutral-200 p-2 dark:bg-neutral-800">
          <View className="ml-2 pt-4">
            <Ionicons name="document-text" size={18} color={iconColor} />
          </View>
          <NoteTextInput
            value={note}
            onChangeText={setNote}
            placeholder={t('transactionNote.placeholder')}
            placeholderTextColor={colors.neutral[400]}
            multiline
            scrollEnabled
            maxLength={MAX_TRANSACTION_NOTE_LENGTH}
            textAlignVertical="top"
            onContentSizeChange={handleContentSizeChange}
            className="mt-0 flex-1 rounded-xl p-4 font-inter text-base font-medium leading-5 dark:bg-neutral-800 dark:text-white"
            style={inputStyle}
          />
        </View>

        <Button label={isEditing ? t('transactionNote.saveButton') : t('transactionNote.addNoteButton')} fullWidth size="lg" variant="secondary" loading={isSaving} disabled={isSaving} onPress={handleSave} />
      </View>
    </Modal>
  );
});
