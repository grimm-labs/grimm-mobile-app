/* eslint-disable max-lines-per-function */
import { type Payment, PaymentStatus, PaymentType } from '@breeztech/breez-sdk-spark-react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import DetailRow from '@/components/detail-row';
import { TransactionNoteSection } from '@/components/transaction-note-section';
import { colors, FocusAwareStatusBar, Image, SafeAreaView } from '@/components/ui';
import { formatBalance } from '@/lib';
import { AppContext } from '@/lib/context';
import { useStackScreenOptions } from '@/lib/stack-screen-options';
import { theme } from '@/lib/theme-classes';

type SearchParams = {
  transactionData: string;
};

export default function LightningTransactionDetailsScreen() {
  const { t } = useTranslation();
  const { transactionData } = useLocalSearchParams<SearchParams>();
  const { bitcoinUnit } = useContext(AppContext);

  const transaction = JSON.parse(transactionData as string) as Payment;

  const isSent = transaction.paymentType === PaymentType.Send;
  const isComplete = transaction.status === PaymentStatus.Completed;

  const formattedDate = new Date(Number(transaction.timestamp) * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const amountSat = Number(transaction.amount);
  const feesSat = Number(transaction.fees);
  const totalAmount = isSent ? amountSat + feesSat : amountSat;
  const stackScreenOptions = useStackScreenOptions();

  return (
    <SafeAreaProvider>
      <SafeAreaView className={`flex-1 ${theme.screen}`}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: '',
            headerLeft: HeaderLeft,
            headerRight: () => null,
            headerShadowVisible: false,
            ...stackScreenOptions,
          }}
        />
        <FocusAwareStatusBar />
        <ScrollView className="flex-1 px-3" showsVerticalScrollIndicator={false}>
          <View className="mb-6 mt-4 items-center">
            <View className={`rounded-full px-4 py-2 ${isComplete ? 'bg-green-100 dark:bg-green-900/40' : 'bg-yellow-100 dark:bg-yellow-900/40'}`}>
              <Text className={`text-sm font-semibold ${isComplete ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
                {isComplete ? '✓ ' + t('transactionItem.status.confirmed') : t('transactionItem.status.pending')}
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
                {formatBalance(amountSat, bitcoinUnit)}
              </Text>
            </View>
          </View>
          <View className="mb-4 flex-row items-center justify-center">
            <Ionicons name={isSent ? 'arrow-up-circle' : 'arrow-down-circle'} size={24} color={isSent ? colors.danger[600] : colors.primary[600]} />
            <Text className={`ml-2 text-lg font-medium ${theme.textSecondary}`}>{isSent ? t('lnTransactionDetail.sent') : t('lnTransactionDetail.received')}</Text>
          </View>
          <View className="mb-6 mt-4">
            <Text className={`mb-4 text-xl font-semibold ${theme.textPrimary}`}>{t('lnTransactionDetail.details')}</Text>
            <TransactionNoteSection type="ln" transactionId={transaction.id ?? ''} />
            <DetailRow label={t('lnTransactionDetail.date')} value={formattedDate} />
            {isSent && (
              <>
                <DetailRow label={t('lnTransactionDetail.fees')} value={`${formatBalance(feesSat, bitcoinUnit)}`} />
                <DetailRow label={t('lnTransactionDetail.total')} value={`${formatBalance(totalAmount, bitcoinUnit)}`} />
              </>
            )}
            <DetailRow label={t('lnTransactionDetail.transactionId')} value={transaction.id || ''} copyable />
            {transaction.details && (transaction.details as any).tag === 'Lightning' && (
              <>
                {(transaction.details as any).inner.paymentHash && <DetailRow label={t('lnTransactionDetail.paymentHash')} value={(transaction.details as any).inner.paymentHash} copyable expandable />}
                {(transaction.details as any).inner.preimage && <DetailRow label={t('lnTransactionDetail.preimage')} value={(transaction.details as any).inner.preimage} copyable expandable />}
                {(transaction.details as any).inner.description && <DetailRow label={t('lnTransactionDetail.description')} value={(transaction.details as any).inner.description} />}
                {(transaction.details as any).inner.invoice && <DetailRow label={t('lnTransactionDetail.invoice')} value={(transaction.details as any).inner.invoice} copyable expandable />}
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
