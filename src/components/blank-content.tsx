import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';

import { colors, Text, View } from '@/ui';

export type BlankContentProps = {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color?: string;
};

export const BlankContent = ({
  title,
  subtitle,
  icon,
  color,
}: BlankContentProps) => {
  return (
    <View className="flex items-center justify-center">
      <Ionicons
        name={icon}
        size={50}
        color={color || colors.neutral[400]}
        className="mb-4 rounded text-gray-300"
      />
      <Text className="font-mdeium mb-4 text-center text-base text-gray-600">
        {title}
      </Text>
      <Text className="font-sm mb-4 text-center text-sm text-gray-500">
        {subtitle}
      </Text>
    </View>
  );
};
