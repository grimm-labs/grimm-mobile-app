/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable max-lines-per-function */
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
import type { Bolt11InvoiceDetails, PrepareLnurlPayResponse, PrepareSendPaymentResponse } from '@/lib/context/breez-context';
import { useBreez } from '@/lib/context/breez-context';
import { InputType_Tags } from '@/lib/context/breez-context';
import { BitcoinUnit } from '@/types/enum';

type SearchParams = {
  rawInvoice?: string;
  lightningAddress?: string;
  amountSats?: string;
};

export default function PaymentDetailsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { rawInvoice, lightningAddress, amountSats } = useLocalSearchParams<SearchParams>();

  const { selectedCountry } = useContext(AppContext);
  const { bitcoinPrices } = useBitcoin();
  const { parseInput, prepareSend, executeSend, prepareLnurlPay, executeLnurlPay, balance } = useBreez();

  const [isLoading, setIsLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [decodeError, setDecodeError] = useState<string | undefined>(undefined);
  const [feesSat, setFeesSat] = useState(0);
  const [decodedInvoiceData, setDecodedInvoiceData] = useState<Bolt11InvoiceDetails>();
  const [paymentIsProcessing, setPaymentIsProcessing] = useState(false);
  const [savedPrepareResponse, setSavedPrepareResponse] = useState<PrepareSendPaymentResponse | null>(null);
  const [savedLnurlPrepareResponse, setSavedLnurlPrepareResponse] = useState<PrepareLnurlPayResponse | null>(null);

  const convertMsatToSats = (msat: bigint | undefined) => {
    if (msat === undefined) return 0;
    return Number(msat / 1000n);
  };

  const isLnAddress = !!lightningAddress && !!amountSats;
  const selectedFiatCurrency = getFiatCurrency(selectedCountry);
  const amountSat = isLnAddress ? Number(amountSats) : convertMsatToSats(decodedInvoiceData?.amountMsat || 0n);
  const totalAmountSat = Number((feesSat || 0) + amountSat);
  const hasInsufficientBalance = totalAmountSat > balance;

  useEffect(() => {
    const prepareLnAddress = async () => {
      if (!lightningAddress || !amountSats) return;
      try {
        const parsed = await parseInput(lightningAddress);
        let payRequest;
        if (parsed.tag === InputType_Tags.LightningAddress) {
          payRequest = parsed.inner[0].payRequest;
        } else if (parsed.tag === InputType_Tags.LnurlPay) {
          payRequest = parsed.inner[0];
        } else {
          setDecodeError(t('paymentDetails.errors.decode'));
          return;
        }
        const prepareResponse = await prepareLnurlPay(Number(amountSats), payRequest);
        setFeesSat(Number(prepareResponse.feeSats));
        setSavedLnurlPrepareResponse(prepareResponse);
      } catch (error) {
        if ((error as Error).message?.includes('not enough funds')) {
          setDecodeError(t('paymentDetails.errors.notEnoughFunds'));
        } else {
          showErrorMessage(t('paymentDetails.errors.invalidData'));
          console.error('Error preparing LN address payment:', (error as Error)?.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    const parseInvoice = async () => {
      if (!rawInvoice) return;
      try {
        const parsed = await parseInput(rawInvoice.trim());
        if (parsed.tag === InputType_Tags.Bolt11Invoice && parsed.inner[0].amountMsat !== undefined) {
          setDecodedInvoiceData(parsed.inner[0]);
          const prepareResponse = await prepareSend(parsed.inner[0].invoice.bolt11);
          const method = prepareResponse.paymentMethod;
          let totalFees = 0;
          if (method && 'inner' in method) {
            const inner = method.inner as any;
            totalFees = Number(inner.sparkTransferFeeSats || 0n) + Number(inner.lightningFeeSats || 0n);
          }
          setFeesSat(totalFees);
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

    if (isLnAddress) {
      prepareLnAddress();
    } else if (rawInvoice) {
      parseInvoice();
    }
  }, [parseInput, prepareSend, prepareLnurlPay, rawInvoice, lightningAddress, amountSats, isLnAddress, router, t]);

  useEffect(() => {
    if (!decodedInvoiceData?.expiry || !decodedInvoiceData?.timestamp) return;

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const expiryTime = Number(decodedInvoiceData.timestamp) + Number(decodedInvoiceData.expiry);
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
    if (isLnAddress) {
      return lightningAddress;
    }
    if (decodedInvoiceData?.payeePubkey) {
      return decodedInvoiceData?.payeePubkey;
    }
    return t('paymentDetails.unknown');
  };

  const handleSendPayment = async () => {
    if (!isLnAddress && !decodedInvoiceData) {
      showErrorMessage(t('paymentDetails.errors.invalidPayment'));
      return;
    }

    setPaymentIsProcessing(true);
    try {
      if (isLnAddress && savedLnurlPrepareResponse) {
        const payment = await executeLnurlPay(savedLnurlPrepareResponse);
        if (payment) {
          router.push({
            pathname: '/transaction-result/success-screen',
            params: { transactionType: 'sent', satsAmount: Number(payment.amount).toString() },
          });
        }
      } else if (savedPrepareResponse) {
        const sendResponse = await executeSend(savedPrepareResponse);
        const payment = sendResponse.payment;
        if (payment) {
          router.push({
            pathname: '/transaction-result/success-screen',
            params: { transactionType: 'sent', satsAmount: Number(payment.amount).toString() },
          });
        }
      }
    } finally {
      setPaymentIsProcessing(false);
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
                  <Text className="text-lg font-medium text-gray-900">{amountSat} SAT</Text>
                  <Text className="text-sm text-gray-500">
                    {convertBitcoinToFiat(amountSat, BitcoinUnit.Sats, selectedFiatCurrency, bitcoinPrices).toLocaleString()} {selectedFiatCurrency}
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
                  <Text className="text-lg font-medium text-gray-900">{totalAmountSat} SAT</Text>
                  <Text className="text-sm text-gray-500">
                    {convertBitcoinToFiat(totalAmountSat, BitcoinUnit.Sats, selectedFiatCurrency, bitcoinPrices).toLocaleString()} {selectedFiatCurrency}
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
            {!isLnAddress && timeRemaining && (
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
            {hasInsufficientBalance ? (
              <View className="mb-4 p-3">
                <Text className="text-center text-sm font-medium text-red-500">{t('paymentDetails.errors.notEnoughFunds')}</Text>
              </View>
            ) : (
              <SlideToConfirm onConfirm={handleSendPayment} loading={paymentIsProcessing} />
            )}
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
