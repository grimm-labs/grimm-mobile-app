/* eslint-disable max-lines-per-function */
/* eslint-disable react-native/no-inline-styles */
import { LiquidNetwork } from '@breeztech/react-native-breez-sdk-liquid';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { colors, FocusAwareStatusBar, Pressable, SafeAreaView, Text, View } from '@/components/ui';
import { useBreez } from '@/lib/context/breez-context';
import { Env } from '@/lib/env';

const isProduction = Env.APP_ENV === 'production';

interface NetworkOptionProps {
  title: string;
  description: string;
  isSelected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

const NetworkOption = React.memo<NetworkOptionProps>(({ title, description, isSelected, onPress, disabled = false }) => (
  <Pressable onPress={onPress} style={{ opacity: disabled ? 0.5 : 1 }} disabled={disabled}>
    <View className="flex flex-row items-center justify-between border-b-[0.5px] border-gray-300 px-2 py-4">
      <View className="flex-1 pr-4">
        <Text className="text-sm font-medium text-gray-900">{title}</Text>
        <Text className="mt-1 text-xs text-gray-500">{description}</Text>
      </View>
      <View className="size-6 items-center justify-center">{isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.primary[600]} style={{ transform: [{ scale: 1 }] }} />}</View>
    </View>
  </Pressable>
));

const NetworkSwitcherHeaderTitle = () => <HeaderTitle title="Network" />;

export default function NetworkSwitcher() {
  const { liquidNetwork, setLiquidNetwork, isConnected, isSyncing } = useBreez();
  const [isChangingNetwork, setIsChangingNetwork] = useState(false);

  const performNetworkSwitch = useCallback(
    async (network: LiquidNetwork) => {
      try {
        setIsChangingNetwork(true);
        await setLiquidNetwork(network);
      } catch (error) {
        console.error('Error switching network:', error);
        Alert.alert('Network Switch Failed', 'Failed to switch network. Please try again.', [{ text: 'OK' }]);
      } finally {
        setIsChangingNetwork(false);
      }
    },
    [setLiquidNetwork],
  );

  const handleNetworkChange = useCallback(
    async (network: LiquidNetwork) => {
      if (network === liquidNetwork || isProduction) return;

      if (network === LiquidNetwork.MAINNET && liquidNetwork !== LiquidNetwork.MAINNET) {
        Alert.alert('Switch to Mainnet', 'You are about to switch to the Bitcoin mainnet. This will disconnect your current session and reconnect to the live Bitcoin network. Are you sure?', [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Switch',
            style: 'default',
            onPress: () => performNetworkSwitch(network),
          },
        ]);
      } else {
        performNetworkSwitch(network);
      }
    },
    [liquidNetwork, performNetworkSwitch],
  );

  const handleMainnetPress = useCallback(() => {
    if (isProduction) return;
    handleNetworkChange(LiquidNetwork.MAINNET);
  }, [handleNetworkChange]);

  const handleTestnetPress = useCallback(() => {
    if (isProduction) return;
    handleNetworkChange(LiquidNetwork.TESTNET);
  }, [handleNetworkChange]);

  const networkOptions = useMemo(
    () => [
      {
        title: 'Mainnet (Bitcoin)',
        description: 'The primary Bitcoin network with real BTC',
        isSelected: liquidNetwork === LiquidNetwork.MAINNET,
        onPress: handleMainnetPress,
        key: 'mainnet',
      },
      {
        title: 'Testnet',
        description: 'A test network for Bitcoin developers',
        isSelected: liquidNetwork === LiquidNetwork.TESTNET,
        onPress: handleTestnetPress,
        key: 'testnet',
      },
    ],
    [liquidNetwork, handleMainnetPress, handleTestnetPress],
  );

  const isDisabled = isChangingNetwork || isSyncing || isProduction;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <View className="flex h-full px-4">
          <Stack.Screen
            options={{
              headerTitle: NetworkSwitcherHeaderTitle,
              headerTitleAlign: 'center',
              headerShown: true,
              headerShadowVisible: false,
              headerLeft: HeaderLeft,
            }}
          />
          <FocusAwareStatusBar style="dark" />

          {isChangingNetwork && (
            <View className="mt-4 flex-row items-center justify-center rounded-lg bg-blue-50 py-3">
              <ActivityIndicator size="small" color={colors.primary[600]} />
              <Text className="ml-2 text-sm text-blue-700">Switching network...</Text>
            </View>
          )}

          <View className="mb-2 mt-4 px-2">
            <View className="flex-row items-center">
              <View className={`mr-2 size-2 rounded-full ${isConnected ? 'bg-primary-500' : 'bg-red-500'}`} />
              <Text className="text-sm text-gray-600">{isConnected ? `Connected to ${liquidNetwork}` : 'Disconnected'}</Text>
            </View>
          </View>

          {isProduction && (
            <View className="mt-4 rounded-lg bg-yellow-50 p-3">
              <Text className="text-sm text-yellow-800">Network switching is disabled in production. Using Mainnet by default.</Text>
            </View>
          )}

          <View className="mt-2">
            {networkOptions.map((option) => (
              <NetworkOption key={option.key} title={option.title} description={option.description} isSelected={option.isSelected} onPress={option.onPress} disabled={isDisabled} />
            ))}
          </View>

          <View className="mt-6">
            <Text className="text-xs text-gray-600">{isProduction ? 'Production mode: Network is locked to Mainnet for security.' : 'You should most likely be on mainnet for real Bitcoin transactions.'}</Text>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
