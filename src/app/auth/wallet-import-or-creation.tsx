/* eslint-disable max-lines-per-function */
import { FontAwesome } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';

import { useSoftKeyboardEffect } from '@/core/keyboard';
import { FocusAwareStatusBar, Pressable, Text, View } from '@/ui';

export default function WalletImportOrCreation() {
  const router = useRouter();
  useSoftKeyboardEffect();

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerShown: true,
          headerShadowVisible: false,
          headerRight: () => (
            <Pressable
              testID="need-help-button"
              onPress={() => {
                router.push('need-help');
              }}
            >
              <Text className="text-base font-medium text-primary-600">
                Need help?
              </Text>
            </Pressable>
          ),
        }}
      />
      <FocusAwareStatusBar />
      <View className="flex-1 justify-between px-4 pb-4">
        <View>
          <Text testID="wallet-title" className="mb-4 text-2xl">
            Create your wallet
          </Text>
          <Text
            testID="wallet-description"
            className="mb-6 text-sm text-gray-700"
          >
            Manage your digital assets with ease. Create a new wallet or import
            an existing one to get started.
          </Text>
          <Pressable
            className="mb-4 flex-row items-center justify-between rounded-lg bg-gray-200 px-4 py-6"
            style={{ cursor: 'pointer', backgroundColor: '#325ffa' }}
            onPress={() => router.push('/auth/generate-seed-phrase')}
          >
            <View className="flex flex-row items-center justify-around">
              <View className="mx-2">
                <FontAwesome name="file-text" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="pl-4 text-base font-medium text-white">
                  Create a new wallet
                </Text>
                <Text className="pl-4 text-xs text-white">
                  Set up a new, secure wallet with ease. Safeguard your assets
                  and start transacting today.
                </Text>
              </View>
              <View className="mx-2">
                <FontAwesome name="chevron-right" size={16} color="white" />
              </View>
            </View>
          </Pressable>
          <Pressable
            className="flex-row items-center justify-between rounded-lg bg-gray-200 px-4 py-6"
            style={{ backgroundColor: '#cb6d3f' }}
            onPress={() => router.push('/auth/wallet-import')}
          >
            <View className="flex flex-row items-center justify-around">
              <View className="mx-2">
                <FontAwesome name="download" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="pl-4 text-base font-medium text-white">
                  Import an existing wallet
                </Text>
                <Text className="pl-4 text-xs text-white">
                  Easily restore your existing wallet. Regain access to your
                  funds and transaction history in seconds.
                </Text>
              </View>
              <View className="mx-2">
                <FontAwesome name="chevron-right" size={16} color="white" />
              </View>
            </View>
          </Pressable>
        </View>
      </View>
    </>
  );
}
