/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable max-lines-per-function */
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import SlideToConfirm from '@/components/slide-to-confirm';
import { colors, FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { convertBitcoinToFiat, convertSatsToBtc, getFiatCurrency } from '@/lib';
import { AppContext, useBdk } from '@/lib/context';
import { useBitcoin } from '@/lib/context/bitcoin-prices-context';
import { BitcoinUnit } from '@/types/enum';

type SearchParams = {
  recipientAddress: string;
  satsAmount: string;
  feeSpeed: 'low' | 'medium' | 'fast';
  feeSatsPerVbyte: string;
};

interface TransactionDetail {
  label: string;
  value: string;
  subValue?: string;
  icon?: string;
  iconColor?: string;
  copyable?: boolean;
}

const DetailRow = ({ detail }: { detail: TransactionDetail }) => (
  <View className="mb-4 flex-row items-start justify-between rounded-xl bg-gray-50 p-4">
    <View className="flex-1">
      <Text className="mb-1 text-sm font-medium text-gray-500">{detail.label}</Text>
      <Text className="text-base font-semibold text-gray-800" numberOfLines={detail.copyable ? 2 : 1}>
        {detail.value}
      </Text>
      {detail.subValue && <Text className="mt-1 text-sm text-gray-500">{detail.subValue}</Text>}
    </View>
    {detail.icon && (
      <View className="ml-3 size-10 items-center justify-center rounded-full bg-primary-600">
        <MaterialCommunityIcons name={detail.icon as any} size={20} color={colors.white} />
      </View>
    )}
  </View>
);

export default function OnchainSummaryTransactionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { recipientAddress, satsAmount, feeSpeed, feeSatsPerVbyte } = useLocalSearchParams<SearchParams>();

  const { selectedCountry, bitcoinUnit } = useContext(AppContext);
  const { bitcoinPrices } = useBitcoin();
  const { wallet, sendTransaction, calculateTransactionFee } = useBdk();

  const [isProcessing, setIsProcessing] = useState(false);
  const [estimatedFeeSats, setEstimatedFeeSats] = useState(0);

  const selectedFiatCurrency = getFiatCurrency(selectedCountry);
  const satsValue = Number(satsAmount);

  const feeSatsPerVbyteNum = Number(feeSatsPerVbyte);
  const totalSats = satsValue + estimatedFeeSats;

  const amountFiat = convertBitcoinToFiat(satsValue, BitcoinUnit.Sats, selectedFiatCurrency, bitcoinPrices).toFixed(2);
  const feeFiat = convertBitcoinToFiat(estimatedFeeSats, BitcoinUnit.Sats, selectedFiatCurrency, bitcoinPrices).toFixed(2);
  const totalFiat = convertBitcoinToFiat(totalSats, BitcoinUnit.Sats, selectedFiatCurrency, bitcoinPrices).toFixed(2);

  const feeSpeedLabels = {
    low: t('onchainSend.summary.feeSpeed.low'),
    medium: t('onchainSend.summary.feeSpeed.medium'),
    fast: t('onchainSend.summary.feeSpeed.fast'),
  };

  const formatAddress = (address: string) => {
    if (address.length <= 20) return address;
    return `${address.slice(0, 10)}...${address.slice(-10)}`;
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      const txId = await sendTransaction(recipientAddress, 1000, feeSatsPerVbyteNum);
      if (txId) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * 2));
        router.push(`/send-onchain/transaction-result?satsAmount=${encodeURIComponent(totalSats)}&txId=${encodeURIComponent(txId)}`);
      }
    } catch (error) {
      console.error('Failed to send transaction: ', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const transactionDetails: TransactionDetail[] = [
    {
      label: t('onchainSend.summary.recipient'),
      value: formatAddress(recipientAddress),
      icon: 'wallet-outline',
      copyable: true,
    },
    {
      label: t('onchainSend.summary.amount'),
      value: `${bitcoinUnit === BitcoinUnit.Sats ? satsValue.toLocaleString('en-US') : convertSatsToBtc(satsValue)} ${bitcoinUnit}`,
      subValue: `≈ ${amountFiat} ${selectedFiatCurrency}`,
      icon: 'bitcoin',
      iconColor: colors.primary[600],
    },
    {
      label: t('onchainSend.summary.networkFee'),
      value: `${bitcoinUnit === BitcoinUnit.Sats ? estimatedFeeSats.toLocaleString('en-US') : convertSatsToBtc(estimatedFeeSats)} ${bitcoinUnit}`,
      subValue: `${feeSpeedLabels[feeSpeed]} • ${feeSatsPerVbyteNum} sat/vB • ≈ ${feeFiat} ${selectedFiatCurrency}`,
      icon: 'lightning-bolt',
      iconColor: colors.primary[600],
    },
  ];

  useEffect(() => {
    async function prepareTx() {
      const fee = await calculateTransactionFee(recipientAddress, satsValue, feeSatsPerVbyteNum);
      setEstimatedFeeSats(fee);
    }
    prepareTx();
  }, [recipientAddress, satsValue, feeSatsPerVbyteNum, wallet, calculateTransactionFee]);

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white">
        <FocusAwareStatusBar style="dark" />
        <Stack.Screen
          options={{
            headerTitle: () => <HeaderTitle title={t('onchainSend.summary.headerTitle')} />,
            headerTitleAlign: 'center',
            headerLeft: HeaderLeft,
            headerShadowVisible: false,
          }}
        />
        <ScrollView className="flex-1 px-4">
          <View className="mb-6 mt-4 items-center">
            <View className="mb-4 size-20 items-center justify-center">
              <Ionicons name="send" size={40} color={colors.primary[600]} />
            </View>
          </View>
          <View className="mb-6">
            {transactionDetails.map((detail, index) => (
              <DetailRow key={index} detail={detail} />
            ))}
          </View>
          <View className="mb-6 rounded-xl bg-neutral-100 p-6">
            <Text className="mb-2 text-center text-sm font-medium text-gray-600">{t('onchainSend.summary.totalAmount')}</Text>
            <View className="items-center">
              <Text className="text-3xl font-bold text-gray-800">
                {bitcoinUnit === BitcoinUnit.Sats ? totalSats.toLocaleString() : convertSatsToBtc(totalSats)} {bitcoinUnit}
              </Text>
            </View>
            <Text className="mt-2 text-center text-base text-gray-600">
              ≈ {totalFiat} {selectedFiatCurrency}
            </Text>
          </View>
        </ScrollView>
        <View className="p-4">
          <SlideToConfirm onConfirm={handleConfirm} loading={isProcessing} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
