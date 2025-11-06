/* eslint-disable max-lines-per-function */
/* eslint-disable react-native/no-inline-styles */
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TransactionItem } from '@/components/transaction';
import { FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { mergeAndSortTransactions } from '@/lib';
import { useBdk } from '@/lib/context';
import { useBreez } from '@/lib/context/breez-context';
import { TransactionSource, type UnifiedTransaction, UnifiedTransactionStatus } from '@/types/transaction';

type FilterType = 'All' | 'Confirmed' | 'Pending' | 'Lightning' | 'OnChain';

export default function Transactions() {
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');
  const { payments } = useBreez();
  const { transactions: bdkTransactions } = useBdk();
  const router = useRouter();
  const { t } = useTranslation();
  const [transactions, setTransactions] = React.useState<UnifiedTransaction[]>([]);
  const filters: FilterType[] = ['All', 'Confirmed', 'Pending', 'Lightning', 'OnChain'];

  const getFilteredTransactions = (): UnifiedTransaction[] => {
    if (selectedFilter === 'All') {
      return transactions;
    }
    if (selectedFilter === 'Confirmed') {
      return transactions.filter((tx) => tx.status === UnifiedTransactionStatus.CONFIRMED);
    }
    if (selectedFilter === 'Pending') {
      return transactions.filter((tx) => tx.status === UnifiedTransactionStatus.PENDING);
    }
    if (selectedFilter === 'Lightning') {
      return transactions.filter((tx) => tx.source === TransactionSource.LIGHTNING);
    }
    if (selectedFilter === 'OnChain') {
      return transactions.filter((tx) => tx.source === TransactionSource.ONCHAIN);
    }
    return transactions;
  };

  const filteredTransactions = getFilteredTransactions();

  const renderFilterButton = (filter: FilterType) => {
    const isSelected = selectedFilter === filter;
    return (
      <TouchableOpacity key={filter} onPress={() => setSelectedFilter(filter)} className={`mr-3 rounded-full px-4 py-2 ${isSelected ? 'bg-primary-600' : 'bg-gray-100'}`} activeOpacity={0.7}>
        <Text className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-gray-600'}`}>{t(`transactions.filters.${filter.toLowerCase()}`)}</Text>
      </TouchableOpacity>
    );
  };

  const renderTransaction = ({ item }: { item: UnifiedTransaction }) => <TransactionItem transaction={item} />;

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-6 py-20">
      <Text className="mb-2 text-2xl text-gray-600">{t('transactions.empty.title')}</Text>
      <Text className="mb-8 text-center text-xs text-gray-600">{t('transactions.empty.description')}</Text>
      <TouchableOpacity className="rounded-full bg-primary-600 px-8 py-3" activeOpacity={0.8} onPress={() => router.push('/receive/amount-description')}>
        <Text className="text-xs font-semibold text-white">{t('transactions.empty.button')}</Text>
      </TouchableOpacity>
    </View>
  );

  useEffect(() => {
    const unified = mergeAndSortTransactions(payments, bdkTransactions);
    setTransactions(unified);
  }, [bdkTransactions, payments]);

  return (
    <SafeAreaProvider>
      <FocusAwareStatusBar style="dark" />
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex border-b border-neutral-100 px-4 py-3">
          <Text className="text-2xl font-bold text-gray-800">{t('transactions.title')}</Text>
        </View>
        <View className="border-b border-neutral-100 py-4">
          <FlatList data={filters} renderItem={({ item }) => renderFilterButton(item)} keyExtractor={(item) => item} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row' }} />
        </View>
        <View className="flex-1">
          {filteredTransactions.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={filteredTransactions}
              renderItem={renderTransaction}
              keyExtractor={(item, index) => item.id || index.toString()}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
