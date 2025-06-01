/* eslint-disable max-lines-per-function */
import type { ReceiveAmount } from '@breeztech/react-native-breez-sdk-liquid';
import { PaymentMethod, prepareReceivePayment, ReceiveAmountVariant, receivePayment } from '@breeztech/react-native-breez-sdk-liquid';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Clipboard, Pressable, SafeAreaView, ScrollView, Share } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import QRCode from 'react-native-qrcode-svg';

import { HeaderLeft } from '@/components/back-button';
import { Button, colors, FocusAwareStatusBar, Text, View } from '@/components/ui';
import { convertBitcoinToFiat, getFiatCurrency } from '@/lib';
import { AppContext } from '@/lib/context';
import { useBitcoin } from '@/lib/context/bitcoin-prices-context';
import { BitcoinUnit } from '@/types/enum';

type SearchParams = {
  satsAmount: string;
  note?: string;
};

export default function ReceivePaymentScreen() {
  const { selectedCountry, bitcoinUnit } = useContext(AppContext);
  const router = useRouter();
  const { bitcoinPrices } = useBitcoin();
  const { satsAmount, note } = useLocalSearchParams<SearchParams>();
  const [loading, setLoading] = useState(true);
  const [paymentRequest, setPaymentRequest] = useState<string>('');
  const [fees, setFees] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const defaultNotes = `Grimm App Payment of ${satsAmount} sats`;

  const selectedFiatCurrency = getFiatCurrency(selectedCountry);

  const generatePaymentRequest = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      if (!satsAmount || parseInt(satsAmount, 10) <= 0) {
        throw new Error('Invalid amount');
      }

      const optionalAmount: ReceiveAmount = {
        type: ReceiveAmountVariant.BITCOIN,
        payerAmountSat: Number(satsAmount),
      };

      const prepareResponse = await prepareReceivePayment({
        paymentMethod: PaymentMethod.BOLT11_INVOICE,
        amount: optionalAmount,
      });

      setFees(prepareResponse.feesSat);

      const receiveResponse = await receivePayment({
        prepareResponse,
        description: note || defaultNotes,
      });

      setPaymentRequest(receiveResponse.destination);
    } catch (err) {
      console.error('Error generating invoice:', err);
      setError(err instanceof Error ? err.message : 'Error generating invoice');
    } finally {
      setLoading(false);
    }
  }, [satsAmount, note, defaultNotes]);

  useEffect(() => {
    generatePaymentRequest();
  }, [generatePaymentRequest]);

  const copyToClipboard = async () => {
    if (paymentRequest) {
      await Clipboard.setString(paymentRequest);
      showMessage({ message: 'Payment address has been copied to clipboard', type: 'success', duration: 2000 });
    }
  };

  const sharePaymentRequest = async () => {
    if (paymentRequest) {
      try {
        await Share.share({
          message: paymentRequest,
          title: 'Lightning Payment Request',
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
    router.replace('/');
  };

  if (loading) {
    return (
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
          <Text className="mt-4 text-lg text-gray-600">Generating invoice...</Text>
          <Text className="mt-2 text-center text-sm text-gray-400">Creating your payment QR Code</Text>
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
            title: 'Error',
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
            <Text className="mb-2 text-xl font-semibold text-gray-800">Generation Error</Text>
            <Text className="mb-6 text-center text-gray-600">{error}</Text>
          </View>

          <View className="mb-8">
            <Button label="Try Again" onPress={handleRetry} fullWidth={true} variant="secondary" textClassName="text-base text-white" size="lg" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
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

      <View className="flex-1">
        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          {/* Amount Information */}
          <View className="mb-4 mt-3">
            <View className="items-center rounded-2xl p-6">
              <Text className="mb-2 text-4xl font-light text-gray-800">{parseInt(satsAmount, 10).toLocaleString()} SATS</Text>
              <Text className="text-lg text-gray-500">
                {convertBitcoinToFiat(Number(satsAmount), bitcoinUnit, selectedFiatCurrency, bitcoinPrices).toFixed(2)} {selectedFiatCurrency}
              </Text>
              <View className="mt-4 rounded-lg bg-white p-3">
                <Text className="text-sm text-gray-600">{note || defaultNotes}</Text>
              </View>
            </View>
          </View>

          {/* QR Code */}
          <View className="mb-8 items-center">
            <View className=" bg-white p-6">{paymentRequest && <QRCode value={paymentRequest} size={250} backgroundColor="white" color="black" />}</View>
            <Text className="mt-4 text-center text-sm text-gray-500">Scan this QR Code to make the payment</Text>
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
              A {fees} sats ({convertBitcoinToFiat(fees, BitcoinUnit.Sats, selectedFiatCurrency, bitcoinPrices).toFixed(2)} {selectedFiatCurrency}) fee will be applied to this invoice. Please keep Grimm App open until
              payment is complete
            </Text>
          </View>
        </ScrollView>

        <View className="px-4 pb-4">
          <Button label="Close" disabled={!isValidAmount()} onPress={handleSubmit} fullWidth={true} variant="secondary" textClassName="text-base text-white" size="lg" />
        </View>
      </View>
    </SafeAreaView>
  );
}
