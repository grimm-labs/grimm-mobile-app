/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable max-lines-per-function */
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { Button, colors, FocusAwareStatusBar, NumericKeypad, SafeAreaView, showErrorMessage, Text, View } from '@/components/ui';
import { convertBtcToSats, formatBalance, toKeypadAmount } from '@/lib';
import { AppContext } from '@/lib/context';
import type { LnurlWithdrawRequestDetails } from '@/lib/context/breez-context';
import { InputType_Tags, PaymentStatus, useBreez } from '@/lib/context/breez-context';
import type { SatLimits } from '@/lib/lightning/amount-limits';
import { isFixedAmount, isWithinLimits, toSatLimits } from '@/lib/lightning/amount-limits';
import { domainOf } from '@/lib/lightning/domain';
import { theme } from '@/lib/theme-classes';
import { BitcoinUnit } from '@/types/enum';

type SearchParams = {
  paymentInput: string;
};

type Withdrawal = {
  request: LnurlWithdrawRequestDetails;
  limits: SatLimits;
};

/**
 * A Withdrawal (LNURL-withdraw): a service (voucher, ATM, faucet) pays an Invoice of the Lightning wallet, for an Amount
 * within its limits. There is no confirmation step: a Withdrawal only brings funds in.
 */
export default function WithdrawalScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { paymentInput } = useLocalSearchParams<SearchParams>();
  const { bitcoinUnit } = useContext(AppContext);
  const { parseInput, isBreezInitialized, lnurlWithdraw } = useBreez();

  const [withdrawal, setWithdrawal] = useState<Withdrawal>();
  const [parseFailed, setParseFailed] = useState(false);
  const [amount, setAmount] = useState('0');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  // A second tap can land before the button shows its loading state
  const isWithdrawingRef = useRef(false);

  const isBtcUnit = bitcoinUnit === BitcoinUnit.Btc;
  const satsAmount = isBtcUnit ? convertBtcToSats(Number(amount)) : Number(amount);
  const isOutsideLimits = !!withdrawal && !isWithinLimits(satsAmount, withdrawal.limits);

  useEffect(() => {
    if (!isBreezInitialized || !paymentInput) return;

    let cancelled = false;
    const parseWithdrawal = async () => {
      try {
        const parsed = await parseInput(paymentInput.trim());
        if (cancelled) return;
        if (parsed.tag !== InputType_Tags.LnurlWithdraw) {
          setParseFailed(true);
          return;
        }
        const request = parsed.inner[0];
        const limits = toSatLimits(request.minWithdrawable, request.maxWithdrawable);
        setWithdrawal({ request, limits });
        // The maximum by default: most services offer a fixed voucher or "up to" an Amount
        setAmount(toKeypadAmount(limits.maxSats, bitcoinUnit));
      } catch (error) {
        console.error('Error parsing the Withdrawal:', (error as Error)?.message);
        if (!cancelled) setParseFailed(true);
      }
    };
    parseWithdrawal();

    return () => {
      cancelled = true;
    };
  }, [isBreezInitialized, paymentInput, parseInput, bitcoinUnit]);

  const handleWithdraw = async () => {
    if (!withdrawal || isWithdrawingRef.current) return;
    isWithdrawingRef.current = true;
    setIsWithdrawing(true);
    try {
      const payment = await lnurlWithdraw(satsAmount, withdrawal.request);
      const params = { transactionType: 'received', satsAmount: String(satsAmount) };
      if (payment?.status === PaymentStatus.Completed) {
        router.push({ pathname: '/transaction-result/success-screen', params });
      } else if (!payment || payment.status === PaymentStatus.Pending) {
        // Not received within the 60 s the SDK waits: the service may still pay
        router.push({ pathname: '/transaction-result/pending-screen', params });
      } else {
        showErrorMessage(t('withdrawal.errors.failed'));
      }
    } catch (error) {
      console.error('Error during the Withdrawal:', (error as Error)?.message);
      showErrorMessage(t('withdrawal.errors.failed'));
    } finally {
      isWithdrawingRef.current = false;
      setIsWithdrawing(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView testID="withdrawal-screen" className={`flex-1 ${theme.screen}`}>
        <FocusAwareStatusBar />
        <Stack.Screen
          options={{
            headerTitle: () => <HeaderTitle title={t('withdrawal.title')} />,
            headerLeft: HeaderLeft,
            headerTitleAlign: 'center',
            headerShadowVisible: false,
          }}
        />
        {parseFailed ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text testID="withdrawal-error" className={`text-center text-lg ${theme.textPrimary}`}>
              {t('paymentInput.errors.unsupported')}
            </Text>
          </View>
        ) : !withdrawal ? (
          <View testID="withdrawal-loading" className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary[600]} />
          </View>
        ) : (
          <View className="flex-1 px-4 pt-6">
            <View className="mb-6 items-center">
              <Text testID="withdrawal-domain" className={`text-lg font-semibold ${theme.textPrimary}`}>
                {domainOf(withdrawal.request.callback)}
              </Text>
              <Text testID="withdrawal-description" className={`mt-1 text-center text-base ${theme.textSecondary}`}>
                {withdrawal.request.defaultDescription}
              </Text>
            </View>
            <View className="mb-6 items-center">
              <View className="flex-row items-center">
                <Text testID="withdrawal-amount" className="text-6xl font-light text-gray-800 dark:text-charcoal-100">
                  {amount}
                </Text>
                <Text className="ml-2 text-2xl font-light text-gray-400 dark:text-charcoal-500">{bitcoinUnit}</Text>
              </View>
              {isOutsideLimits && (
                <Text testID="withdrawal-limits" className="mt-2 text-center text-sm text-red-500">
                  {t('enterAmount.limits', { min: formatBalance(withdrawal.limits.minSats, bitcoinUnit), max: formatBalance(withdrawal.limits.maxSats, bitcoinUnit) })}
                </Text>
              )}
            </View>
            <View className="flex-1" />
            {/* A fixed voucher has nothing to choose */}
            {!isFixedAmount(withdrawal.limits) && <NumericKeypad amount={amount} setAmount={setAmount} isBtcUnit={isBtcUnit} />}
            <View className="mb-4">
              <Button
                testID="withdrawal-confirm"
                label={t('withdrawal.confirm')}
                onPress={handleWithdraw}
                loading={isWithdrawing}
                disabled={isOutsideLimits || !satsAmount}
                fullWidth
                variant="secondary"
                size="lg"
                textClassName="text-base text-white"
              />
            </View>
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
