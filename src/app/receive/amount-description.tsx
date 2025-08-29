/* eslint-disable react-native/no-inline-styles */
/* eslint-disable max-lines-per-function */
import { fetchLightningLimits, fetchOnchainLimits } from '@breeztech/react-native-breez-sdk-liquid';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { Button, colors, FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { convertBitcoinToFiat, getFiatCurrency } from '@/lib';
import { AppContext } from '@/lib/context';
import { useBitcoin } from '@/lib/context/bitcoin-prices-context';
import { BitcoinUnit } from '@/types/enum';

type SearchParams = {
  type: 'onchain' | 'lightning';
};

const EnterAmountScreenHeaderTitle = () => {
  const { t } = useTranslation();
  return <HeaderTitle title={t('enterAmount.headerTitle')} />;
};

export default function EnterAmountScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { type } = useLocalSearchParams<SearchParams>();

  const { selectedCountry } = useContext(AppContext);
  const { bitcoinPrices } = useBitcoin();

  const [satsAmount, setSatsAmount] = useState('0');
  const [fiatAmount, setFiatAmount] = useState('0');
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [receiveMinSatsLimit, setReceiveMinSatsLimit] = useState(0);
  const [receiveMaxSatsLimit, setReceiveMaxSatsLimit] = useState(0);

  const selectedFiatCurrency = getFiatCurrency(selectedCountry);

  useEffect(() => {
    const fetchLimits = async () => {
      if (type === 'onchain') {
        const currentLimits = await fetchOnchainLimits();
        setReceiveMinSatsLimit(currentLimits.receive.minSat);
        setReceiveMaxSatsLimit(currentLimits.receive.maxSat);
      }

      if (type === 'lightning') {
        const currentLimits = await fetchLightningLimits();
        setReceiveMinSatsLimit(currentLimits.receive.minSat);
        setReceiveMaxSatsLimit(currentLimits.receive.maxSat);
      }
    };
    fetchLimits();
  }, [type]);

  const validateAmount = (satsValue: number): string => {
    if (satsValue < receiveMinSatsLimit) {
      return t('enterAmount.errors.min', { value: receiveMinSatsLimit.toLocaleString() });
    }
    if (satsValue > receiveMaxSatsLimit) {
      return t('enterAmount.errors.max', { value: receiveMaxSatsLimit.toLocaleString() });
    }
    return '';
  };

  const handleSatsChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setSatsAmount((+numericValue).toString());

    if (numericValue && numericValue !== '0') {
      const satsValue = parseInt(numericValue, 10);
      const fiat = convertBitcoinToFiat(satsValue, BitcoinUnit.Sats, selectedFiatCurrency, bitcoinPrices).toFixed(2);
      setFiatAmount(fiat);

      const error = validateAmount(satsValue);
      setValidationError(error);
    } else {
      setFiatAmount('0');
      setValidationError('');
    }
  };

  const handleSubmit = async () => {
    const satsValue = parseInt(satsAmount, 10);

    if (satsAmount === '0' || satsAmount === '' || isNaN(satsValue)) {
      Alert.alert(t('enterAmount.alert.errorTitle'), t('enterAmount.alert.errorMessage'));
      return;
    }

    if (validateAmount(satsValue)) {
      Alert.alert(t('enterAmount.alert.invalidTitle'), validationError);
      return;
    }

    router.push({
      pathname: '/receive/ln-qrcode',
      params: { satsAmount, note, type },
    });
  };

  const isValidAmount = () => {
    const satsValue = parseInt(satsAmount, 10);
    return !isNaN(satsValue) && satsValue > 0 && satsValue >= receiveMinSatsLimit && satsValue <= receiveMaxSatsLimit;
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1">
        <FocusAwareStatusBar style="dark" />

        <Stack.Screen
          options={{
            headerTitle: EnterAmountScreenHeaderTitle,
            headerTitleAlign: 'center',
            headerLeft: HeaderLeft,
            headerShadowVisible: false,
          }}
        />

        <View className="flex-1 px-4 pt-8">
          <View className="mb-8 items-center">
            <Text className="mb-4 text-lg font-semibold text-gray-700">{t('enterAmount.satsLabel')}</Text>
            <TextInput
              textAlign="center"
              textAlignVertical="center"
              value={satsAmount}
              onChangeText={handleSatsChange}
              className={`w-full text-center text-6xl font-light ${validationError ? 'text-red-400' : 'text-gray-400'}`}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#D1D5DB"
            />
            {validationError ? <Text className="mt-2 text-center text-sm text-red-500">{validationError}</Text> : null}
          </View>

          <View className="mb-8 items-center">
            <View className="rounded-full bg-primary-600 p-2">
              <Ionicons name="swap-vertical" size={20} color={colors.white} />
            </View>
          </View>

          <View className="mb-12 items-center">
            <View className="flex-row items-center">
              <Text className="mr-2 text-xl font-semibold text-gray-700">{selectedFiatCurrency}</Text>
              <Text className="text-bold text-2xl font-medium">{fiatAmount}</Text>
            </View>
          </View>
          {type === 'lightning' && (
            <View className="mb-8">
              {!showNoteInput ? (
                <TouchableOpacity onPress={() => setShowNoteInput(true)} className="items-center">
                  <Text className="text-base text-gray-400">{t('enterAmount.addNote')}</Text>
                </TouchableOpacity>
              ) : (
                <View className="rounded border bg-white p-4" style={{ borderColor: '#9CA3AF' }}>
                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    returnKeyType="done"
                    placeholder={t('enterAmount.notePlaceholder')}
                    placeholderTextColor="#9CA3AF"
                    className="min-h-[40px] text-base text-gray-700"
                    multiline
                    autoFocus
                  />
                  <TouchableOpacity
                    onPress={() => {
                      setShowNoteInput(false);
                      setNote('');
                    }}
                    className="absolute right-2 top-2"
                  >
                    <Ionicons name="close" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          <View className="flex-1" />
          <View>
            <Button label={t('enterAmount.continueButton')} disabled={!isValidAmount()} onPress={handleSubmit} fullWidth={true} variant="secondary" textClassName="text-base text-white" size="lg" />
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
