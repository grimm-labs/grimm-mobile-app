/* eslint-disable max-lines-per-function */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';

import { NumericVirtualKeyboard, Pressable, Text, View } from '@/ui';

export default function EnterBitcoinAmountScreen() {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'SAT'>('USD');
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');

  const handleContinue = () => {
    console.log('Continue pressed with:', { amount, currency, speed });
    // Logic to proceed with the entered amount
  };

  const handleCurrencySwitch = () => {
    setCurrency((prev) => (prev === 'USD' ? 'SAT' : 'USD'));
  };

  const handleSpeedSelection = (selectedSpeed: 'slow' | 'normal' | 'fast') => {
    setSpeed(selectedSpeed);
  };

  return (
    <SafeAreaView className="flex h-full">
      <View className="h-full flex-1 justify-between px-4">
        <Stack.Screen
          options={{
            title: 'Amount',
            headerShown: true,
            headerShadowVisible: false,
          }}
        />
        <View className="my-2 flex h-48 items-center justify-center border">
          {/* Conteneur du montant */}
          <View className="w-4/5 px-4 py-6">
            <Text className="text-center text-sm font-medium text-gray-600">
              Selected Currency({currency})
            </Text>
            <Pressable className="my-6" onPress={handleCurrencySwitch}>
              <Text
                className="text-center text-6xl font-bold text-gray-900"
                style={{ fontSize: 50 }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.3}
              >
                {currency}{' '}
                {amount
                  ? new Intl.NumberFormat('en-EN').format(Number(amount))
                  : '0'}
              </Text>
            </Pressable>
            <Text className="text-center text-xl font-medium text-gray-600">
              0.00000000 BTC
            </Text>
          </View>
        </View>
        <View className="flex-1 border">
          <Pressable
            onPress={handleCurrencySwitch}
            className="mb-4 flex-row items-center self-center border"
          >
            <Text className="ml-2 text-sm font-medium text-gray-500">
              click on text to switch between USD and SAT
            </Text>
          </Pressable>

          <View className="flex-row items-center justify-between border py-2">
            <Pressable
              onPress={() => handleSpeedSelection('slow')}
              className={`flex-row items-center rounded px-4 py-2 ${
                speed === 'slow'
                  ? 'rounded-full bg-primary-600 text-white'
                  : 'bg-white'
              }`}
            >
              <Ionicons
                name="timer-outline"
                size={14}
                color={speed === 'slow' ? 'white' : 'black'}
              />
              <Text
                className={`ml-2 text-sm font-semibold ${
                  speed === 'slow' ? 'text-white' : 'text-black'
                }`}
              >
                Slow
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleSpeedSelection('normal')}
              className={`flex-row items-center rounded px-3 py-2 ${
                speed === 'normal' ? 'rounded-full bg-primary-600' : 'bg-white'
              }`}
            >
              <Ionicons
                name="speedometer-outline"
                size={14}
                color={speed === 'normal' ? 'white' : 'black'}
              />
              <Text
                className={`ml-2 text-sm font-semibold ${
                  speed === 'normal' ? 'text-white' : 'text-black'
                }`}
              >
                Normal
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleSpeedSelection('fast')}
              className={`flex-row items-center rounded px-4 py-2 ${
                speed === 'fast'
                  ? 'rounded-full bg-primary-600 text-white'
                  : 'bg-white'
              }`}
            >
              <Ionicons
                name="rocket-outline"
                size={14}
                color={speed === 'fast' ? 'white' : 'black'}
              />
              <Text
                className={`ml-2 text-sm font-semibold ${
                  speed === 'fast' ? 'text-white' : 'text-black'
                }`}
              >
                Fast
              </Text>
            </Pressable>
          </View>
          <View className="flex-1 border">
            <NumericVirtualKeyboard
              onPress={(value) => {
                if (value === -1) {
                  setAmount(amount.slice(0, -1));
                } else {
                  setAmount(`${amount}${value}`);
                }
              }}
            />
            {/* Continue Button */}
            <View className=" mb-6 border">
              <Pressable
                onPress={handleContinue}
                disabled={!amount.trim()}
                className={`w-full items-center justify-center rounded-full py-4 ${
                  amount.trim() ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <Text className="text-base font-medium text-white">
                  Continue
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
