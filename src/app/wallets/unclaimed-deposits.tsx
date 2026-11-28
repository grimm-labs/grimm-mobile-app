/* eslint-disable react/no-unstable-nested-components */
import type { DepositInfo } from '@breeztech/breez-sdk-spark-react-native';
import { Stack } from 'expo-router';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { Button, FocusAwareStatusBar, SafeAreaView, Text } from '@/components/ui';
import type { DepositState } from '@/lib/breez/deposits';
import { getDepositKey, getDepositState, getRequiredClaimFeeSats } from '@/lib/breez/deposits';
import { useUnclaimedDeposits } from '@/lib/hooks/use-unclaimed-deposits';
import { useStackScreenOptions } from '@/lib/stack-screen-options';
import { theme } from '@/lib/theme-classes';

function formatSats(amount: bigint): string {
  return Number(amount).toLocaleString('en-US');
}

/** testIDs of a deposit: `deposits-item-<txid>-<vout>` */
function depositTestId(deposit: Pick<DepositInfo, 'txid' | 'vout'>): string {
  return `deposits-item-${deposit.txid}-${deposit.vout}`;
}

const STATE_BADGE_CLASSES: Record<DepositState, string> = {
  confirming: 'bg-gray-100 text-gray-700 dark:bg-charcoal-800 dark:text-charcoal-200',
  awaitingClaim: 'bg-gray-100 text-gray-700 dark:bg-charcoal-800 dark:text-charcoal-200',
  claiming: 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200',
  needsFeeApproval: 'bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-200',
  tooSmall: 'bg-danger-100 text-danger-700 dark:bg-danger-900 dark:text-danger-200',
  failed: 'bg-danger-100 text-danger-700 dark:bg-danger-900 dark:text-danger-200',
  refunding: 'bg-gray-100 text-gray-700 dark:bg-charcoal-800 dark:text-charcoal-200',
};

type ClaimFeeDetailsProps = { deposit: DepositInfo; requiredFeeSats: bigint; isClaiming: boolean; onClaimPress: (deposit: DepositInfo) => void };

function ClaimFeeDetails({ deposit, requiredFeeSats, isClaiming, onClaimPress }: ClaimFeeDetailsProps) {
  const { t } = useTranslation();
  const testID = depositTestId(deposit);

  return (
    <View className="mt-3">
      <Text className={`mb-1 text-sm font-medium ${theme.textMuted}`}>{t('lnWallet.manualClaimModal.claimFee')}</Text>
      <Text testID={`${testID}-fee`} className={`mb-3 text-base ${theme.textPrimary}`}>
        {formatSats(requiredFeeSats)} sats
      </Text>
      <Text className={`mb-1 text-sm font-medium ${theme.textMuted}`}>{t('lnWallet.manualClaimModal.netAmount')}</Text>
      <Text testID={`${testID}-net`} className={`mb-4 text-base font-semibold ${theme.textPrimary}`}>
        {formatSats(deposit.amountSats - requiredFeeSats)} sats
      </Text>
      <Button
        testID={`${testID}-claim`}
        label={t('lnWallet.manualClaimPage.claimButton')}
        fullWidth
        size="lg"
        variant="secondary"
        textClassName="text-base font-semibold"
        loading={isClaiming}
        onPress={() => onClaimPress(deposit)}
      />
    </View>
  );
}

type DepositCardProps = {
  deposit: DepositInfo;
  isClaiming: boolean;
  onClaimPress: (deposit: DepositInfo) => void;
};

function DepositCard({ deposit, isClaiming, onClaimPress }: DepositCardProps) {
  const { t } = useTranslation();
  const state = getDepositState(deposit);
  const requiredFeeSats = getRequiredClaimFeeSats(deposit);
  const testID = depositTestId(deposit);

  return (
    <View testID={testID} className={`mb-4 rounded-xl p-4 ${theme.card}`}>
      <View className="mb-2 flex-row items-center justify-between">
        <Text testID={`${testID}-amount`} className={`text-base font-semibold ${theme.textPrimary}`}>
          {formatSats(deposit.amountSats)} sats
        </Text>
        {/* eslint-disable-next-line security/detect-object-injection -- state is a DepositState, not user input */}
        <Text testID={`${testID}-state`} className={`overflow-hidden rounded-full px-3 py-1 text-xs font-semibold ${STATE_BADGE_CLASSES[state]}`}>
          {t(`deposits.state.${state}`)}
        </Text>
      </View>
      <Text className={`text-sm ${theme.textSecondary}`}>{t(`deposits.stateDescription.${state}`)}</Text>
      <Text className={`mt-2 text-xs ${theme.textMuted}`} selectable>
        {t('deposits.transaction', { txid: `${deposit.txid.slice(0, 12)}…`, vout: deposit.vout })}
      </Text>
      {state === 'needsFeeApproval' && requiredFeeSats !== null && <ClaimFeeDetails deposit={deposit} requiredFeeSats={requiredFeeSats} isClaiming={isClaiming} onClaimPress={onClaimPress} />}
    </View>
  );
}

export default function UnclaimedDepositsScreen() {
  const { t } = useTranslation();
  const stackScreenOptions = useStackScreenOptions();
  const { deposits, isLoading, claimDeposit, claimingKey } = useUnclaimedDeposits();

  const handleClaimPress = useCallback(
    (deposit: DepositInfo) => {
      const requiredFeeSats = getRequiredClaimFeeSats(deposit);
      if (requiredFeeSats === null) {
        return;
      }

      Alert.alert(
        t('lnWallet.manualClaimConfirm.title'),
        t('lnWallet.manualClaimConfirm.message', {
          amount: formatSats(deposit.amountSats),
          fee: formatSats(requiredFeeSats),
          net: formatSats(deposit.amountSats - requiredFeeSats),
        }),
        [
          { text: t('lnWallet.manualClaimConfirm.cancel'), style: 'cancel' },
          { text: t('lnWallet.manualClaimConfirm.ok'), onPress: () => claimDeposit(deposit) },
        ],
      );
    },
    [claimDeposit, t],
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView testID="deposits-screen" className="flex-1 bg-white dark:bg-charcoal-950">
        <Stack.Screen
          options={{
            headerTitleAlign: 'center',
            headerTitle: () => <Text className={theme.textPrimary}>{t('deposits.title')}</Text>,
            headerShown: true,
            headerShadowVisible: false,
            headerLeft: HeaderLeft,
            ...stackScreenOptions,
          }}
        />
        <FocusAwareStatusBar />
        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          <View className="mb-6 mt-4">
            <Text className={`mb-4 text-base ${theme.textSecondary}`}>{t('deposits.description')}</Text>
            {isLoading && deposits.length === 0 ? (
              <ActivityIndicator testID="deposits-loading" size="large" className="mt-8" />
            ) : deposits.length === 0 ? (
              <View testID="deposits-empty" className={`rounded-xl p-6 ${theme.card}`}>
                <Text className={`text-center text-base ${theme.textSecondary}`}>{t('deposits.empty')}</Text>
              </View>
            ) : (
              deposits.map((deposit) => <DepositCard key={getDepositKey(deposit)} deposit={deposit} isClaiming={claimingKey === getDepositKey(deposit)} onClaimPress={handleClaimPress} />)
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
