/* eslint-disable react-native/no-inline-styles */
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useContext } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { QuickActions } from '@/components/quick-actions';
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
  const { isSeedPhraseBackup, selectedCountry } = useContext(AppContext);
  const [notificationCount, _setNotificationCount] = React.useState(10);

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1">
        <FocusAwareStatusBar style="dark" />
        <View className="flex-1">
          <View className="flex flex-row items-center justify-between border-b border-neutral-200 px-4">
            <View className="flex  py-3">
              <Text className="text-2xl font-bold text-gray-800">Home</Text>
            </View>
            <Pressable className="relative" onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={24} color="gray" />
              {notificationCount > 0 && <View className="absolute -right-0.5 -top-1 size-3 items-center justify-center rounded-full bg-primary-600" />}
            </Pressable>
          </View>
          <View className="flex-1">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
              <View className="m-4">
                <WalletOverview />
                <View className="mb-8" />
                {!isSeedPhraseBackup && <SeedPhraseBackupNotification />}
                {isSeedPhraseBackup && selectedCountry.isoCode === 'CM' && <QuickActions />}
                <View className="mb-4" />
                <Pressable onPress={() => router.push('/wallets/ln-wallet-details')} className="rounded-xl bg-gray-50 p-2 ">
                  <View className="flex-row justify-between">
                    <Text className="mb-2 text-lg font-bold text-gray-600">Spending</Text>
                    <SvgComponent />
                  </View>
                  <WalletView name="Bitcoin" symbol="BTC" type="Lightning" />
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
