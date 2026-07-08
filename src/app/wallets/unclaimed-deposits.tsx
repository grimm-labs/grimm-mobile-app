/* eslint-disable react/no-unstable-nested-components */
import type { DepositInfo } from '@breeztech/breez-sdk-spark-react-native';
import { Stack } from 'expo-router';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { Button, FocusAwareStatusBar, SafeAreaView, Text } from '@/components/ui';
import { getDepositKey, getRequiredClaimFeeSats } from '@/lib/breez/unclaimed-deposits-log';
import { useUnclaimedDeposits } from '@/lib/hooks/use-unclaimed-deposits';
import { useStackScreenOptions } from '@/lib/stack-screen-options';
import { theme } from '@/lib/theme-classes';

function formatSats(amount: bigint): string {
  return Number(amount).toLocaleString('en-US');
}

type DepositCardProps = {
  deposit: DepositInfo;
  isClaiming: boolean;
  onClaimPress: (deposit: DepositInfo) => void;
};

function DepositCard({ deposit, isClaiming, onClaimPress }: DepositCardProps) {
  const { t } = useTranslation();
  const requiredFeeSats = getRequiredClaimFeeSats(deposit) ?? BigInt(0);
  const netAmountSats = deposit.amountSats - requiredFeeSats;

  return (
    <View className={`mb-4 rounded-xl p-4 ${theme.card}`}>
      <Text className={`mb-1 text-sm font-medium ${theme.textMuted}`}>{t('lnWallet.manualClaimModal.amount')}</Text>
      <Text className={`mb-3 text-base font-semibold ${theme.textPrimary}`}>{formatSats(deposit.amountSats)} sats</Text>

      <Text className={`mb-1 text-sm font-medium ${theme.textMuted}`}>{t('lnWallet.manualClaimModal.claimFee')}</Text>
      <Text className={`mb-3 text-base ${theme.textPrimary}`}>{formatSats(requiredFeeSats)} sats</Text>

      <Text className={`mb-1 text-sm font-medium ${theme.textMuted}`}>{t('lnWallet.manualClaimModal.netAmount')}</Text>
      <Text className={`mb-4 text-base font-semibold ${theme.textPrimary}`}>{formatSats(netAmountSats)} sats</Text>

      <Button label={t('lnWallet.manualClaimPage.claimButton')} fullWidth size="lg" variant="secondary" textClassName="text-base font-semibold" loading={isClaiming} onPress={() => onClaimPress(deposit)} />
    </View>
  );
}

export default function UnclaimedDepositsScreen() {
  const { t } = useTranslation();
  const stackScreenOptions = useStackScreenOptions();
  const { actionableDeposits, isLoading, claimDeposit, claimingKey } = useUnclaimedDeposits();

  const handleClaimPress = useCallback(
    (deposit: DepositInfo) => {
      const requiredFeeSats = getRequiredClaimFeeSats(deposit);
      if (requiredFeeSats === null) {
        return;
      }

      const netAmountSats = deposit.amountSats - requiredFeeSats;

      Alert.alert(
        t('lnWallet.manualClaimConfirm.title'),
        t('lnWallet.manualClaimConfirm.message', {
          amount: formatSats(deposit.amountSats),
          fee: formatSats(requiredFeeSats),
          net: formatSats(netAmountSats),
        }),
        [
          { text: t('lnWallet.manualClaimConfirm.cancel'), style: 'cancel' },
          {
            text: t('lnWallet.manualClaimConfirm.ok'),
            onPress: () => {
              claimDeposit(deposit);
            },
          },
        ],
      );
    },
    [claimDeposit, t],
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white dark:bg-charcoal-950">
        <Stack.Screen
          options={{
            headerTitleAlign: 'center',
            headerTitle: () => <Text className={theme.textPrimary}>{t('lnWallet.manualClaimPage.title')}</Text>,
            headerShown: true,
            headerShadowVisible: false,
            headerLeft: HeaderLeft,
            ...stackScreenOptions,
          }}
        />
        <FocusAwareStatusBar />
        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          <View className="mb-6 mt-4">
            <Text className={`mb-4 text-base ${theme.textSecondary}`}>{t('lnWallet.manualClaimPage.description')}</Text>
            {isLoading ? (
              <ActivityIndicator size="large" className="mt-8" />
            ) : actionableDeposits.length === 0 ? (
              <View className={`rounded-xl p-6 ${theme.card}`}>
                <Text className={`text-center text-base ${theme.textSecondary}`}>{t('lnWallet.manualClaimPage.empty')}</Text>
              </View>
            ) : (
              actionableDeposits.map((deposit) => <DepositCard key={getDepositKey(deposit)} deposit={deposit} isClaiming={claimingKey === getDepositKey(deposit)} onClaimPress={handleClaimPress} />)
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
