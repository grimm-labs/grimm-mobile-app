/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable max-lines-per-function */
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';

import { useSeedPhrase } from '@/core/hooks/use-seed-phrase';
import { useSoftKeyboardEffect } from '@/core/keyboard';
import {
  Button,
  FocusAwareStatusBar,
  showErrorMessage,
  Text,
  TouchableOpacity,
  View,
} from '@/ui';

type SearchParams = {
  mnemonic: string;
};

export default function SeedPhraseConfirmation() {
  const { mnemonic } = useLocalSearchParams<SearchParams>();
  const [shuffledMnemonic, setShuffledMnemonic] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const router = useRouter();
  const [_seedPhrase, setSeedPhrase] = useSeedPhrase();

  useSoftKeyboardEffect();

  useEffect(() => {
    const shuffled = mnemonic?.split(' ').sort(() => 0.5 - Math.random());
    if (shuffled) {
      setShuffledMnemonic(shuffled);
    }
  }, []);

  const handleWordPress = (word: string) => {
    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter((w) => w !== word));
      setShuffledMnemonic([...shuffledMnemonic, word]);
    } else if (selectedWords.length < 12) {
      setSelectedWords([...selectedWords, word]);
      setShuffledMnemonic(shuffledMnemonic.filter((w) => w !== word));
    }
  };

  const verifyMnemonic = () => {
    const mnemonicAsArray = mnemonic?.split(' ');
    if (mnemonicAsArray && selectedWords.length === 12) {
      const isCorrect = selectedWords.every(
        (word, index) => word === mnemonicAsArray[index]
      );
      if (isCorrect) {
        setSeedPhrase(mnemonic);
        router.push('/auth/wallet-preparation');
      } else {
        showErrorMessage(
          'The words are not in the same order as they were generated'
        );
      }
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerShown: true,
          headerShadowVisible: false,
        }}
      />
      <FocusAwareStatusBar />
      <View className="mb-6 flex-1 justify-between px-4 pt-6">
        <View>
          <Text testID="otp-title" className="mb-4 text-4xl">
            Seed phrase confirmation
          </Text>
          <Text testID="otp-description" className="mb-6 text-sm text-gray-600">
            Select each word in the order it was presented to you.
          </Text>
          <View>
            <View className="mb-4 flex flex-row flex-wrap justify-evenly rounded border-[1.5px] border-dashed border-gray-300 p-2">
              {selectedWords.map((word, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleWordPress(word)}
                  className="m-2 rounded-full bg-primary-700 px-5 py-3"
                >
                  <Text className="text-sm font-medium text-white">
                    {index + 1}. {word}
                  </Text>
                </TouchableOpacity>
              ))}
              {selectedWords.length === 0 ? (
                <View className="my-4 w-full items-center justify-center">
                  <Text className="text-sm text-gray-600">
                    Words will be displayed here in order
                  </Text>
                </View>
              ) : undefined}
            </View>
            <View className="mb-4 flex flex-row flex-wrap justify-evenly">
              {shuffledMnemonic.map((word, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleWordPress(word)}
                  className="my-2 mr-2 rounded-full border border-primary-200 px-5 py-3"
                >
                  <Text className="ont-medium text-sm text-black">{word}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        <Button
          label="Confirm"
          onPress={verifyMnemonic}
          fullWidth={true}
          variant="secondary"
          textClassName="text-base text-white font-medium"
          size="lg"
          disabled={selectedWords.length !== 12}
        />
      </View>
    </>
  );
}
