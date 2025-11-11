/* eslint-disable max-lines-per-function */
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useContext, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors, Image, SafeAreaView } from '@/components/ui';
import { convertBitcoinToFiat, convertSatsToBtc, generateTxUrl, getFiatCurrency } from '@/lib';
import { AppContext, useBreez } from '@/lib/context';
import { useBitcoin } from '@/lib/context/bitcoin-prices-context';
import { BitcoinUnit } from '@/types/enum';

type SearchParams = {
  satsAmount: string;
  txId: string;
};

interface HeaderLeftProps {
  onPress: () => void;
}

const HeaderLeft: React.FC<HeaderLeftProps> = ({ onPress }) => (
  <TouchableOpacity onPress={onPress}>
    <Ionicons name="close-sharp" size={32} color={colors.primary[600]} />
  </TouchableOpacity>
);

export default function TransactionResultScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { satsAmount, txId } = useLocalSearchParams<SearchParams>();
  const { selectedCountry, bitcoinUnit } = useContext(AppContext);
  const { liquidNetwork } = useBreez();
  const { bitcoinPrices } = useBitcoin();
  const animation = useRef<LottieView>(null);

  const headerLeft = () => (
    <HeaderLeft
      onPress={() => {
        router.dismissAll();
        router.replace('/');
      }}
    />
  );

  const selectedFiatCurrency = getFiatCurrency(selectedCountry);

  const openLink = () => {
    const url = generateTxUrl(txId, liquidNetwork);
    Linking.openURL(url).catch((err) => console.error(`Error opening link: ${url}`, err));
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white">
        <Stack.Screen
          options={{
            headerTitle: '',
            headerShown: true,
            headerShadowVisible: false,
            headerLeft: headerLeft,
            headerStyle: {
              backgroundColor: 'white',
            },
          }}
        />
        <View className="flex-1 items-center justify-center px-6">
          <View className="mb-4">
            <LottieView autoPlay ref={animation} style={styles.lottie} loop={true} source={require('@/assets/lotties/1749330404855.json')} />
          </View>
          <Text className="mb-8 text-center text-2xl text-gray-900">{t('onchainSend.transactionResult.sent')}</Text>
          <View className="mb-4 flex-row items-center">
            <View className="mr-3 size-8 items-center justify-center rounded-full bg-orange-500">
              <Image className="mr-2 size-8 rounded-full" source={require('@/assets/images/bitcoin_logo.png')} />
            </View>
            <Text className="text-4xl font-semibold text-neutral-700">
              {bitcoinUnit === BitcoinUnit.Sats ? satsAmount.toLocaleString() : convertSatsToBtc(Number(satsAmount))} {bitcoinUnit}
            </Text>
          </View>
          <Text className="mb-6 text-center text-base text-gray-500">
            {t('onchainSend.transactionResult.date')}{' '}
            {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <Text className="mb-8 text-xl font-bold text-primary-500">
            {t('onchainSend.transactionResult.fiatEquivalent', {
              amount: convertBitcoinToFiat(Number(satsAmount), BitcoinUnit.Sats, selectedFiatCurrency, bitcoinPrices).toLocaleString(undefined, { maximumFractionDigits: 2 }),
              currency: selectedFiatCurrency,
            })}
          </Text>
          <Text className="mb-12 text-base font-medium text-gray-600">#GrimmAppBTC</Text>
        </View>
        <View className="mb-4 px-6">
          <TouchableOpacity onPress={() => openLink()} className="items-center rounded-full bg-primary-600 px-6 py-4">
            <Text className="text-lg font-normal text-white">{t('onchainSend.transactionResult.exploreTransaction')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  lottie: {
    width: 250,
    height: 250,
  },
});
