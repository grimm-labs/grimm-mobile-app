import React, { useContext } from 'react';

import { Image, Text, View } from '@/components/ui';
import { formatBalance } from '@/lib';
import { AppContext } from '@/lib/context';

type WalletType = 'On-chain' | 'Lightning' | 'Liquid';

type Props = {
  name: string;
  symbol: string;
  type: WalletType;
  balance: number;
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

export const WalletView = ({ name, symbol, type, balance }: Props) => {
  const { hideBalance } = useContext(AppContext);
  const selectedBitcoinUnit = 'SAT';
  const selectedFiatCurrency = 'XAF';

  const walletIcon = getWalletIcon(type);

  return (
    <View className="flex flex-row items-center rounded border border-neutral-200 bg-neutral-100 p-3">
      <Image className="mr-4 size-12 rounded-full" source={walletIcon} />
      <View className="flex-1 flex-row items-center justify-between">
        <View>
          <Text className="text-base font-semibold text-gray-800">{name}</Text>
          <View className="flex-row items-center">
            <Text className="mr-1 text-sm font-medium text-gray-600">{symbol}</Text>
            <Text className="text-xs text-gray-500">({type})</Text>
          </View>
        </View>
        <View>
          {hideBalance ? (
            <Text className="text-right text-lg font-semibold text-gray-900">********</Text>
          ) : (
            <View>
              <Text className="text-right text-base font-semibold text-gray-900">{formatBalance(balance, selectedBitcoinUnit)}</Text>
              <Text className="text-right text-sm font-medium text-gray-600">{selectedFiatCurrency} 0.00</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};
