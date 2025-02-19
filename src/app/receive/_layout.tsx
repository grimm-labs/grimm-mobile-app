/* eslint-disable max-lines-per-function */
import { Network } from 'bdk-rn/lib/lib/enums';
import { AddressIndex } from 'bdk-rn/lib/lib/enums';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { createWallet, getBlockchain, getBlockchainConfig, useSelectedBitcoinNetwork } from '@/core';
import { useSeedPhrase } from '@/core/hooks/use-seed-phrase';
import { Button, colors, showSuccessMessage, Text, View } from '@/ui';

export default function NotificationsScreen() {
  const [seedPhrase, _setSeedPhrase] = useSeedPhrase();
  const [address, setAddress] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedBitcoinNetwork, _setSelectedBitcoinNetwork] = useSelectedBitcoinNetwork();

  useEffect(() => {
    const syncWalletAndGetAddress = async () => {
      if (seedPhrase) {
        const wallet = await createWallet(seedPhrase, selectedBitcoinNetwork as Network);
        const blockchain = await getBlockchain(getBlockchainConfig());
        await wallet.sync(blockchain);
        const addressInfo = await wallet.getAddress(AddressIndex.LastUnused);
        setAddress(await addressInfo.address.asString());
        setIsLoading(false);
      }
    };
    syncWalletAndGetAddress();
  }, [seedPhrase, selectedBitcoinNetwork]);

  const handleCopyAdress = () => {
    showSuccessMessage('Bitcoin address copied!');
  };

  const handleShareAddress = async () => {
    showSuccessMessage('Bitcoin address copied!');
  };

  return (
    <SafeAreaView className="flex h-full">
      <View className="flex h-full justify-between px-4">
        <Stack.Screen
          options={{
            title: 'Receive BTC',
            headerShown: true,
            headerShadowVisible: false,
            headerBackTitleVisible: false,
          }}
        />
        {isLoading && (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary[600]} />
          </View>
        )}
        {!isLoading && (
          <View className="flex-1">
            <View>
              {selectedBitcoinNetwork === Network.Testnet && (
                <View className="my-4 rounded-lg bg-danger-500 px-3 py-4">
                  <Text className="font-light text-white">You are currently on the testnet network, do not send any real bitcoin to this address, otherwise it will be lost forever.</Text>
                </View>
              )}
            </View>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
              <View>
                <View className="mx-10 items-center justify-center py-10">
                  <QRCode size={235} value={address} logo={require('@/assets/images/on-chain-icon.png')} logoSize={60} logoBackgroundColor="transparent" />
                </View>
              </View>
              <View className="mx-5">
                <Text className="text-normal my-2 text-center text-gray-600">Scan BTC address to send payment or copy wallet address below</Text>
                <View className="mb-2">
                  <Text ellipsizeMode="middle" selectable={true} className="my-4 text-center text-lg text-gray-600">
                    {address}
                  </Text>
                </View>
              </View>
            </KeyboardAvoidingView>
            <View>
              <View className="flex-col justify-between">
                <Button testID="share-button" label="Share BTC Address" fullWidth={true} size="lg" variant="outline" className="mb-4" textClassName="text-base" onPress={handleShareAddress} icon="share" />
                <Button testID="copy-address-button" label="Copy Address" fullWidth={true} size="lg" variant="secondary" textClassName="text-base text-white" onPress={handleCopyAdress} disabled={false} />
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
