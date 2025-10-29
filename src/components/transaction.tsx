/* eslint-disable max-lines-per-function */
import { type Payment, PaymentType } from '@breeztech/react-native-breez-sdk-liquid';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity } from 'react-native';

import { Text, View } from '@/components/ui';
import { convertSatsToBtc } from '@/lib';
import { AppContext } from '@/lib/context';
import { BitcoinUnit } from '@/types/enum';

export const TransactionItem: React.FC<{ payment: Payment }> = ({ payment }) => {
  const { bitcoinUnit } = useContext(AppContext);
  const { t } = useTranslation();
  const router = useRouter();

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
    const targetDate = new Date(timestamp * 1000);
    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

    const diffTime = today.getTime() - target.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return t('transactionItem.date.today');
    } else if (diffDays === 1) {
      return t('transactionItem.date.yesterday');
    } else if (diffDays > 0 && diffDays <= 7) {
      return t('transactionItem.date.daysAgo', { count: diffDays });
    } else if (diffDays < 0 && diffDays >= -7) {
      return t('transactionItem.date.inDays', { count: Math.abs(diffDays) });
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
    <TouchableOpacity
      className="flex-row items-center py-4"
      activeOpacity={0.7}
      onPress={() => {
        router.push({
          pathname: '/transaction-details/ln',
          params: {
            transactionData: JSON.stringify(payment),
          },
        });
      }}
    >
      <View className="mr-4 size-12 items-center justify-center rounded-full" style={{ backgroundColor: `${getTransactionColor()}15` }}>
        <Ionicons name={getTransactionIcon() as any} size={20} color={getTransactionColor()} />
      </View>
      <View className="flex-1 flex-row items-center justify-between">
        <View>
          <Text className="text-left text-base font-semibold text-gray-900">{payment.paymentType === PaymentType.RECEIVE ? t('transactionItem.received') : t('transactionItem.sent')}</Text>
          <Text className="text-left text-xs text-gray-600">
            {formatDate(payment.timestamp)} • {payment.status === 'pending' ? t('transactionItem.status.pending') : t('transactionItem.status.confirmed')}
          </Text>
        </View>
        <Text className="my-2 text-center text-base font-semibold" style={{ color: getTransactionColor() }}>
          {getAmountPrefix()}
          {bitcoinAmount} {bitcoinUnit}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
