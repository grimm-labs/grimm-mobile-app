import { Ionicons } from '@expo/vector-icons';
import type { TransactionDetails } from 'bdk-rn/lib/classes/Bindings';
import type { Network } from 'bdk-rn/lib/lib/enums';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';

import TransactionsHeader from '@/components/transactions-header';
import { createWallet, getBlockchain, getBlockchainConfig, useSeedPhrase, useSelectedBitcoinNetwork } from '@/core';
import { colors, SafeAreaView, Text, View } from '@/ui';

export interface TransactionItemProps {
  index: number;
  item: TransactionDetails;
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat('en-EN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(timestamp));
}

const renderTransactionItem = ({ item, index }: TransactionItemProps): JSX.Element => {
  const isReceived = item.sent < item.received;
  return (
    <View key={index} className="mb-3 flex-row items-center justify-between rounded-2xl bg-white p-4">
      <View className="flex-row items-center">
        <View className={`rounded-full p-3 ${isReceived ? 'bg-green-100' : 'bg-red-100'}`}>
          <Ionicons name={isReceived ? 'arrow-down-outline' : 'arrow-up-outline'} size={30} color={isReceived ? colors.success[600] : colors.danger[600]} />
        </View>
        <View className="ml-2">
          <Text className="mb-1 text-lg font-semibold text-gray-800">{isReceived ? 'Received' : 'Sent'}</Text>
          <Text className="text-sm text-gray-500">{item.confirmationTime?.timestamp ? formatDate(item.confirmationTime.timestamp * 1000) : 'Pending'}</Text>
        </View>
      </View>
      <View className="items-end">
        <Text className="mb-1 text-lg font-semibold text-gray-900">
          {isReceived ? '+' : '-'} {Math.abs(item.sent - item.received) / 1e8} BTC
        </Text>
        <Text className="text-sm text-gray-500">XAF {(Math.abs(item.sent - item.received) / 1e8) * 1000000}</Text>
      </View>
    </View>
  );
};

const renderEmptyList = (): JSX.Element => (
  <View className="mt-10 items-center">
    <Ionicons name="alert-circle-outline" size={40} color={colors.neutral[400]} />
    <Text className="mt-2 text-lg font-semibold text-gray-500">No transactions available</Text>
    <Text className="text-sm text-gray-400">Your transactions will appear here once available.</Text>
  </View>
);

export default function Activity() {
  const [seedPhrase] = useSeedPhrase();
  const [selectedBitcoinNetwork] = useSelectedBitcoinNetwork();
  const [transactions, setTransactions] = useState<TransactionDetails[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (seedPhrase) {
      const wallet = await createWallet(seedPhrase, selectedBitcoinNetwork as Network);
      const blockchain = await getBlockchain(getBlockchainConfig());
      await wallet.sync(blockchain);
      const trx = await wallet.listTransactions(true);
      setTransactions(trx);
    }
  }, [seedPhrase, selectedBitcoinNetwork]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions, seedPhrase, selectedBitcoinNetwork]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  }, [fetchTransactions]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="mx-2 flex">
        <TransactionsHeader />
        <FlatList
          className="h-full"
          data={transactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item.txid}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary[600]]} />}
          ListEmptyComponent={renderEmptyList}
        />
      </View>
    </SafeAreaView>
  );
}
