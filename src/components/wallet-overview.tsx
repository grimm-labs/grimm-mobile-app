/* eslint-disable max-lines-per-function */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useContext } from 'react';
import { Pressable, Text, View } from 'react-native';

import { convertBitcoinToFiat, formatBalance, getFiatCurrency } from '@/lib';
import { AppContext } from '@/lib/context';
import { useBitcoin } from '@/lib/context/bitcoin-prices-context';
import { useBreez } from '@/lib/context/breez-context';

export const WalletOverview = () => {
  const router = useRouter();
  const { hideBalance, setHideBalance, selectedCountry, bitcoinUnit } = useContext(AppContext);
  const { bitcoinPrices } = useBitcoin();
  const { balance } = useBreez();
  const selectedFiatCurrency = getFiatCurrency(selectedCountry);

  const convertedVal = convertBitcoinToFiat(balance, bitcoinUnit, selectedFiatCurrency, bitcoinPrices);

  return (
    <View className="">
      <View className="flex-row items-center justify-center">
        <Pressable
          onPress={() => {
            setHideBalance(!hideBalance);
          }}
          className="flex flex-row items-center"
        >
          <Text className="mr-2 text-center text-lg font-medium">Total Balance</Text>
          <View className="flex-row space-x-2">
            <Ionicons name={hideBalance ? 'eye-off' : 'eye'} size={16} color="gray" />
          </View>
        </Pressable>
      </View>
      <View className="py-6">
        <Pressable onPress={() => setHideBalance(!hideBalance)}>
          <Text className="mb-4 text-center text-3xl font-bold text-gray-700">{hideBalance ? '********' : formatBalance(balance, bitcoinUnit)}</Text>
        </Pressable>
        <View className="mb-4">
          <Text className="text-center text-lg font-medium text-gray-600">{hideBalance ? '********' : `${selectedFiatCurrency} ${convertedVal.toFixed(2)}`}</Text>
        </View>
      </View>
      <View className="flex flex-row justify-around space-x-1">
        <View className="flex items-center justify-center">
          <Pressable className="mb-2 rounded-full bg-primary-600 p-3 text-white" onPress={() => router.push('/send/enter-address')}>
            <Ionicons name="arrow-up-outline" size={28} color="white" />
          </Pressable>
          <Text className="text-sm font-medium">Send</Text>
        </View>
        <View className="flex items-center justify-center">
          <Pressable
            className="mb-2 rounded-full bg-primary-600 p-3 text-white"
            onPress={() => {
              router.push({
                pathname: '/receive/amount-description',
                params: { type: 'lightning' },
              });
            }}
          >
            <Ionicons name="add" size={28} color="white" />
          </Pressable>
          <Text className="text-sm font-medium">Receive</Text>
        </View>
        <View className="flex items-center justify-center">
          <Pressable
            className="mb-2 rounded-full bg-neutral-700 p-3 text-white"
            onPress={() => {
              router.push({
                pathname: '/transaction-result/success-screen',
                params: { transactionType: 'received', satsAmount: '34298' },
              });
            }}
          >
            <Ionicons name="scan" size={28} color="white" />
          </Pressable>
          <Text className="text-sm font-medium">Scan QR</Text>
        </View>
      </View>
    </View>
  );
};
