import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { colors, Text, View } from '@/components/ui';
import { theme } from '@/lib/theme-classes';

type EmptyTransactionsProps = {
  type: 'ln' | 'onchain';
};

export const EmptyTransactions: React.FC<EmptyTransactionsProps> = ({ type }) => {
  const { t } = useTranslation();

  return (
    <View className="items-center justify-center px-8 py-16">
      <View className="mb-6 size-20 items-center justify-center rounded-full bg-gray-100 dark:bg-charcoal-800">
        <Ionicons name={type === 'ln' ? 'flash-outline' : 'wallet-outline'} size={32} color={colors.neutral[400]} />
      </View>

      <Text className={`mb-2 text-center text-lg font-semibold ${theme.textPrimary}`}>{t('emptyTransactions.title')}</Text>

      <Text className={`text-center text-sm leading-relaxed ${theme.textMuted}`}>{t(`emptyTransactions.${type}.message`)}</Text>
    </View>
  );
};
