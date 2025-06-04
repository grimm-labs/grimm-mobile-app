import React, { useContext } from 'react';

import { Image, Text, View } from '@/components/ui';
import { formatBalance, getFiatCurrency } from '@/lib';
import { AppContext } from '@/lib/context';
import { useBreez } from '@/lib/context/breez-context';

type WalletType = 'On-chain' | 'Lightning' | 'Liquid';

type Props = {
  name: string;
  symbol: string;
  type: WalletType;
};

const getWalletIcon = (type: WalletType) => {
  switch (type) {
    case 'On-chain':
      return require('../assets/images/on-chain-icon.png');
    case 'Lightning':
      return require('../assets/images/lightning-icon.png');
    default:
      return require('../assets/images/on-chain-icon.png');
  }
};

export const WalletView = ({ name, symbol, type }: Props) => {
  const { hideBalance, selectedCountry, bitcoinUnit } = useContext(AppContext);
  const selectedFiatCurrency = getFiatCurrency(selectedCountry);
  const { balance } = useBreez();

  const walletIcon = getWalletIcon(type);

  return (
    <View className="flex flex-row items-center py-2">
      <Image className="mr-4 size-12 rounded-full" source={walletIcon} />
      <View className="flex-1 flex-row items-center justify-between">
        <View className="">
          <Text className="text-lg font-semibold text-gray-700">{name}</Text>
          <View className="my" />
          <View className="flex-row items-center">
            <Text className="text-sm font-medium text-gray-600">{symbol}</Text>
            <Text className="text-xs text-gray-500">({type})</Text>
          </View>
        </View>
        <View className="">
          {hideBalance ? (
            <Text className="text-right text-lg font-semibold text-gray-900">********</Text>
          ) : (
            <View>
              <Text className="text-right text-lg font-semibold text-gray-700">{formatBalance(balance, bitcoinUnit)}</Text>
              <View className="my" />
              <Text className="text-right text-sm font-medium text-gray-600">0.00 {selectedFiatCurrency} </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};
