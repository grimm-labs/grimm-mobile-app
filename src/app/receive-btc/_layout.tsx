/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable max-lines-per-function */
import { Ionicons } from '@expo/vector-icons';
import { AddressIndex } from 'bdk-rn/lib/lib/enums';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Clipboard, Pressable, ScrollView, Share } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import type { AddressConfig } from '@/components/modal/address-config-bottom-sheet';
import { AddressConfigBottomSheet } from '@/components/modal/address-config-bottom-sheet';
import { Button, colors, FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { useBdk } from '@/lib/context';

export default function ReceivePaymentScreen() {
  const { t } = useTranslation();
  const { wallet } = useBdk();

  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [note, setNote] = useState<string | undefined>(undefined);

  const addressConfigRef = useRef<any>(null);

  const handleSaveConfig = (config: AddressConfig) => {
    setAmount(config.amount);
    setNote(config.note);
  };

  const addAmountAndNoteToAddress = (baseAddress: string, amountParam?: number, noteParam?: string): string => {
    let modifiedAddress = baseAddress;
    const params: string[] = [];

    if (amountParam) params.push(`amount=${amountParam}`);
    if (noteParam) params.push(`message=${encodeURIComponent(noteParam)}`);

    return params.length > 0 ? `${modifiedAddress}?${params.join('&')}` : modifiedAddress;
  };

  const openAddressConfig = () => addressConfigRef.current?.present();

  const generateAddress = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const res = await wallet?.getAddress(AddressIndex.New);
      const bitcoinAddress = await res?.address.asString();

      if (bitcoinAddress) {
        setAddress(bitcoinAddress);
      } else {
        setError(t('receive_onchain.error_generic'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('receive_onchain.error_generic'));
    } finally {
      setLoading(false);
    }
  }, [t, wallet]);

  useEffect(() => {
    generateAddress();
  }, [generateAddress]);

  const copyToClipboard = async () => {
    if (!address) return;
    await Clipboard.setString(address);
    showMessage({ message: t('receive_onchain.copied'), type: 'success', duration: 2000 });
  };

  const shareAddress = async () => {
    if (!address) return;
    try {
      await Share.share({
        message: address,
        title: t('receive_onchain.share_title'),
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <FocusAwareStatusBar style="dark" />
        <Stack.Screen
          options={{
            headerTitle: () => <HeaderTitle title={t('receive_onchain.header')} />,
            headerTitleAlign: 'center',
            headerLeft: HeaderLeft,
            headerShadowVisible: false,
          }}
        />
        <View className="flex-1 items-center justify-center px-4">
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text className="mt-4 text-lg text-gray-600">{t('receive_onchain.loading_title')}</Text>
          <Text className="mt-2 text-center text-sm text-gray-400">{t('receive_onchain.loading_subtitle')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <FocusAwareStatusBar style="dark" />
        <Stack.Screen
          options={{
            headerTitle: () => <HeaderTitle title={t('receive_onchain.header')} />,
            headerTitleAlign: 'center',
            headerLeft: HeaderLeft,
            headerShadowVisible: false,
          }}
        />
        <View className="flex-1 items-center justify-center px-4">
          <View className="mb-4 rounded-full bg-red-100 p-4">
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
          </View>
          <Text className="mb-2 text-xl font-semibold text-gray-800">{t('receive_onchain.error_title')}</Text>
          <Text className="mb-6 text-center text-gray-600">{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white">
        <FocusAwareStatusBar style="dark" />
        <Stack.Screen
          options={{
            headerTitle: () => <HeaderTitle title={t('receive_onchain.header')} />,
            headerTitleAlign: 'center',
            headerLeft: HeaderLeft,
            headerShadowVisible: false,
          }}
        />
        <View className="flex-1 px-2">
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="mb-8 items-center">
              <View className="bg-white p-6">
                <QRCode value={addAmountAndNoteToAddress(address, amount, note)} size={220} backgroundColor="white" color="black" />
              </View>
              <Text className="mt-4 text-center text-sm text-gray-500">{t('receive_onchain.scan_text')}</Text>
            </View>
            <View className="flex flex-row justify-center">
              <Pressable className="mx-4 mb-2 rounded-full bg-primary-600 p-3 text-white" onPress={copyToClipboard}>
                <Ionicons name="copy" size={20} color="white" />
              </Pressable>
              <Pressable className="mx-4 mb-2 rounded-full bg-primary-600 p-3 text-white" onPress={shareAddress}>
                <Ionicons name="share" size={20} color="white" />
              </Pressable>
            </View>
            <Pressable onPress={copyToClipboard} className="mt-6 items-center">
              <Text className="text-center text-sm font-medium text-gray-700">{address}</Text>
            </Pressable>
          </ScrollView>
          <View>
            <Pressable className="my-4" onPress={openAddressConfig}>
              <Text className="text-center text-base font-medium text-primary-700">{t('receive_onchain.address_settings')}</Text>
            </Pressable>
            <Button label={t('receive_onchain.new_address')} onPress={generateAddress} fullWidth variant="secondary" textClassName="text-base text-white" size="lg" />
          </View>
        </View>
        <AddressConfigBottomSheet ref={addressConfigRef} onSave={handleSaveConfig} defaultAmount={amount} defaultNote={note} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
