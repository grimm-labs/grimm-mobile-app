import React, { useContext } from 'react';

import { Image, Text, View } from '@/components/ui';
import { convertBitcoinToFiat, formatBalance, getFiatCurrency } from '@/lib';
import { AppContext } from '@/lib/context';
import { useBitcoin } from '@/lib/context/bitcoin-prices-context';
import { useBreez } from '@/lib/context/breez-context';
import { BitcoinUnit } from '@/types/enum';

type WalletType = 'On-chain' | 'Lightning' | 'Liquid';

type Props = {
  name: string;
  symbol: string;
  type: WalletType;
};

const getWalletIcon = (type: WalletType) => {
  switch (type) {
    case 'On-chain':
      return require('../assets/images/bitcoin_logo.png');
    case 'Lightning':
      return require('../assets/images/bitcoin_lightning_logo.png');
    default:
      return require('../assets/images/bitcoin_logo.png');
  }
};

export const WalletView = ({ name, symbol, type }: Props) => {
  const { hideBalance, selectedCountry, bitcoinUnit } = useContext(AppContext);
  const selectedFiatCurrency = getFiatCurrency(selectedCountry);
  const { balance } = useBreez();
  const { bitcoinPrices } = useBitcoin();

  const walletIcon = getWalletIcon(type);

  return (
    <View className="flex flex-row items-center py-2">
      <Image className="mr-4 size-14 rounded-full" source={walletIcon} />
      <View className="flex-1 flex-row items-center justify-between">
        <View>
          <Text className="text-xl font-bold text-gray-700">{name}</Text>
          <View className="my-1" />
          <View className="flex-row items-center">
            <Text className="text-sm font-bold text-gray-600">{symbol}</Text>
            <Text className="mx-1 text-xs text-gray-500">({type})</Text>
          </View>
        </View>
        <View>
          {hideBalance ? (
            <Text className="text-right text-xl font-semibold text-gray-900">********</Text>
          ) : (
            <View className="text-right">
              <Text className="text-right text-xl font-bold text-gray-700">{formatBalance(balance, bitcoinUnit)}</Text>
              <View className="my-1" />
              <Text className="text-right text-sm font-medium text-gray-600">
                {convertBitcoinToFiat(balance, BitcoinUnit.Sats, selectedFiatCurrency, bitcoinPrices).toFixed(2)} {selectedFiatCurrency}{' '}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};
