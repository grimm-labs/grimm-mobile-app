/* eslint-disable max-lines-per-function */
/* eslint-disable react/no-unstable-nested-components */
import * as Clipboard from 'expo-clipboard';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { useBreez } from '@/lib/context/breez-context';

export default function LnAddressScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { lightningAddress } = useBreez();

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
      <SafeAreaView className="flex-1 bg-gray-50">
        <FocusAwareStatusBar style="dark" />
        <Stack.Screen
          options={{
            headerTitle: () => <HeaderTitle title={t('lnAddressScreen.title')} />,
            headerTitleAlign: 'center',
            headerLeft: HeaderLeft,
            headerShadowVisible: false,
            headerStyle: { backgroundColor: '#f9fafb' },
          }}
        />
        <View className="flex-1 items-center px-4">
          {lightningAddress ? (
            <View className="flex-1 items-center pt-8">
              {/* QR Code */}
              <View className="mb-8 rounded-2xl bg-white p-6">
                <QRCode value={lightningAddress} size={250} backgroundColor="white" color="black" logoSize={40} logoBackgroundColor="white" logoBorderRadius={20} />
              </View>

              {/* Lightning Address Label */}
              <Text className="mb-2 text-base text-gray-400">{t('lnAddressScreen.addressLabel')}</Text>

              {/* Lightning Address */}
              <Text className="mb-3 text-center text-2xl font-bold text-gray-900">{lightningAddress}</Text>

              {/* Custom address link */}
              <TouchableOpacity onPress={() => router.push('/settings/ln-address')} activeOpacity={0.7}>
                <Text className="text-base text-primary-500">{t('lnAddressScreen.getCustomAddress')}</Text>
              </TouchableOpacity>

              <View className="flex-1" />

              {/* Action Buttons */}
              <View className="mb-8 w-full flex-row justify-center gap-4 px-4">
                <TouchableOpacity className="flex-1 items-center rounded-full bg-gray-200 py-4" onPress={handleCopy} activeOpacity={0.7}>
                  <Text className="text-base font-semibold text-gray-900">{t('lnAddressScreen.copy')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 items-center rounded-full bg-gray-200 py-4"
                  onPress={() =>
                    router.push({
                      pathname: '/receive/amount-description',
                      params: { type: 'lightning' },
                    })
                  }
                  activeOpacity={0.7}
                >
                  <Text className="text-base font-semibold text-gray-900">{t('lnAddressScreen.addDetails')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
