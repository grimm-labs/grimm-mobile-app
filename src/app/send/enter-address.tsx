/* eslint-disable max-lines-per-function */
import { InputTypeVariant, parse } from '@breeztech/react-native-breez-sdk-liquid';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { Button, colors, FocusAwareStatusBar, SafeAreaView, showErrorMessage, View } from '@/components/ui';

export default function LightningPaymentScreen() {
  const router = useRouter();

  const [invoiceInput, setInvoiceInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [addressError, setAddressError] = useState(false);

  const handleInvoiceChange = (value: string) => {
    setInvoiceInput(value);
  };

  const handlePayment = async () => {
    if (!invoiceInput.trim()) {
      showErrorMessage('Please enter a valid Lightning invoice');
      return;
    }

    try {
      setIsLoading(true);
      setAddressError(false);
      const parsed = await parse(invoiceInput.trim());
      switch (parsed.type) {
        case InputTypeVariant.BITCOIN_ADDRESS:
          console.log(`Input is Bitcoin address ${parsed.address.address}`);
          showErrorMessage('Sorry, payment to a Bitcoin address is not supported yet');
          setAddressError(true);
          break;
        case InputTypeVariant.BOLT11:
          if (parsed.invoice.amountMsat === null) {
            showErrorMessage('Sorry, we are not supporting Zero-amount ligthning payment');
            setAddressError(true);
            return;
          }
          console.log(`Input is BOLT11 invoice for ${parsed.invoice.amountMsat != null ? parsed.invoice.amountMsat.toString() : 'unknown'} msats`);
          router.push({
            pathname: '/send/transaction-details',
            params: {
              rawInvoice: parsed.invoice.bolt11,
            },
          });
          break;
        default:
          showErrorMessage('Sorry, we do not support this Bitcoin or Lightning address');
          setAddressError(true);
          break;
      }
    } catch (error) {
      console.error('Payment preparation error:', error);
      setAddressError(true);
      showErrorMessage('Unable to prepare payment. Invalid Address');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white">
        <Stack.Screen
          options={{
            title: 'Lightning Payment',
            headerTitleAlign: 'center',
            headerLeft: HeaderLeft,
            headerShadowVisible: false,
          }}
        />
        <FocusAwareStatusBar style="dark" />
        <ScrollView className="flex-1 px-4 pt-8">
          <View className="mb-4">
            <View className="relative">
              <TextInput
                value={invoiceInput}
                onChangeText={handleInvoiceChange}
                className={`min-h-[120px] rounded-lg border bg-white p-4 text-base ${addressError ? 'border-red-400' : 'border-gray-300'}`}
                placeholder="Invoice | Lightning Address | BTC Address"
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {isLoading && <ActivityIndicator size="small" color={colors.primary[600]} />}

          <View>
            <Button label={isLoading ? 'Processing...' : 'Pay Invoice'} onPress={handlePayment} fullWidth={true} variant="secondary" textClassName="text-base text-white" size="lg" />
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
