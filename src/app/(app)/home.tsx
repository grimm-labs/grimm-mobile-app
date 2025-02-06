/* eslint-disable react-native/no-inline-styles */
import { Blockchain } from 'bdk-rn';
import type { Balance } from 'bdk-rn/lib/classes/Bindings';
import type { BlockchainElectrumConfig } from 'bdk-rn/lib/lib/enums';
import { Network } from 'bdk-rn/lib/lib/enums';
import React, { useEffect, useState } from 'react';

import HomeHeader from '@/components/home-header';
import { WalletOverview } from '@/components/wallet-overview';
import { WalletView } from '@/components/wallet-view';
import { createWallet } from '@/core';
import { useSeedPhrase } from '@/core/hooks/use-seed-phrase';
import { SafeAreaView, ScrollView, Text, View } from '@/ui';

export default function Home() {
  const [seedPhrase, _setSeedPhrase] = useSeedPhrase();
  const [_balance, _setBalance] = useState<Balance>();

  useEffect(() => {
    if (seedPhrase) {
      const blockchainConfig: BlockchainElectrumConfig = {
        url: 'ssl://electrum.blockstream.info:60002',
        sock5: null,
        retry: 5,
        timeout: 5,
        stopGap: 100,
        validateDomain: false,
      };

      const syncWallet = async () => {
        const wallet = await createWallet(seedPhrase, Network.Testnet);
        const blockchain = await new Blockchain().create(blockchainConfig);
        await wallet.sync(blockchain);
      };
      syncWallet();
    }
  }, [seedPhrase]);

  return (
    <SafeAreaView className="flex-1">
      <View className="flex">
        <HomeHeader />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} className="flex">
          <WalletOverview />
          <View className="my-4" />
          <View>
            <View className="mx-4">
              <Text className="mb-4 text-base font-medium text-neutral-500">On-chain</Text>
              <WalletView name="Bitcoin" symbol="BTC" amount={1.52000394} type="On-chain" fiat="98,629,528" />
              <Text className="my-4 text-base font-medium text-neutral-500">Lightning</Text>
              <View className="space-x-2">
                <WalletView name="Bitcoin Lighning" symbol="BTC" amount={0.50000391} type="Lightning" fiat="32,444,093" />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
