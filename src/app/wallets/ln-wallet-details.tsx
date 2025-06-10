/* eslint-disable max-lines-per-function */
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useContext } from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';

import { HeaderLeft } from '@/components/back-button';
import { EmptyTransactions } from '@/components/empty-transaction';
import { TransactionItem } from '@/components/transaction';
import { colors, FocusAwareStatusBar, Image, SafeAreaView, Text, View } from '@/components/ui';
import { convertBitcoinToFiat, convertSatsToBtc, getFiatCurrency } from '@/lib';
import { AppContext } from '@/lib/context';
import { useBitcoin } from '@/lib/context/bitcoin-prices-context';
import { useBreez } from '@/lib/context/breez-context';
import { BitcoinUnit } from '@/types/enum';

type MenuItemProps = {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
};

const MenuItem: React.FC<MenuItemProps> = ({ icon, title, subtitle, onPress, showArrow = true }) => (
  <TouchableOpacity className="flex-row items-center bg-gray-50 p-4" onPress={onPress} activeOpacity={0.7}>
    <View className="mr-4 size-12 items-center justify-center rounded-full bg-primary-600">
      <Ionicons name={icon as any} size={18} color="white" />
    </View>
    <View className="flex-1">
      <Text className="text-base font-medium text-gray-900">{title}</Text>
      {subtitle && <Text className="mt-1 text-sm text-gray-500">{subtitle}</Text>}
    </View>
    {showArrow && <Ionicons name="chevron-forward" size={20} color={colors.primary[600]} />}
  </TouchableOpacity>
);

const HeaderTitle = () => (
  <View className="flex-row items-center">
    <Image className="mr-2 size-8 rounded-full" source={require('@/assets/images/bitcoin_lightning_logo.png')} />
    <Text className="text-lg font-semibold">Lightning</Text>
  </View>
);

export default function LnWalletDetails() {
  const router = useRouter();
  const { bitcoinPrices } = useBitcoin();
  const { selectedCountry, bitcoinUnit } = useContext(AppContext);
  const { balance, payments } = useBreez();

  const selectedFiatCurrency = getFiatCurrency(selectedCountry);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen
        options={{
          headerTitleAlign: 'center',
          headerTitle: HeaderTitle,
          headerShown: true,
          headerShadowVisible: false,
          headerLeft: HeaderLeft,
          headerStyle: {
            backgroundColor: 'white',
          },
        }}
      />
      <FocusAwareStatusBar style="dark" />
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="mb-6 mt-4">
          <View className="rounded-xl border border-gray-100 bg-gray-50 p-6">
            <Text className="mb-2 text-sm text-gray-500">Available Bitcoin Lightning</Text>
            <Text className="mb-2 text-4xl font-bold text-gray-900">
              {convertBitcoinToFiat(balance, BitcoinUnit.Sats, selectedFiatCurrency, bitcoinPrices).toFixed(2)} {selectedFiatCurrency}
            </Text>
            <Text className="mb-4 text-sm text-gray-400">
              {bitcoinUnit === BitcoinUnit.Sats ? Number(balance).toLocaleString('en-US', { minimumFractionDigits: 2 }) : convertSatsToBtc(balance)} {bitcoinUnit}
            </Text>

            <View className="mb-2 border-t border-gray-200 pt-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Image className="mr-2 size-6 rounded-full" source={require('@/assets/images/bitcoin_logo.png')} />
                  <Text className="text-sm text-gray-700">Current Bitcoin price</Text>
                </View>
                <Text className="text-sm font-semibold text-gray-900">
                  {convertBitcoinToFiat(1, BitcoinUnit.Btc, selectedFiatCurrency, bitcoinPrices).toLocaleString('en-US', { minimumFractionDigits: 2 })} {selectedFiatCurrency}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="mb-8">
          <Text className="mb-3 text-xl font-bold text-gray-900">Actions</Text>
          <View className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
            <MenuItem
              icon="add-outline"
              title="Create BTC lightning invoice"
              onPress={() => {
                router.push({
                  pathname: '/receive/amount-description',
                  params: { type: 'lightning' },
                });
              }}
            />
            <View className="ml-14 border-t border-gray-200" />
            <MenuItem
              icon="link"
              title="Receive via BTC on-chain"
              onPress={() => {
                router.push({
                  pathname: '/receive/amount-description',
                  params: { type: 'onchain' },
                });
              }}
            />
            <View className="ml-14 border-t border-gray-200" />
            <MenuItem icon="arrow-up-outline" title="Pay a lightning invoice" onPress={() => router.push('/send/enter-address')} />
          </View>
        </View>

        <View className="mb-8">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-gray-900">Transactions</Text>
            {payments.length > 4 && (
              <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(app)/transactions')}>
                <Text className="text-base font-medium text-primary-600">See all</Text>
              </TouchableOpacity>
            )}
          </View>

          <View>
            {payments.length === 0 ? (
              <EmptyTransactions />
            ) : (
              <View className="">
                {payments.slice(0, 4).map((payment, index) => (
                  <View key={payment.txId}>
                    <TransactionItem payment={payment} />
                    {index < payments.length - 1 && <View className="ml-16 border-t border-gray-100" />}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
