import { Ionicons } from '@expo/vector-icons';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { colors, Modal, Text, useModal } from '@/components/ui';
import { theme } from '@/lib/theme-classes';
import { useModalBottomInset } from '@/lib/use-modal-bottom-inset';

type PaymentMethod = 'onchain' | 'lightning';

interface PaymentMethodBottomSheetProps {
  mode: 'send' | 'receive';
  onSelect: (method: PaymentMethod) => void;
}

interface PaymentMethodOptionProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconBgClass: string;
  title: string;
  description: string;
  onPress: () => void;
  className?: string;
}

const PaymentMethodOption = ({ icon, iconBgClass, title, description, onPress, className = 'mb-3' }: PaymentMethodOptionProps) => {
  const { colorScheme } = useColorScheme();
  const chevronColor = colorScheme === 'dark' ? colors.charcoal[400] : colors.neutral[400];

  return (
    <Pressable className={`${className} flex-row items-center rounded-2xl p-4 active:opacity-80 ${theme.card}`} onPress={onPress}>
      <View className={`mr-4 items-center justify-center rounded-full p-3 ${iconBgClass}`}>
        <Ionicons name={icon} size={22} color={colors.white} />
      </View>
      <View className="flex-1">
        <Text className={`text-base font-bold ${theme.textPrimary}`}>{title}</Text>
        <Text className={`mt-0.5 text-sm ${theme.textMuted}`}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={chevronColor} />
    </Pressable>
  );
};

export const PaymentMethodBottomSheet = React.forwardRef<BottomSheetModal, PaymentMethodBottomSheetProps>(({ mode, onSelect }, forwardedRef) => {
  const { ref, present, dismiss } = useModal();
  const { t } = useTranslation();
  const bottomInset = useModalBottomInset();

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
    <Modal ref={ref} snapPoints={['34%']} title="" showCloseButton={false} bottomInset={bottomInset}>
      <View className="flex-1 px-6 pb-4 pt-2">
        <PaymentMethodOption icon="flash" iconBgClass="bg-warning-400" title={t(`lnPaymentMethod.${mode}Title`)} description={t('lnPaymentMethod.lightningDescription')} onPress={() => handleSelect('lightning')} />
        <PaymentMethodOption
          icon="link"
          iconBgClass="bg-primary-600"
          title={t(`onchainPaymentMethod.${mode}Title`)}
          description={t('onchainPaymentMethod.onchainDescription')}
          onPress={() => handleSelect('onchain')}
          className=""
        />
      </View>
    </Modal>
  );
});
