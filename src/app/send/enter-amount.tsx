/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable max-lines-per-function */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { Button, colors, FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { NumericKeypad } from '@/components/ui';
import { convertBitcoinToFiat, convertBtcToSats, formatBalance, getFiatCurrency, toKeypadAmount } from '@/lib';
import { AppContext } from '@/lib/context';
import { useBitcoin } from '@/lib/context/bitcoin-prices-context';
import type { InputType } from '@/lib/context/breez-context';
import { InputType_Tags, useBreez } from '@/lib/context/breez-context';
import type { SatLimits } from '@/lib/lightning/amount-limits';
import { isFixedAmount, isWithinLimits, toSatLimits } from '@/lib/lightning/amount-limits';
import { BitcoinUnit } from '@/types/enum';

type SearchParams = {
  paymentInput: string;
};

type Recipient = {
  sendTo: string;
  /** The recipient's limits; an Invoice without an Amount has none */
  limits?: SatLimits;
  /** Set for an Invoice without an Amount: Continue pays this Invoice with the Amount entered */
  bolt11?: string;
};

// What the recipient accepts, read from the Breez parse: undefined for anything this screen cannot pay
function readRecipient(parsed: InputType, invoiceLabel: string): Recipient | undefined {
  if (parsed.tag === InputType_Tags.LightningAddress) {
    const { address, payRequest } = parsed.inner[0];
    return { sendTo: address, limits: toSatLimits(payRequest.minSendable, payRequest.maxSendable) };
  }
  if (parsed.tag === InputType_Tags.LnurlPay) {
    const payRequest = parsed.inner[0];
    return { sendTo: payRequest.domain, limits: toSatLimits(payRequest.minSendable, payRequest.maxSendable) };
  }
  if (parsed.tag === InputType_Tags.Bolt11Invoice && parsed.inner[0].amountMsat === undefined) {
    const invoice = parsed.inner[0];
    return { sendTo: invoice.description || invoiceLabel, bolt11: invoice.invoice.bolt11 };
  }
  return undefined;
}

export default function LightningAddressAmountScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { paymentInput } = useLocalSearchParams<SearchParams>();
  const { bitcoinUnit, selectedCountry } = useContext(AppContext);
  const { bitcoinPrices } = useBitcoin();
  const { balance, parseInput, isBreezInitialized } = useBreez();

  const [amount, setAmount] = useState('0');
  const [fiatAmount, setFiatAmount] = useState('0');
  const [validationError, setValidationError] = useState('');
  const [recipient, setRecipient] = useState<Recipient>();
  const [parseFailed, setParseFailed] = useState(false);

  const isBtcUnit = bitcoinUnit === BitcoinUnit.Btc;
  const selectedFiatCurrency = getFiatCurrency(selectedCountry);
  const satsAmount = isBtcUnit ? convertBtcToSats(Number(amount)) : Number(amount);
  const isOutsideLimits = !!recipient?.limits && !isWithinLimits(satsAmount, recipient.limits);
  // Continue waits for the parse: without it, the recipient's limits are unknown
  const isAmountInvalid = !recipient || !Number(amount) || satsAmount > balance || isOutsideLimits;

  useEffect(() => {
    if (!isBreezInitialized || !paymentInput) return;

    let cancelled = false;
    const parseRecipient = async () => {
      try {
        const parsed = readRecipient(await parseInput(paymentInput.trim()), t('enterAmount.lightningInvoice'));
        if (cancelled) return;
        if (!parsed) {
          setParseFailed(true);
          return;
        }
        setRecipient(parsed);
        // A fixed Amount (equal limits) is pre-filled; the keypad stays enabled
        if (parsed.limits && isFixedAmount(parsed.limits)) {
          setAmount(toKeypadAmount(parsed.limits.minSats, bitcoinUnit));
        }
      } catch (error) {
        console.error('Error parsing the Lightning recipient:', (error as Error)?.message);
        if (!cancelled) setParseFailed(true);
      }
    };
    parseRecipient();

    return () => {
      cancelled = true;
    };
  }, [isBreezInitialized, paymentInput, parseInput, bitcoinUnit, t]);

  useEffect(() => {
    if (!amount || amount === '0' || amount === '.') {
      setFiatAmount('0');
      setValidationError('');
      return;
    }

    const satsValue = isBtcUnit ? Math.round(parseFloat(amount) * 1e8) : parseInt(amount, 10);

    if (isNaN(satsValue)) {
      setValidationError(t('enterAmount.invalidAmount'));
      return;
    }

    setValidationError('');
    const fiat = convertBitcoinToFiat(satsValue, BitcoinUnit.Sats, selectedFiatCurrency, bitcoinPrices).toFixed(2);
    setFiatAmount(fiat);
  }, [amount, isBtcUnit, bitcoinPrices, selectedFiatCurrency, t]);

  const handleContinue = () => {
    const satsValue = isBtcUnit ? Math.round(parseFloat(amount) * 1e8) : parseInt(amount, 10);

    if (!satsValue || isNaN(satsValue)) {
      setValidationError(t('enterAmount.invalidAmount'));
      return;
    }

    if (recipient?.bolt11) {
      router.push({ pathname: '/send/transaction-details', params: { rawInvoice: recipient.bolt11, amountSats: satsValue.toString() } });
      return;
    }
    router.push({
      pathname: '/send/transaction-details',
      params: {
        paymentInput,
        amountSats: satsValue.toString(),
      },
    });
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView testID="send-ln-amount-screen" className="flex-1 bg-white dark:bg-charcoal-950">
        <FocusAwareStatusBar />
        <Stack.Screen
          options={{
            headerTitle: () => <HeaderTitle title={t('enterAmount.headerTitle')} />,
            headerLeft: HeaderLeft,
            headerTitleAlign: 'center',
            headerShadowVisible: false,
          }}
        />
        <View className="flex-1 px-4 pt-6">
          <View className="mb-4 min-h-6 items-center">
            {recipient && (
              <Text testID="send-ln-amount-send-to" className="text-base text-gray-500 dark:text-charcoal-400">
                {t('enterAmount.sendTo')} {recipient.sendTo}
              </Text>
            )}
          </View>
          <View className="mb-6 items-center">
            <View className="flex-row items-center">
              <Text testID="send-ln-amount-value" className={`text-6xl font-light ${validationError ? 'text-red-400' : 'text-gray-800 dark:text-charcoal-100'}`}>
                {amount}
              </Text>
              <Text className="ml-2 text-2xl font-light text-gray-400 dark:text-charcoal-500">{bitcoinUnit}</Text>
            </View>
            {validationError && <Text className="mt-2 text-center text-sm text-red-500">{validationError}</Text>}
            {parseFailed && (
              <Text testID="send-ln-amount-error" className="mt-2 text-center text-sm text-red-500">
                {t('lightningPayment.errors.preparePaymentFailed')}
              </Text>
            )}
            {recipient?.limits && isOutsideLimits && (
              <Text testID="send-ln-amount-limits" className={`mt-2 text-center text-sm ${Number(amount) ? 'text-red-500' : 'text-gray-500 dark:text-charcoal-400'}`}>
                {t('enterAmount.limits', { min: formatBalance(recipient.limits.minSats, bitcoinUnit), max: formatBalance(recipient.limits.maxSats, bitcoinUnit) })}
              </Text>
            )}
          </View>
          <View className="mb-6 items-center">
            <View className="rounded-full bg-primary-600 p-2">
              <MaterialCommunityIcons name="approximately-equal" size={20} color={colors.white} />
            </View>
          </View>
          <View className="mb-8 items-center">
            <View className="flex-row items-center">
              <Text className="mr-2 text-xl font-medium text-gray-800 dark:text-charcoal-100">{fiatAmount}</Text>
              <Text className="text-xl font-semibold text-gray-600 dark:text-charcoal-300">{selectedFiatCurrency}</Text>
            </View>
          </View>
          {Number(amount) > 0 && satsAmount > balance && (
            <View>
              <Text testID="send-ln-amount-insufficient" className="text-center text-base font-semibold text-danger-600">
                {t('enterAmount.insufficientBalance')}
              </Text>
            </View>
          )}
          <View className="flex-1" />
          <NumericKeypad amount={amount} setAmount={setAmount} isBtcUnit={isBtcUnit} />
          <View className="mb-4">
            <Button
              testID="send-ln-amount-continue"
              label={t('enterAmount.continueButton')}
              onPress={handleContinue}
              fullWidth
              variant="secondary"
              size="lg"
              disabled={isAmountInvalid}
              textClassName="text-base text-white"
            />
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
