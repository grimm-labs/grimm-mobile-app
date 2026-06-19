import React from 'react';
import { useTranslation } from 'react-i18next';

import { Text, View } from '@/components/ui';
import { useBdk } from '@/lib/context';

export const EsploraConnectionBanner: React.FC = () => {
  const { error, isSyncing } = useBdk();
  const { t } = useTranslation();

  if (error == null || isSyncing) {
    return null;
  }

  return (
    <View className="bg-danger-500 py-2">
      <Text className="text-center text-sm font-semibold text-white">{t('home.esploraConnectionWarning')}</Text>
    </View>
  );
};
