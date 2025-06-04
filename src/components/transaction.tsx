/* eslint-disable max-lines-per-function */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity } from 'react-native';

import { Text, View } from '@/components/ui';
import { convertBitcoinToFiat, convertSatsToBtc } from '@/lib';
import { BitcoinUnit } from '@/types/enum';

type TransactionType = 'received' | 'sent' | 'pending';

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number; // in sats
  description?: string;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
  fee?: number;
};

export const TransactionItem: React.FC<{ transaction: Transaction; fiatCurrency: string; bitcoinPrices: any; bitcoinUnit: BitcoinUnit }> = ({ transaction, fiatCurrency, bitcoinPrices, bitcoinUnit }) => {
  const getTransactionIcon = () => {
    switch (transaction.type) {
      case 'received':
        return 'arrow-down';
      case 'sent':
        return 'arrow-up';
      case 'pending':
        return 'time-outline';
      default:
        return 'flash-outline';
    }
  };

  const getTransactionColor = () => {
    switch (transaction.type) {
      case 'received':
        return '#10b981'; // green
      case 'sent':
        return '#ef4444'; // red
      case 'pending':
        return '#f59e0b'; // amber
      default:
        return '#6b7280'; // gray
    }
  };

  const getAmountPrefix = () => {
    switch (transaction.type) {
      case 'received':
        return '+';
      case 'sent':
        return '-';
      default:
        return '';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const fiatAmount = convertBitcoinToFiat(transaction.amount, BitcoinUnit.Sats, fiatCurrency, bitcoinPrices);
  const bitcoinAmount = bitcoinUnit === BitcoinUnit.Sats ? transaction.amount.toLocaleString('en-US') : convertSatsToBtc(transaction.amount);

  return (
    <TouchableOpacity className="flex-row items-center py-4" activeOpacity={0.7}>
      <View className="mr-4 size-12 items-center justify-center rounded-full" style={{ backgroundColor: `${getTransactionColor()}15` }}>
        <Ionicons name={getTransactionIcon() as any} size={20} color={getTransactionColor()} />
      </View>

      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-medium text-gray-900">{transaction.description || (transaction.type === 'received' ? 'Payment received' : 'Payment sent')}</Text>
          <Text className="text-base font-bold" style={{ color: getTransactionColor() }}>
            {getAmountPrefix()}
            {fiatAmount.toLocaleString('en-US')} {fiatCurrency}
          </Text>
        </View>

        <View className="mt-1 flex-row items-center justify-between">
          <Text className="text-sm text-gray-500">
            {formatDate(transaction.timestamp)} • {transaction.status === 'pending' ? 'Pending' : 'Confirmed'}
          </Text>
          <Text className="text-sm text-gray-500">
            {getAmountPrefix()}
            {bitcoinAmount} {bitcoinUnit}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
