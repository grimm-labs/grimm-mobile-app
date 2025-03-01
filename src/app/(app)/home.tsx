/* eslint-disable react-native/no-inline-styles */
import { Balance } from 'bdk-rn/lib/classes/Bindings';
import type { Network } from 'bdk-rn/lib/lib/enums';
import React, { useEffect, useState } from 'react';

import HomeHeader from '@/components/home-header';
import { WalletOverview } from '@/components/wallet-overview';
import { WalletView } from '@/components/wallet-view';
import { createWallet, getBlockchain, getBlockchainConfig, useSelectedBitcoinNetwork } from '@/core';
import { useSeedPhrase } from '@/core/hooks/use-seed-phrase';
import { SafeAreaView, ScrollView, Text, View } from '@/ui';

export default function Home() {
  const [seedPhrase, _setSeedPhrase] = useSeedPhrase();
  const [selectedBitcoinNetwork, _setSelectedBitcoinNetwork] = useSelectedBitcoinNetwork();
  const [balance, setBalance] = useState<Balance>(new Balance(0, 0, 0, 0, 0));

  useEffect(() => {
    const syncWallet = async () => {
      if (seedPhrase && selectedBitcoinNetwork) {
        const wallet = await createWallet(seedPhrase, selectedBitcoinNetwork as Network);
        const blockchain = await getBlockchain(getBlockchainConfig());
        await wallet.sync(blockchain);
        const newBalance = await wallet.getBalance();
        setBalance(newBalance);
      }
    };
    syncWallet();
  }, [seedPhrase, selectedBitcoinNetwork]);

  return (
    <SafeAreaView className="h-full flex-1">
      <View className="flex">
        <HomeHeader />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 70 }}>
          <View className="m-4">
            <WalletOverview balance={balance} />
            {/* <QuickActions /> */}
            <View className="mb-4" />
            <View className="mb-4">
              <Text className="mb-2 text-lg font-medium">On-chain</Text>
              <WalletView name="Bitcoin" symbol="BTC" type="On-chain" balance={balance} />
            </View>
            <View>
              <Text className="mb-2 text-lg font-medium">Lightning</Text>
              <WalletView name="Bitcoin Lighning" symbol="BTC" type="Lightning" balance={balance} />
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
