import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native';

import { useSelectedFiatCurrency } from '@/core';
import { FocusAwareStatusBar, Pressable, Text, View } from '@/ui';

interface CurrencyOptionProps {
  currency: string;
  description: string;
  isSelected: boolean;
  onPress: () => void;
}

const CurrencyOption: React.FC<CurrencyOptionProps> = ({ currency, description, isSelected, onPress }) => (
  <Pressable onPress={onPress}>
    <View className="flex flex-row items-center justify-between border-b-[0.5px] border-gray-300 py-4">
      <View className="flex-1">
        <Text className="text-sm font-medium">{currency}</Text>
        <Text className="text-xs text-gray-500">{description}</Text>
      </View>
      {isSelected && <Ionicons name="checkmark-outline" size={24} color="green" />}
    </View>
  </Pressable>
);

export default function CurrencySelector() {
  const [selectedFiatCurrency, setSelectedFiatCurrency] = useSelectedFiatCurrency();

  const currencies = [
    { code: 'XAF', description: 'Central African CFA Franc' },
    { code: 'XOF', description: 'West African CFA Franc' },
    { code: 'KES', description: 'Kenyan Shilling' },
  ];

  return (
    <SafeAreaView>
      <View className="flex h-full px-4">
        <Stack.Screen
          options={{
            title: 'Currency Selector',
            headerShown: true,
            headerShadowVisible: false,
            headerBackTitleVisible: false,
          }}
        />
        <FocusAwareStatusBar />
        <View className="mt-6">
          {currencies.map(({ code, description }) => (
            <CurrencyOption key={code} currency={code} description={description} isSelected={selectedFiatCurrency === code} onPress={() => setSelectedFiatCurrency(code)} />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
