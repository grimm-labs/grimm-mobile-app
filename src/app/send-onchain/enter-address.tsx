/* eslint-disable max-lines-per-function */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { Button, colors, FocusAwareStatusBar, Input, SafeAreaView, showErrorMessage, View } from '@/components/ui';
import { useBreez } from '@/lib/context/breez-context';
import { InputType_Tags } from '@/lib/context/breez-context';

const LightningPaymentScreenHeaderTitle = (title: string) => <HeaderTitle title={title} />;

type SearchParams = {
  input: string;
};

export default function EnterAddressScreen() {
  const { t } = useTranslation();
  const { input } = useLocalSearchParams<SearchParams>();
  const router = useRouter();
  const { parseInput } = useBreez();

  const [addressInput, setAddressInput] = useState(input?.trim() || '');
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    if (!addressInput.trim()) {
      showErrorMessage(t('onchainSend.enterAddress.errors.invalidAddress'));
      return;
    }

    try {
      setIsLoading(true);
      const parsed = await parseInput(addressInput.trim());
      switch (parsed.tag) {
        case InputType_Tags.BitcoinAddress:
          router.push(`/send-onchain/enter-amount?recipientAddress=${encodeURIComponent(addressInput.trim())}`);
          break;
        default:
          showErrorMessage(t('onchainSend.enterAddress.errors.unsupportedAddress'));
          break;
      }
    } catch (error) {
      showErrorMessage(t('onchainSend.enterAddress.errors.addressVerificationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const scanQRCode = async () => {
    router.push('/scan-qr');
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white">
        <Stack.Screen
          options={{
            headerTitle: () => LightningPaymentScreenHeaderTitle(t('onchainSend.enterAddress.title')),
            headerTitleAlign: 'center',
            headerLeft: HeaderLeft,
            headerShadowVisible: false,
          }}
        />
        <FocusAwareStatusBar style="dark" />
        <ScrollView className="flex-1 px-4 pt-8">
          <View className="mb-2">
            <View className="relative">
              <Input
                value={addressInput}
                onChangeText={(text) => setAddressInput(text)}
                placeholder="Input address or Scan QR"
                placeholderTextColor="#9CA3AF"
                suffix={
                  <View className="flex flex-row">
                    <Ionicons name="scan" size={24} color={colors.primary[600]} className="mr-4" onPress={scanQRCode} />
                  </View>
                }
              />
            </View>
          </View>
          {isLoading && <ActivityIndicator size="small" color={colors.primary[600]} />}
          <View>
            <Button label="Continue" disabled={isLoading} onPress={handlePayment} fullWidth={true} variant="secondary" textClassName="text-base font-bold text-white" size="lg" />
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
