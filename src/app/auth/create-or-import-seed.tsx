import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { ScreenSubtitle } from '@/components/screen-subtitle';
import { ScreenTitle } from '@/components/screen-title';
import { colors, FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { generateMnemonic12 } from '@/lib/bdk';
import { AppContext } from '@/lib/context';
import { useStackScreenOptions } from '@/lib/stack-screen-options';
import { theme } from '@/lib/theme-classes';

interface SeedOptionItemProps {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}

const SeedOptionItem: React.FC<SeedOptionItemProps> = ({ title, subtitle, onPress, icon }) => {
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === 'dark' ? colors.charcoal[200] : colors.neutral[800];
  const chevronColor = colorScheme === 'dark' ? colors.charcoal[400] : colors.neutral[400];

  return (
    <TouchableOpacity onPress={onPress} className={`mb-3 flex-row items-center justify-between rounded-xl p-4 ${theme.card}`} activeOpacity={0.7}>
      <View className="mr-4">
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <View className="flex-1 pr-4">
        <Text className={`mb-1 text-lg font-semibold ${theme.textPrimary}`}>{title}</Text>
        <Text className={`text-sm ${theme.textSecondary}`}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={chevronColor} />
    </TouchableOpacity>
  );
};

export default function CreateOrImportSeed() {
  const { t } = useTranslation();
  const { setSeedPhrase } = useContext(AppContext);
  const router = useRouter();
  const stackScreenOptions = useStackScreenOptions();

  const handleCreateSeed = async () => {
    try {
      const newMnemonic = generateMnemonic12();
      if (!newMnemonic) {
        throw new Error('Failed to generate seed phrase');
      }
      await setSeedPhrase(newMnemonic);
      router.dismissAll();
      router.replace('/');
    } catch (error) {
      console.error('Error generating seed phrase:', error);
    }
  };

  const handleImportSeed = async () => {
    router.push('/auth/import-seed-phrase');
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView className={`flex-1 ${theme.screen}`}>
        <View className="flex h-full justify-between px-4">
          <Stack.Screen
            options={{
              headerShown: true,
              headerTitle: '',
              headerLeft: HeaderLeft,
              headerRight: () => null,
              headerShadowVisible: false,
              ...stackScreenOptions,
            }}
          />
          <FocusAwareStatusBar />
          <View className="flex-1">
            <ScreenTitle title={t('seedSetup.title')} />
            <View className="mb-3" />
            <ScreenSubtitle subtitle={t('seedSetup.subtitle')} />
            <View className="mb-3" />
            <View className="flex-1">
              <SeedOptionItem icon="add-circle-outline" title={t('seedSetup.create.title')} subtitle={t('seedSetup.create.subtitle')} onPress={handleCreateSeed} />
              <SeedOptionItem icon="folder-open-outline" title={t('seedSetup.import.title')} subtitle={t('seedSetup.import.subtitle')} onPress={handleImportSeed} />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
