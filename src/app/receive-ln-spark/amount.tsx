/* eslint-disable react/no-unstable-nested-components */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { Button, colors, FocusAwareStatusBar, NumericKeypad, SafeAreaView, Text, View } from '@/components/ui';
import { convertBitcoinToFiat, getFiatCurrency } from '@/lib';
import { AppContext } from '@/lib/context';
import { useBitcoin } from '@/lib/context/bitcoin-prices-context';
import { BitcoinUnit } from '@/types/enum';

type SearchParams = {
  type: 'lightning';
};

export default function EnterAmountScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { type } = useLocalSearchParams<SearchParams>();

  const { selectedCountry } = useContext(AppContext);
  const { bitcoinPrices } = useBitcoin();

  const [amount, setAmount] = useState('0');

  const selectedFiatCurrency = getFiatCurrency(selectedCountry);
  const satsValue = parseInt(amount, 10) || 0;
  const fiatAmount = satsValue > 0 ? convertBitcoinToFiat(satsValue, BitcoinUnit.Sats, selectedFiatCurrency, bitcoinPrices).toFixed(2) : '0';

  const handleSubmit = () => {
    router.push({
      pathname: '/receive-ln-spark/ln-qrcode',
      params: { satsAmount: amount, note: '', type },
    });
  };

  const isValidSubmit = () => {
    return !isNaN(satsValue) && satsValue > 0;
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1">
        <FocusAwareStatusBar style="dark" />
        <Stack.Screen
          options={{
            headerTitle: () => <HeaderTitle title={t('enterAmount.headerTitle')} />,
            headerTitleAlign: 'center',
            headerLeft: HeaderLeft,
            headerShadowVisible: false,
          }}
        />
        <View className="flex-1 px-4 pt-8">
          <View className="mb-4 items-center">
            <Text className="mb-2 text-lg font-semibold text-gray-700">{t('enterAmount.satsLabel')}</Text>
            <Text className="text-5xl font-light text-gray-800">{satsValue.toLocaleString()}</Text>
          </View>
          <View className="mb-4 items-center">
            <View className="rounded-full bg-primary-600 p-2">
              <MaterialCommunityIcons name="approximately-equal" size={20} color={colors.white} />
            </View>
          </View>
          <View className="mb-6 items-center">
            <View className="flex-row items-center">
              <Text className="mr-2 text-xl font-semibold text-gray-700">{selectedFiatCurrency}</Text>
              <Text className="text-2xl font-medium">{fiatAmount}</Text>
            </View>
          </View>
          <View className="flex-1" />
          <NumericKeypad amount={amount} setAmount={setAmount} isBtcUnit={false} />
          <View className="mb-4">
            <Button label={t('enterAmount.continueButton')} disabled={!isValidSubmit()} onPress={handleSubmit} fullWidth={true} variant="secondary" textClassName="text-base text-white" size="lg" />
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
