/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable max-lines-per-function */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { RecommendedFeesResponse } from '@/api/mempool';
import { useBitcoinRecommendedFees } from '@/api/mempool';
import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { Button, colors, FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { NumericKeypad } from '@/components/ui';
import { convertBitcoinToFiat, convertBtcToSats, getFiatCurrency } from '@/lib';
import { AppContext, useBdk } from '@/lib/context';
import { useBitcoin } from '@/lib/context/bitcoin-prices-context';
import { BitcoinUnit } from '@/types/enum';

type SearchParams = {
  recipientAddress: string;
};

type FeeSpeed = 'low' | 'medium' | 'fast';

interface FeeOption {
  speed: FeeSpeed;
  label: string;
  satsPerVbyte: number;
  estimatedTime: string;
}

export default function OnchainSendAmountScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { recipientAddress } = useLocalSearchParams<SearchParams>();
  const { bitcoinUnit, selectedCountry } = useContext(AppContext);
  const { bitcoinPrices } = useBitcoin();
  const { balance: bdkBalance } = useBdk();

  const [amount, setAmount] = useState('0');
  const [fiatAmount, setFiatAmount] = useState('0');
  const [selectedFee, setSelectedFee] = useState<FeeSpeed>('medium');
  const [feeOptions, setFeeOptions] = useState<FeeOption[]>([]);
  const [validationError, setValidationError] = useState('');

  const { mutate: getBitcoinRecommendedFees, isPending } = useBitcoinRecommendedFees();

  const isBtcUnit = bitcoinUnit === BitcoinUnit.Btc;
  const selectedFiatCurrency = getFiatCurrency(selectedCountry);

  const satsAmount = bitcoinUnit === BitcoinUnit.Sats ? Number(amount) : convertBtcToSats(Number(amount));

  const isAmountInvalid = !feeOptions.length || !Number(amount) || satsAmount >= bdkBalance;

  const fetchBitcoinRecommendedFees = useCallback(() => {
    getBitcoinRecommendedFees(
      {},
      {
        onSuccess: (response: RecommendedFeesResponse) => {
          const valid = [response.fastestFee, response.halfHourFee, response.hourFee].every((fee) => Number(fee) > 0);
          if (valid) {
            setFeeOptions([
              { speed: 'low', label: t('onchainSend.enterAmount.fees.low'), satsPerVbyte: Number(response.hourFee), estimatedTime: '~60 min' },
              { speed: 'medium', label: t('onchainSend.enterAmount.fees.medium'), satsPerVbyte: Number(response.halfHourFee), estimatedTime: '~30 min' },
              { speed: 'fast', label: t('onchainSend.enterAmount.fees.fast'), satsPerVbyte: Number(response.fastestFee), estimatedTime: '~10 min' },
            ]);
          } else {
            console.warn('Invalid fee response');
          }
        },
        onError: (error) => console.error('Error fetching recommended fees', error),
      },
    );
  }, [getBitcoinRecommendedFees, t]);

  useEffect(() => {
    fetchBitcoinRecommendedFees();
  }, [fetchBitcoinRecommendedFees]);

  useEffect(() => {
    if (!amount || amount === '0' || amount === '.') {
      setFiatAmount('0');
      setValidationError('');
      return;
    }

    const satsValue = isBtcUnit ? Math.round(parseFloat(amount) * 1e8) : parseInt(amount, 10);

    if (isNaN(satsValue)) {
      setValidationError(t('onchainSend.enterAmount.alert.errorMessage'));
      return;
    }

    const fiat = convertBitcoinToFiat(satsValue, BitcoinUnit.Sats, selectedFiatCurrency, bitcoinPrices).toFixed(2);
    setFiatAmount(fiat);
  }, [amount, isBtcUnit, bitcoinPrices, selectedFiatCurrency, t]);

  const handleSubmit = () => {
    const satsValue = isBtcUnit ? Math.round(parseFloat(amount) * 1e8) : parseInt(amount, 10);

    if (!satsValue || isNaN(satsValue)) {
      Alert.alert(t('onchainSend.enterAmount.alert.errorTitle'), t('onchainSend.enterAmount.alert.errorMessage'));
      return;
    }

    const selectedFeeOption = feeOptions.find((f) => f.speed === selectedFee);
    router.push({
      pathname: '/send-onchain/summary',
      params: {
        recipientAddress,
        satsAmount: satsValue.toString(),
        feeSpeed: selectedFee,
        feeSatsPerVbyte: selectedFeeOption?.satsPerVbyte.toString(),
      },
    });
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white">
        <FocusAwareStatusBar style="dark" />
        <Stack.Screen
          options={{
            headerTitle: () => <HeaderTitle title={t('onchainSend.enterAmount.headerTitle')} />,
            headerLeft: HeaderLeft,
            headerTitleAlign: 'center',
            headerShadowVisible: false,
          }}
        />
        <View className="flex-1 px-4 pt-6">
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
          <View className="mb-6">
            <Text className="mb-3 text-base font-semibold text-gray-700">{t('onchainSend.enterAmount.feeSelection')}</Text>
            {isPending ? (
              <View className="flex items-center justify-center">
                <ActivityIndicator size="small" color={colors.primary[600]} />
              </View>
            ) : (
              <View className="flex-row justify-between">
                {feeOptions.map((fee) => (
                  <Pressable key={fee.speed} onPress={() => setSelectedFee(fee.speed)} className={`mx-1 flex-1 rounded-xl p-2 ${selectedFee === fee.speed ? 'bg-primary-600' : 'bg-gray-100'}`}>
                    <Text className={`text-center text-sm font-semibold ${selectedFee === fee.speed ? 'text-white' : 'text-gray-700'}`}>{fee.label}</Text>
                    <Text className={`mt-1 text-center text-xs ${selectedFee === fee.speed ? 'text-white' : 'text-gray-700'}`}>{fee.satsPerVbyte} sat/vB</Text>
                    <Text className={`mt-1 text-center text-xs ${selectedFee === fee.speed ? 'text-white' : 'text-gray-700'}`}>{fee.estimatedTime}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
          {Number(amount) > 0 && satsAmount >= bdkBalance && (
            <View>
              <Text className="text-center text-base font-semibold text-danger-600">{t('onchainSend.enterAmount.invalidAmount')}</Text>
            </View>
          )}
          <View className="flex-1" />
          <NumericKeypad amount={amount} setAmount={setAmount} isBtcUnit={isBtcUnit} />
          <View className="mb-4">
            <Button label={t('onchainSend.enterAmount.continueButton')} onPress={handleSubmit} fullWidth variant="secondary" size="lg" disabled={isAmountInvalid} textClassName="text-base text-white" />
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
