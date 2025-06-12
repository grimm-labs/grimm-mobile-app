import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
};

export const SettingsItem = ({ icon, title, subtitle, onPress }: Props) => {
  return (
    <Pressable onPress={onPress} className="mb-4 flex-row items-center rounded py-2">
      <View className="mr-1 rounded-full p-2">
        <Ionicons name={icon} size={20} color="gray" />
      </View>
      <View className="ml-2 flex-1">
        <Text className="text-base font-medium text-gray-800">{title}</Text>
        <Text className="text-xs text-gray-500">{subtitle}</Text>
      </View>
      <View>
        <Ionicons name="chevron-forward" size={20} color="gray" />
      </View>
    </Pressable>
  );
};
