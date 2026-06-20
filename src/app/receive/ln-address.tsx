/* eslint-disable max-lines-per-function */
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

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-charcoal-900">
        <FocusAwareStatusBar />
        <Stack.Screen
          options={{
            headerTitle: () => <HeaderTitle title={t('lnAddressScreen.title')} />,
            headerTitleAlign: 'center',
            headerLeft: HeaderLeft,
            ...stackScreenOptions,
          }}
        />
        <View className="flex-1 items-center px-4">
          {lightningAddress ? (
            <View className="flex-1 items-center pt-8">
              {/* QR Code */}
              <View className="mb-8 rounded-2xl bg-white p-6 dark:bg-charcoal-900">
                <QRCode value={lightningAddress} size={250} backgroundColor="white" color="black" logoSize={40} logoBackgroundColor="white" logoBorderRadius={20} />
              </View>

              {/* Lightning Address Label */}
              <Text className="mb-2 text-base text-gray-400 dark:text-charcoal-500">{t('lnAddressScreen.addressLabel')}</Text>

              {/* Lightning Address */}
              <Text className="mb-3 text-center text-2xl font-bold text-gray-900 dark:text-charcoal-100">{lightningAddress}</Text>

              {/* Custom address link */}
              <TouchableOpacity onPress={() => router.push('/settings/ln-address')} activeOpacity={0.7}>
                <Text className="text-base text-primary-600 dark:text-primary-400">{t('lnAddressScreen.getCustomAddress')}</Text>
              </TouchableOpacity>

              <View className="flex-1" />

              {/* Action Buttons */}
              <View className="mb-8 w-full flex-row justify-center gap-4 px-4">
                <Button label={t('lnAddressScreen.copy')} variant="outline" fullWidth={false} className="my-0 flex-1" textClassName="text-base font-semibold" onPress={handleCopy} />
                <Button
                  label={t('lnAddressScreen.addDetails')}
                  variant="default"
                  fullWidth={false}
                  className="my-0 flex-1"
                  textClassName="text-base font-semibold"
                  onPress={() =>
                    router.push({
                      pathname: '/receive/amount-description',
                      params: { type: 'lightning' },
                    })
                  }
                />
              </View>
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
