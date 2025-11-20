/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable max-lines-per-function */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { showMessage } from 'react-native-flash-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { Button, Input, SafeAreaView, ScrollView, Text, View } from '@/components/ui';
import { AppContext } from '@/lib/context';

interface WordToVerify {
  position: number;
  word: string;
  userInput: string;
}

export default function SeedPhraseVerificationScreen() {
  const { seedPhrase, setIsSeedPhraseBackup } = useContext(AppContext);
  const router = useRouter();
  const { t } = useTranslation();

  const [wordsToVerify, setWordsToVerify] = useState<WordToVerify[]>([]);

  useEffect(() => {
    if (seedPhrase) {
      const words = seedPhrase.split(' ');
      const positions = new Set<number>();

      while (positions.size < 4) {
        const randomIndex = Math.floor(Math.random() * words.length);
        positions.add(randomIndex);
      }

      const selectedWords = Array.from(positions)
        .sort((a, b) => a - b)
        .map((index) => ({
          position: index + 1,
          word: words[index],
          userInput: '',
        }));

      setWordsToVerify(selectedWords);
    }
  }, [seedPhrase]);

  const handleInputChange = (index: number, value: string) => {
    const updated = [...wordsToVerify];
    updated[index].userInput = value.trim().toLowerCase();
    setWordsToVerify(updated);
  };

  const handleVerify = async () => {
    const allCorrect = wordsToVerify.every((item) => item.userInput === item.word.toLowerCase());

    if (allCorrect) {
      await setIsSeedPhraseBackup(true);
      router.dismissAll();
      router.replace('/');
    } else {
      showMessage({
        message: t('seedPhraseVerification.errorMessage'),
        type: 'danger',
        duration: 1500,
        icon: 'danger',
      });
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white">
        <Stack.Screen
          options={{
            headerTitleAlign: 'center',
            headerTitle: () => <HeaderTitle title={t('seedPhraseVerification.header')} />,
            headerShown: true,
            headerShadowVisible: false,
            headerLeft: HeaderLeft,
          }}
        />
        <View className="flex-1 px-6">
          <View className="mt-8 items-center">
            <View className="mb-4 rounded-full bg-blue-100 p-4">
              <Ionicons name="checkmark-done-outline" size={48} color="#3b82f6" />
            </View>
            <Text className="text-xl font-bold text-gray-900">{t('seedPhraseVerification.title')}</Text>
            <Text className="mt-3 text-center text-base leading-6 text-gray-600">{t('seedPhraseVerification.description')}</Text>
          </View>
          <ScrollView className="mt-8 flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <View className="space-y-4">
              {wordsToVerify.map((item, index) => (
                <View key={item.position} className="mb-4">
                  <Text className="mb-2 text-sm font-semibold text-gray-700">{t('seedPhraseVerification.wordLabel', { number: item.position })}</Text>
                  <Input placeholder={t('seedPhraseVerification.placeholder')} value={item.userInput} onChangeText={(value) => handleInputChange(index, value)} autoCapitalize="none" autoCorrect={false} />
                </View>
              ))}
            </View>
          </ScrollView>
          <View className="pb-4">
            <Button testID="verify-button" label={t('seedPhraseVerification.verifyButton')} fullWidth size="lg" variant="secondary" textClassName="text-base text-white" onPress={handleVerify} />
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
