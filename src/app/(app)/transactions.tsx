/* eslint-disable react-native/no-inline-styles */
import { type Payment, PaymentState } from '@breeztech/react-native-breez-sdk-liquid';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';
import { FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TransactionItem } from '@/components/transaction';
import { FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { useBreez } from '@/lib/context/breez-context';

type FilterType = 'All' | 'Confirmed' | 'Pending';

export default function Transactions() {
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');
  const { payments } = useBreez();
  const router = useRouter();

  const filters: FilterType[] = ['All', 'Confirmed', 'Pending'];

  const getFilteredPayments = (): Payment[] => {
    if (selectedFilter === 'All') {
      return payments;
    }
    if (selectedFilter === 'Confirmed') {
      return payments.filter((payment) => payment.status === PaymentState.COMPLETE);
    }
    if (selectedFilter === 'Pending') {
      return payments.filter((payment) => payment.status === PaymentState.PENDING);
    }
    return payments;
  };

  const filteredPayments = getFilteredPayments();

  const renderFilterButton = (filter: FilterType) => {
    const isSelected = selectedFilter === filter;
    return (
      <TouchableOpacity key={filter} onPress={() => setSelectedFilter(filter)} className={`mr-3 rounded-full px-4 py-2 ${isSelected ? 'bg-primary-600' : 'bg-gray-100'}`} activeOpacity={0.7}>
        <Text className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-600'}`}>{filter}</Text>
      </TouchableOpacity>
    );
  };

  const renderTransaction = ({ item }: { item: Payment }) => <TransactionItem payment={item} />;

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-6 py-20">
      <Text className="mb-2 text-2xl text-gray-600">No Transactions</Text>
      <Text className="mb-8 text-center text-xs text-gray-600">You haven't made a transaction yet.</Text>
      <TouchableOpacity className="rounded-full bg-primary-600 px-8 py-3" activeOpacity={0.8} onPress={() => router.push('/receive/amount-description')}>
        <Text className="text-xs font-semibold text-white">Receive</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaProvider>
      <FocusAwareStatusBar style="dark" />
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex border-b border-neutral-100 px-4 py-3">
          <Text className="text-2xl font-bold text-gray-800">Transaction</Text>
        </View>
        <View className="p-4">
          <View className="flex-row">{filters.map(renderFilterButton)}</View>
        </View>
        <View className="flex-1">
          {filteredPayments.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={filteredPayments}
              renderItem={renderTransaction}
              keyExtractor={(item, index) => item.txId || index.toString()}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
