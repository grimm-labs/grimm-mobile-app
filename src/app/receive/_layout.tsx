/* eslint-disable max-lines-per-function */
import { AddressIndex, Network } from 'bdk-rn/lib/lib/enums';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { createWallet } from '@/core';
import { useSeedPhrase } from '@/core/hooks/use-seed-phrase';
import { Button, showSuccessMessage, Text, View } from '@/ui';

export default function NotificationsScreen() {
  const [seedPhrase, _setSeedPhrase] = useSeedPhrase();
  const [address, setAddress] = useState<string>();

  useEffect(() => {
    const x = async () => {
      if (seedPhrase) {
        const wallet = await createWallet(seedPhrase, Network.Testnet);
        const addressInfo = await wallet.getAddress(AddressIndex.New);
        const newAddress = await addressInfo.address.asString();
        setAddress(newAddress);
      }
    };
    x();
  }, [seedPhrase]);

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
            title: 'Receive Bitcoin',
            headerShown: true,
            headerShadowVisible: false,
            headerBackTitleVisible: false,
          }}
        />

        {/* Header */}
        <View className="">
          <Text className="my-2 text-center text-lg font-bold text-gray-600">
            This address only accepts Bitcoin
          </Text>
          <Text className="my-2 text-center text-base text-gray-600">
            Scan the QR code to send funds to this address{' '}
          </Text>
        </View>

        {/* Input Section */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <View className="">
            <View className="items-center justify-center py-10">
              <QRCode
                size={220}
                value={address}
                logo={require('@/assets/images/on-chain-icon.png')}
                logoSize={50}
                logoBackgroundColor="transparent"
              />
            </View>
          </View>
          <View className="mb-2">
            <Text
              ellipsizeMode="middle"
              className="my-4 text-center text-lg font-bold text-gray-800"
            >
              {address}
            </Text>
          </View>
          <Text className="my-2 text-center text-base text-gray-600">
            Sending other assets than Bitcoin will result in permanent loss of
            funds. Please check the address before completing the transaction.
          </Text>
        </KeyboardAvoidingView>

        {/* Continue Button */}
        <View>
          <View className="flex-col justify-between">
            <Button
              testID="login-button"
              label="Share"
              fullWidth={true}
              size="lg"
              variant="outline"
              className="mb-4"
              textClassName="text-base"
              onPress={handleShareAddress}
              icon="share"
            />
            <Button
              testID="login-button"
              label="Copy Address"
              fullWidth={true}
              size="lg"
              variant="secondary"
              textClassName="text-base text-white"
              onPress={handleCopyAdress}
              disabled={false}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
