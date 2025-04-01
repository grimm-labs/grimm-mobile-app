import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';

import { FocusAwareStatusBar, Pressable, Text, View } from '@/components/ui';

interface ThemeOptionProps {
  name?: string;
  theme: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  isSelected: boolean;
  onPress: () => void;
}

interface ThemeTypes {
  name: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

const ThemeOption: React.FC<ThemeOptionProps> = ({ theme, description, icon, isSelected, onPress }) => (
  <Pressable onPress={onPress}>
    <View className="flex flex-row items-center justify-between border-b-[0.5px] border-gray-300 py-4">
      <View className="flex flex-row items-center">
        <Ionicons name={icon} size={24} color="black" />
        <View className="ml-4">
          <Text className="text-sm font-medium">{theme}</Text>
          <Text className="text-xs text-gray-500">{description}</Text>
        </View>
      </View>
      {isSelected && <Ionicons name="checkmark-outline" size={24} color="green" />}
    </View>
  </Pressable>
);

export default function ThemeSelector() {
  const [selectedTheme, setSelectedTheme] = useState<string>('System');

  const themes: ThemeTypes[] = [
    {
      name: 'System',
      description: 'Let Grimm App visually match your device settings.',
      icon: 'phone-portrait-outline',
    },
    {
      name: 'Light',
      description: 'Turn on light mode.',
      icon: 'sunny-outline',
    },
    {
      name: 'Dark',
      description: 'Turn on dark mode.',
      icon: 'moon-outline',
    },
  ];

  return (
    <SafeAreaView>
      <View className="flex h-full px-4">
        <Stack.Screen
          options={{
            title: 'Appearance',
            headerShown: true,
            headerShadowVisible: false,
          }}
        />
        <FocusAwareStatusBar />
        <View className="mt-6">
          {themes.map(({ name, description, icon }) => (
            <ThemeOption key={name} theme={name} description={description} icon={icon} isSelected={selectedTheme === name} onPress={() => setSelectedTheme(name)} />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
