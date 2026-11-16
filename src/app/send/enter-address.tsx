/* eslint-disable react-native/no-inline-styles */
/* eslint-disable max-lines-per-function */
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { PaymentMethodBottomSheet } from '@/components/modal/payment-method-bottom-sheet';
import { Button, colors, FocusAwareStatusBar, Input, SafeAreaView, showErrorMessage, View } from '@/components/ui';
import { usePaymentInput } from '@/lib/hooks/use-payment-input';
import { paymentInputErrorKey } from '@/lib/payment-input/error-messages';

const LightningPaymentScreenHeaderTitle = (title: string) => <HeaderTitle title={title} />;

type SearchParams = {
  input: string;
};

export default function LightningPaymentScreen() {
  const { t } = useTranslation();
  const { input } = useLocalSearchParams<SearchParams>();
  const { routeInput, methodSheet } = usePaymentInput({
    navigation: 'push',
    // The screen stays as it is, with the input, so the user can correct it
    onError: (reason) => showErrorMessage(t(paymentInputErrorKey(reason, 'lightningPayment.errors.invalidInvoice'))),
  });

  const [invoiceInput, setInvoiceInput] = useState(input || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleInvoiceChange = (value: string) => {
    setInvoiceInput(value);
  };

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      await routeInput(invoiceInput);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView testID="send-ln-address-screen" className="flex-1 bg-white dark:bg-charcoal-950">
        <Stack.Screen
          options={{
            headerTitle: () => LightningPaymentScreenHeaderTitle(t('lightningPayment.title')),
            headerTitleAlign: 'center',
            headerLeft: HeaderLeft,
            headerShadowVisible: false,
          }}
        />
        <FocusAwareStatusBar />
        <ScrollView className="flex-1 px-4 pt-8">
          <View className="mb-2">
            <View className="relative">
              <Input
                testID="send-ln-address-input"
                value={invoiceInput}
                onChangeText={handleInvoiceChange}
                placeholder={t('lightningPayment.placeholder')}
                multiline
                textAlignVertical="top"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                style={{ minHeight: 120 }}
              />
            </View>
          </View>

          {isLoading && <ActivityIndicator size="small" color={colors.primary[600]} />}

          <View>
            <Button
              testID="send-ln-address-continue"
              label={isLoading ? t('lightningPayment.processing') : t('lightningPayment.payButton')}
              onPress={handlePayment}
              fullWidth={true}
              variant="secondary"
              textClassName="text-base font-bold text-white"
              size="lg"
            />
          </View>
        </ScrollView>
        <PaymentMethodBottomSheet ref={methodSheet.ref} mode="send" onSelect={methodSheet.onSelect} onDismiss={methodSheet.onDismiss} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
