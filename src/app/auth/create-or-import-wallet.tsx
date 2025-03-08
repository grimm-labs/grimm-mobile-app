import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, View } from 'react-native';

import { ScreenSubtitle } from '@/components/screen-subtitle';
import { ScreenTitle } from '@/components/screen-title';
import { colors, FocusAwareStatusBar, Pressable, Text } from '@/components/ui';

export default function CreateOrImportWallet() {
  const router = useRouter();
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
        <Pressable className="mb-4 flex flex-row items-center justify-between rounded-xl bg-neutral-100 px-3 py-6" onPress={() => router.push('/auth/wallet-preparation')}>
          <View className="flex flex-row items-center">
            <Ionicons name="add-circle-outline" size={28} />
            <Text className="ml-6 text-base font-medium">Create a new wallet</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
        </Pressable>
        <Pressable className="mb-4 flex flex-row items-center justify-between rounded-xl bg-neutral-100 px-3 py-6" onPress={() => router.push('/auth/import-wallet')}>
          <View className="flex flex-row items-center">
            <Ionicons name="cloud-download-outline" size={28} />
            <Text className="ml-6 text-base font-medium">Restore your wallet</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
        </Pressable>
        <View className="mb-6" />
        <Text className="text-base">
          By choosing one of the option, you agree to the <Text className="font-bold underline">Self-Custody Wallet Licensing and User Agrement.</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}
