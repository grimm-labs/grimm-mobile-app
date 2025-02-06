import { Ionicons } from '@expo/vector-icons';
import type { Balance } from 'bdk-rn/lib/classes/Bindings';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { convertBtcToSats } from '@/core';
import { useHideBalance } from '@/core/hooks/use-hide-balance';

type WalletOverviewProps = {
  balance: Balance;
};

export const WalletOverview = ({ balance }: WalletOverviewProps) => {
  const router = useRouter();

  const [balanceUnit, setBalanceUnit] = useState('SAT');
  const [isBalanceHide, setIsBalanceHide] = useHideBalance();

  const toggleBalanceVisibility = async () => {
    setIsBalanceHide(!isBalanceHide);
  };

  const toggleBalanceUnit = () => {
    setBalanceUnit((current) => (current === 'SAT' ? 'BTC' : 'SAT'));
  };

  const formatBalance = () => {
    if (isBalanceHide) return '********';

    if (balanceUnit === 'SAT') {
      return `${convertBtcToSats(balance.total)} SAT`;
    } else {
      return `${balance.total.toFixed(8)} BTC`;
    }
  };

  return (
    <View className="mx-4 mt-2 rounded-lg">
      <View className="flex-row items-center justify-center">
        <Text className="mr-2 text-center text-base font-medium text-neutral-500">Total balance</Text>
        <View className="flex-row space-x-2">
          <Pressable onPress={toggleBalanceVisibility}>
            <Ionicons name={isBalanceHide ? 'eye-off' : 'eye'} size={16} color="gray" />
          </Pressable>
        </View>
      </View>
      <View className="py-6">
        <Pressable onPress={toggleBalanceUnit}>
          <Text className="mb-4 text-center text-3xl font-bold text-gray-700">{formatBalance()}</Text>
        </Pressable>
        <View className="mb-4">
          <Text className="text-center text-lg font-medium text-gray-600">{isBalanceHide ? '********' : `XAF 0`}</Text>
        </View>
      </View>
      <View className="flex flex-row justify-around space-x-1">
        <View className="flex items-center justify-center">
          <Pressable className="mb-2 rounded-full bg-primary-600 p-3 text-white" onPress={() => router.push('send/enter-address')}>
            <Ionicons name="arrow-up-outline" size={28} color="white" />
          </Pressable>
          <Text className="text-sm font-medium">Send</Text>
        </View>
        <View className="flex items-center justify-center">
          <Pressable className="mb-2 rounded-full bg-primary-600 p-3 text-white" onPress={() => router.push('receive')}>
            <Ionicons name="add" size={28} color="white" />
          </Pressable>
          <Text className="text-sm font-medium">Receive</Text>
        </View>
        <View className="flex items-center justify-center">
          <Pressable className="mb-2 rounded-full bg-neutral-700 p-3 text-white">
            <Ionicons name="scan" size={28} color="white" />
          </Pressable>
          <Text className="text-sm font-medium">Scan QR</Text>
        </View>
      </View>
    </View>
  );
};
