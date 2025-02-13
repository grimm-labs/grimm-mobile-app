/* eslint-disable max-lines-per-function */
import { Mnemonic } from 'bdk-rn';
import { WordCount } from 'bdk-rn/lib/lib/enums';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';

import { ScreenSubtitle } from '@/components/screen-subtitle';
import { ScreenTitle } from '@/components/screen-title';
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
        setMnemonic((await new Mnemonic().create(WordCount.WORDS12)).asString());
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
      <View className="mx-4 h-full justify-between">
        <FocusAwareStatusBar />
        <View className="flex-1">
          <View>
            <ScreenTitle title="Seed phrase" />
            <View className="mb-4" />
            <ScreenSubtitle subtitle=" Write it down on a paper to keep it in a safe place." />
            <View className="mb-4" />
            <View>
              <View className="flex-row flex-wrap justify-around">
                {mnemonic?.split(' ').map((word, index) => (
                  <View key={index} className="mb-4 w-1/3 flex-row items-center px-1">
                    <View className="w-full flex-row items-center rounded-lg border border-gray-400 px-4 py-3">
                      <Text key={index} className="text-center text-base font-medium text-gray-600">
                        {showSeed ? `${index + 1}. ${word}` : '•••••••'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
              <View className="mt-4">
                <Checkbox.Root checked={isBackup} onChange={(value) => setIsBackup(value)} accessibilityLabel="I have backup my seed phrase" className="pb-2">
                  <Checkbox.Icon checked={isBackup} />
                  <Checkbox.Label text="I have backup my seed phrase" className="font-medium" />
                </Checkbox.Root>
                <View className="my-2" />
                <Checkbox.Root checked={isUnderstand} onChange={(value) => setIsUnderstand(value)} accessibilityLabel="I have backup my seed phrase" className="pb-2">
                  <Checkbox.Icon checked={isUnderstand} />
                  <Checkbox.Label text="I understand if I loose my recovery key, I won't be able to access my wallet." className="font-medium" />
                </Checkbox.Root>
              </View>
            </View>
          </View>
        </View>
        <View>
          <Button label={showSeed ? 'Hide Words' : 'Show Words'} fullWidth={true} variant="link" textClassName="text-base text-primary-600 font-medium" size="lg" onPress={() => setShowSeed(!showSeed)} />
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
            disabled={!(isUnderstand && isBackup && showSeed)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
