import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native';

import { useSelectedBitcoinUnit } from '@/core/hooks/use-selected-bitcoin-unit';
import { colors, FocusAwareStatusBar, Pressable, Text, View } from '@/ui';

interface UnitOptionProps {
  title: string;
  description: string;
  isSelected: boolean;
  onPress: () => void;
}

const UnitOption: React.FC<UnitOptionProps> = ({ title, description, isSelected, onPress }) => (
  <Pressable onPress={onPress}>
    <View className="flex flex-row items-center justify-between border-b-[0.5px] border-gray-300 py-4">
      <View className="flex-1">
        <Text className="text-sm font-medium">{title}</Text>
        <Text className="text-xs text-gray-500">{description}</Text>
      </View>
      {isSelected && <Ionicons name="checkmark-outline" size={24} color={colors.success[600]} />}
    </View>
  </Pressable>
);

export default function UnitSwitcher() {
  const [selectedBitcoinUnit, setSelectedBitcoinUnit] = useSelectedBitcoinUnit();

  return (
    <SafeAreaView>
      <View className="flex h-full px-4">
        <Stack.Screen
          options={{
            title: 'Bitcoin Unit',
            headerShown: true,
            headerShadowVisible: false,
            headerBackTitleVisible: false,
          }}
        />
        <FocusAwareStatusBar />
        <View>
          <UnitOption title="Bitcoin (BTC)" description="Standard unit of Bitcoin, 1 BTC = 100,000,000 Satoshis" isSelected={selectedBitcoinUnit === 'BTC'} onPress={() => setSelectedBitcoinUnit('BTC')} />
          <UnitOption title="Satoshi (SAT)" description="Smallest Bitcoin unit, 1 SAT = 0.00000001 BTC" isSelected={selectedBitcoinUnit === 'SAT'} onPress={() => setSelectedBitcoinUnit('SAT')} />
        </View>
        <View className="mt-6">
          <Text className="text-sm text-gray-600">The Bitcoin unit determines how balances are displayed in the wallet.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
