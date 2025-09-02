/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable max-lines-per-function */
/* eslint-disable react-native/no-inline-styles */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { colors, FocusAwareStatusBar, Pressable, SafeAreaView, Text, View } from '@/components/ui';

type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeConfig {
  id: ThemeMode;
  name: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  gradient?: string;
}

interface ThemeOptionProps {
  theme: ThemeConfig;
  isSelected: boolean;
  onPress: () => void;
}

const ThemeOption = React.memo<ThemeOptionProps>(({ theme, isSelected, onPress }) => (
  <Pressable onPress={onPress} style={{ opacity: 1 }}>
    <View
      className={`
      mb-3 flex flex-row items-center 
      justify-between rounded-xl border border-gray-200 p-4
      ${isSelected ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}
      min-h-[80px]
    `}
    >
      <View className="flex flex-1 flex-row items-center">
        <View
          className={`
          mr-4 size-12 items-center justify-center rounded-full
          ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}
        `}
        >
          <Ionicons name={theme.icon} size={24} color={isSelected ? colors.primary[600] : theme.iconColor} />
        </View>

        <View className="flex-1 pr-3">
          <Text
            className={`
            mb-1 text-sm font-medium
            ${isSelected ? 'text-blue-900' : 'text-gray-900'}
          `}
          >
            {theme.name}
          </Text>
          <Text
            className={`
            text-xs leading-5
            ${isSelected ? 'text-blue-700' : 'text-gray-600'}
          `}
          >
            {theme.description}
          </Text>
        </View>
      </View>

      <View className="size-6 shrink-0 items-center justify-center">{isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.primary[600]} />}</View>
    </View>
  </Pressable>
));

ThemeOption.displayName = 'ThemeOption';

export default function ThemeSelector() {
  const { t } = useTranslation();
  const [selectedTheme, setSelectedTheme] = useState<ThemeMode>('system');

  const THEME_CONFIGURATIONS: readonly ThemeConfig[] = useMemo(
    () => [
      {
        id: 'system',
        name: t('theme.system.name'),
        description: t('theme.system.description'),
        icon: 'phone-portrait-outline',
        iconColor: '#6B7280',
      },
      {
        id: 'light',
        name: t('theme.light.name'),
        description: t('theme.light.description'),
        icon: 'sunny-outline',
        iconColor: '#F59E0B',
      },
      {
        id: 'dark',
        name: t('theme.dark.name'),
        description: t('theme.dark.description'),
        icon: 'moon-outline',
        iconColor: '#4F46E5',
      },
    ],
    [t],
  );

  const handleThemeSelect = useCallback((themeId: ThemeMode) => {
    setSelectedTheme(themeId);
  }, []);

  const themeHandlers = useMemo(() => {
    const handlers: Record<ThemeMode, () => void> = {} as Record<ThemeMode, () => void>;
    THEME_CONFIGURATIONS.forEach((theme) => {
      handlers[theme.id] = () => handleThemeSelect(theme.id);
    });
    return handlers;
  }, [THEME_CONFIGURATIONS, handleThemeSelect]);

  const themeOptions = useMemo(
    () =>
      THEME_CONFIGURATIONS.map((theme) => ({
        theme,
        isSelected: selectedTheme === theme.id,
        onPress: themeHandlers[theme.id],
      })),
    [THEME_CONFIGURATIONS, selectedTheme, themeHandlers],
  );

  const screenOptions = useMemo(
    () => ({
      headerTitle: () => <HeaderTitle title={t('theme.header_title')} />,
      headerTitleAlign: 'center' as const,
      headerShown: true,
      headerShadowVisible: false,
      headerLeft: HeaderLeft,
    }),
    [t],
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <View className="flex h-full px-4">
          <Stack.Screen options={screenOptions} />
          <FocusAwareStatusBar style="dark" />
          <View className="mt-4 flex-1">
            {themeOptions.map((option) => (
              <ThemeOption key={option.theme.id} theme={option.theme} isSelected={option.isSelected} onPress={option.onPress} />
            ))}
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
