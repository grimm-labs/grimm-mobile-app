import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

export const SeedPhraseBackupNotification: React.FC = () => {
  const router = useRouter();

  const handleBackupPress = () => {
    router.push('/backup-seed-phrase');
  };

  return (
    <View className="mb-4 rounded-xl border-l-4 border-yellow-400 bg-yellow-50 p-4">
      <View className="flex-row items-start">
        {/* Warning Icon */}
        <View className="mr-3 p-2">
          <Ionicons name="warning" size={20} color="#D97706" />
        </View>
        {/* Content */}
        <View className="flex-1">
          <Text className="mb-1 text-sm font-semibold text-gray-900">Back up your recovery phrase</Text>
          <Text className="mb-3 text-xs leading-4 text-gray-700">Protect your funds by backing up your recovery phrase now. Without it, you could lose access to your wallet permanently.</Text>
          {/* Action Buttons */}
          <View className="flex-row items-center space-x-3">
            <Pressable onPress={handleBackupPress} className="flex-row items-center rounded-lg bg-yellow-400 px-4 py-2.5">
              <Ionicons name="shield-checkmark" size={16} color="white" />
              <Text className="ml-2 text-xs font-semibold text-white">Back up now</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
};
