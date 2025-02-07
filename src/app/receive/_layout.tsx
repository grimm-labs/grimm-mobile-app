/* eslint-disable max-lines-per-function */
import { Network } from 'bdk-rn/lib/lib/enums';
import { AddressIndex } from 'bdk-rn/lib/lib/enums';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { createWallet, useSelectedBitcoinNetwork } from '@/core';
import { useSeedPhrase } from '@/core/hooks/use-seed-phrase';
import { Button, showSuccessMessage, Text, View } from '@/ui';

export default function NotificationsScreen() {
  const [seedPhrase, _setSeedPhrase] = useSeedPhrase();
  const [address, setAddress] = useState<string>();
  const [selectedBitcoinNetwork, _setSelectedBitcoinNetwork] = useSelectedBitcoinNetwork();

  useEffect(() => {
    const x = async () => {
      if (seedPhrase) {
        const wallet = await createWallet(seedPhrase, selectedBitcoinNetwork as Network);
        const addressInfo = await wallet.getAddress(AddressIndex.New);
        const newAddress = await addressInfo.address.asString();
        setAddress(newAddress);
      }
    };
    x();
  }, [seedPhrase, selectedBitcoinNetwork]);

  const handleCopyAdress = () => {
    showSuccessMessage('Bitcoin address copied!');
  };

  const handleShareAddress = () => {
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

        {/* Header */}
        <View>
          <Text className="text-normal my-4 text-center text-gray-600">Scan the QR code to send funds to this address </Text>
          {selectedBitcoinNetwork === Network.Testnet && (
            <View className="my-4 rounded-lg bg-danger-500 px-3 py-4">
              <Text className="font-light text-white">You are currently on the testnet network, do not send any real bitcoin to this address, otherwise it will be lost forever.</Text>
            </View>
          )}
        </View>

        {/* Input Section */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <View>
            <View className="mx-10 items-center justify-center py-10">
              <QRCode size={220} value={address} logo={require('@/assets/images/on-chain-icon.png')} logoSize={60} logoBackgroundColor="transparent" />
            </View>
          </View>
          <View className="mx-5">
            <Text className="text-normal my-2 text-center text-gray-600">Scan BTC address to send payment or copy wallet address below</Text>
            <View className="mb-2">
              <Text ellipsizeMode="middle" className="my-4 text-center text-lg text-gray-600">
                {address}
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* Continue Button */}
        <View>
          <View className="flex-col justify-between">
            <Button testID="login-button" label="Share BTC Address" fullWidth={true} size="lg" variant="outline" className="mb-4" textClassName="text-base" onPress={handleShareAddress} icon="share" />
            <Button testID="login-button" label="Copy Address" fullWidth={true} size="lg" variant="secondary" textClassName="text-base text-white" onPress={handleCopyAdress} disabled={false} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
