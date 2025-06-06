import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import { Text, View } from '@/components/ui';

export const EmptyTransactions: React.FC = () => (
  <View className="items-center justify-center px-8 py-16">
    <View className="mb-6 size-20 items-center justify-center rounded-full bg-gray-100">
      <Ionicons name="flash-outline" size={32} color="#9ca3af" />
    </View>
    <Text className="mb-2 text-center text-lg font-semibold text-gray-900">No transactions</Text>
    <Text className="text-center text-sm leading-relaxed text-gray-500">Your Lightning transactions will appear here.</Text>
  </View>
);
