import { Stack } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native';

import { FocusAwareStatusBar, Text, View } from '@/components/ui';

export default function WalletDetailsScreen() {
  return (
    <SafeAreaView>
      <View className="flex h-full">
        <Stack.Screen
          options={{
            title: 'Bitcoin',
            headerShown: true,
            headerShadowVisible: false,
          }}
        />
        <FocusAwareStatusBar />
        <View className="mb-6 flex-1">
          <View className="flex-1 items-center justify-center">
            <Text className="text-base text-gray-500">Wallet details</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
