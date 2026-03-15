import { Ionicons } from '@expo/vector-icons';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import React, { useCallback, useContext, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { PaymentMethodBottomSheet } from '@/components/modal/payment-method-bottom-sheet';
import { Text, View } from '@/components/ui';
import { convertBitcoinToFiat, formatBalance, getFiatCurrency } from '@/lib';
import { AppContext, useBdk } from '@/lib/context';
import { useBitcoin } from '@/lib/context/bitcoin-prices-context';
import { useBreez } from '@/lib/context/breez-context';
import { BitcoinUnit } from '@/types/enum';

type PaymentMethod = 'onchain' | 'lightning';

const ActionButton = ({ icon, color, bgClass, label, onPress }: { icon: string; color: string; bgClass: string; label: string; onPress: () => void }) => (
  <View className="flex items-center justify-center">
    <Pressable className={`mb-2 rounded-full ${bgClass} p-3 text-white`} onPress={onPress}>
      <Ionicons name={icon as any} size={28} color={color} />
    </Pressable>
    <Text className="text-sm font-medium">{label}</Text>
  </View>
);

export const WalletOverview = () => {
  const router = useRouter();
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
        <Pressable onPress={toggleBalance} className="flex flex-row items-center">
          <Text className="mr-2 text-center text-base font-semibold text-gray-600">{t('walletOverview.totalBalance')}</Text>
          <Ionicons name={hideBalance ? 'eye-off' : 'eye'} size={16} color="gray" />
        </Pressable>
      </View>
      <View className="py-6">
        <Pressable onPress={toggleBalance}>
          <Text className="mb-4 text-center text-3xl font-bold text-gray-700">{hideBalance ? t('walletOverview.hiddenBalance') : formatBalance(balance, bitcoinUnit)}</Text>
        </Pressable>
        <View className="mb-4">
          <Text className="text-center text-lg font-medium text-gray-600">
            {hideBalance ? t('walletOverview.hiddenBalance') : `${convertedVal.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${selectedFiatCurrency}`}
          </Text>
        </View>
      </View>
      <View className="flex flex-row justify-around space-x-1">
        <ActionButton icon="arrow-up-outline" color="white" bgClass="bg-primary-600" label={t('walletOverview.send')} onPress={() => sendModalRef.current?.present()} />
        <ActionButton icon="add" color="white" bgClass="bg-primary-600" label={t('walletOverview.receive')} onPress={() => receiveModalRef.current?.present()} />
        <ActionButton icon="scan" color="white" bgClass="bg-neutral-700" label={t('walletOverview.scanQr')} onPress={() => router.push('/scan-qr')} />
      </View>
      <PaymentMethodBottomSheet ref={sendModalRef} mode="send" onSelect={handleSendSelect} />
      <PaymentMethodBottomSheet ref={receiveModalRef} mode="receive" onSelect={handleReceiveSelect} />
    </View>
  );
};
