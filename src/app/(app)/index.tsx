/* eslint-disable react-native/no-inline-styles */
import { useRouter } from 'expo-router';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { SeedPhraseBackupNotification } from '@/components/seed-phrase-backup-notification';
import { FocusAwareStatusBar, Pressable, SafeAreaView, ScrollView, Text, View } from '@/components/ui';
import { WalletOverview } from '@/components/wallet-overview';
import { WalletView } from '@/components/wallet-view';
import { AppContext } from '@/lib/context';

const SvgComponent = () => {
  return (
    <Svg width={9} height={16} viewBox="0 0 9 16" fill="none">
      <Path d="M1 15.75a.75.75 0 01-.53-1.281l6.47-6.47L.47 1.53A.75.75 0 111.531.468l7 7a.75.75 0 010 1.061l-7 7A.745.745 0 011 15.75z" fill="#5A5A5A" />
    </Svg>
  );
};

export default function Home() {
  const router = useRouter();
  const { isSeedPhraseBackup } = useContext(AppContext);
  const { t } = useTranslation();

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1">
        <FocusAwareStatusBar style="dark" />
        <View className="flex-1">
          {/* Header */}
          <View className="flex flex-row items-center justify-between border-b border-neutral-200 px-4">
            <View className="flex py-3">
              <Text className="text-2xl font-bold text-gray-800">{t('home.title')}</Text>
            </View>
          </View>

          {/* Content */}
          <View className="flex-1">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
              <View className="m-4">
                <WalletOverview />
                <View className="mb-8" />
                {!isSeedPhraseBackup && <SeedPhraseBackupNotification />}
                <View className="mb-4" />
                <Pressable onPress={() => router.push('/wallets/ln-wallet-details')} className="rounded-xl bg-gray-50 p-2 ">
                  <View className="flex-row justify-between">
                    <Text className="mb-2 text-lg font-bold text-gray-600">{t('home.spending')}</Text>
                    <SvgComponent />
                  </View>
                  <WalletView name={t('home.walletName')} symbol="BTC" type="Lightning" />
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
