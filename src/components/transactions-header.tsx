import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { FocusAwareStatusBar } from '@/ui';

const TransactionsHeader = () => {
  return (
    <View className="flex-row items-center justify-between border-b border-neutral-200 px-4">
      <View className="flex  py-3">
        <FocusAwareStatusBar />
        <Text className="text-2xl font-bold text-gray-800">Transactions</Text>
      </View>
      <Pressable className="relative" onPress={() => router.push('notifications')}>
        <Ionicons name="filter-sharp" size={24} color="gray" />
      </Pressable>
    </View>
  );
};

export default TransactionsHeader;
