/* eslint-disable max-lines-per-function */
import { Ionicons } from '@expo/vector-icons';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, colors, Input, Modal, Text, useModal } from '@/components/ui';
import { convertBtcToSats, convertSatsToBtc } from '@/lib';
import { AppContext } from '@/lib/context';
import { BitcoinUnit } from '@/types/enum';

export interface AddressConfig {
  amount?: number;
  note?: string;
}

interface AddressConfigBottomSheetProps {
  defaultAmount?: number;
  defaultNote?: string;
  onSave: (config: AddressConfig) => void;
}

export const AddressConfigBottomSheet = React.forwardRef<BottomSheetModal, AddressConfigBottomSheetProps>(({ defaultAmount, defaultNote = '', onSave }, forwardedRef) => {
  const { ref, present, dismiss } = useModal();
  const { t } = useTranslation();

  const [amount, setAmount] = useState<number | undefined>(defaultAmount);
  const [note, setNote] = useState<string>(defaultNote);
  const { bitcoinUnit } = useContext(AppContext);

  React.useEffect(() => {
    if (defaultAmount && bitcoinUnit === BitcoinUnit.Sats) {
      setAmount(convertBtcToSats(defaultAmount));
    } else {
      setAmount(defaultAmount);
    }
    setNote(defaultNote);
  }, [defaultAmount, defaultNote, bitcoinUnit]);

  React.useImperativeHandle(
    forwardedRef,
    () =>
      ({
        present,
        dismiss,
        close: dismiss,
        snapToIndex: () => {},
        snapToPosition: () => {},
        expand: () => {},
        collapse: () => {},
        forceClose: dismiss,
      }) as BottomSheetModal,
  );

  const handleSave = () => {
    let finalAmount = amount;

    if (finalAmount && bitcoinUnit === BitcoinUnit.Sats) {
      finalAmount = Number(convertSatsToBtc(finalAmount));
    }

    const config: AddressConfig = {
      amount: finalAmount,
      note: note || undefined,
    };
    onSave(config);
    dismiss();
  };

  return (
    <Modal ref={ref} snapPoints={['40%']}>
      <View className="flex-1 px-6 pb-8">
        <View className="flex-1">
          <Text className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">{t('addressConfig.title')}</Text>

          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('addressConfig.amount')}</Text>
            <Input
              value={amount?.toString() || ''}
              onChangeText={(text) => setAmount(text ? Number(text) : undefined)}
              placeholder={bitcoinUnit === 'SATS' ? 'e.g., 1000' : 'e.g., 0.0001'}
              keyboardType="decimal-pad"
              placeholderTextColor="#9CA3AF"
              prefix={<Text>₿</Text>}
              suffix={<Text>{bitcoinUnit}</Text>}
            />
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('addressConfig.note')}</Text>
            <Input
              value={note}
              onChangeText={setNote}
              placeholder={t('addressConfig.notePlaceholder')}
              multiline
              numberOfLines={3}
              placeholderTextColor="#9CA3AF"
              textAlignVertical="top"
              prefix={<Ionicons name="document-text" size={18} color={colors.neutral[400]} />}
            />
          </View>
        </View>

        <View>
          <Button label={t('addressConfig.saveButton')} fullWidth size="lg" variant="secondary" textClassName="text-base text-white font-bold" onPress={handleSave} />
        </View>
      </View>
    </Modal>
  );
});
