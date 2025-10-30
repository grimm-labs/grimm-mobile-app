/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable max-lines-per-function */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useRouter } from 'expo-router';
import React, { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Clipboard } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { Button, SafeAreaView, ScrollView, Text, View } from '@/components/ui';
import { AppContext } from '@/lib/context';

export default function SeedPhraseScreen() {
  const { seedPhrase, setIsSeedPhraseBackup } = useContext(AppContext);
  const router = useRouter();
  const { t } = useTranslation();

  const organizedWords = useMemo(() => {
    if (!seedPhrase) return [];
    const words = seedPhrase.split(' ');
    const rows = [];
    for (let i = 0; i < words.length; i += 3) {
      const row = words.slice(i, i + 3).map((word, index) => ({
        word,
        index: i + index,
      }));
      rows.push(row);
    }
    return rows;
  }, [seedPhrase]);

  const handleClose = async () => {
    await setIsSeedPhraseBackup(true);
    router.dismissAll();
    router.replace('/');
  };

  const copyToClipboard = async () => {
    if (seedPhrase) {
      await Clipboard.setString(seedPhrase);
      showMessage({
        message: t('seedPhraseScreen.copiedMessage'),
        type: 'success',
        duration: 2000,
        icon: 'success',
      });
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white">
        <Stack.Screen
          options={{
            headerTitleAlign: 'center',
            headerTitle: () => <HeaderTitle title={t('seedPhraseScreen.header')} />,
            headerShown: true,
            headerShadowVisible: false,
            headerLeft: HeaderLeft,
            headerStyle: { backgroundColor: '#ffffff' },
          }}
        />
        <View className="flex-1 px-6">
          <View className="mt-8 items-center">
            <View className="mb-4 rounded-full bg-amber-100 p-4">
              <Ionicons name="shield-checkmark-outline" size={48} color="#f59e0b" />
            </View>
            <Text className="text-xl font-bold text-gray-900">{t('seedPhraseScreen.title')}</Text>
            <Text className="mt-3 text-center text-base leading-6 text-gray-600">{t('seedPhraseScreen.description')}</Text>
          </View>
          <ScrollView className="mt-8 flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <View className="p-3">
              <View className="space-y-4">
                {organizedWords.map((row, rowIndex) => (
                  <View key={rowIndex} className="mb-3 flex-row justify-between">
                    {row.map(({ word, index }) => (
                      <View key={index} className="mx-1 flex-1 rounded-xl border border-gray-200 py-2">
                        <Text className="text-center text-xs font-semibold text-gray-500">{index + 1}</Text>
                        <Text className="mt-1 text-center text-xs font-semibold text-gray-900">{word}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
          <View className="space-y-3">
            <Button testID="copy-button" label={t('seedPhraseScreen.copyButton')} fullWidth size="lg" variant="outline" className="mb-4" textClassName="text-base" onPress={copyToClipboard} />
            <Button testID="saved-button" label={t('seedPhraseScreen.savedButton')} fullWidth size="lg" variant="secondary" textClassName="text-base text-white" onPress={handleClose} />
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
