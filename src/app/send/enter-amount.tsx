/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable max-lines-per-function */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { Button, colors, FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { NumericKeypad } from '@/components/ui';
import { convertBitcoinToFiat, convertBtcToSats, getFiatCurrency } from '@/lib';
import { AppContext } from '@/lib/context';
import { useBitcoin } from '@/lib/context/bitcoin-prices-context';
import { useBreez } from '@/lib/context/breez-context';
import { BitcoinUnit } from '@/types/enum';

type SearchParams = {
  paymentInput: string;
};

export default function LightningAddressAmountScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { paymentInput } = useLocalSearchParams<SearchParams>();
  const { bitcoinUnit, selectedCountry } = useContext(AppContext);
  const { bitcoinPrices } = useBitcoin();
  const { balance } = useBreez();

  const [amount, setAmount] = useState('0');
  const [fiatAmount, setFiatAmount] = useState('0');
  const [validationError, setValidationError] = useState('');

  const isBtcUnit = bitcoinUnit === BitcoinUnit.Btc;
  const selectedFiatCurrency = getFiatCurrency(selectedCountry);
  const satsAmount = isBtcUnit ? convertBtcToSats(Number(amount)) : Number(amount);
  const isAmountInvalid = !Number(amount) || satsAmount > balance;

  useEffect(() => {
    if (!amount || amount === '0' || amount === '.') {
      setFiatAmount('0');
      setValidationError('');
      return;
    }

    const satsValue = isBtcUnit ? Math.round(parseFloat(amount) * 1e8) : parseInt(amount, 10);

    if (isNaN(satsValue)) {
      setValidationError(t('enterAmount.invalidAmount'));
      return;
    }

    setValidationError('');
    const fiat = convertBitcoinToFiat(satsValue, BitcoinUnit.Sats, selectedFiatCurrency, bitcoinPrices).toFixed(2);
    setFiatAmount(fiat);
  }, [amount, isBtcUnit, bitcoinPrices, selectedFiatCurrency, t]);

  const handleContinue = () => {
    const satsValue = isBtcUnit ? Math.round(parseFloat(amount) * 1e8) : parseInt(amount, 10);

    if (!satsValue || isNaN(satsValue)) {
      setValidationError(t('enterAmount.invalidAmount'));
      return;
    }

    router.push({
      pathname: '/send/transaction-details',
      params: {
        paymentInput,
        amountSats: satsValue.toString(),
      },
    });
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white">
        <FocusAwareStatusBar style="dark" />
        <Stack.Screen
          options={{
            headerTitle: () => <HeaderTitle title={t('enterAmount.headerTitle')} />,
            headerLeft: HeaderLeft,
            headerTitleAlign: 'center',
            headerShadowVisible: false,
          }}
        />
        <View className="flex-1 px-4 pt-6">
          <View className="mb-4 items-center">
            <Text className="text-base text-gray-500">
              {t('enterAmount.sendTo')} {paymentInput}
            </Text>
          </View>
          <View className="mb-6 items-center">
            <View className="flex-row items-center">
              <Text className={`text-6xl font-light ${validationError ? 'text-red-400' : 'text-gray-800'}`}>{amount}</Text>
              <Text className="ml-2 text-2xl font-light text-gray-400">{bitcoinUnit}</Text>
            </View>
            {validationError && <Text className="mt-2 text-center text-sm text-red-500">{validationError}</Text>}
          </View>
          <View className="mb-6 items-center">
            <View className="rounded-full bg-primary-600 p-2">
              <MaterialCommunityIcons name="approximately-equal" size={20} color={colors.white} />
            </View>
          </View>
          <View className="mb-8 items-center">
            <View className="flex-row items-center">
              <Text className="mr-2 text-xl font-medium text-gray-800">{fiatAmount}</Text>
              <Text className="text-xl font-semibold text-gray-600">{selectedFiatCurrency}</Text>
            </View>
          </View>
          {Number(amount) > 0 && satsAmount > balance && (
            <View>
              <Text className="text-center text-base font-semibold text-danger-600">{t('enterAmount.insufficientBalance')}</Text>
            </View>
          )}
          <View className="flex-1" />
          <NumericKeypad amount={amount} setAmount={setAmount} isBtcUnit={isBtcUnit} />
          <View className="mb-4">
            <Button label={t('enterAmount.continueButton')} onPress={handleContinue} fullWidth variant="secondary" size="lg" disabled={isAmountInvalid} textClassName="text-base text-white" />
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
