/* eslint-disable max-lines-per-function */
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, View } from 'react-native';

import SlideToConfirm from '@/components/slide-to-confirm';
import { Text } from '@/ui';

export default function TransactionVerificationScreen() {
  const [isLoading, setIsLoading] = useState(false);

  const handleTransactionSend = () => {
    setIsLoading(true);

    setTimeout(() => {
      Alert.alert('Success', 'Transaction sent successfully!');
    }, 3000);
  };

  return (
    <SafeAreaView className="flex h-full bg-white">
      <View className="h-full flex-1 px-4">
        <Stack.Screen
          options={{
            title: 'Confirm transaction',
            headerShown: true,
            headerShadowVisible: false,
            headerBackTitleVisible: false,
          }}
        />
        <View className="my-6">
          <View className="mb-8">
            <Text className="mb-2 text-xl font-extrabold">Destination</Text>
            <View className="rounded-xl bg-gray-200 px-3 py-5">
              <Text className="text-center text-base font-medium text-gray-800">
                1Lbcfr7sAHTD9CHTD9CgdQo3HTMTkV8gdQo3HTMTkV8LK4ZnX71
              </Text>
            </View>
          </View>
          <View className="mb-8">
            <Text className="mb-2 text-xl font-extrabold">From</Text>
            <View className="flex flex-row items-center rounded-xl bg-gray-200 p-3">
              <View className="mr-4 rounded-lg bg-primary-600 ">
                <Text className="p-2 font-extrabold text-white">BTC</Text>
              </View>
              <View>
                <Text className="text-xl font-bold text-gray-800">
                  $2,000.50
                </Text>
                <Text className="text-lg font-medium text-gray-800">
                  1,400,294 sats
                </Text>
              </View>
            </View>
          </View>
          <View className="mb-8">
            <Text className="mb-2 text-xl font-extrabold">Amount</Text>
            <View className="rounded-xl bg-gray-200 p-3">
              <Text className="text-xl font-bold text-gray-800">$2000.50</Text>
              <Text className="text-lg font-medium text-gray-800">
                1400 sats
              </Text>
            </View>
          </View>
          <View>
            <Text className="mb-2 text-xl font-extrabold">Fee</Text>
            <View className="rounded-xl bg-gray-200 p-3">
              <Text className="text-xl font-bold text-gray-800">
                $0.50
                <Text className="text-xl font-medium text-gray-800">
                  {' '}
                  (1400 sats)
                </Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Slider pour envoyer */}
        <View className="flex-1 justify-end">
          {isLoading ? (
            <View className="flex h-[60px] items-center justify-center rounded-full bg-gray-200">
              <View className="flex flex-row">
                <Text className="mr-2 text-base text-gray-500">Confirming</Text>
                <ActivityIndicator size="small" color="gray" />
              </View>
            </View>
          ) : (
            <View className="flex h-[60px] justify-center">
              <SlideToConfirm onConfirm={handleTransactionSend} />
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
