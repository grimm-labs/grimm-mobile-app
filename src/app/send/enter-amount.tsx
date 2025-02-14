/* eslint-disable react-native/no-inline-styles */
/* eslint-disable max-lines-per-function */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Balance } from 'bdk-rn/lib/classes/Bindings';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';

import { WalletView } from '@/components/wallet-view';
import { Button, NumericVirtualKeyboard, Pressable, Text, View } from '@/ui';

export default function EnterBitcoinAmountScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'SAT'>('USD');
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [balance, _setBalance] = useState<Balance>(new Balance(0, 0, 0, 0, 0.3433));

  const handleContinue = () => {
    router.push('send/transaction-verification');
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
            headerBackTitleVisible: false,
          }}
        />
        <View className="my-2 flex h-48 items-center justify-center ">
          {/* Conteneur du montant */}
          <View className="w-4/5 px-4 py-6">
            <Text className="text-center text-base font-medium text-gray-600">Selected Currency({currency})</Text>
            <Pressable className="my-6" onPress={handleCurrencySwitch}>
              <Text className="text-center text-5xl font-bold text-gray-900" style={{ fontSize: 50 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.3}>
                {currency} {amount ? new Intl.NumberFormat('en-EN').format(Number(amount)) : '0'}
              </Text>
            </Pressable>
            <Text className="text-center text-base font-medium text-gray-600">0.00000000 BTC</Text>
          </View>
        </View>
        <View className="flex-1">
          <View>
            <Pressable onPress={handleCurrencySwitch} className="mb-4 flex-row items-center self-center ">
              <Text className="ml-2 text-sm font-medium text-gray-500">click on text to switch between USD and SAT</Text>
            </Pressable>

            <View className="my-4 flex-row items-center justify-between rounded-lg border border-neutral-200 bg-neutral-100 p-6">
              <Pressable onPress={() => handleSpeedSelection('slow')} className={`flex-row items-center rounded-full px-4 py-2 ${speed === 'slow' ? 'rounded-full bg-primary-600 text-white' : 'bg-white'}`}>
                <Ionicons name="timer-outline" size={20} color={speed === 'slow' ? 'white' : 'black'} />
                <Text className={`ml-2 text-base font-medium ${speed === 'slow' ? 'text-white' : 'text-black'}`}>Slow</Text>
              </Pressable>
              <Pressable onPress={() => handleSpeedSelection('normal')} className={`flex-row items-center rounded-full px-3 py-2 ${speed === 'normal' ? 'rounded-full bg-primary-600' : 'bg-white'}`}>
                <Ionicons name="speedometer-outline" size={20} color={speed === 'normal' ? 'white' : 'black'} />
                <Text className={`ml-3 text-base font-medium ${speed === 'normal' ? 'text-white' : 'text-black'}`}>Normal</Text>
              </Pressable>

              <Pressable onPress={() => handleSpeedSelection('fast')} className={`flex-row items-center rounded-full px-4 py-2 ${speed === 'fast' ? 'rounded-full bg-primary-600 text-white' : 'bg-white'}`}>
                <Ionicons name="rocket-outline" size={20} color={speed === 'fast' ? 'white' : 'black'} />
                <Text className={`ml-3 text-base font-medium ${speed === 'fast' ? 'text-white' : 'text-black'}`}>Fast</Text>
              </Pressable>
            </View>
          </View>
          <View className="flex-1 justify-end">
            <WalletView name="Bitcoin" symbol="BTC" type="On-chain" balance={balance} />
            <View className="my-4 flex-1">
              <NumericVirtualKeyboard
                onPress={(value) => {
                  if (value === -1) {
                    setAmount(amount.slice(0, -1));
                  } else if (value === -2) {
                    setAmount(`${amount}.0`);
                  } else {
                    setAmount(`${amount}${value}`);
                  }
                }}
                allowDotKey={true}
              />
            </View>
            <View className="">
              <Button testID="login-button" label="Continue" fullWidth={true} size="lg" variant="secondary" textClassName="text-base text-white" onPress={handleContinue} disabled={!(Number(amount.trim()) > 0)} />
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
