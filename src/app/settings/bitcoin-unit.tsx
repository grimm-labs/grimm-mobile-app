/* eslint-disable react-native/no-inline-styles */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import React, { useCallback, useContext, useMemo } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { colors, FocusAwareStatusBar, Pressable, SafeAreaView, Text, View } from '@/components/ui';
import { AppContext } from '@/lib/context';
import { BitcoinUnit } from '@/types/enum';

interface UnitOptionProps {
  title: string;
  description: string;
  isSelected: boolean;
  onPress: () => void;
}

const UnitOption = React.memo<UnitOptionProps>(({ title, description, isSelected, onPress }) => (
  <Pressable onPress={onPress} style={{ opacity: 1 }}>
    <View className="flex min-h-[72px] flex-row items-center justify-between border-b-[0.5px] border-gray-300 px-2 py-4">
      <View className="flex-1 pr-4">
        <Text className="mb-1 text-sm font-medium text-gray-900">{title}</Text>
        <Text className="text-xs leading-4 text-gray-500">{description}</Text>
      </View>
      <View className="size-6 shrink-0 items-center justify-center">{isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.primary[600]} />}</View>
    </View>
  </Pressable>
));

UnitOption.displayName = 'UnitOption';

const UNIT_OPTIONS_DATA = [
  {
    key: 'btc',
    unit: BitcoinUnit.Btc,
    title: 'Bitcoin (BTC)',
    description: 'Standard unit of Bitcoin, 1 BTC = 100,000,000 Satoshis',
  },
  {
    key: 'sats',
    unit: BitcoinUnit.Sats,
    title: 'Satoshi (SATS)',
    description: 'Smallest Bitcoin unit, 1 SAT = 0.00000001 BTC',
  },
] as const;

export default function BitcoinUnitScreen() {
  const { bitcoinUnit, setBitcoinUnit } = useContext(AppContext);

  const handleBtcPress = useCallback(() => {
    setBitcoinUnit(BitcoinUnit.Btc);
  }, [setBitcoinUnit]);

  const handleSatsPress = useCallback(() => {
    setBitcoinUnit(BitcoinUnit.Sats);
  }, [setBitcoinUnit]);

  const handlersMap = useMemo(
    () => ({
      [BitcoinUnit.Btc]: handleBtcPress,
      [BitcoinUnit.Sats]: handleSatsPress,
    }),
    [handleBtcPress, handleSatsPress],
  );

  const unitOptions = useMemo(
    () =>
      UNIT_OPTIONS_DATA.map((option) => ({
        ...option,
        isSelected: bitcoinUnit === option.unit,
        onPress: handlersMap[option.unit],
      })),
    [bitcoinUnit, handlersMap],
  );

  const screenOptions = useMemo(
    () => ({
      headerTitleAlign: 'center' as const,
      title: 'Bitcoin Unit',
      headerShown: true,
      headerShadowVisible: false,
      headerLeft: HeaderLeft,
    }),
    [],
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View className="flex h-full px-4">
          <Stack.Screen options={screenOptions} />
          <FocusAwareStatusBar style="dark" />

          <View className="mt-4">
            {unitOptions.map((option) => (
              <UnitOption key={option.key} title={option.title} description={option.description} isSelected={option.isSelected} onPress={option.onPress} />
            ))}
          </View>

          <View className="mt-6 px-2">
            <Text className="text-xs leading-5 text-gray-500">The Bitcoin unit determines how balances are displayed in the wallet.</Text>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
