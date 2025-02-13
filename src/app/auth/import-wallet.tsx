import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, View } from 'react-native';

import { ImportSeedScreenForm } from '@/components/forms/import-wallet-form';
import { ScreenSubtitle } from '@/components/screen-subtitle';
import { ScreenTitle } from '@/components/screen-title';
import { useSoftKeyboardEffect } from '@/core/keyboard';
import { FocusAwareStatusBar } from '@/ui';

export default function ImportWallet() {
  const _router = useRouter();
  useSoftKeyboardEffect();

  return (
    <SafeAreaView>
      <View className="flex h-full px-4">
        <Stack.Screen
          options={{
            title: '',
            headerShown: true,
            headerShadowVisible: false,
          }}
        />
        <FocusAwareStatusBar />
        <ScreenTitle title="Import an existing wallet" />
        <View className="mb-4" />
        <ScreenSubtitle subtitle="Enter your 12 recovery words below to restore your wallet." />
        <View className="mb-4" />
        <ImportSeedScreenForm />
      </View>
    </SafeAreaView>
  );
}
