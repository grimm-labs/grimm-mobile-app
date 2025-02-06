import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';

import { FocusAwareStatusBar, Pressable, Text, View } from '@/ui';

interface LanguageOptionProps {
  language: string;
  isSelected: boolean;
  onPress: () => void;
}

const LanguageOption: React.FC<LanguageOptionProps> = ({ language, isSelected, onPress }) => (
  <Pressable onPress={onPress}>
    <View className="flex flex-row items-center justify-between border-b-[0.5px] border-gray-300 py-4">
      <Text className="text-sm font-medium">{language}</Text>
      {isSelected && <Ionicons name="checkmark-outline" size={24} color="green" />}
    </View>
  </Pressable>
);

export default function LanguageSelector() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Français');

  const languages = ['Français', 'English', 'العربية', '中文'];

  return (
    <SafeAreaView>
      <View className="flex h-full px-4">
        <Stack.Screen
          options={{
            title: 'Language Selector',
            headerShown: true,
            headerShadowVisible: false,
            headerBackTitleVisible: false,
          }}
        />
        <FocusAwareStatusBar />
        <View className="mt-6">
          {languages.map((language) => (
            <LanguageOption key={language} language={language} isSelected={selectedLanguage === language} onPress={() => setSelectedLanguage(language)} />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
