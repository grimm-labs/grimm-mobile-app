import { Ionicons } from '@expo/vector-icons';
import { Mnemonic } from 'bdk-rn';
import { WordCount } from 'bdk-rn/lib/lib/enums';
import { Stack, useRouter } from 'expo-router';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { ScreenSubtitle } from '@/components/screen-subtitle';
import { ScreenTitle } from '@/components/screen-title';
import { colors, FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { AppContext } from '@/lib/context';

interface SeedOptionItemProps {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}

const SeedOptionItem: React.FC<SeedOptionItemProps> = ({ title, subtitle, onPress, icon }) => {
  return (
    <TouchableOpacity onPress={onPress} className={`mb-3 flex-row items-center justify-between p-4`} activeOpacity={0.7}>
      <View className="mr-4">
        <Ionicons name={icon} size={24} color={colors.neutral[800]} />
      </View>
      <View className="flex-1 pr-4">
        <Text className="mb-1 text-lg font-semibold text-gray-900">{title}</Text>
        <Text className="text-sm text-gray-600">{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={colors.neutral[400]} />
    </TouchableOpacity>
  );
};

export default function CreateOrImportSeed() {
  const { t } = useTranslation();
  const { setSeedPhrase } = useContext(AppContext);
  const router = useRouter();

  const handleCreateSeed = async () => {
    try {
      const newMnemonic = (await new Mnemonic().create(WordCount.WORDS12)).asString();
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
      <SafeAreaView>
        <View className="flex h-full justify-between px-4">
          <Stack.Screen
            options={{
              headerShown: true,
              headerTitle: '',
              headerLeft: HeaderLeft,
              headerRight: () => null,
              headerShadowVisible: false,
            }}
          />
          <FocusAwareStatusBar style="dark" />
          <View className="flex-1">
            <ScreenTitle title={t('seedSetup.title')} />
            <View className="mb-3" />
            <ScreenSubtitle subtitle={t('seedSetup.subtitle')} />
            <View className="mb-3" />
            <View className="flex-1">
              <SeedOptionItem icon="add-circle-outline" title={t('seedSetup.create.title')} subtitle={t('seedSetup.create.subtitle')} onPress={handleCreateSeed} />
              <View className="my-2 border-b border-neutral-200" />
              <SeedOptionItem icon="folder-open-outline" title={t('seedSetup.import.title')} subtitle={t('seedSetup.import.subtitle')} onPress={handleImportSeed} />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
