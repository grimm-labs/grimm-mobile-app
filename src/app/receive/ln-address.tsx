/* eslint-disable react/no-unstable-nested-components */
import * as Clipboard from 'expo-clipboard';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { showMessage } from 'react-native-flash-message';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { Button, FocusAwareStatusBar, SafeAreaView, Text, TouchableOpacity, View } from '@/components/ui';
import { useBreez } from '@/lib/context/breez-context';
import { useStackScreenOptions } from '@/lib/stack-screen-options';
import { theme } from '@/lib/theme-classes';

const LnAddressDetails = ({ lightningAddress }: { lightningAddress: string }) => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View className="items-center pt-8">
      <View testID="ln-address-qr" className={`mb-8 rounded-2xl border bg-white p-6 dark:bg-charcoal-900 ${theme.border}`}>
        <QRCode value={lightningAddress} size={250} backgroundColor="white" color="black" />
      </View>
      <Text className={`mb-2 text-base ${theme.textMuted}`}>{t('lnAddressScreen.addressLabel')}</Text>
      <Text testID="ln-address-value" selectable className={`mb-3 text-center text-2xl font-bold ${theme.textPrimary}`}>
        {lightningAddress}
      </Text>
      <TouchableOpacity testID="ln-address-custom" onPress={() => router.push('/settings/ln-address')} activeOpacity={0.7}>
        <Text className="text-base text-primary-600 dark:text-primary-400">{t('lnAddressScreen.getCustomAddress')}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function LnAddressScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { lightningAddress } = useBreez();
  const stackScreenOptions = useStackScreenOptions();

  const handleCopy = async () => {
    if (lightningAddress) {
      await Clipboard.setStringAsync(lightningAddress);
      showMessage({
        message: t('receive_payment.copied'),
        type: 'success',
        duration: 2000,
      });
    }
  };

  const handleAddDetails = () => router.push({ pathname: '/receive/amount-description', params: { type: 'lightning' } });

  return (
    <SafeAreaProvider>
      <SafeAreaView testID="ln-address-screen" className={`flex-1 ${theme.screen}`}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitleAlign: 'center',
            headerTitle: () => <HeaderTitle title={t('lnAddressScreen.title')} />,
            headerLeft: HeaderLeft,
            headerShadowVisible: false,
            ...stackScreenOptions,
          }}
        />
        <FocusAwareStatusBar />
        {lightningAddress ? (
          <View className="flex-1 justify-between px-4">
            <LnAddressDetails lightningAddress={lightningAddress} />
            <View className="pb-4">
              <Button testID="ln-address-copy" label={t('lnAddressScreen.copy')} fullWidth size="lg" variant="outline" textClassName="text-base" onPress={handleCopy} />
              <Button testID="ln-address-add-details" label={t('lnAddressScreen.addDetails')} fullWidth size="lg" variant="secondary" textClassName="text-base text-white" onPress={handleAddDetails} />
            </View>
          </View>
        ) : null}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
