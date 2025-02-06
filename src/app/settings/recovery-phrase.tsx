import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView } from 'react-native';

import { useSeedPhrase } from '@/core/hooks/use-seed-phrase';
import { Button, showSuccessMessage, Text, View } from '@/ui';

export default function SeedPhraseScreen() {
  const router = useRouter();
  const [seedPhrase, _setSeedPhrase] = useSeedPhrase();

  const handleClose = () => {
    router.push('(app)');
  };

  const copyToClipboard = () => {
    showSuccessMessage('Seed phrase copied to clipboard');
  };

  return (
    <SafeAreaView>
      <View className="flex h-full justify-between px-4">
        <Stack.Screen
          options={{
            title: 'Seed Phrase',
            headerShown: true,
            headerShadowVisible: false,
            headerBackTitleVisible: false,
          }}
        />

        {/* Header */}
        <View className="mt-6 items-center">
          <Ionicons name="eye-off-outline" size={64} color="gray" />
          <Text className="mt-6 text-center text-lg font-medium">For Your Eyes Only</Text>
          <Text className="mt-2 text-center text-sm text-gray-600">Never share the recovery phrase. Anyone with these words has full access to your wallet.</Text>
        </View>

        {/* Seed Phrase Display */}
        <ScrollView className="mt-8 flex-1">
          <View className="flex flex-row flex-wrap justify-center">
            {seedPhrase?.split(' ').map((word, index) => (
              <Text key={index} className="m-2 rounded-lg border border-gray-400 px-4 py-2 text-center text-sm font-medium text-gray-700">
                {index + 1}. {word}
              </Text>
            ))}
          </View>
        </ScrollView>

        <View>
          <Button testID="close-button" label="Copy to clipboard" fullWidth={true} size="lg" variant="outline" textClassName="text-base" onPress={copyToClipboard} />
          <Button testID="close-button" label="Close" fullWidth={true} size="lg" variant="destructive" textClassName="text-base text-white" onPress={handleClose} />
        </View>
      </View>
    </SafeAreaView>
  );
}
