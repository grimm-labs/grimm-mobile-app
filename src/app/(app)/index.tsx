/* eslint-disable react-native/no-inline-styles */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Easing } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SeedPhraseBackupNotification } from '@/components/seed-phrase-backup-notification';
import { colors, FocusAwareStatusBar, Pressable, SafeAreaView, ScrollView, Text, View } from '@/components/ui';
import { WalletOverview } from '@/components/wallet-overview';
import { WalletView } from '@/components/wallet-view';
import { AppContext, useBdk, useBreez } from '@/lib/context';
import { AppNetwork } from '@/lib/context/breez-context';

function SyncSpinnerIcon({ syncing, size, color }: { syncing: boolean; size: number; color: string }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!syncing) {
      spin.stopAnimation(() => spin.setValue(0));
      return undefined;
    }
    const timing = Animated.timing(spin, {
      toValue: 1,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
      isInteraction: false,
    });
    const loop = Animated.loop(timing, { resetBeforeIteration: true });
    loop.start();

    return () => {
      loop.stop();
      spin.stopAnimation(() => spin.setValue(0));
    };
  }, [spin, syncing]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <MaterialCommunityIcons name="sync" size={size} color={color} />
    </Animated.View>
  );
}

export default function Home() {
  const router = useRouter();
  const { isSeedPhraseBackup } = useContext(AppContext);
  const { balance: balanceBreez, isSyncing: isSyncingBreez, network } = useBreez();
  const { balance: balanceBdk, isSyncing: isSyncingBdk, syncWallet } = useBdk();
  const { t } = useTranslation();
  const syncing = isSyncingBreez || isSyncingBdk;

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
                <SyncSpinnerIcon syncing={syncing} size={28} color={colors.primary[600]} />
                {!syncing && <View className="absolute right-0 top-0 size-3 rounded-full border-2 border-white bg-primary-600" style={{ zIndex: 2 }} />}
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
                <Pressable onPress={() => router.push('/wallets/bitcoin-wallet-details')} className="rounded-xl border border-gray-100 bg-gray-50 p-2 ">
                  <WalletView name={t('home.walletName')} symbol="BTC" type="On-chain" balanceSats={balanceBdk} />
                </Pressable>
                <View className="my-2" />
                <Pressable onPress={() => router.push('/wallets/ln-wallet-details')} className="rounded-xl border border-gray-100 bg-gray-50 p-2">
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
