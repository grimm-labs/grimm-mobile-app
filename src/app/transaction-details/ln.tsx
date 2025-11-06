/* eslint-disable max-lines-per-function */
import { type Payment } from '@breeztech/react-native-breez-sdk-liquid';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import DetailRow from '@/components/detail-row';
import { colors, FocusAwareStatusBar, Image, SafeAreaView } from '@/components/ui';
import { formatBalance } from '@/lib';
import { AppContext } from '@/lib/context';

type SearchParams = {
  transactionData: string;
};

export default function LightningTransactionDetailsScreen() {
  const { t } = useTranslation();
  const { transactionData } = useLocalSearchParams<SearchParams>();
  const { bitcoinUnit } = useContext(AppContext);

  const transaction = JSON.parse(transactionData as string) as Payment;

  const isSent = transaction.paymentType === 'send';
  const isComplete = transaction.status === 'complete';

  const formattedDate = new Date(transaction.timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalAmount = isSent ? transaction.amountSat + transaction.feesSat : transaction.amountSat;

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white">
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
        <ScrollView className="flex-1 px-3" showsVerticalScrollIndicator={false}>
          <View className="mb-6 mt-4 items-center">
            <View className={`rounded-full px-4 py-2 ${isComplete ? 'bg-green-100' : 'bg-yellow-100'}`}>
              <Text className={`text-sm font-semibold ${isComplete ? 'text-green-700' : 'text-yellow-700'}`}>{isComplete ? '✓ ' + t('transactionItem.status.confirmed') : t('transactionItem.status.pending')}</Text>
            </View>
          </View>
          <View className="mb-6 items-center">
            <View className="mb-3 flex-row items-center">
              <View className="mr-3 size-10 items-center justify-center rounded-full bg-orange-500">
                <Image className="size-10 rounded-full" source={require('@/assets/images/bitcoin_logo.png')} />
              </View>
              <Text className={`text-4xl font-bold ${isSent ? 'text-red-600' : 'text-green-600'}`}>
                {isSent ? '- ' : '+ '}
                {formatBalance(transaction.amountSat, bitcoinUnit)}
              </Text>
            </View>
          </View>
          <View className="mb-4 flex-row items-center justify-center">
            <Ionicons name={isSent ? 'arrow-up-circle' : 'arrow-down-circle'} size={24} color={isSent ? colors.danger[600] : colors.primary[600]} />
            <Text className="ml-2 text-lg font-medium text-gray-700">{isSent ? t('lnTransactionDetail.sent') : t('lnTransactionDetail.received')}</Text>
          </View>
          <View className="mb-6 mt-4">
            <Text className="mb-4 text-xl font-semibold text-gray-900">{t('lnTransactionDetail.details')}</Text>
            <DetailRow label={t('lnTransactionDetail.date')} value={formattedDate} />
            {isSent && (
              <>
                <DetailRow label={t('lnTransactionDetail.fees')} value={`${formatBalance(transaction.feesSat, bitcoinUnit)}`} />
                <DetailRow label={t('lnTransactionDetail.total')} value={`${formatBalance(totalAmount, bitcoinUnit)}`} />
              </>
            )}
            <DetailRow label={t('lnTransactionDetail.transactionId')} value={transaction.txId || ''} copyable />
            {transaction.details.type === 'lightning' && (
              <>
                {transaction.details.paymentHash && <DetailRow label={t('lnTransactionDetail.paymentHash')} value={transaction.details.paymentHash} copyable expandable />}
                {transaction.details.preimage && <DetailRow label={t('lnTransactionDetail.preimage')} value={transaction.details.preimage} copyable expandable />}
                {transaction.details.description && <DetailRow label={t('lnTransactionDetail.description')} value={transaction.details.description} />}
                {transaction.details.invoice && <DetailRow label={t('lnTransactionDetail.invoice')} value={transaction.details.invoice} copyable expandable />}
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
