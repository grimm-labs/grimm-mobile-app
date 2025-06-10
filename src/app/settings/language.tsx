/* eslint-disable react-native/no-inline-styles */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';

import { HeaderLeft } from '@/components/back-button';
import { colors, FocusAwareStatusBar, Pressable, SafeAreaView, Text, View } from '@/components/ui';

interface LanguageOptionProps {
  language: string;
  nativeName: string;
  flag: string;
  isSelected: boolean;
  onPress: () => void;
}

const LanguageOption = React.memo<LanguageOptionProps>(({ language, nativeName, flag, isSelected, onPress }) => (
  <Pressable onPress={onPress} style={{ opacity: 1 }}>
    <View className="flex min-h-[64px] flex-row items-center justify-between border-b-[0.5px] border-gray-200 px-2 py-4">
      <View className="flex flex-1 flex-row items-center">
        <Text className="mr-3 text-2xl">{flag}</Text>
        <View className="flex-1">
          <Text className="mb-1 text-base font-medium text-gray-900">{language}</Text>
          <Text className="text-sm text-gray-500">{nativeName}</Text>
        </View>
      </View>
      <View className="ml-3 size-6 shrink-0 items-center justify-center">{isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.primary[600]} />}</View>
    </View>
  </Pressable>
));

LanguageOption.displayName = 'LanguageOption';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const AVAILABLE_LANGUAGES: readonly Language[] = [
  {
    code: 'fr',
    name: 'Français',
    nativeName: 'Français',
    flag: '🇫🇷',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
  },
] as const;

export default function LanguageSelector() {
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>('fr');

  const handleLanguageSelect = useCallback((languageCode: string) => {
    setSelectedLanguageCode(languageCode);
  }, []);

  const languageHandlers = useMemo(() => {
    const handlers: Record<string, () => void> = {};
    AVAILABLE_LANGUAGES.forEach((lang) => {
      handlers[lang.code] = () => handleLanguageSelect(lang.code);
    });
    return handlers;
  }, [handleLanguageSelect]);

  const languageOptions = useMemo(
    () =>
      AVAILABLE_LANGUAGES.map((lang) => ({
        ...lang,
        isSelected: selectedLanguageCode === lang.code,
        onPress: languageHandlers[lang.code],
      })),
    [selectedLanguageCode, languageHandlers],
  );

  const screenOptions = useMemo(
    () => ({
      title: 'Language',
      headerTitleAlign: 'center' as const,
      headerShown: true,
      headerShadowVisible: false,
      headerLeft: HeaderLeft,
    }),
    [],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View className="flex h-full px-4">
        <Stack.Screen options={screenOptions} />
        <FocusAwareStatusBar style="dark" />

        <View className="flex-1">
          {languageOptions.map((language) => (
            <LanguageOption key={language.code} language={language.name} nativeName={language.nativeName} flag={language.flag} isSelected={language.isSelected} onPress={language.onPress} />
          ))}
        </View>

        <View className="mb-4 mt-6 px-2">
          <Text className="text-center text-xs leading-4 text-gray-500">Language changes will be applied immediately to the interface</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
