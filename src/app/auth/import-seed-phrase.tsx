/* eslint-disable max-lines-per-function */
import { Stack, useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import { ScrollView, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { ScreenSubtitle } from '@/components/screen-subtitle';
import { ScreenTitle } from '@/components/screen-title';
import { Button, FocusAwareStatusBar, SafeAreaView, showErrorMessage, Text, View } from '@/components/ui';
import { AppContext } from '@/lib/context';
import { isMnemonicValid } from '@/lib/utils';

export default function ImportSeedPhrase() {
  const { setSeedPhrase, setIsSeedPhraseBackup } = useContext(AppContext);
  const [seedPhraseInput, setSeedPhraseInput] = useState('');
  const router = useRouter();

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
      showErrorMessage('Please enter a valid 12-word seed phrase.');
      return;
    }

    setSeedPhrase(seedPhraseInput.trim());
    setIsSeedPhraseBackup(true);
    router.push('/sync');
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
      return `✓ ${wordCount} words entered`;
    }

    return null;
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView>
        <View className="flex h-full justify-between px-2">
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

          <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
            <View className="mb-3">
              <ScreenTitle title="Recovery Phrase" />
              <View className="mb-3" />
              <ScreenSubtitle subtitle="Enter your 12 or 24-word recovery phrase to restore your Bitcoin wallet." />
            </View>

            <View className="mb-6">
              <TextInput
                value={seedPhraseInput}
                onChangeText={handleTextChange}
                placeholder="Enter your 12 or 24-word seed phrase separated by spaces"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className={`min-h-[120px] rounded-lg border-2 p-4 text-base ${seedPhraseInput.length > 0 ? 'border-primary-600' : 'border-gray-200 bg-white'} text-gray-900`}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                returnKeyType="done"
              />

              <View className="mt-2 flex-row items-center justify-between">
                <Text className={`text-sm font-semibold text-gray-500`}>{seedPhraseInput.trim() ? seedPhraseInput.trim().split(/\s+/).length : 0} / 12 words</Text>
                <Text className="font-semibold text-primary-600">{getValidationMessage(seedPhraseInput)}</Text>
              </View>
            </View>
          </ScrollView>

          <Button testID="login-button" disabled={!isFormValid} label="Import" fullWidth size="lg" variant="secondary" textClassName="text-base text-white" onPress={handleContinue} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
