import React from 'react';

import HomeHeader from '@/components/home-header';
import { Wallet } from '@/components/wallet';
import { WalletOverview } from '@/components/wallet-overview';
import { SafeAreaView, ScrollView, Text, View } from '@/ui';

export default function Home() {
  return (
    <SafeAreaView className="flex-1">
      <View className="flex">
        <HomeHeader />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <WalletOverview />
          <View className="my-4" />
          <View className="">
            <View className="mx-4">
              <Text className="mb-4 text-base font-medium text-neutral-500">
                On-chain
              </Text>
              <Wallet
                name="Bitcoin"
                symbol="BTC"
                amount={0.30923849}
                type="On-chain"
              />
              <Text className="my-4 text-base font-medium text-neutral-500">
                Lightning & Liquid
              </Text>
              <View className="space-x-2">
                <Wallet
                  name="Bitcoin Lighning"
                  symbol="BTC"
                  amount={0.30923849}
                  type="Lightning"
                />
                <View className="my-2" />
                <Wallet
                  name="Liquid Network"
                  symbol="USDt"
                  amount={19.403}
                  type="Liquid"
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
