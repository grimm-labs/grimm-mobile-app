import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, View } from 'react-native';

import { ScreenSubtitle } from '@/components/screen-subtitle';
import { ScreenTitle } from '@/components/screen-title';
import { useSoftKeyboardEffect } from '@/core/keyboard';
import { FocusAwareStatusBar, Pressable, Text } from '@/ui';

export default function CreateOrImportWallet() {
  const router = useRouter();
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
        <ScreenTitle title="Let's set up your wallet" />
        <View className="mb-4" />
        <ScreenSubtitle subtitle="Your wallet supports top network like Bitcoin - So you can manage your bitcoin wallets all in one place." />
        <View className="mb-6" />
        <Pressable className="mb-4 flex flex-row items-center rounded-lg bg-neutral-100 p-4" onPress={() => router.push('/auth/generate-seed-phrase')}>
          <Ionicons name="add-circle-outline" size={28} />
          <Text className="ml-3 text-lg font-medium">Create a new wallet</Text>
        </Pressable>
        <Pressable className="mb-4 flex flex-row items-center rounded-lg bg-neutral-100 p-4" onPress={() => router.push('/auth/import-wallet')}>
          <Ionicons name="cloud-download-outline" size={28} />
          <Text className="ml-3 text-lg font-medium">Import an existing wallet</Text>
        </Pressable>
        <View className="mb-6" />
        <Text className="text-base">
          By choosing one of the option, you agree to the <Text className="font-bold underline">Self-Custody Wallet Licensing and User Agrement.</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}
