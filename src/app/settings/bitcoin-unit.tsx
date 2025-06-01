import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import React, { useContext } from 'react';
import { SafeAreaView } from 'react-native';

import { HeaderLeft } from '@/components/back-button';
import { colors, FocusAwareStatusBar, Pressable, Text, View } from '@/components/ui';
import { AppContext } from '@/lib/context';
import { BitcoinUnit } from '@/types/enum';

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
      {isSelected && <Ionicons name="checkmark-circle" size={24} color={colors.primary[600]} />}
    </View>
  </Pressable>
);

export default function BitcoinUnitScreen() {
  const { bitcoinUnit, setBitcoinUnit } = useContext(AppContext);

  return (
    <SafeAreaView>
      <View className="flex h-full px-4">
        <Stack.Screen
          options={{
            headerTitleAlign: 'center',
            title: 'Bitcoin Unit',
            headerShown: true,
            headerShadowVisible: false,
            headerLeft: HeaderLeft,
          }}
        />
        <FocusAwareStatusBar style="dark" />
        <View>
          <UnitOption title="Bitcoin (BTC)" description="Standard unit of Bitcoin, 1 BTC = 100,000,000 Satoshis" isSelected={bitcoinUnit === BitcoinUnit.Btc} onPress={() => setBitcoinUnit(BitcoinUnit.Btc)} />
          <UnitOption title="Satoshi (SATS)" description="Smallest Bitcoin unit, 1 SAT = 0.00000001 BTC" isSelected={bitcoinUnit === BitcoinUnit.Sats} onPress={() => setBitcoinUnit(BitcoinUnit.Sats)} />
        </View>
        <View className="mt-6">
          <Text className="text-sm text-gray-500">The Bitcoin unit determines how balances are displayed in the wallet.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
