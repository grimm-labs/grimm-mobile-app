/* eslint-disable react-native/no-inline-styles */
import { LiquidNetwork } from '@breeztech/react-native-breez-sdk-liquid';
import { useRouter } from 'expo-router';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SeedPhraseBackupNotification } from '@/components/seed-phrase-backup-notification';
import { FocusAwareStatusBar, Pressable, SafeAreaView, ScrollView, Text, View } from '@/components/ui';
import { WalletOverview } from '@/components/wallet-overview';
import { WalletView } from '@/components/wallet-view';
import { AppContext, useBdk, useBreez } from '@/lib/context';
import { convertBtcToSats } from '@/lib/utils';

export default function Home() {
  const router = useRouter();
  const { isSeedPhraseBackup } = useContext(AppContext);
  const { balance: balanceBreez, liquidNetwork } = useBreez();
  const { balance: balanceBdk } = useBdk();
  const { t } = useTranslation();

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1">
        <FocusAwareStatusBar style="dark" />
        <View className="flex-1">
          <View className="flex flex-row items-center justify-between border-b border-neutral-200 px-4">
            <View className="flex py-3">
              <Text className="text-2xl font-bold text-gray-800">{t('home.title')}</Text>
            </View>
          </View>
          {liquidNetwork === LiquidNetwork.TESTNET && (
            <View className="bg-danger-500 py-2">
              <Text className="text-center text-sm font-semibold text-white">{t('home.networkWarning')}</Text>
            </View>
          )}
          <View className="flex-1">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
              <View className="m-4">
                <WalletOverview />
                <View className="mb-8" />
                {!isSeedPhraseBackup && <SeedPhraseBackupNotification />}
                <View className="mb-4" />
                <View className="mb-4 flex-row items-center justify-between">
                  <Text className="text-xl font-bold text-gray-600">{t('home.accounts')}</Text>
                </View>
                <Pressable onPress={() => router.push('/wallets/bitcoin-wallet-details')} className="rounded-xl bg-gray-50 p-2 ">
                  <WalletView name={t('home.walletName')} symbol="BTC" type="On-chain" balanceSats={convertBtcToSats(balanceBdk)} />
                </Pressable>
                <View className="my-2" />
                <Pressable onPress={() => router.push('/wallets/ln-wallet-details')} className="rounded-xl bg-gray-50 p-2 ">
                  <WalletView name={t('home.l2WalletName')} symbol="L-BTC" type="Lightning" balanceSats={balanceBreez} />
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
