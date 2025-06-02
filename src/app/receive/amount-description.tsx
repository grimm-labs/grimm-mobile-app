/* eslint-disable react-native/no-inline-styles */
/* eslint-disable max-lines-per-function */
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import { Alert, SafeAreaView, TextInput, TouchableOpacity } from 'react-native';

import { HeaderLeft } from '@/components/back-button';
import { Button, colors, FocusAwareStatusBar, Text, View } from '@/components/ui';
import { convertBitcoinToFiat, getFiatCurrency } from '@/lib';
import { AppContext } from '@/lib/context';
import { useBitcoin } from '@/lib/context/bitcoin-prices-context';
import { BitcoinUnit } from '@/types/enum';

export default function EnterAmountScreen() {
  const router = useRouter();

  const { selectedCountry } = useContext(AppContext);
  const { bitcoinPrices } = useBitcoin();

  const [satsAmount, setSatsAmount] = useState('0');
  const [fiatAmount, setFiatAmount] = useState('0');
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [validationError, setValidationError] = useState('');

  const selectedFiatCurrency = getFiatCurrency(selectedCountry);

  const MIN_SATS = 1000;
  const MAX_SATS = 25000000;

  const validateAmount = (satsValue: number): string => {
    if (satsValue < MIN_SATS) {
      return `The minimum amount is ${MIN_SATS.toLocaleString()} SATS`;
    }
    if (satsValue > MAX_SATS) {
      return `The maximum amount is ${MAX_SATS.toLocaleString()} SATS`;
    }
    return '';
  };

  const handleSatsChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setSatsAmount(numericValue);

    if (numericValue && numericValue !== '0') {
      const satsValue = parseInt(numericValue, 10);
      const fiat = convertBitcoinToFiat(satsValue, BitcoinUnit.Sats, selectedFiatCurrency, bitcoinPrices).toFixed(2);
      setFiatAmount(fiat);

      // Validation
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
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (validateAmount(satsValue)) {
      Alert.alert('Invalid amount', validationError);
      return;
    }

    router.push({
      pathname: '/receive/ln-qrcode',
      params: { satsAmount, note },
    });
  };

  const isValidAmount = () => {
    const satsValue = parseInt(satsAmount, 10);
    return !isNaN(satsValue) && satsValue >= MIN_SATS && satsValue <= MAX_SATS;
  };

  return (
    <SafeAreaView className="flex-1">
      <FocusAwareStatusBar style="dark" />

      <Stack.Screen
        options={{
          title: 'Enter amount',
          headerTitleAlign: 'center',
          headerLeft: HeaderLeft,
          headerShadowVisible: false,
        }}
      />

      <View className="flex-1 px-4 pt-8">
        <View className="mb-8 items-center">
          <Text className="mb-4 text-lg font-semibold text-gray-700">SATS</Text>
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

        <View className="mb-8">
          {!showNoteInput ? (
            <TouchableOpacity onPress={() => setShowNoteInput(true)} className="items-center">
              <Text className="text-base text-gray-400">+ Add a note (optional)</Text>
            </TouchableOpacity>
          ) : (
            <View className="rounded border bg-white p-4" style={{ borderColor: '#9CA3AF' }}>
              <TextInput value={note} onChangeText={setNote} returnKeyType="done" placeholder="Add a note here..." placeholderTextColor="#9CA3AF" className="min-h-[40px] text-base text-gray-700" multiline autoFocus />
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
        <View className="flex-1" />
        <View className="mb-8">
          <Button label="Continue" disabled={!isValidAmount()} onPress={handleSubmit} fullWidth={true} variant="secondary" textClassName="text-base text-white" size="lg" />
        </View>
      </View>
    </SafeAreaView>
  );
}
