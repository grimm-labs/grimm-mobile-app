/* eslint-disable max-lines-per-function */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView } from 'react-native';

import { Pressable, Text, View } from '@/ui';

export default function SeedPhraseScreen() {
  const seedPhrase = [
    'apple',
    'banana',
    'cherry',
    'date',
    'elderberry',
    'fig',
    'grape',
    'honeydew',
    'kiwi',
    'lemon',
    'mango',
    'nectarine',
  ]; // Example seed phrase words

  const handleClose = () => {
    console.log('Close pressed');
  };

  return (
    <SafeAreaView>
      <View className="flex h-full justify-between px-4">
        <Stack.Screen
          options={{
            title: 'Seed Phrase',
            headerShown: true,
            headerShadowVisible: false,
          }}
        />

        {/* Header */}
        <View className="mt-10 items-center">
          <Ionicons name="eye-off-outline" size={48} color="black" />
          <Text className="mt-4 text-center text-lg font-bold">
            For Your Eyes Only
          </Text>
          <Text className="mt-2 text-center text-sm text-gray-600">
            Never share the recovery phrase. Anyone with these words has full
            access to your wallet.
          </Text>
        </View>

        {/* Seed Phrase Display */}
        <ScrollView className="mt-8 flex-1">
          <View className="flex flex-row flex-wrap justify-center">
            {seedPhrase.map((word, index) => (
              <View
                key={index}
                className="m-2 w-[30%] rounded bg-gray-100 px-4 py-3 shadow-sm"
              >
                <Text className="text-center text-sm font-medium text-gray-700">
                  {index + 1}. {word}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Close Button */}
        <View className="mb-6">
          <Pressable
            onPress={handleClose}
            className="w-full items-center justify-center rounded bg-red-500 py-4"
          >
            <Text className="text-sm font-medium text-white">Close</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
