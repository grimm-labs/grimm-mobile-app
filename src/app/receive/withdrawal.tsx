/* eslint-disable react/no-unstable-nested-components */
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
import { hasPayableAmount, isFixedAmount, isWithinLimits, toSatLimits } from '@/lib/lightning/amount-limits';
import { domainOf } from '@/lib/lightning/domain';
import { isNetworkError } from '@/lib/payment-input/route-payment-input';
import { theme } from '@/lib/theme-classes';
import { BitcoinUnit } from '@/types/enum';

type SearchParams = {
  paymentInput: string;
};

type Withdrawal = {
  request: LnurlWithdrawRequestDetails;
  limits: SatLimits;
};

type ErrorKey = 'paymentInput.errors.unsupported' | 'paymentInput.errors.unreachable' | 'paymentInput.errors.lightningFailed';

/** The service's offer, read again with Breez; or the reason it cannot be shown. */
function useWithdrawalOffer(paymentInput: string | undefined) {
  const { bitcoinUnit } = useContext(AppContext);
  const { parseInput, isBreezInitialized, breezError } = useBreez();
  const [withdrawal, setWithdrawal] = useState<Withdrawal>();
  const [parseError, setParseError] = useState<ErrorKey | null>(null);
  const [amount, setAmount] = useState('0');

  useEffect(() => {
    if (!isBreezInitialized || !paymentInput) return;

    let cancelled = false;
    const fail = (key: ErrorKey) => {
      setWithdrawal(undefined);
      setParseError(key);
    };
    const parseWithdrawal = async () => {
      // A new parse (Breez restarted, another unit) starts clean
      setParseError(null);
      try {
        const parsed = await parseInput(paymentInput.trim());
        if (cancelled) return;
        if (parsed.tag !== InputType_Tags.LnurlWithdraw) return fail('paymentInput.errors.unsupported');
        const request = parsed.inner[0];
        const limits = toSatLimits(request.minWithdrawable, request.maxWithdrawable);
        // Limits with no whole sat inside (for example 1 500 msat to 1 500 msat) cannot be withdrawn
        if (!hasPayableAmount(limits)) return fail('paymentInput.errors.unsupported');
        setWithdrawal({ request, limits });
        // The maximum by default: most services offer a fixed voucher or "up to" an Amount
        setAmount(toKeypadAmount(limits.maxSats, bitcoinUnit));
      } catch (error) {
        console.error('Error parsing the Withdrawal:', (error as Error)?.message);
        if (!cancelled) fail(isNetworkError(error) ? 'paymentInput.errors.unreachable' : 'paymentInput.errors.unsupported');
      }
    };
    parseWithdrawal();

    return () => {
      cancelled = true;
    };
  }, [isBreezInitialized, paymentInput, parseInput, bitcoinUnit]);

  // Breez could not start: the offer cannot be read, instead of a spinner that never ends
  const errorKey: ErrorKey | null = parseError ?? (!isBreezInitialized && breezError ? 'paymentInput.errors.lightningFailed' : null);
  return { withdrawal, errorKey, amount, setAmount };
}

/** Withdraw, once per tap; the result screen replaces this one, so Back never returns to a spent offer. */
function useWithdraw(withdrawal: Withdrawal | undefined, satsAmount: number) {
  const { t } = useTranslation();
  const router = useRouter();
  const { lnurlWithdraw } = useBreez();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  // A second tap can land before the button shows its loading state
  const isWithdrawingRef = useRef(false);
  // lnurlWithdraw waits up to 60 s: the user may have left meanwhile
  const isMountedRef = useRef(true);
  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    [],
  );

  const withdraw = async () => {
    if (!withdrawal || isWithdrawingRef.current) return;
    isWithdrawingRef.current = true;
    setIsWithdrawing(true);
    try {
      const payment = await lnurlWithdraw(satsAmount, withdrawal.request);
      if (!isMountedRef.current) return;
      const params = { transactionType: 'received', satsAmount: String(satsAmount) };
      if (payment?.status === PaymentStatus.Completed) {
        router.replace({ pathname: '/transaction-result/success-screen', params });
      } else if (!payment || payment.status === PaymentStatus.Pending) {
        // Not received within the 60 s the SDK waits: the service may still pay
        router.replace({ pathname: '/transaction-result/pending-screen', params });
      } else {
        showErrorMessage(t('withdrawal.errors.failed'));
      }
    } catch (error) {
      console.error('Error during the Withdrawal:', (error as Error)?.message);
      if (isMountedRef.current) showErrorMessage(t('withdrawal.errors.failed'));
    } finally {
      isWithdrawingRef.current = false;
      if (isMountedRef.current) setIsWithdrawing(false);
    }
  };

  return { withdraw, isWithdrawing };
}

type OfferProps = {
  withdrawal: Withdrawal;
  amount: string;
  setAmount: (amount: string) => void;
  onWithdraw: () => void;
  isWithdrawing: boolean;
};

const Offer = ({ withdrawal, amount, setAmount, onWithdraw, isWithdrawing }: OfferProps) => {
  const { t } = useTranslation();
  const { bitcoinUnit } = useContext(AppContext);
  const isBtcUnit = bitcoinUnit === BitcoinUnit.Btc;
  const satsAmount = isBtcUnit ? convertBtcToSats(Number(amount)) : Number(amount);
  const isOutsideLimits = !isWithinLimits(satsAmount, withdrawal.limits);

  return (
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
          onPress={onWithdraw}
          loading={isWithdrawing}
          disabled={isOutsideLimits || !satsAmount}
          fullWidth
          variant="secondary"
          size="lg"
          textClassName="text-base text-white"
        />
      </View>
    </View>
  );
};

/**
 * A Withdrawal (LNURL-withdraw): a service (voucher, ATM, faucet) pays an Invoice of the Lightning wallet, for an Amount
 * within its limits. There is no confirmation step: a Withdrawal only brings funds in.
 */
export default function WithdrawalScreen() {
  const { t } = useTranslation();
  const { paymentInput } = useLocalSearchParams<SearchParams>();
  const { bitcoinUnit } = useContext(AppContext);
  const { withdrawal, errorKey, amount, setAmount } = useWithdrawalOffer(paymentInput);
  const satsAmount = bitcoinUnit === BitcoinUnit.Btc ? convertBtcToSats(Number(amount)) : Number(amount);
  const { withdraw, isWithdrawing } = useWithdraw(withdrawal, satsAmount);

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
        {errorKey ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text testID="withdrawal-error" className={`text-center text-lg ${theme.textPrimary}`}>
              {t(errorKey)}
            </Text>
          </View>
        ) : !withdrawal ? (
          <View testID="withdrawal-loading" className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary[600]} />
          </View>
        ) : (
          <Offer withdrawal={withdrawal} amount={amount} setAmount={setAmount} onWithdraw={withdraw} isWithdrawing={isWithdrawing} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
