/* eslint-disable react-native/no-inline-styles */
import Ionicons from '@expo/vector-icons/Ionicons';
import BigNumber from 'bignumber.js';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';

import { FocusAwareStatusBar, Pressable, SafeAreaView, ScrollView, Text, View } from '@/components/ui';
import { WalletOverview } from '@/components/wallet-overview';
import { WalletView } from '@/components/wallet-view';
import type { TBalance } from '@/types';

export default function Home() {
  const router = useRouter();
  const [notificationCount, _setNotificationCount] = React.useState(10);
  const [balance] = useState<TBalance>({ onchain: BigNumber(1002), lightning: BigNumber(1909303) });

  return (
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
        <View className=" flex-1">
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
            <View className="m-4">
              <WalletOverview balance={balance} />
              {/* <QuickActions /> */}
              <View className="mb-4" />
              <View className="mb-4">
                <Text className="mb-2 text-lg font-medium">On-chain</Text>
                <WalletView name="Bitcoin" symbol="BTC" type="On-chain" balance={balance.onchain.toNumber()} />
              </View>
              <View>
                <Text className="mb-2 text-lg font-medium">Lightning</Text>
                <WalletView name="Bitcoin Lighning" symbol="BTC" type="Lightning" balance={balance.lightning.toNumber()} />
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}
