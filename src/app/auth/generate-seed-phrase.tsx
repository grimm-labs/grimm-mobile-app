/* eslint-disable max-lines-per-function */
import { Mnemonic } from 'bdk-rn';
import { WordCount } from 'bdk-rn/lib/lib/enums';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';

import { Button, FocusAwareStatusBar, Text, View } from '@/ui';

export default function GenerateSeedPhrase() {
  const router = useRouter();
  const [mnemonic, setMnemonic] = useState<string | undefined>(undefined);
  const [showSeed, setShowSeed] = useState(false);

  useEffect(() => {
    const initSeedPhrase = async () => {
      if (mnemonic === undefined) {
        setMnemonic(
          (await new Mnemonic().create(WordCount.WORDS12)).asString()
        );
      }
    };

    initSeedPhrase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView>
      <Stack.Screen
        options={{
          title: '',
          headerShown: true,
          headerShadowVisible: false,
        }}
      />
      <View className="flex h-full justify-between px-4">
        <FocusAwareStatusBar />
        <View className="flex-1">
          <View>
            <Text testID="otp-title" className="mb-4 text-2xl">
              Setup your secure seed phrase
            </Text>
            <Text
              testID="otp-description"
              className="mb-6 text-sm text-gray-600"
            >
              Save your secret recovery phrase. Write it down on a paper to keep
              it in a safe place. You'll asked to re-enter your secret recovery
              phrase in the next step.
            </Text>
            <View>
              <View className="flex-row flex-wrap justify-around">
                {mnemonic?.split(' ').map((word, index) => (
                  <View
                    key={index}
                    className="mb-8 w-1/2 flex-row items-center px-1"
                  >
                    <View className="w-full flex-row items-center rounded-lg border border-gray-300 bg-gray-200 px-2 py-3">
                      <View className="h-6 w-6 flex-row items-center justify-center rounded-lg bg-primary-600">
                        <Text className="text-base font-bold text-white">
                          {index + 1}
                        </Text>
                      </View>
                      <Text className="ml-2 text-base font-medium">
                        {showSeed ? word : '•••••••'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
        <View>
          <Button
            label={showSeed ? 'Hide Seed Phrase' : 'Show Seed Phrase'}
            fullWidth={true}
            variant="link"
            textClassName="text-base text-primary-600 font-medium"
            size="lg"
            onPress={() => setShowSeed(!showSeed)}
          />
          <Button
            label="Continue"
            onPress={() =>
              router.push({
                pathname: '/auth/seed-phrase-confirmation',
                params: { mnemonic },
              })
            }
            fullWidth={true}
            variant="secondary"
            textClassName="text-base text-white"
            size="lg"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
