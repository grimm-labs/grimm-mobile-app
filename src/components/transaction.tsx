/* eslint-disable max-lines-per-function */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity } from 'react-native';

import { Text, View } from '@/components/ui';
import { convertSatsToBtc } from '@/lib';
import { AppContext } from '@/lib/context';
import { BitcoinUnit } from '@/types/enum';
import type { UnifiedTransaction } from '@/types/transaction';
import { TransactionSource, UnifiedTransactionStatus, UnifiedTransactionType } from '@/types/transaction';

export const TransactionItem: React.FC<{ transaction: UnifiedTransaction }> = ({ transaction }) => {
  const { bitcoinUnit, hideBalance } = useContext(AppContext);
  const { t } = useTranslation();
  const router = useRouter();

  const getTransactionIcon = () => {
    if (transaction.type === UnifiedTransactionType.RECEIVE) {
      return 'arrow-down';
    }
    return 'arrow-up';
  };

  const getTransactionColor = () => {
    switch (transaction.type) {
      case UnifiedTransactionType.RECEIVE:
        return '#10b981';
      case UnifiedTransactionType.SEND:
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getAmountPrefix = () => {
    switch (transaction.type) {
      case UnifiedTransactionType.RECEIVE:
        return '+';
      case UnifiedTransactionType.SEND:
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
        ...(targetDate.getFullYear() !== now.getFullYear() && {
          year: 'numeric',
        }),
      });
    }
  };

  const getTransactionLabel = () => {
    const typeLabel = transaction.type === UnifiedTransactionType.RECEIVE ? t('transactionItem.received') : t('transactionItem.sent');
    const sourceLabel = transaction.source === TransactionSource.LIGHTNING ? ' ⚡' : ' 🔗';
    return typeLabel + sourceLabel;
  };

  const getStatusLabel = () => {
    return transaction.status === UnifiedTransactionStatus.PENDING ? t('transactionItem.status.pending') : t('transactionItem.status.confirmed');
  };

  const bitcoinAmount = bitcoinUnit === BitcoinUnit.Sats ? transaction.amountSat.toLocaleString('en-US') : convertSatsToBtc(transaction.amountSat);

  const handlePress = () => {
    const data = transaction.source === TransactionSource.LIGHTNING ? transaction.lightningData : transaction.onchainData;
    if (transaction.source === TransactionSource.LIGHTNING) {
      router.push(`/transaction-details/ln?transactionData=${encodeURIComponent(JSON.stringify(data))}`);
      return;
    }

    if (transaction.source === TransactionSource.ONCHAIN) {
      router.push(`/transaction-details/onchain?transactionData=${encodeURIComponent(JSON.stringify(data))}`);
      return;
    }
  };

  return (
    <TouchableOpacity className="flex-row items-center py-4" activeOpacity={0.7} onPress={handlePress}>
      <View className="mr-4 size-12 items-center justify-center rounded-full" style={{ backgroundColor: `${getTransactionColor()}15` }}>
        <Ionicons name={getTransactionIcon() as any} size={20} color={getTransactionColor()} />
      </View>
      <View className="flex-1 flex-row items-center justify-between">
        <View>
          <Text className="text-left text-base font-semibold text-gray-900">{getTransactionLabel()}</Text>
          <Text className="text-left text-xs text-gray-600">
            {formatDate(transaction.timestamp)} • {getStatusLabel()}
          </Text>
        </View>
        {hideBalance ? (
          <Text className="my-2 text-center text-base font-bold">{t('walletOverview.hiddenBalance')}</Text>
        ) : (
          <Text className="my-2 text-center text-base font-semibold" style={{ color: getTransactionColor() }}>
            {getAmountPrefix()}
            {bitcoinAmount} {bitcoinUnit}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};
