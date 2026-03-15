import { Ionicons } from '@expo/vector-icons';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Modal, Text, useModal } from '@/components/ui';
import { capitalize } from '@/lib';

type PaymentMethod = 'onchain' | 'lightning';

interface PaymentMethodBottomSheetProps {
  mode: 'send' | 'receive';
  onSelect: (method: PaymentMethod) => void;
}

export const PaymentMethodBottomSheet = React.forwardRef<BottomSheetModal, PaymentMethodBottomSheetProps>(({ mode, onSelect }, forwardedRef) => {
  const { ref, present, dismiss } = useModal();
  const { t } = useTranslation();

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

  const handleSelect = (method: PaymentMethod) => {
    dismiss();
    onSelect(method);
  };

  return (
    <Modal ref={ref} snapPoints={['30%']} title="" showCloseButton={false}>
      <View className="flex-1 px-6 pt-4">
        <Pressable
          className="mb-3 flex-row items-center rounded-2xl border border-neutral-200 bg-neutral-50 p-4 active:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:active:bg-neutral-700"
          onPress={() => handleSelect('lightning')}
        >
          <View className="mr-4 items-center justify-center rounded-full bg-warning-400 p-3">
            <Ionicons name="flash" size={22} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-800 dark:text-white">{`${capitalize(mode)}`} via Lightning</Text>
            <Text className="mt-0.5 text-sm text-gray-500 dark:text-neutral-400">{t('paymentMethod.lightningDescription')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#A3A3A3" />
        </Pressable>

        <Pressable
          className="flex-row items-center rounded-2xl border border-neutral-200 bg-neutral-50 p-4 active:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:active:bg-neutral-700"
          onPress={() => handleSelect('onchain')}
        >
          <View className="mr-4 items-center justify-center rounded-full bg-primary-600 p-3">
            <Ionicons name="link" size={22} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-800 dark:text-white">{`${capitalize(mode)}`} via On-chain</Text>
            <Text className="mt-0.5 text-sm text-gray-500 dark:text-neutral-400">{t('paymentMethod.onchainDescription')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#A3A3A3" />
        </Pressable>
      </View>
    </Modal>
  );
});
