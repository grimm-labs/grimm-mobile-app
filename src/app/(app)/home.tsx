/* eslint-disable react-native/no-inline-styles */
import { Blockchain } from 'bdk-rn';
import { Balance } from 'bdk-rn/lib/classes/Bindings';
import type { BlockchainElectrumConfig } from 'bdk-rn/lib/lib/enums';
import type { Network } from 'bdk-rn/lib/lib/enums';
import React, { useEffect, useState } from 'react';

import HomeHeader from '@/components/home-header';
import { WalletOverview } from '@/components/wallet-overview';
import { WalletView } from '@/components/wallet-view';
import { createWallet, useSelectedBitcoinNetwork } from '@/core';
import { useSeedPhrase } from '@/core/hooks/use-seed-phrase';
import { SafeAreaView, ScrollView, Text, View } from '@/ui';

export default function Home() {
  const [seedPhrase, _setSeedPhrase] = useSeedPhrase();
  const [selectedBitcoinNetwork, _setSelectedBitcoinNetwork] = useSelectedBitcoinNetwork();
  const [balance, setBalance] = useState<Balance>(new Balance(0, 0, 0, 0, 0.3433));

  useEffect(() => {
    const syncWallet = async () => {
      if (seedPhrase && selectedBitcoinNetwork) {
        const blockchainConfig: BlockchainElectrumConfig = {
          url: 'ssl://electrum.blockstream.info:60002',
          sock5: null,
          retry: 5,
          timeout: 5,
          stopGap: 100,
          validateDomain: false,
        };
        const wallet = await createWallet(seedPhrase, selectedBitcoinNetwork as Network);
        const blockchain = await new Blockchain().create(blockchainConfig);
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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} className="flex">
          <WalletOverview balance={balance} />
          <View className="my-4" />
          <View>
            <View className="mx-4">
              <Text className="mb-4 text-base font-medium text-neutral-500">On-chain</Text>
              <WalletView name="Bitcoin" symbol="BTC" type="On-chain" balance={balance} />
              <Text className="my-4 text-base font-medium text-neutral-500">Lightning</Text>
              <View className="space-x-2">
                <WalletView name="Bitcoin Lighning" symbol="BTC" type="Lightning" balance={balance} />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
