/* eslint-disable react-native/no-inline-styles */
/* eslint-disable max-lines-per-function */
import { Stack, useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { ScreenSubtitle } from '@/components/screen-subtitle';
import { ScreenTitle } from '@/components/screen-title';
import { Button, FocusAwareStatusBar, Input, SafeAreaView, showErrorMessage, Text, View } from '@/components/ui';
import { AppContext } from '@/lib/context';
import { useStackScreenOptions } from '@/lib/stack-screen-options';
import { theme } from '@/lib/theme-classes';
import { isMnemonicValid } from '@/lib/utils';

export default function ImportSeedPhrase() {
  const { t } = useTranslation();
  const { setSeedPhrase, setIsSeedPhraseBackup } = useContext(AppContext);
  const [seedPhraseInput, setSeedPhraseInput] = useState('');
  const router = useRouter();
  const stackScreenOptions = useStackScreenOptions();

  const handleTextChange = (text: string) => {
    const cleanedText = text
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .replace(/\s+/g, ' ');
    setSeedPhraseInput(cleanedText);
  };

  const handleContinue = async () => {
    if (!seedPhraseInput.trim()) return;

    if ((await isMnemonicValid(seedPhraseInput.trim())) === false) {
      showErrorMessage(t('importSeed.error'));
      return;
    }

    await setSeedPhrase(seedPhraseInput.trim());
    await setIsSeedPhraseBackup(true);
    router.dismissAll();
    router.replace('/');
  };

  const isFormValid = seedPhraseInput.trim().length > 0;

  const countSeedPhraseWords = (phrase: string): number => {
    return phrase.trim() ? phrase.trim().split(/\s+/).length : 0;
  };

  const isValidWordCount = (wordCount: number): boolean => {
    return wordCount === 12 || wordCount === 24;
  };

  const getValidationMessage = (phrase: string): string | null => {
    const wordCount = countSeedPhraseWords(phrase);

    if (isValidWordCount(wordCount)) {
      return t('importSeed.validCount', { count: wordCount });
    }

    return null;
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView className={`flex-1 ${theme.screen}`}>
        <View className="flex h-full justify-between px-2">
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

          <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
            <View className="mb-3">
              <ScreenTitle title={t('importSeed.title')} />
              <View className="mb-3" />
              <ScreenSubtitle subtitle={t('importSeed.subtitle')} />
            </View>

            <View className="mb-6">
              <Input
                value={seedPhraseInput}
                onChangeText={handleTextChange}
                placeholder={t('importSeed.placeholder')}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                returnKeyType="done"
                style={{ minHeight: 120 }}
              />

              <View className="mt-2 flex-row items-center justify-between">
                <Text className={`text-sm font-semibold ${theme.textMuted}`}>
                  {seedPhraseInput.trim() ? seedPhraseInput.trim().split(/\s+/).length : 0} / 12 {t('importSeed.words')}
                </Text>
                <Text className="font-semibold text-primary-600 dark:text-primary-400">{getValidationMessage(seedPhraseInput)}</Text>
              </View>
            </View>
          </ScrollView>

          <View className="px-2 pb-4">
            <Button testID="login-button" disabled={!isFormValid} label={t('common.import')} fullWidth size="lg" variant="secondary" onPress={handleContinue} />
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
