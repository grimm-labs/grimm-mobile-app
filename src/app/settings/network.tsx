/* eslint-disable react-native/no-inline-styles */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native';

import { HeaderLeft } from '@/components/back-button';
import { colors, FocusAwareStatusBar, Pressable, Text, View } from '@/components/ui';
import { BitcoinNetwork } from '@/types/enum';

interface NetworkOptionProps {
  title: string;
  description: string;
  isSelected: boolean;
  onPress: () => void;
}

const NetworkOption = React.memo<NetworkOptionProps>(({ title, description, isSelected, onPress }) => (
  <Pressable onPress={onPress} style={{ opacity: 1 }}>
    <View className="flex flex-row items-center justify-between border-b-[0.5px] border-gray-300 px-2 py-4">
      <View className="flex-1 pr-4">
        <Text className="text-sm font-medium text-gray-900">{title}</Text>
        <Text className="mt-1 text-xs text-gray-500">{description}</Text>
      </View>
      <View className="size-6 items-center justify-center">{isSelected && <Ionicons name="checkmark-circle" size={24} color={colors.primary[600]} style={{ transform: [{ scale: 1 }] }} />}</View>
    </View>
  </Pressable>
));

NetworkOption.displayName = 'NetworkOption';

export default function NetworkSwitcher() {
  const [selectedBitcoinNetwork, setSelectedBitcoinNetwork] = useState<BitcoinNetwork>(BitcoinNetwork.testnet);

  const handleMainnetPress = useCallback(() => {
    setSelectedBitcoinNetwork(BitcoinNetwork.Mainnet);
  }, []);

  const handleTestnetPress = useCallback(() => {
    setSelectedBitcoinNetwork(BitcoinNetwork.testnet);
  }, []);

  const networkOptions = useMemo(
    () => [
      {
        title: 'Mainnet (Bitcoin)',
        description: 'The primary Bitcoin network',
        isSelected: selectedBitcoinNetwork === BitcoinNetwork.Mainnet,
        onPress: handleMainnetPress,
        key: 'mainnet',
      },
      {
        title: 'Testnet',
        description: 'A test network for Bitcoin developers',
        isSelected: selectedBitcoinNetwork === BitcoinNetwork.testnet,
        onPress: handleTestnetPress,
        key: 'testnet',
      },
    ],
    [selectedBitcoinNetwork, handleMainnetPress, handleTestnetPress],
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex h-full px-4">
        <Stack.Screen
          options={{
            title: 'Network',
            headerTitleAlign: 'center',
            headerShown: true,
            headerShadowVisible: false,
            headerLeft: HeaderLeft,
          }}
        />
        <FocusAwareStatusBar style="dark" />

        <View className="mt-4">
          {networkOptions.map((option) => (
            <NetworkOption key={option.key} title={option.title} description={option.description} isSelected={option.isSelected} onPress={option.onPress} />
          ))}
        </View>

        <View className="mt-6 px-2">
          <Text className="text-sm leading-5 text-gray-600">You should most likely be on mainnet. Testnet is a test network for developers and does not have real BTC on it.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
