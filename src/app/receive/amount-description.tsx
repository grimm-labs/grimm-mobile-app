/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable max-lines-per-function */
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, TextInput, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { Button, colors, FocusAwareStatusBar, NumericKeypad, SafeAreaView, Text, View } from '@/components/ui';
import { convertBitcoinToFiat, getFiatCurrency } from '@/lib';
import { AppContext } from '@/lib/context';
import { useBitcoin } from '@/lib/context/bitcoin-prices-context';
import { BitcoinUnit } from '@/types/enum';

type SearchParams = {
  type: 'onchain' | 'lightning';
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
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [draftNote, setDraftNote] = useState('');
  const [validationError, setValidationError] = useState('');
  const noteInputRef = useRef<TextInput>(null);

  const selectedFiatCurrency = getFiatCurrency(selectedCountry);

  const validateAmount = (satsValue: number): string => {
    if (satsValue <= 0) {
      return t('enterAmount.errors.min', { value: '1' });
    }
    return '';
  };

  const handleAmountChange = (value: string) => {
    setSatsAmount(value);
    const satsValue = parseInt(value, 10);

    if (!isNaN(satsValue) && satsValue > 0) {
      const fiat = convertBitcoinToFiat(satsValue, BitcoinUnit.Sats, selectedFiatCurrency, bitcoinPrices).toFixed(2);
      setFiatAmount(fiat);
      setValidationError(validateAmount(satsValue));
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
    return !isNaN(satsValue) && satsValue > 0;
  };

  const openNoteModal = () => {
    setDraftNote(note);
    setNoteModalVisible(true);
  };

  const saveNote = () => {
    setNote(draftNote.trim());
    setNoteModalVisible(false);
  };

  const cancelNote = () => {
    setDraftNote('');
    setNoteModalVisible(false);
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
            <Text className={`text-5xl font-light ${validationError ? 'text-red-400' : 'text-gray-800'}`}>{satsAmount}</Text>
            {validationError ? <Text className="mt-1 text-center text-sm text-red-500">{validationError}</Text> : null}
          </View>
          <View className="mb-4 items-center">
            <View className="rounded-full bg-primary-600 p-2">
              <MaterialCommunityIcons name="approximately-equal" size={20} color={colors.white} />
            </View>
          </View>
          <View className="mb-4 items-center">
            <View className="flex-row items-center">
              <Text className="mr-2 text-xl font-semibold text-gray-700">{selectedFiatCurrency}</Text>
              <Text className="text-bold text-2xl font-medium">{fiatAmount}</Text>
            </View>
          </View>
          {type === 'lightning' && (
            <View className="mb-4 items-center">
              {note ? (
                <TouchableOpacity onPress={openNoteModal} className="flex-row items-center rounded-full bg-gray-100 px-4 py-2">
                  <Ionicons name="document-text-outline" size={16} color="#6B7280" />
                  <Text className="ml-2 text-sm text-gray-600" numberOfLines={1}>
                    {note}
                  </Text>
                  <TouchableOpacity onPress={() => setNote('')} className="ml-2" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={openNoteModal} className="flex-row items-center">
                  <Ionicons name="add-circle-outline" size={18} color="#9CA3AF" />
                  <Text className="ml-1 text-base text-gray-400">{t('enterAmount.addNote')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          <View className="flex-1" />
          <NumericKeypad amount={satsAmount} setAmount={handleAmountChange} isBtcUnit={false} />
          <View className="mb-2">
            <Button label={t('enterAmount.continueButton')} disabled={!isValidAmount()} onPress={handleSubmit} fullWidth={true} variant="secondary" textClassName="text-base text-white" size="lg" />
          </View>
        </View>

        <Modal visible={noteModalVisible} animationType="slide" transparent={true} onRequestClose={cancelNote}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 justify-end bg-black/50">
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View className="rounded-t-3xl bg-white px-4 pb-8 pt-6">
                  <View className="mb-4 flex-row items-center justify-between">
                    <Text className="text-lg font-semibold text-gray-800">{t('enterAmount.addNote')}</Text>
                    <TouchableOpacity onPress={cancelNote} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close" size={24} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    ref={noteInputRef}
                    value={draftNote}
                    onChangeText={setDraftNote}
                    placeholder={t('enterAmount.notePlaceholder')}
                    placeholderTextColor="#9CA3AF"
                    className="mb-4 min-h-[80px] rounded-xl border border-gray-200 bg-gray-50 p-4 text-base text-gray-700"
                    multiline
                    autoFocus
                    onSubmitEditing={saveNote}
                  />
                  <Button label={t('enterAmount.continueButton')} onPress={saveNote} fullWidth={true} variant="secondary" textClassName="text-base text-white" size="lg" />
                </View>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
