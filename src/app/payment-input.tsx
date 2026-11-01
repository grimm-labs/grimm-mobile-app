import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PaymentMethodBottomSheet } from '@/components/modal/payment-method-bottom-sheet';
import { Button, colors, FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { AppContext } from '@/lib/context';
import { useBreez } from '@/lib/context/breez-context';
import { usePaymentInput } from '@/lib/hooks/use-payment-input';
import { paymentInputErrorKey } from '@/lib/payment-input/error-messages';
import type { PaymentInputError } from '@/lib/payment-input/route-payment-input';
import { theme } from '@/lib/theme-classes';

type SearchParams = {
  input?: string;
};

const ErrorView = ({ message, onBack, backLabel }: { message: string; onBack: () => void; backLabel: string }) => (
  <>
    <View className="flex-1 items-center justify-center px-6">
      <Text testID="payment-input-error" className={`text-center text-lg ${theme.textPrimary}`}>
        {message}
      </Text>
    </View>
    <View className="px-4 pb-4">
      <Button testID="payment-input-back" label={backLabel} onPress={onBack} fullWidth variant="secondary" size="lg" textClassName="text-base font-semibold text-white" />
    </View>
  </>
);

const LoadingView = ({ label }: { label: string }) => (
  <View testID="payment-input-loading" className="flex-1 items-center justify-center px-6">
    <ActivityIndicator size="large" color={colors.primary[600]} />
    <Text className={`mt-4 text-lg ${theme.textSecondary}`}>{label}</Text>
  </View>
);

/**
 * Where lightning: and bitcoin: links land (+native-intent.tsx). Routes the Payment Input with the rules of every entry
 * point, then replaces itself with the destination. Opening a link never pays or signs in by itself.
 */
export default function PaymentInputScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { input } = useLocalSearchParams<SearchParams>();
  const { hasSeedPhrase, isDataLoaded } = useContext(AppContext);
  const { isBreezInitialized, breezError } = useBreez();

  const [errorReason, setErrorReason] = useState<PaymentInputError>();
  const [isWaitingForBreez, setIsWaitingForBreez] = useState(false);
  const hasRoutedRef = useRef(false);
  const hasPresentedSheetRef = useRef(false);

  const goHome = useCallback(() => {
    router.dismissAll();
    router.replace('/');
  }, [router]);

  const { routeInput, methodSheet } = usePaymentInput({
    navigation: 'replace',
    onError: (reason) => {
      // The link itself waits for Breez while it starts; the Lightning choice of the method sheet does not
      if (reason === 'lightningNotReady' && !hasPresentedSheetRef.current) {
        setIsWaitingForBreez(true);
      } else {
        setErrorReason(reason);
      }
    },
    onSheetDismiss: goHome,
  });

  useEffect(() => {
    if (!isDataLoaded) return;
    // Without a Recovery Phrase, / leads to onboarding
    if (!hasSeedPhrase) {
      router.replace('/');
      return;
    }
    if (hasRoutedRef.current && !(isWaitingForBreez && isBreezInitialized)) return;

    hasRoutedRef.current = true;
    setIsWaitingForBreez(false);
    routeInput(input ?? '').then((route) => {
      if (route.kind === 'chooseMethod') hasPresentedSheetRef.current = true;
    });
  }, [isDataLoaded, hasSeedPhrase, isWaitingForBreez, isBreezInitialized, input, routeInput, router]);

  const lightningFailed = !!breezError && (isWaitingForBreez || errorReason === 'lightningNotReady');
  const errorMessage = lightningFailed ? t('paymentInput.errors.lightningFailed') : errorReason && t(paymentInputErrorKey(errorReason, 'paymentInput.errors.unsupported'));

  return (
    <SafeAreaProvider>
      <SafeAreaView testID="payment-input-screen" className={`flex-1 ${theme.screen}`}>
        <Stack.Screen options={{ headerShown: false }} />
        <FocusAwareStatusBar />
        {errorMessage ? <ErrorView message={errorMessage} onBack={goHome} backLabel={t('paymentDetails.goBack')} /> : <LoadingView label={t('paymentInput.reading')} />}
        <PaymentMethodBottomSheet ref={methodSheet.ref} mode="send" onSelect={methodSheet.onSelect} onDismiss={methodSheet.onDismiss} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
