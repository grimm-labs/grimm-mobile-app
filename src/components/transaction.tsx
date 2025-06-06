/* eslint-disable max-lines-per-function */
import { type Payment, PaymentType } from '@breeztech/react-native-breez-sdk-liquid';
import { Ionicons } from '@expo/vector-icons';
import React, { useContext } from 'react';
import { TouchableOpacity } from 'react-native';

import { Text, View } from '@/components/ui';
import { convertSatsToBtc } from '@/lib';
import { AppContext } from '@/lib/context';
import { BitcoinUnit } from '@/types/enum';

type TransactionType = 'received' | 'sent' | 'pending';

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  description?: string;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
  fee?: number;
};

export const TransactionItem: React.FC<{ payment: Payment }> = ({ payment }) => {
  const { bitcoinUnit } = useContext(AppContext);

  const getTransactionIcon = () => (payment.paymentType === PaymentType.RECEIVE ? 'arrow-down' : 'arrow-up');

  const getTransactionColor = () => {
    switch (payment.paymentType) {
      case PaymentType.RECEIVE:
        return '#10b981'; // green
      case PaymentType.SEND:
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const getAmountPrefix = () => {
    switch (payment.paymentType) {
      case PaymentType.RECEIVE:
        return '+';
      case PaymentType.SEND:
        return '-';
      default:
        return '';
    }
  };

  const formatDate = (timestamp: number) => {
    const targetDate = new Date(timestamp);
    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

    const diffTime = today.getTime() - target.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays > 0 && diffDays <= 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 0 && diffDays >= -7) {
      return `In ${Math.abs(diffDays)} days`;
    } else {
      return targetDate.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        ...(targetDate.getFullYear() !== now.getFullYear() && { year: 'numeric' }),
      });
    }
  };

  const bitcoinAmount = bitcoinUnit === BitcoinUnit.Sats ? payment.amountSat.toLocaleString('en-US') : convertSatsToBtc(payment.amountSat);

  return (
    <TouchableOpacity className="flex-row items-center py-4" activeOpacity={0.7}>
      <View className="mr-4 size-12 items-center justify-center rounded-full" style={{ backgroundColor: `${getTransactionColor()}15` }}>
        <Ionicons name={getTransactionIcon() as any} size={20} color={getTransactionColor()} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-medium text-gray-900">{payment.paymentType === PaymentType.RECEIVE ? 'You received' : 'You paid'}</Text>
          <Text className="text-base" style={{ color: getTransactionColor() }}>
            {getAmountPrefix()}
            {bitcoinAmount} {bitcoinUnit}
          </Text>
        </View>
        <View className="mt-1 flex-row items-center justify-between">
          <Text className="text-sm text-gray-500">
            {formatDate(payment.timestamp)} • {payment.status === 'pending' ? 'Pending' : 'Confirmed'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
