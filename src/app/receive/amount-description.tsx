/* eslint-disable react-native/no-inline-styles */
/* eslint-disable max-lines-per-function */
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SafeAreaView, TextInput, TouchableOpacity } from 'react-native';

import { HeaderLeft } from '@/components/back-button';
import { Button, colors, FocusAwareStatusBar, Text, View } from '@/components/ui';

export default function EnterAmountScreen() {
  const [satsAmount, setSatsAmount] = useState('0');
  const [fcfaAmount, setFcfaAmount] = useState('0');
  const router = useRouter();
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Taux de conversion exemple (à adapter selon vos besoins)
  const SATS_TO_FCFA_RATE = 0.604; // 1 sat = 0.6 FCFA

  const MIN_SATS = 100;
  const MAX_SATS = 25000000;

  const validateAmount = (satsValue: number): string => {
    if (satsValue < MIN_SATS) {
      return `Le montant minimum est de ${MIN_SATS.toLocaleString()} SATS`;
    }
    if (satsValue > MAX_SATS) {
      return `Le montant maximum est de ${MAX_SATS.toLocaleString()} SATS`;
    }
    return '';
  };

  const handleSatsChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setSatsAmount(numericValue);

    if (numericValue && numericValue !== '0') {
      const satsValue = parseInt(numericValue, 10);
      const fcfa = (satsValue * SATS_TO_FCFA_RATE).toFixed(0);
      setFcfaAmount(fcfa);

      // Validation
      const error = validateAmount(satsValue);
      setValidationError(error);
    } else {
      setFcfaAmount('0');
      setValidationError('');
    }
  };

  const handleFcfaChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setFcfaAmount(numericValue);

    if (numericValue && numericValue !== '0') {
      const sats = Math.round(parseInt(numericValue, 10) / SATS_TO_FCFA_RATE);
      setSatsAmount(sats.toString());

      // Validation
      const error = validateAmount(sats);
      setValidationError(error);
    } else {
      setSatsAmount('0');
      setValidationError('');
    }
  };

  const handleSubmit = async () => {
    const satsValue = parseInt(satsAmount, 10);

    if (satsAmount === '0' || satsAmount === '' || isNaN(satsValue)) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }

    if (validateAmount(satsValue)) {
      Alert.alert('Montant invalide', validationError);
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
        {/* Section SATS */}
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

        {/* Icône de conversion */}
        <View className="mb-8 items-center">
          <View className="rounded-full bg-primary-600 p-2">
            <Ionicons name="swap-vertical" size={20} color={colors.white} />
          </View>
        </View>

        {/* Section FCFA */}
        <View className="mb-12 items-center">
          <View className="flex-row items-center">
            <Text className="mr-2 text-lg font-semibold text-gray-700">FCFA</Text>
            <TextInput
              value={fcfaAmount}
              onChangeText={handleFcfaChange}
              className={`text-center text-lg ${validationError ? 'text-red-500' : 'text-gray-500'}`}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Section Note */}
        <View className="mb-8">
          {!showNoteInput ? (
            <TouchableOpacity onPress={() => setShowNoteInput(true)} className="items-center">
              <Text className="text-base text-gray-400">+ Add a note (optional)</Text>
            </TouchableOpacity>
          ) : (
            <View className="rounded border bg-white p-4" style={{ borderColor: '#9CA3AF' }}>
              <TextInput value={note} onChangeText={setNote} placeholder="Add a note here..." placeholderTextColor="#9CA3AF" className="min-h-[40px] text-base text-gray-700" multiline autoFocus />
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

        {/* Message d'information sur les limites */}
        <View className="mb-6 rounded-lg bg-blue-50 p-4">
          <View className="mb-2 flex-row items-center">
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <Text className="ml-2 text-sm font-normal text-blue-800">Limites de montant que vous pouvez recevoir</Text>
          </View>
          <Text className="text-sm font-semibold text-blue-700">
            Minimum: {MIN_SATS.toLocaleString()} SATS • Maximum: {MAX_SATS.toLocaleString()} SATS
          </Text>
        </View>

        <View className="flex-1" />

        <View className="mb-8">
          <Button label="Get Started" disabled={!isValidAmount()} onPress={handleSubmit} fullWidth={true} variant="secondary" textClassName="text-base text-white" size="lg" />
        </View>
      </View>
    </SafeAreaView>
  );
}
