import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { Text, View } from '@/components/ui';

export const SeedPhraseBackupNotification: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();

  const handleBackupPress = () => {
    router.push('/settings/backup-seed-phrase/recovery-seed-phrase-warning');
  };

  return (
    <View className="mb-4 rounded-xl border-l-4 border-yellow-400 bg-yellow-50 p-4">
      <View className="flex-row items-start">
        <View className="mr-3 p-2">
          <Ionicons name="warning" size={20} color="#D97706" />
        </View>
        <View className="flex-1">
          <Text className="mb-1 text-sm font-semibold text-gray-900">{t('seedPhraseBackup.title')}</Text>
          <Text className="mb-3 text-xs leading-4 text-gray-700">{t('seedPhraseBackup.description')}</Text>
          <View className="flex-row items-center space-x-3">
            <Pressable onPress={handleBackupPress} className="flex-row items-center rounded-lg bg-yellow-400 px-4 py-2.5">
              <Ionicons name="shield-checkmark" size={16} color="white" />
              <Text className="ml-2 text-xs font-semibold text-white">{t('seedPhraseBackup.cta')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
};
