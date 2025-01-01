import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';

import { colors, FocusAwareStatusBar, Pressable, Text, View } from '@/ui';

interface NetworkOptionProps {
  title: string;
  description: string;
  isSelected: boolean;
  onPress: () => void;
}

const NetworkOption: React.FC<NetworkOptionProps> = ({
  title,
  description,
  isSelected,
  onPress,
}) => (
  <Pressable onPress={onPress}>
    <View className="flex flex-row items-center justify-between border-b-[0.5px] border-gray-300 py-4">
      <View className="flex-1">
        <Text className="text-sm font-medium">{title}</Text>
        <Text className="text-xs text-gray-500">{description}</Text>
      </View>
      {isSelected && (
        <Ionicons
          name="checkmark-outline"
          size={24}
          color={colors.success[600]}
        />
      )}
    </View>
  </Pressable>
);

export default function NetworkSwitcher() {
  const [selectedNetwork, setSelectedNetwork] = useState<'mainnet' | 'testnet'>(
    'mainnet'
  );

  const selectNetwork = (network: 'mainnet' | 'testnet') => {
    setSelectedNetwork(network);
  };

  return (
    <SafeAreaView>
      <View className="flex h-full px-4">
        <Stack.Screen
          options={{
            title: 'Network',
            headerShown: true,
            headerShadowVisible: false,
          }}
        />
        <FocusAwareStatusBar />
        <View className="mt-6">
          <NetworkOption
            title="Mainnet"
            description="The primary Bitcoin network"
            isSelected={selectedNetwork === 'mainnet'}
            onPress={() => selectNetwork('mainnet')}
          />
          <NetworkOption
            title="Testnet"
            description="A test network for Bitcoin developers"
            isSelected={selectedNetwork === 'testnet'}
            onPress={() => selectNetwork('testnet')}
          />
        </View>
        <View className="mt-6 px-4">
          <Text className="text-sm text-gray-600">
            You should most likely be on mainnet. Devnet is a test network for
            developers and does not have real BTC on it.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
