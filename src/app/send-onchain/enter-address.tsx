/* eslint-disable max-lines-per-function */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
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

export default function EnterAddressScreen() {
  const { t } = useTranslation();
  const { input } = useLocalSearchParams<SearchParams>();
  const router = useRouter();
  // Same rules as every entry point: an Invoice pasted here opens the Lightning flow
  const { routeInput, methodSheet } = usePaymentInput({
    navigation: 'push',
    onError: (reason) => showErrorMessage(t(paymentInputErrorKey(reason, 'onchainSend.enterAddress.errors.invalidAddress'))),
  });

  const [addressInput, setAddressInput] = useState(input?.trim() || '');
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      await routeInput(addressInput);
    } finally {
      setIsLoading(false);
    }
  };

  const scanQRCode = async () => {
    router.push('/scan-qr');
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView testID="send-onchain-address-screen" className="flex-1 bg-white dark:bg-charcoal-950">
        <Stack.Screen
          options={{
            headerTitle: () => LightningPaymentScreenHeaderTitle(t('onchainSend.enterAddress.title')),
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
                testID="send-onchain-address-input"
                value={addressInput}
                onChangeText={setAddressInput}
                placeholder={t('onchainSend.enterAddress.placeholder')}
                suffix={
                  <View className="flex flex-row">
                    <Ionicons testID="send-onchain-address-scan" name="scan" size={24} color={colors.primary[600]} className="mr-4" onPress={scanQRCode} />
                  </View>
                }
              />
            </View>
          </View>
          {isLoading && <ActivityIndicator size="small" color={colors.primary[600]} />}
          <View>
            <Button
              testID="send-onchain-address-continue"
              label={t('onchainSend.enterAddress.continueButton')}
              disabled={isLoading}
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
