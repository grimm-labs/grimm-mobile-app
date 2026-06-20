import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import React from 'react';

import { colors, Pressable, Text, View } from '@/components/ui';
import { theme } from '@/lib/theme-classes';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
};

export const SettingsItem = ({ icon, title, subtitle, onPress }: Props) => {
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === 'dark' ? colors.charcoal[300] : colors.neutral[500];

  return (
    <Pressable onPress={onPress} className="flex-row items-center rounded py-2">
      <View className="mr-1 rounded-full p-2">
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View className="ml-2 flex-1">
        <Text className={`text-base font-medium ${theme.textPrimary}`}>{title}</Text>
        <Text className={`text-xs ${theme.textMuted}`}>{subtitle}</Text>
      </View>
      <View>
        <Ionicons name="chevron-forward" size={20} color={iconColor} />
      </View>
    </Pressable>
  );
};
