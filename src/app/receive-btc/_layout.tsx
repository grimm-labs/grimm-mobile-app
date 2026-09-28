/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable max-lines-per-function */
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, Share } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import type { AddressConfig } from '@/components/modal/address-config-bottom-sheet';
import { AddressConfigBottomSheet } from '@/components/modal/address-config-bottom-sheet';
import { Button, colors, FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { splitStringIntoChunks } from '@/lib';
import { useBdk } from '@/lib/context';

export default function ReceivePaymentScreen() {
  const { t } = useTranslation();
  const { getReceiveAddress } = useBdk();

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

  // getReceiveAddress changes on every BDK state update (sync, balance...). Depending on it regenerated (and revealed)
  // a new address each time the wallet synced: the address changed under the user and open sheets were closed.
  // The address is only generated on mount and on explicit actions (New Address, retry).
  const getReceiveAddressRef = useRef(getReceiveAddress);
  getReceiveAddressRef.current = getReceiveAddress;

  const generateAddress = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const bitcoinAddress = await getReceiveAddressRef.current();

      if (bitcoinAddress) {
        setAddress(bitcoinAddress);
      } else {
        console.error('Failed to generate address: address is undefined');
        setError(t('receive_onchain.error_generic'));
      }
    } catch (err) {
      console.error('Error generating address:', err);
      setError(err instanceof Error ? err.message : t('receive_onchain.error_generic'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    generateAddress();
  }, [generateAddress]);

  const copyToClipboard = async () => {
    if (!address) return;
    await Clipboard.setStringAsync(address);
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
      <SafeAreaView testID="receive-btc-loading" className="flex-1 bg-white dark:bg-charcoal-950">
        <FocusAwareStatusBar />
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
          <Text className="mt-4 text-lg text-gray-600 dark:text-charcoal-300">{t('receive_onchain.loading_title')}</Text>
          <Text className="mt-2 text-center text-sm text-gray-400 dark:text-charcoal-500">{t('receive_onchain.loading_subtitle')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView testID="receive-btc-error" className="flex-1 bg-white dark:bg-charcoal-950">
        <FocusAwareStatusBar />
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
          <Text className="mb-2 text-xl font-semibold text-gray-800 dark:text-charcoal-100">{t('receive_onchain.error_title')}</Text>
          <Text className="mb-6 text-center text-gray-600 dark:text-charcoal-300">{error}</Text>
        </View>
        {/* Without a retry the error state was a dead end: the user had to leave the screen */}
        <View className="mb-8 px-4">
          <Button testID="receive-btc-retry" label={t('receive_payment.retry')} onPress={generateAddress} fullWidth variant="secondary" textClassName="text-base text-white" size="lg" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView testID="receive-btc-screen" className="flex-1 bg-white dark:bg-charcoal-950">
        <FocusAwareStatusBar />
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
              <View className="p-6">
                <QRCode value={addAmountAndNoteToAddress(address?.toUpperCase(), amount, note)} size={220} backgroundColor="white" color="black" />
              </View>
              <Text className="mt-4 text-center text-sm text-gray-500 dark:text-charcoal-400">{t('receive_onchain.scan_text')}</Text>
            </View>
            <View className="my-8 flex flex-row justify-center space-x-1">
              {/* The whole column (icon + label) is pressable so tapping the label works too */}
              <Pressable testID="receive-btc-copy" className="mx-4 flex items-center justify-center" onPress={copyToClipboard} accessibilityRole="button">
                <View className="mb-2 rounded-full bg-primary-600 p-3 text-white">
                  <Ionicons name="copy" size={20} color="white" />
                </View>
                <Text className="text-sm font-medium">{t('receive_onchain.copy')}</Text>
              </Pressable>
              <Pressable testID="receive-btc-share" className="mx-4 flex items-center justify-center" onPress={shareAddress} accessibilityRole="button">
                <View className="mb-2 rounded-full bg-neutral-700 p-3 text-white">
                  <Ionicons name="share" size={20} color="white" />
                </View>
                <Text className="text-sm font-medium">{t('receive_onchain.share')}</Text>
              </Pressable>
            </View>
            <Pressable testID="receive-btc-address" onPress={copyToClipboard} className="mx-4 flex flex-row flex-wrap justify-center">
              {splitStringIntoChunks(address?.toUpperCase(), 6).map((s) => (
                <View className="m-2" key={s}>
                  <Text className="text-base font-bold text-primary-600">{s}</Text>
                </View>
              ))}
            </Pressable>
          </ScrollView>
          <View>
            <Pressable testID="receive-btc-address-settings" className="my-4" onPress={openAddressConfig}>
              <Text className="text-center text-base font-medium text-primary-700">{t('receive_onchain.address_settings')}</Text>
            </Pressable>
            <Button testID="receive-btc-new-address" label={t('receive_onchain.new_address')} onPress={generateAddress} fullWidth variant="secondary" textClassName="text-base text-white" size="lg" />
          </View>
        </View>
        <AddressConfigBottomSheet ref={addressConfigRef} onSave={handleSaveConfig} defaultAmount={amount} defaultNote={note} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
