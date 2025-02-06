import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';

import { colors, Text, View } from '@/ui';

export type BlankContentProps = {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color?: string;
};

export const BlankContent = ({ title, icon, color }: BlankContentProps) => {
  return (
    <View className="flex items-center justify-center">
      <Ionicons name={icon} size={60} color={color || colors.neutral[400]} className="mb-8 rounded text-gray-300" />
      <Text className="text-center text-base text-gray-500">{title}</Text>
    </View>
  );
};
