/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable max-lines-per-function */
import type { ReceiveAmount } from '@breeztech/react-native-breez-sdk-liquid';
import { PaymentMethod, prepareReceivePayment, ReceiveAmountVariant, receivePayment } from '@breeztech/react-native-breez-sdk-liquid';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Clipboard, Pressable, ScrollView, Share } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { Button, colors, FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { convertBitcoinToFiat, getFiatCurrency } from '@/lib';
import { AppContext } from '@/lib/context';
import { useBitcoin } from '@/lib/context/bitcoin-prices-context';
import { BitcoinUnit } from '@/types/enum';

type SearchParams = {
  satsAmount: string;
  type: 'onchain' | 'lightning';
  note?: string;
};

export default function ReceivePaymentScreen() {
  const { t } = useTranslation();
  const { selectedCountry } = useContext(AppContext);
  const router = useRouter();
  const { bitcoinPrices } = useBitcoin();
  const { satsAmount, note, type } = useLocalSearchParams<SearchParams>();
  const [loading, setLoading] = useState(true);
  const [paymentRequest, setPaymentRequest] = useState<string>('');
  const [fees, setFees] = useState<number>(0);
  const [error, setError] = useState<string>('');

  const defaultNotes = t('receive_payment.default_note', { amount: Number(satsAmount).toLocaleString() });
  const selectedFiatCurrency = getFiatCurrency(selectedCountry);

  const generatePaymentRequest = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      if (!satsAmount || parseInt(satsAmount, 10) <= 0) {
        throw new Error(t('receive_payment.invalid_amount'));
      }

      const optionalAmount: ReceiveAmount = {
        type: ReceiveAmountVariant.BITCOIN,
        payerAmountSat: Number(satsAmount),
      };

      const prepareResponse = await prepareReceivePayment({
        paymentMethod: type === 'onchain' ? PaymentMethod.BITCOIN_ADDRESS : PaymentMethod.BOLT11_INVOICE,
        amount: optionalAmount,
      });

      setFees(prepareResponse.feesSat);

      const receiveResponse = await receivePayment({
        prepareResponse,
        ...(type === 'lightning' && { description: note || defaultNotes }),
      });

      setPaymentRequest(receiveResponse.destination);
    } catch (err) {
      console.error('Error generating invoice:', err);
      setError(err instanceof Error ? err.message : t('receive_payment.error_generic'));
    } finally {
      setLoading(false);
    }
  }, [satsAmount, type, note, defaultNotes, t]);

  useEffect(() => {
    generatePaymentRequest();
  }, [generatePaymentRequest]);

  const copyToClipboard = async () => {
    if (paymentRequest) {
      await Clipboard.setString(paymentRequest);
      showMessage({ message: t('receive_payment.copied'), type: 'success', duration: 2000 });
    }
  };

  const sharePaymentRequest = async () => {
    if (paymentRequest) {
      try {
        await Share.share({
          message: paymentRequest,
          title: t('receive_payment.share_title'),
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }
  };

  const handleRetry = () => {
    generatePaymentRequest();
  };

  const isValidAmount = () => {
    return paymentRequest && satsAmount && parseInt(satsAmount, 10) > 0;
  };

  const handleSubmit = () => {
    router.dismissAll();
    router.replace('/');
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <FocusAwareStatusBar style="dark" />
        <Stack.Screen
          options={{
            headerTitle: () => <HeaderTitle title={t('receive_payment.header')} />,
            headerTitleAlign: 'center',
            headerLeft: HeaderLeft,
            headerShadowVisible: false,
          }}
        />
        <View className="flex-1 items-center justify-center px-4">
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text className="mt-4 text-lg text-gray-600">{t('receive_payment.loading_title')}</Text>
          <Text className="mt-2 text-center text-sm text-gray-400">{t('receive_payment.loading_subtitle')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <FocusAwareStatusBar style="dark" />
        <Stack.Screen
          options={{
            headerTitle: () => <HeaderTitle title={t('receive_payment.header')} />,
            headerTitleAlign: 'center',
            headerLeft: HeaderLeft,
            headerShadowVisible: false,
          }}
        />
        <View className="flex-1 px-4">
          <View className="flex-1 items-center justify-center">
            <View className="mb-4 rounded-full bg-red-100 p-4">
              <Ionicons name="alert-circle" size={48} color="#EF4444" />
            </View>
            <Text className="mb-2 text-xl font-semibold text-gray-800">{t('receive_payment.error_title')}</Text>
            <Text className="mb-6 text-center text-gray-600">{error}</Text>
          </View>

          <View className="mb-8">
            <Button label={t('receive_payment.retry')} onPress={handleRetry} fullWidth={true} variant="secondary" textClassName="text-base text-white" size="lg" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white">
        <FocusAwareStatusBar style="dark" />
        <Stack.Screen
          options={{
            headerTitle: () => <HeaderTitle title={t('receive_payment.header')} />,
            headerTitleAlign: 'center',
            headerLeft: HeaderLeft,
            headerShadowVisible: false,
          }}
        />
        <View className="flex-1 px-2">
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="mb-2 mt-3">
              <View className="items-center rounded-2xl p-6">
                <Text className="mb-2 text-2xl font-light text-gray-800">{parseInt(satsAmount, 10).toLocaleString()} SATS</Text>
                <Text className="text-lg text-gray-500">
                  {Number(convertBitcoinToFiat(Number(satsAmount), BitcoinUnit.Sats, selectedFiatCurrency, bitcoinPrices).toFixed(2)).toLocaleString()} {selectedFiatCurrency}
                </Text>
                <View className="rounded-lg bg-white p-3">
                  <Text className="text-sm text-gray-600">{note || defaultNotes}</Text>
                </View>
              </View>
            </View>
            <View className="mb-8 items-center">
              <View className="bg-white p-6">{paymentRequest && <QRCode value={paymentRequest} size={type === 'onchain' ? 150 : 250} backgroundColor="white" color="black" />}</View>
              {type === 'onchain' && <Text className="mt-4 text-center text-sm text-gray-500">{paymentRequest}</Text>}
              <Text className="mt-4 text-center text-sm text-gray-500">{t('receive_payment.scan_text')}</Text>
            </View>
            <View className="flex flex-row justify-center">
              <View className="mx-4 flex items-center justify-center">
                <Pressable className="mb-2 rounded-full bg-primary-600 p-3 text-white" onPress={copyToClipboard}>
                  <Ionicons name="copy" size={20} color="white" />
                </Pressable>
              </View>
              <View className="mx-4 flex items-center justify-center">
                <Pressable className="mb-2 rounded-full bg-primary-600 p-3 text-white" onPress={sharePaymentRequest}>
                  <Ionicons name="share" size={20} color="white" />
                </Pressable>
              </View>
            </View>
            <View className="my-4 rounded-lg bg-blue-50 p-4">
              <Text className="text-center text-sm text-blue-700">
                {t('receive_payment.fee_info', { fees, fiat: convertBitcoinToFiat(fees, BitcoinUnit.Sats, selectedFiatCurrency, bitcoinPrices).toFixed(2), currency: selectedFiatCurrency })}
              </Text>
            </View>
          </ScrollView>
          <View>
            <Button label={t('receive_payment.close')} disabled={!isValidAmount()} onPress={handleSubmit} fullWidth={true} variant="secondary" textClassName="text-base text-white" size="lg" />
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
