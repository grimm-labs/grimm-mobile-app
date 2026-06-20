/* eslint-disable max-lines-per-function */
import { Ionicons } from '@expo/vector-icons';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useColorScheme } from 'nativewind';
import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, colors, Input, Modal, Text, useModal } from '@/components/ui';
import { convertBtcToSats, convertSatsToBtc } from '@/lib';
import { AppContext } from '@/lib/context';
import { theme } from '@/lib/theme-classes';
import { useModalBottomInset } from '@/lib/use-modal-bottom-inset';
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
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === 'dark' ? colors.charcoal[300] : colors.neutral[500];

  const [amount, setAmount] = useState<number | undefined>(defaultAmount);
  const [note, setNote] = useState<string>(defaultNote);
  const { bitcoinUnit } = useContext(AppContext);
  const bottomInset = useModalBottomInset();

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
    <Modal ref={ref} snapPoints={['44%']} bottomInset={bottomInset} keyboardBehavior="interactive" keyboardBlurBehavior="restore">
      <View className="flex-1 px-6 pb-4">
        <View className="flex-1">
          <Text className={`mb-4 text-2xl font-bold ${theme.textPrimary}`}>{t('addressConfig.title')}</Text>

          <View className="mb-4">
            <Text className={`mb-2 text-sm font-medium ${theme.textSecondary}`}>{t('addressConfig.amount')}</Text>
            <Input
              value={amount?.toString() || ''}
              onChangeText={(text) => setAmount(text ? Number(text) : undefined)}
              placeholder={bitcoinUnit === 'SATS' ? 'e.g., 1000' : 'e.g., 0.0001'}
              keyboardType="decimal-pad"
              placeholderTextColor={colors.neutral[400]}
              prefix={<Text className={theme.textPrimary}>₿</Text>}
              suffix={<Text className={theme.textSecondary}>{bitcoinUnit}</Text>}
            />
          </View>

          <View className="mb-4">
            <Text className={`mb-2 text-sm font-medium ${theme.textSecondary}`}>{t('addressConfig.note')}</Text>
            <Input
              value={note}
              onChangeText={setNote}
              placeholder={t('addressConfig.notePlaceholder')}
              multiline
              numberOfLines={3}
              placeholderTextColor={colors.neutral[400]}
              textAlignVertical="top"
              prefix={<Ionicons name="document-text" size={18} color={iconColor} />}
            />
          </View>
        </View>

        <View>
          <Button label={t('addressConfig.saveButton')} fullWidth size="lg" variant="secondary" onPress={handleSave} />
        </View>
      </View>
    </Modal>
  );
});
