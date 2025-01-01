/* eslint-disable max-lines-per-function */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TextInput,
} from 'react-native';

import { Pressable, Text, View } from '@/ui';

export default function EnterBitcoinAddressScreen() {
  const router = useRouter();
  const [address, setAddress] = useState('');

  const handleScanQRCode = () => {
    console.log('Scan QR Code pressed');
    // Logic to open QR scanner
  };

  const handlePasteAddress = () => {
    console.log('Paste address pressed');
    // Logic to paste address (mock example)
    setAddress('bc1qexamplepasteaddress123456');
  };

  const handleContinue = () => {
    console.log('Continue pressed with address:', address);
    router.push('send/enter-amount');
    // Logic to proceed with the entered address
  };

  return (
    <SafeAreaView className="flex h-full">
      <View className="flex h-full justify-between px-4">
        <Stack.Screen
          options={{
            title: 'Send Bitcoin',
            headerShown: true,
            headerShadowVisible: false,
          }}
        />

        {/* Header */}
        <View className="mt-4">
          <Text className="text-left text-lg font-bold">
            Enter Bitcoin Address
          </Text>
          <Text className="my-2 text-left text-sm text-gray-600">
            Provide a valid Bitcoin address to send funds.
          </Text>
        </View>

        {/* Input Section */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="mt-8 flex-1"
        >
          <View className="mb-4">
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Enter or paste address here"
              className="w-full rounded border border-gray-300 bg-gray-100 px-4 py-3 text-sm"
            />
          </View>

          <View className="mt-4 flex flex-row justify-between">
            {/* Scan QR Code Button */}
            <Pressable
              onPress={handleScanQRCode}
              className="flex flex-row items-center rounded-full border border-gray-300 px-4 py-2"
            >
              <Ionicons name="qr-code-outline" size={14} color="black" />
              <Text className="ml-2 text-sm font-medium text-gray-800">
                Scan QR Code
              </Text>
            </Pressable>

            {/* Paste Address Button */}
            <Pressable
              onPress={handlePasteAddress}
              className="flex flex-row items-center rounded-full border border-gray-300 px-4 py-2"
            >
              <Ionicons name="clipboard-outline" size={14} color="black" />
              <Text className="ml-2 text-sm font-medium text-gray-800">
                Paste Address
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>

        {/* Continue Button */}
        <View className="mb-6">
          <Pressable
            onPress={handleContinue}
            disabled={!address.trim()}
            className={`w-full items-center justify-center rounded border py-4 ${
              address.trim() ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            <Text className="text-sm font-medium">Continue</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
