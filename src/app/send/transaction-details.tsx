/* eslint-disable react-native/no-inline-styles */
/* eslint-disable max-lines-per-function */
import type { LnInvoice } from '@breeztech/react-native-breez-sdk-liquid';
import { InputTypeVariant, parse } from '@breeztech/react-native-breez-sdk-liquid';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
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
  const router = useRouter();
  const { rawInvoice } = useLocalSearchParams<SearchParams>();

  const { selectedCountry } = useContext(AppContext);
  const { bitcoinPrices } = useBitcoin();

  const [isLoading, setIsLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [decodeError, setDecodeError] = useState<string | undefined>(undefined);
  const [feesSat, _setFeesSat] = useState(34);
  const [decodedInvoiceData, setDecodedInvoiceData] = useState<LnInvoice>();

  const selectedFiatCurrency = getFiatCurrency(selectedCountry);

  useEffect(() => {
    if (rawInvoice) {
      const parseInvoice = async () => {
        try {
          const parsed = await parse(rawInvoice.trim());
          if (parsed.type === InputTypeVariant.BOLT11 && parsed.invoice.amountMsat !== null) {
            setDecodedInvoiceData(parsed.invoice);
            // const prepareResponse = await prepareSendPayment({
            //   destination: parsed.invoice.bolt11,
            // });
            // setFeesSat(prepareResponse.feesSat || 0);
          } else {
            setDecodeError('Error while decoding LN invoice');
          }
        } catch (error) {
          if ((error as Error).message?.includes('not enough funds')) {
            setDecodeError('Cannot pay: not enough funds');
          } else {
            showErrorMessage('Invalid invoice data');
          }
          console.error('Error parsing invoice data:', (error as Error)?.message);
        } finally {
          setIsLoading(false);
        }
      };
      parseInvoice();
    }
  }, [rawInvoice, router]);

  useEffect(() => {
    if (!decodedInvoiceData?.expiry || !decodedInvoiceData?.timestamp) return;

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const expiryTime = decodedInvoiceData.timestamp + decodedInvoiceData.expiry;
      const remaining = expiryTime - now;

      if (remaining <= 0) {
        setTimeRemaining('Expired');
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
  }, [decodedInvoiceData]);

  const getDestinationDisplay = () => {
    if (decodedInvoiceData?.payeePubkey) {
      return decodedInvoiceData?.payeePubkey;
    }
    return 'Unknown';
  };

  const handleSendPayment = async () => {
    if (!decodedInvoiceData) {
      showErrorMessage('Invalid payment data');
      return;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView className="flex-1 bg-white">
          <FocusAwareStatusBar style="dark" />
          <Stack.Screen
            options={{
              title: 'Receive Bitcoin',
              headerTitleAlign: 'center',
              headerLeft: HeaderLeft,
              headerShadowVisible: false,
            }}
          />
          <View className="flex-1 items-center justify-center px-4">
            <ActivityIndicator size="large" color={colors.primary[600]} />
            <Text className="mt-4 text-lg text-gray-600">Loading Invoice</Text>
            <Text className="mt-2 text-center text-sm text-gray-400">Just a moment while we fetch your details...</Text>
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
              title: 'Payment Error',
              headerTitleAlign: 'center',
              headerLeft: HeaderLeft,
              headerShadowVisible: false,
            }}
          />
          <View className="flex-1 items-center justify-center px-6">
            <View className="mb-8 size-24 items-center justify-center rounded-full bg-red-100">
              <Ionicons name="alert-circle" size={48} color={colors.danger[500]} />
            </View>
            <Text className="mb-4 text-center text-2xl font-bold text-gray-900">Something went wrong</Text>
            <Text className="mb-8 text-center text-base leading-6 text-gray-600">We couldn't process your payment request. Please check your invoice and try again.</Text>
            <View className="mb-8 w-full rounded-lg bg-gray-50 p-4">
              <Text className="text-center text-sm text-gray-500">{decodeError}</Text>
            </View>
          </View>
          <View className="px-4 pb-8">
            <Button label="Go Back" onPress={() => router.back()} fullWidth={true} variant="secondary" textClassName="text-base font-semibold text-white" size="lg" className="rounded-lg" />
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
            title: 'Pay via lightning',
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
                <Text className="mb-2 text-lg font-medium text-gray-900">To</Text>
                <Text className="text-base text-gray-600">{getDestinationDisplay()}</Text>
              </View>
              <View className="mb-6 flex-row items-center justify-between border-b border-gray-100 pb-6">
                <Text className="text-lg text-gray-600">Amount</Text>
                <View className="items-end">
                  <Text className="text-lg font-medium text-gray-900">{decodedInvoiceData?.amountMsat} SAT</Text>
                  <Text className="text-sm text-gray-500">
                    {convertBitcoinToFiat(Number(decodedInvoiceData?.amountMsat || 0), BitcoinUnit.Sats, selectedFiatCurrency, bitcoinPrices).toLocaleString()} {selectedFiatCurrency}
                  </Text>
                </View>
              </View>
              <View className="mb-6 flex-row items-center justify-between border-b border-gray-100 pb-6">
                <Text className="text-lg text-gray-600">Network fee</Text>
                <View className="items-end">
                  <Text className="text-lg font-medium text-gray-900">{feesSat} SAT</Text>
                  <Text className="text-sm text-gray-500">
                    {convertBitcoinToFiat(Number(feesSat || 0), BitcoinUnit.Sats, selectedFiatCurrency, bitcoinPrices).toLocaleString()} {selectedFiatCurrency}
                  </Text>
                </View>
              </View>
              <View className="mb-6 flex-row items-center justify-between border-b border-gray-100 pb-6">
                <Text className="text-lg text-gray-600">Total</Text>
                <View className="items-end">
                  <Text className="text-lg font-medium text-gray-900">{Number((feesSat || 0) + (decodedInvoiceData?.amountMsat || 0))} SAT</Text>
                  <Text className="text-sm text-gray-500">
                    {convertBitcoinToFiat(Number((feesSat || 0) + (decodedInvoiceData?.amountMsat || 0)), BitcoinUnit.Sats, selectedFiatCurrency, bitcoinPrices).toLocaleString()} {selectedFiatCurrency}
                  </Text>
                </View>
              </View>
              {decodedInvoiceData?.description && (
                <View className="mb-8">
                  <Text className="mb-2 text-lg font-medium text-gray-900">Note</Text>
                  <Text className="text-base text-gray-600">{decodedInvoiceData.description}</Text>
                </View>
              )}
            </View>
          </ScrollView>
          <View className="border-t border-gray-100 bg-white px-4 pb-8 pt-4">
            {timeRemaining && (
              <View className="mb-6 items-center">
                <Text className="text-base text-gray-600">{timeRemaining === 'Expired' ? <Text className="text-red-500">This invoice has expired</Text> : <>This invoice expires in {timeRemaining}</>}</Text>
              </View>
            )}
            <SlideToConfirm onConfirm={handleSendPayment} />
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
