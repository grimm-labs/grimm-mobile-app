/* eslint-disable max-lines-per-function */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { useHideBalance } from '@/core/hooks/use-hide-balance';

import { ReceiveBitcoinModal } from './modals/receive-bitcoin';

export const WalletOverview = () => {
  const _router = useRouter();
  const [balanceUnit, setBalanceUnit] = useState('SAT');
  const [balance, _setBalance] = useState({
    sats: 2_398_423,
    btc: 0.02398423,
    usd: 59_564.29,
  });
  const [isBalanceHide, setIsBalanceHide] = useHideBalance();
  const [isReceiveBitcoinModalOpen, setIsReceiveBitcoinModalOpen] =
    useState(false);

  const toggleBalanceVisibility = async () => {
    setIsBalanceHide(!isBalanceHide);
  };

  const toggleBalanceUnit = () => {
    setBalanceUnit((current) => (current === 'SAT' ? 'BTC' : 'SAT'));
  };

  const formatBalance = () => {
    if (!isBalanceHide) return '********';

    if (balanceUnit === 'SAT') {
      return `${balance.sats.toLocaleString()} SAT`;
    } else {
      return `${balance.btc.toFixed(8)} BTC`;
    }
  };

  return (
    <View className="mx-4 mt-2 rounded-lg">
      <View className="flex-row items-center justify-center">
        <Text className="mr-2 text-center text-base font-medium text-neutral-500">
          Available balance
        </Text>
        <View className="flex-row space-x-2">
          <Pressable onPress={toggleBalanceVisibility}>
            <Ionicons
              name={isBalanceHide ? 'eye-off' : 'eye'}
              size={16}
              color="gray"
            />
          </Pressable>
        </View>
      </View>
      <View className="py-6">
        <Pressable onPress={toggleBalanceUnit}>
          <Text className="mb-4 text-center text-3xl font-bold text-gray-700">
            {formatBalance()}
          </Text>
        </Pressable>
        <Text className="text-center text-lg text-gray-700">
          {isBalanceHide ? `$${balance.usd.toLocaleString()}` : '********'}
        </Text>
      </View>
      <View className="flex flex-row justify-around space-x-1">
        <View className="flex items-center justify-center">
          <Pressable className="mb-2 rounded-full bg-primary-600 p-3 text-white">
            <Ionicons name="arrow-up-outline" size={28} color="white" />
          </Pressable>
          <Text className="text-sm font-medium">Send</Text>
        </View>
        <View className="flex items-center justify-center">
          <Pressable
            className="mb-2 rounded-full bg-primary-600 p-3 text-white"
            onPress={() => setIsReceiveBitcoinModalOpen(true)}
          >
            <Ionicons name="add" size={28} color="white" />
          </Pressable>
          <Text className="text-sm font-medium">Receive</Text>
        </View>
        <View className="flex items-center justify-center">
          <Pressable className="mb-2 rounded-full bg-neutral-700 p-3 text-white">
            <Ionicons name="scan" size={28} color="white" />
          </Pressable>
          <Text className="text-sm font-medium">Scan</Text>
        </View>
      </View>
      <Modal
        visible={isReceiveBitcoinModalOpen}
        onRequestClose={() => setIsReceiveBitcoinModalOpen(false)}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ReceiveBitcoinModal
          onClose={() => setIsReceiveBitcoinModalOpen(false)}
        />
      </Modal>
    </View>
  );
};
