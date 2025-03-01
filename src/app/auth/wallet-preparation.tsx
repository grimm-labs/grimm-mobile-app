/* eslint-disable max-lines-per-function */
/* eslint-disable react-native/no-inline-styles */
import type { Network } from 'bdk-rn/lib/lib/enums';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, SafeAreaView } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { createWallet, getBlockchain, getBlockchainConfig, useSeedPhrase, useSelectedBitcoinNetwork } from '@/core';
import { Button, FocusAwareStatusBar, showError, Text, View } from '@/ui';

type SearchParams = {
  mnemonic: string;
};

export default function TransactionFinalStatus() {
  const router = useRouter();
  const { mnemonic } = useLocalSearchParams<SearchParams>();
  const animation = useRef<LottieView>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [seedPhrase, setSeedPhrase] = useSeedPhrase();
  const [selectedBitcoinNetwork, _setSelectedBitcoinNetwork] = useSelectedBitcoinNetwork();

  const handleContinue = () => {
    router.replace('/');
    // router.push('./(app)/_layout');
  };
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (mnemonic && mnemonic?.split(' ').length === 12) {
        try {
          setSeedPhrase(mnemonic);
          const wallet = await createWallet(mnemonic, selectedBitcoinNetwork as Network);
          const blockchain = await getBlockchain(getBlockchainConfig());
          await wallet.sync(blockchain);
        } catch (error: any) {
          showError(error.message);
        }
      }

      setIsLoading(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [mnemonic, seedPhrase, selectedBitcoinNetwork, setSeedPhrase]);

  return (
    <SafeAreaView>
      <View className="flex h-full px-4">
        <Stack.Screen
          options={{
            headerShown: false,
            headerShadowVisible: false,
            headerBackTitleVisible: false,
          }}
        />
        <FocusAwareStatusBar />
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 items-center justify-center">
            {isLoading ? (
              <View>
                <ActivityIndicator size="large" color="#FFA500" className="mb-4" />
                <Text className="text-base font-semibold text-gray-600">Configuration of the current wallet...</Text>
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
                <Text className="mt-2 text-center text-base font-semibold text-gray-600">Your Bitcoin wallet has been initialized</Text>
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
