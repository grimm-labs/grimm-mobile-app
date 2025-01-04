/* eslint-disable max-lines-per-function */
import { Mnemonic } from 'bdk-rn';
import { WordCount } from 'bdk-rn/lib/lib/enums';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';

import { Button, Checkbox, FocusAwareStatusBar, Text, View } from '@/ui';

export default function GenerateSeedPhrase() {
  const router = useRouter();
  const [mnemonic, setMnemonic] = useState<string | undefined>(undefined);
  const [showSeed, setShowSeed] = useState(false);
  const [isBackup, setIsBackup] = React.useState(false);
  const [isUnderstand, setIsUnderstand] = React.useState(false);

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
      <View className="h-full flex-1 justify-between px-4 pt-6">
        <FocusAwareStatusBar />
        <View className="flex-1">
          <View>
            <Text testID="otp-title" className="mb-4 text-4xl">
              Seed phrase
            </Text>
            <Text
              testID="otp-description"
              className="mb-6 text-sm text-gray-600"
            >
              Save your secret recovery phrase. Write it down on a paper to keep
              it in a safe place.
            </Text>
            <View>
              <View className="flex-row flex-wrap justify-around">
                {mnemonic?.split(' ').map((word, index) => (
                  <View
                    key={index}
                    className="mb-8 w-1/3 flex-row items-center px-1"
                  >
                    <View className="w-full flex-row items-center rounded-lg border border-gray-400 px-4 py-3">
                      <Text
                        key={index}
                        className="text-center text-base font-medium text-gray-700"
                      >
                        {showSeed ? `${index + 1}. ${word}` : '•••••••'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
              <View>
                <Checkbox.Root
                  checked={isBackup}
                  onChange={(value) => setIsBackup(value)}
                  accessibilityLabel="I have backup my seed phrase"
                  className="pb-2"
                >
                  <Checkbox.Icon checked={isBackup} />
                  <Checkbox.Label text="I have backup my seed phrase" />
                </Checkbox.Root>
                <View className="my-2" />
                <Checkbox.Root
                  checked={isUnderstand}
                  onChange={(value) => setIsUnderstand(value)}
                  accessibilityLabel="I have backup my seed phrase"
                  className="pb-2"
                >
                  <Checkbox.Icon checked={isUnderstand} />
                  <Checkbox.Label text="I understand if I loose my recovery key, I won't be able to access my wallet." />
                </Checkbox.Root>
              </View>
            </View>
          </View>
        </View>
        <View>
          <Button
            label={showSeed ? 'Hide Words' : 'Show Words'}
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
            disabled={!(isUnderstand && isBackup)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
