import { Stack, useRouter } from 'expo-router';
import React from 'react';

import { useSoftKeyboardEffect } from '@/core/keyboard';
import { ActivityIndicator, FocusAwareStatusBar, Text, View } from '@/ui';

export default function WalletPreparation() {
  const _router = useRouter();
  useSoftKeyboardEffect();

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerShown: false,
        }}
      />
      <FocusAwareStatusBar />
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="small" />
        <Text className="mt-2 text-sm font-medium">
          Preparing your wallet...
        </Text>
      </View>
    </>
  );
}
