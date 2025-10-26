/* eslint-disable max-lines-per-function */
import { InputTypeVariant, parse } from '@breeztech/react-native-breez-sdk-liquid';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import validator from 'validator';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { Button, colors, FocusAwareStatusBar, SafeAreaView, showErrorMessage, View } from '@/components/ui';

const LightningPaymentScreenHeaderTitle = (title: string) => <HeaderTitle title={title} />;

type SearchParams = {
  input: string;
};

export default function LightningPaymentScreen() {
  const { t } = useTranslation();
  const { input } = useLocalSearchParams<SearchParams>();
  const router = useRouter();

  const [invoiceInput, setInvoiceInput] = useState(input || '');
  const [isLoading, setIsLoading] = useState(false);
  const [addressError, setAddressError] = useState(false);

  const handleInvoiceChange = (value: string) => {
    setInvoiceInput(value);
  };

  const handlePayment = async () => {
    if (!invoiceInput.trim()) {
      showErrorMessage(t('lightningPayment.errors.invalidInvoice'));
      setAddressError(true);
      return;
    }
    if (validator.isEmail(invoiceInput.trim())) {
      showErrorMessage(t('lightningPayment.errors.lightningAddressNotSupported'));
      setAddressError(true);
      return;
    }

    try {
      setIsLoading(true);
      setAddressError(false);
      const parsed = await parse(invoiceInput.trim());
      switch (parsed.type) {
        case InputTypeVariant.BITCOIN_ADDRESS:
          showErrorMessage(t('lightningPayment.errors.bitcoinNotSupported'));
          setAddressError(true);
          break;
        case InputTypeVariant.BOLT11:
          if (parsed.invoice.amountMsat === null) {
            showErrorMessage(t('lightningPayment.errors.zeroAmountNotSupported'));
            setAddressError(true);
            return;
          }
          router.push({
            pathname: '/send/transaction-details',
            params: {
              rawInvoice: parsed.invoice.bolt11,
            },
          });
          break;
        default:
          showErrorMessage(t('lightningPayment.errors.unsupportedAddress'));
          setAddressError(true);
          break;
      }
    } catch (error) {
      console.error('Payment preparation error:', error);
      setAddressError(true);
      showErrorMessage(t('lightningPayment.errors.preparePaymentFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white">
        <Stack.Screen
          options={{
            headerTitle: () => LightningPaymentScreenHeaderTitle(t('lightningPayment.title')),
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
                placeholder={t('lightningPayment.placeholder')}
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
              />
            </View>
          </View>

          {isLoading && <ActivityIndicator size="small" color={colors.primary[600]} />}

          <View>
            <Button label={isLoading ? t('lightningPayment.processing') : t('lightningPayment.payButton')} onPress={handlePayment} fullWidth={true} variant="secondary" textClassName="text-base text-white" size="lg" />
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
