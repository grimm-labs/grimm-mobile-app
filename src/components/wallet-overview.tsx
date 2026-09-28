import { Ionicons } from '@expo/vector-icons';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React, { useCallback, useContext, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { PaymentMethodBottomSheet } from '@/components/modal/payment-method-bottom-sheet';
import { colors, Text, View } from '@/components/ui';
import { convertBitcoinToFiat, formatBalance, getFiatCurrency } from '@/lib';
import { AppContext, useBdk } from '@/lib/context';
import { useBitcoin } from '@/lib/context/bitcoin-prices-context';
import { useBreez } from '@/lib/context/breez-context';
import { theme } from '@/lib/theme-classes';
import { BitcoinUnit } from '@/types/enum';

type PaymentMethod = 'onchain' | 'lightning';

type ActionButtonProps = { icon: string; color: string; bgClass: string; label: string; onPress: () => void; testID: string };

// The whole column (icon + label) is pressable so tapping the label works too
const ActionButton = ({ icon, color, bgClass, label, onPress, testID }: ActionButtonProps) => (
  <Pressable className="flex items-center justify-center" onPress={onPress} testID={testID} accessibilityRole="button" accessibilityLabel={label}>
    <View className={`mb-2 rounded-full ${bgClass} p-3 text-white`}>
      <Ionicons name={icon as any} size={28} color={color} />
    </View>
    <Text className={`text-sm font-medium ${theme.textSecondary}`}>{label}</Text>
  </Pressable>
);

export const WalletOverview = () => {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === 'dark' ? colors.charcoal[300] : colors.neutral[500];
  const { hideBalance, setHideBalance, selectedCountry, bitcoinUnit } = useContext(AppContext);
  const { bitcoinPrices } = useBitcoin();
  const { balance: balanceBreez } = useBreez();
  const { balance: balanceBdk } = useBdk();
  const { t } = useTranslation();
  const balance = balanceBreez + balanceBdk;

  const sendModalRef = useRef<BottomSheetModal>(null);
  const receiveModalRef = useRef<BottomSheetModal>(null);

  const selectedFiatCurrency = getFiatCurrency(selectedCountry);
  const convertedVal = convertBitcoinToFiat(balance, BitcoinUnit.Sats, selectedFiatCurrency, bitcoinPrices);
  const toggleBalance = () => setHideBalance(!hideBalance);

  const handleSendSelect = useCallback(
    (method: PaymentMethod) => {
      router.push(method === 'lightning' ? '/send/enter-address' : '/send-onchain/enter-address');
    },
    [router],
  );

  const handleReceiveSelect = useCallback(
    (method: PaymentMethod) => {
      if (method === 'lightning') {
        router.push({ pathname: '/receive/amount-description', params: { type: 'lightning' } });
      } else {
        router.push('/receive-btc');
      }
    },
    [router],
  );

  return (
    <View>
      <View className="flex-row items-center justify-center">
        <Pressable onPress={toggleBalance} className="flex flex-row items-center" testID="home-balance-toggle">
          <Text className={`mr-2 text-center text-base font-semibold ${theme.textSecondary}`}>{t('walletOverview.totalBalance')}</Text>
          <Ionicons name={hideBalance ? 'eye-off' : 'eye'} size={16} color={iconColor} />
        </Pressable>
      </View>
      <View className="py-6">
        <Pressable onPress={toggleBalance}>
          <Text testID="home-total-balance" className={`mb-4 text-center text-3xl font-bold ${theme.textPrimary}`}>
            {hideBalance ? t('walletOverview.hiddenBalance') : formatBalance(balance, bitcoinUnit)}
          </Text>
        </Pressable>
        <View className="mb-4">
          <Text testID="home-total-balance-fiat" className={`text-center text-lg font-medium ${theme.textSecondary}`}>
            {hideBalance ? t('walletOverview.hiddenBalance') : `${convertedVal.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${selectedFiatCurrency}`}
          </Text>
        </View>
      </View>
      <View className="flex flex-row justify-around space-x-1">
        <ActionButton icon="arrow-up-outline" color="white" bgClass="bg-primary-600" label={t('walletOverview.send')} onPress={() => sendModalRef.current?.present()} testID="home-send-button" />
        <ActionButton icon="add" color="white" bgClass="bg-primary-600" label={t('walletOverview.receive')} onPress={() => receiveModalRef.current?.present()} testID="home-receive-button" />
        <ActionButton icon="scan" color="white" bgClass="bg-neutral-700" label={t('walletOverview.scanQr')} onPress={() => router.push('/scan-qr')} testID="home-scan-button" />
      </View>
      <PaymentMethodBottomSheet ref={sendModalRef} mode="send" onSelect={handleSendSelect} />
      <PaymentMethodBottomSheet ref={receiveModalRef} mode="receive" onSelect={handleReceiveSelect} />
    </View>
  );
};
