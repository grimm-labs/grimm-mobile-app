/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { colors, FocusAwareStatusBar, Pressable, SafeAreaView, Text, View } from '@/components/ui';
import { useSelectedLanguage } from '@/lib';

import type { Language as TLanguage } from '../../lib/i18n/resources';

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
  const { t } = useTranslation();
  const { language, setLanguage } = useSelectedLanguage();

  const handleLanguageSelect = useCallback(
    (languageCode: TLanguage) => {
      setLanguage(languageCode);
    },
    [setLanguage],
  );

  const languageHandlers = useMemo(() => {
    const handlers: Record<string, () => void> = {};
    AVAILABLE_LANGUAGES.forEach((lang) => {
      handlers[lang.code] = () => handleLanguageSelect(lang.code as TLanguage);
    });
    return handlers;
  }, [handleLanguageSelect]);

  const languageOptions = useMemo(
    () =>
      AVAILABLE_LANGUAGES.map((lang) => ({
        ...lang,
        isSelected: language === lang.code,
        onPress: languageHandlers[lang.code],
      })),
    [language, languageHandlers],
  );

  const screenOptions = useMemo(
    () => ({
      headerTitle: () => <HeaderTitle title={t('language.header_title')} />,
      headerTitleAlign: 'center' as const,
      headerShown: true,
      headerShadowVisible: false,
      headerLeft: HeaderLeft,
    }),
    [t],
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View className="flex h-full px-4">
          <Stack.Screen options={screenOptions} />
          <FocusAwareStatusBar style="dark" />

          <View className="flex-1">
            {languageOptions.map((l) => (
              <LanguageOption key={l.code} language={l.name} nativeName={l.nativeName} flag={l.flag} isSelected={l.isSelected} onPress={l.onPress} />
            ))}
          </View>

          <View className="mb-4 mt-6 px-2">
            <Text className="text-center text-sm leading-4 text-gray-500">{t('language.info_text')}</Text>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
