/* eslint-disable react-native/no-inline-styles */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SeedPhraseBackupNotification } from '@/components/seed-phrase-backup-notification';
import { colors, FocusAwareStatusBar, Pressable, SafeAreaView, ScrollView, Text, View } from '@/components/ui';
import { WalletOverview } from '@/components/wallet-overview';
import { WalletView } from '@/components/wallet-view';
import { AppContext, useBdk, useBreez } from '@/lib/context';
import { AppNetwork } from '@/lib/context/breez-context';

export default function Home() {
  const router = useRouter();
  const { isSeedPhraseBackup } = useContext(AppContext);
  const { balance: balanceBreez, isSyncing: isSyncingBreez, network } = useBreez();
  const { balance: balanceBdk, isSyncing: isSyncingBdk, syncWallet } = useBdk();
  const { t } = useTranslation();

  const handleSyncPress = async () => {
    await syncWallet();
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1">
        <FocusAwareStatusBar style="dark" />
        <View className="flex-1">
          <View className="flex flex-row items-center justify-between border-b border-neutral-200 px-4">
            <View className="flex py-3">
              <Text className="text-2xl font-bold text-gray-800">{t('home.title')}</Text>
            </View>
            <Pressable onPress={handleSyncPress} className="ml-2 mt-2" hitSlop={10} accessibilityLabel={t('home.syncWallet')}>
              <View className="relative items-center justify-center">
                <MaterialCommunityIcons name="sync" size={28} color={colors.primary[600]} className={`${isSyncingBreez || isSyncingBdk ? 'animate-spin' : ''}`} />
                {!isSyncingBreez && !isSyncingBdk && <View className="absolute right-0 top-0 size-3 rounded-full border-2 border-white bg-primary-600" style={{ zIndex: 2 }} />}
              </View>
            </Pressable>
          </View>
          {network === AppNetwork.TESTNET && (
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
                  <WalletView name={t('home.walletName')} symbol="BTC" type="On-chain" balanceSats={balanceBdk} />
                </Pressable>
                <View className="my-2" />
                <Pressable onPress={() => router.push('/wallets/ln-wallet-details')} className="rounded-xl bg-gray-50 p-2 ">
                  <WalletView name={t('home.l2WalletName')} symbol="BTC" type="Lightning" balanceSats={balanceBreez} lightningNetworkType="spark" />
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
