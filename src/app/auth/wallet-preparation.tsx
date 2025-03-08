/* eslint-disable react-native/no-inline-styles */
import { Mnemonic } from 'bdk-rn';
import { WordCount } from 'bdk-rn/lib/lib/enums';
import { Stack, useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, SafeAreaView } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { Button, FocusAwareStatusBar, showError, Text, View } from '@/components/ui';
import { AppContext } from '@/lib/context';

export default function WalletPreparation() {
  const router = useRouter();
  const animation = useRef<LottieView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setSeedPhrase, selectedBitcoinNetwork } = useContext(AppContext);

  const handleContinue = () => {
    router.replace('/');
  };

  useEffect(() => {
    const init = async () => {
      const newMnemonic = (await new Mnemonic().create(WordCount.WORDS12)).asString();
      if (newMnemonic && newMnemonic?.split(' ').length === 12) {
        try {
          setSeedPhrase(newMnemonic);
        } catch (error: any) {
          showError(error.message);
        } finally {
          setIsLoading(false);
        }
      }
    };
    init();
  }, [selectedBitcoinNetwork, setSeedPhrase]);

  return (
    <SafeAreaView>
      <View className="flex h-full px-4">
        <Stack.Screen
          options={{
            headerShown: false,
            headerShadowVisible: false,
          }}
        />
        <FocusAwareStatusBar />
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 items-center justify-center">
            {isLoading ? (
              <View>
                <ActivityIndicator size="large" color="#FFA500" className="mb-4" />
                <Text className="text-base text-gray-600">Configuration of the current wallet...</Text>
              </View>
            ) : (
              <>
                <LottieView
                  autoPlay
                  loop={false}
                  ref={animation}
                  style={{
                    width: 250,
                    height: 250,
                    backgroundColor: 'transparent',
                  }}
                  source={require('@/assets/lotties/success.json')}
                />
                <Text className="text-center text-base text-gray-600">Your Bitcoin wallet has been initialized</Text>
              </>
            )}
          </View>
          {!isLoading && (
            <View className="flex">
              <Button label="Let's Go" fullWidth={true} size="lg" variant="secondary" textClassName="text-base text-white" onPress={handleContinue} className="mt-6" />
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
