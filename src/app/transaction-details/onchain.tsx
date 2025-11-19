/* eslint-disable react-native/no-inline-styles */
/* eslint-disable max-lines-per-function */
import { Ionicons } from '@expo/vector-icons';
import type { TransactionDetails } from 'bdk-rn/lib/classes/Bindings';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import DetailRow from '@/components/detail-row';
import { colors, FocusAwareStatusBar, Image, SafeAreaView, ScrollView } from '@/components/ui';
import { formatBalance, generateTxUrl } from '@/lib';
import { AppContext, useBdk, useBreez } from '@/lib/context';

type SearchParams = {
  transactionData: string;
};

export default function OnchainTransactionDetailsScreen() {
  const { t } = useTranslation();
  const { transactionData } = useLocalSearchParams<SearchParams>();
  const { bitcoinUnit } = useContext(AppContext);
  const { liquidNetwork } = useBreez();
  const { getBlockainHeight } = useBdk();
  const [height, setHeight] = useState<number | undefined>(undefined);

  const transaction = JSON.parse(transactionData) as TransactionDetails;
  const isSent = transaction.sent > transaction.received;
  const isConfirmed = (transaction.confirmationTime?.timestamp || 0) > 0;
  const netAmount = isSent ? transaction.sent - transaction.received + (transaction.fee || 0) : transaction.received - transaction.sent;
  const netAmountWithoutFee = isSent ? transaction.sent - transaction.received : transaction.received - transaction.sent;
  const formattedDate =
    transaction.confirmationTime && typeof transaction.confirmationTime.timestamp === 'number'
      ? new Date(transaction.confirmationTime.timestamp * 1000).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : t('onchainTransactionDetail.status.pending');

  const openLink = (txId: string) => {
    const url = generateTxUrl(txId, liquidNetwork);
    Linking.openURL(url).catch((err) => console.error(`Error opening link: ${url}`, err));
  };

  useEffect(() => {
    async function fetchHeight() {
      try {
        const val = await getBlockainHeight();
        setHeight(val);
      } catch (err) {
        console.error('Error fetching blockchain height', err);
      }
    }
    fetchHeight();
  }, [getBlockainHeight]);

  const displayConfirmation = () => {
    if (transaction.confirmationTime?.height && height) {
      const diff = height - transaction.confirmationTime.height;
      return diff > 10 ? `+10` : diff.toString();
    }
    return '';
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white px-4">
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: '',
            headerLeft: HeaderLeft,
            headerRight: () => null,
            headerShadowVisible: false,
          }}
        />
        <FocusAwareStatusBar style="dark" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }} className="flex-1">
          <View className="mb-6 mt-4 items-center">
            <View className={`rounded-full px-4 py-2 ${isConfirmed ? 'bg-green-100' : 'bg-yellow-100'}`}>
              <Text className={`text-sm font-semibold ${isConfirmed ? 'text-green-700' : 'text-yellow-700'}`}>
                {isConfirmed ? '✓ ' + t('onchainTransactionDetail.status.confirmed') : t('onchainTransactionDetail.status.pending')}
              </Text>
            </View>
          </View>
          <View className="mb-6 items-center">
            <View className="mb-3 flex-row items-center">
              <View className="mr-3 size-10 items-center justify-center rounded-full bg-orange-500">
                <Image className="size-10 rounded-full" source={require('@/assets/images/bitcoin_logo.png')} />
              </View>
              <Text className={`text-4xl font-bold ${isSent ? 'text-red-600' : 'text-green-600'}`}>
                {isSent ? '- ' : '+ '}
                {formatBalance(netAmount, bitcoinUnit)}
              </Text>
            </View>
          </View>
          <View className="mb-4 flex-row items-center justify-center">
            <Ionicons name={isSent ? 'arrow-up-circle' : 'arrow-down-circle'} size={24} color={isSent ? colors.danger[600] : colors.primary[600]} />
            <Text className="ml-2 text-lg font-medium text-gray-700">{isSent ? t('onchainTransactionDetail.sent') : t('onchainTransactionDetail.received')}</Text>
          </View>
          <View className="mb-6 mt-4">
            <Text className="mb-4 text-xl font-semibold text-gray-900">{t('onchainTransactionDetail.details')}</Text>
            {isConfirmed && <DetailRow label={t('onchainTransactionDetail.date')} value={formattedDate} />}
            {isConfirmed && <DetailRow label={t('onchainTransactionDetail.blockHeight')} value={transaction.confirmationTime?.height?.toString() || ''} />}
            {isConfirmed && height && <DetailRow label="Confirmations" value={displayConfirmation()} />}
            <DetailRow label={t('onchainTransactionDetail.amount')} value={formatBalance(netAmountWithoutFee, bitcoinUnit)} />
            {isSent && transaction.fee && <DetailRow label={t('onchainTransactionDetail.networkFee')} value={formatBalance(transaction.fee, bitcoinUnit)} />}
            <DetailRow label={t('onchainTransactionDetail.transactionId')} value={transaction.txid} copyable expandable />
          </View>
        </ScrollView>
        <View className="mb-4 flex">
          <TouchableOpacity onPress={() => openLink(transaction.txid)} className="items-center rounded-full bg-primary-600 px-6 py-4">
            <Text className="text-base font-normal text-white">Explore transaction</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
