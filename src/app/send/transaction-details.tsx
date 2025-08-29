/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable max-lines-per-function */
import type { LnInvoice, PrepareSendResponse } from '@breeztech/react-native-breez-sdk-liquid';
import { InputTypeVariant, parse, prepareSendPayment, sendPayment } from '@breeztech/react-native-breez-sdk-liquid';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import SlideToConfirm from '@/components/slide-to-confirm';
import { Button, colors, FocusAwareStatusBar, SafeAreaView, showErrorMessage, Text, View } from '@/components/ui';
import { convertBitcoinToFiat, getFiatCurrency } from '@/lib';
import { AppContext } from '@/lib/context';
import { useBitcoin } from '@/lib/context/bitcoin-prices-context';
import { BitcoinUnit } from '@/types/enum';

type SearchParams = {
  rawInvoice: string;
};

export default function PaymentDetailsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { rawInvoice } = useLocalSearchParams<SearchParams>();

  const { selectedCountry } = useContext(AppContext);
  const { bitcoinPrices } = useBitcoin();

  const [isLoading, setIsLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [decodeError, setDecodeError] = useState<string | undefined>(undefined);
  const [feesSat, setFeesSat] = useState(0);
  const [decodedInvoiceData, setDecodedInvoiceData] = useState<LnInvoice>();
  const [paymentIsProcessing, setPaymentIsProcessing] = useState(false);
  const [savedPrepareResponse, setSavedPrepareResponse] = useState<PrepareSendResponse | null>(null);

  const selectedFiatCurrency = getFiatCurrency(selectedCountry);

  const convertMsatToSats = (msat: number | undefined) => {
    if (msat === undefined) return 0;
    return Math.floor(msat / 1000);
  };

  useEffect(() => {
    if (rawInvoice) {
      const parseInvoice = async () => {
        try {
          const parsed = await parse(rawInvoice.trim());
          if (parsed.type === InputTypeVariant.BOLT11 && parsed.invoice.amountMsat !== null) {
            setDecodedInvoiceData(parsed.invoice);
            const prepareResponse = await prepareSendPayment({
              destination: parsed.invoice.bolt11,
            });
            setFeesSat(prepareResponse.feesSat || 0);
            setSavedPrepareResponse(prepareResponse);
          } else {
            setDecodeError(t('paymentDetails.errors.decode'));
          }
        } catch (error) {
          if ((error as Error).message?.includes('not enough funds')) {
            setDecodeError(t('paymentDetails.errors.notEnoughFunds'));
          } else {
            showErrorMessage(t('paymentDetails.errors.invalidData'));
          }
          console.error('Error parsing invoice data:', (error as Error)?.message);
        } finally {
          setIsLoading(false);
        }
      };
      parseInvoice();
    }
  }, [rawInvoice, router, t]);

  useEffect(() => {
    if (!decodedInvoiceData?.expiry || !decodedInvoiceData?.timestamp) return;

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const expiryTime = decodedInvoiceData.timestamp + decodedInvoiceData.expiry;
      const remaining = expiryTime - now;

      if (remaining <= 0) {
        setTimeRemaining(t('paymentDetails.expired'));
        return;
      }

      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;

      if (hours > 0) {
        setTimeRemaining(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [decodedInvoiceData, t]);

  const getDestinationDisplay = () => {
    if (decodedInvoiceData?.payeePubkey) {
      return decodedInvoiceData?.payeePubkey;
    }
    return t('paymentDetails.unknown');
  };

  const handleSendPayment = async () => {
    if (!decodedInvoiceData) {
      showErrorMessage(t('paymentDetails.errors.invalidPayment'));
      return;
    }

    if (savedPrepareResponse) {
      setPaymentIsProcessing(true);
      try {
        const sendResponse = await sendPayment({
          prepareResponse: savedPrepareResponse,
        });
        const payment = sendResponse.payment;
        if (payment.txId) {
          router.push({
            pathname: '/transaction-result/success-screen',
            params: { transactionType: 'sent', satsAmount: payment.amountSat.toString() },
          });
        }
      } finally {
        setPaymentIsProcessing(false);
      }
    }
  };

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView className="flex-1 bg-white">
          <FocusAwareStatusBar style="dark" />
          <Stack.Screen
            options={{
              headerTitle: () => <HeaderTitle title={t('paymentDetails.title')} />,
              headerTitleAlign: 'center',
              headerLeft: HeaderLeft,
              headerShadowVisible: false,
            }}
          />
          <View className="flex-1 items-center justify-center px-4">
            <ActivityIndicator size="large" color={colors.primary[600]} />
            <Text className="mt-4 text-lg text-gray-600">{t('paymentDetails.loading')}</Text>
            <Text className="mt-2 text-center text-sm text-gray-400">{t('paymentDetails.loadingSubtitle')}</Text>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (!isLoading && decodeError) {
    return (
      <SafeAreaProvider>
        <SafeAreaView className="flex-1 bg-white">
          <FocusAwareStatusBar style="dark" />
          <Stack.Screen
            options={{
              headerTitle: () => <HeaderTitle title={t('paymentDetails.errorTitle')} />,
              headerTitleAlign: 'center',
              headerLeft: HeaderLeft,
              headerShadowVisible: false,
            }}
          />
          <View className="flex-1 items-center justify-center px-6">
            <View className="mb-8 size-24 items-center justify-center rounded-full bg-red-100">
              <Ionicons name="alert-circle" size={48} color={colors.danger[500]} />
            </View>
            <Text className="mb-4 text-center text-2xl font-bold text-gray-900">{t('paymentDetails.errorMessage')}</Text>
            <Text className="mb-8 text-center text-base leading-6 text-gray-600">{t('paymentDetails.errorDescription')}</Text>
            <View className="mb-8 w-full rounded-lg bg-gray-50 p-4">
              <Text className="text-center text-sm text-gray-500">{decodeError}</Text>
            </View>
          </View>
          <View className="px-4">
            <Button label={t('paymentDetails.goBack')} onPress={() => router.back()} fullWidth={true} variant="secondary" textClassName="text-base font-semibold text-white" size="lg" className="rounded-lg" />
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-gray-50">
        <Stack.Screen
          options={{
            headerTitle: () => <HeaderTitle title={t('paymentDetails.payViaLightning')} />,
            headerTitleAlign: 'center',
            headerLeft: HeaderLeft,
            headerShadowVisible: false,
          }}
        />
        <FocusAwareStatusBar style="dark" />
        <View className="flex-1">
          <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
            <View className="flex-1 bg-white px-4 py-6">
              <View className="mb-8">
                <Text className="mb-2 text-lg font-medium text-gray-900">{t('paymentDetails.to')}</Text>
                <Text className="text-base text-gray-600">{getDestinationDisplay()}</Text>
              </View>
              <View className="mb-6 flex-row items-center justify-between border-b border-gray-100 pb-6">
                <Text className="text-lg text-gray-600">{t('paymentDetails.amount')}</Text>
                <View className="items-end">
                  <Text className="text-lg font-medium text-gray-900">{convertMsatToSats(decodedInvoiceData?.amountMsat)} SAT</Text>
                  <Text className="text-sm text-gray-500">
                    {convertBitcoinToFiat(Number(convertMsatToSats(decodedInvoiceData?.amountMsat || 0)), BitcoinUnit.Sats, selectedFiatCurrency, bitcoinPrices).toLocaleString()} {selectedFiatCurrency}
                  </Text>
                </View>
              </View>
              <View className="mb-6 flex-row items-center justify-between border-b border-gray-100 pb-6">
                <Text className="text-lg text-gray-600">{t('paymentDetails.networkFee')}</Text>
                <View className="items-end">
                  <Text className="text-lg font-medium text-gray-900">{feesSat} SAT</Text>
                  <Text className="text-sm text-gray-500">
                    {convertBitcoinToFiat(Number(feesSat || 0), BitcoinUnit.Sats, selectedFiatCurrency, bitcoinPrices).toLocaleString()} {selectedFiatCurrency}
                  </Text>
                </View>
              </View>
              <View className="mb-6 flex-row items-center justify-between border-b border-gray-100 pb-6">
                <Text className="text-lg text-gray-600">{t('paymentDetails.total')}</Text>
                <View className="items-end">
                  <Text className="text-lg font-medium text-gray-900">{Number((feesSat || 0) + convertMsatToSats(decodedInvoiceData?.amountMsat || 0))} SAT</Text>
                  <Text className="text-sm text-gray-500">
                    {convertBitcoinToFiat(Number((feesSat || 0) + convertMsatToSats(decodedInvoiceData?.amountMsat || 0)), BitcoinUnit.Sats, selectedFiatCurrency, bitcoinPrices).toLocaleString()} {selectedFiatCurrency}
                  </Text>
                </View>
              </View>
              {decodedInvoiceData?.description && (
                <View className="mb-8">
                  <Text className="mb-2 text-lg font-medium text-gray-900">{t('paymentDetails.note')}</Text>
                  <Text className="text-base text-gray-600">{decodedInvoiceData.description}</Text>
                </View>
              )}
            </View>
          </ScrollView>
          <View className="border-t border-gray-100 bg-white px-4">
            {timeRemaining && (
              <View className="my-4 items-center">
                <Text className="text-sm text-gray-600">
                  {timeRemaining === t('paymentDetails.expired') ? (
                    <Text className="text-red-500">{t('paymentDetails.expiredMessage')}</Text>
                  ) : (
                    <>
                      {t('paymentDetails.expiresIn')} {timeRemaining}
                    </>
                  )}
                </Text>
              </View>
            )}
            <SlideToConfirm onConfirm={handleSendPayment} loading={paymentIsProcessing} />
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
