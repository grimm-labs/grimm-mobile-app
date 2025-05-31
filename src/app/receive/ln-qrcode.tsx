/* eslint-disable max-lines-per-function */
import type { ReceiveAmount } from '@breeztech/react-native-breez-sdk-liquid';
import { PaymentMethod, prepareReceivePayment, ReceiveAmountVariant, receivePayment } from '@breeztech/react-native-breez-sdk-liquid';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Clipboard, Pressable, SafeAreaView, ScrollView, Share } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { HeaderLeft } from '@/components/back-button';
import { Button, colors, FocusAwareStatusBar, Text, View } from '@/components/ui';

type SearchParams = {
  satsAmount: string;
  note?: string;
};

export default function ReceivePaymentScreen() {
  const { satsAmount, note } = useLocalSearchParams<SearchParams>();
  const [loading, setLoading] = useState(true);
  const [paymentRequest, setPaymentRequest] = useState<string>('');
  const [error, setError] = useState<string>('');

  const generatePaymentRequest = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      if (!satsAmount || parseInt(satsAmount, 10) <= 0) {
        throw new Error('Invalid amount');
      }

      // Prepare the amount to receive
      const optionalAmount: ReceiveAmount = {
        type: ReceiveAmountVariant.BITCOIN,
        payerAmountSat: Number(satsAmount),
      };

      // Prepare payment reception
      const prepareResponse = await prepareReceivePayment({
        paymentMethod: PaymentMethod.BOLT11_INVOICE,
        amount: optionalAmount,
      });

      console.log(`Receiving fees: ${prepareResponse.feesSat} sats`);

      // Create the payment invoice
      const receiveResponse = await receivePayment({
        prepareResponse,
        description: note || `Payment of ${satsAmount} SATS`,
      });

      setPaymentRequest(receiveResponse.destination);
    } catch (err) {
      console.error('Error generating invoice:', err);
      setError(err instanceof Error ? err.message : 'Error generating invoice');
    } finally {
      setLoading(false);
    }
  }, [satsAmount, note]);

  useEffect(() => {
    generatePaymentRequest();
  }, [generatePaymentRequest]);

  const copyToClipboard = async () => {
    if (paymentRequest) {
      await Clipboard.setString(paymentRequest);
      Alert.alert('Copied', 'Payment address has been copied to clipboard');
    }
  };

  const sharePaymentRequest = async () => {
    if (paymentRequest) {
      try {
        await Share.share({
          message: `Lightning Payment: ${paymentRequest}`,
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
          <Text className="mt-2 text-center text-sm text-gray-400">Creating your payment QR code</Text>
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

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Amount Information */}
        <View className="mb-8 mt-6">
          <View className="items-center rounded-2xl p-6">
            <Text className="mb-2 text-4xl font-light text-gray-800">{parseInt(satsAmount, 10).toLocaleString()} SATS</Text>
            <Text className="text-lg text-gray-500">2,000 FCFA</Text>
            {note && (
              <View className="mt-4 rounded-lg bg-white p-3">
                <Text className="text-sm text-gray-600">{note}</Text>
              </View>
            )}
          </View>
        </View>

        {/* QR Code */}
        <View className="mb-8 items-center">
          <View className=" bg-white p-6">{paymentRequest && <QRCode value={paymentRequest} size={250} backgroundColor="white" color="black" />}</View>
          <Text className="mt-4 text-center text-sm text-gray-500">Scan this QR code to make the payment</Text>
        </View>

        <View className="flex flex-row justify-evenly">
          <View className="flex items-center justify-center">
            <Pressable className="mb-2 rounded-full bg-primary-600 p-3 text-white" onPress={copyToClipboard}>
              <Ionicons name="copy" size={20} color="white" />
            </Pressable>
            <Text className="text-sm font-medium">Copy</Text>
          </View>
          <View className="flex items-center justify-center">
            <Pressable className="mb-2 rounded-full bg-primary-600 p-3 text-white" onPress={sharePaymentRequest}>
              <Ionicons name="share" size={20} color="white" />
            </Pressable>
            <Text className="text-sm font-medium">Share</Text>
          </View>
        </View>

        {/* Additional Information */}
        <View className="my-4 rounded-lg bg-blue-50 p-4">
          <Text className="text-sm text-blue-700">A 24 sats fee will be applied to this invoice. Please keep Grimm App open until payment is complete.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
