/* eslint-disable react/no-unstable-nested-components */
import { Stack } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import DetailRow from '@/app/transaction-details/detail-row';
import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { FocusAwareStatusBar, SafeAreaView } from '@/components/ui';
import { useBreez } from '@/lib/context';

export default function BreezSdkDetailsScreen() {
  const { t } = useTranslation();
  const { breezWalletInfos } = useBreez();

  const screenOptions = useMemo(
    () => ({
      headerTitle: () => <HeaderTitle title={t('breezDetails.header_title')} />,
      headerTitleAlign: 'center' as const,
      headerShown: true,
      headerShadowVisible: false,
      headerLeft: HeaderLeft,
    }),
    [t],
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white">
        <Stack.Screen options={screenOptions} />
        <FocusAwareStatusBar style="dark" />
        <ScrollView className="flex-1 px-3" showsVerticalScrollIndicator={false}>
          <View className="mb-6 mt-4">
            <DetailRow label={t('breezDetails.public_key')} value={breezWalletInfos?.walletInfo.pubkey || ''} expandable />
            <DetailRow label={t('breezDetails.fingerprint')} value={breezWalletInfos?.walletInfo.fingerprint || ''} expandable />
            <DetailRow label={t('breezDetails.balance')} value={breezWalletInfos?.walletInfo.balanceSat.toString() || ''} expandable />
            <DetailRow label={t('breezDetails.liquid_tip')} value={breezWalletInfos?.blockchainInfo.bitcoinTip.toString() || ''} copyable expandable />
            <DetailRow label={t('breezDetails.bitcoin_tip')} value={breezWalletInfos?.blockchainInfo.liquidTip.toString() || ''} copyable expandable />
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
