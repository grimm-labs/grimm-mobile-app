import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, BackHandler } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { Button, colors, FocusAwareStatusBar, SafeAreaView, showErrorMessage, Text, View } from '@/components/ui';
import type { LnurlAuthRequestDetails } from '@/lib/context/breez-context';
import { InputType_Tags, LnurlCallbackStatus_Tags, useBreez } from '@/lib/context/breez-context';
import { readableReason } from '@/lib/lightning/auth-reason';
import { isNetworkError } from '@/lib/payment-input/route-payment-input';
import { theme } from '@/lib/theme-classes';

type SearchParams = {
  paymentInput: string;
};

type ErrorKey = 'paymentInput.errors.unsupported' | 'paymentInput.errors.unreachable' | 'paymentInput.errors.lightningFailed';

// The website says why it asks; any action the spec does not name reads as a sign-in
function titleKey(action: string | undefined) {
  if (action === 'register') return 'lightningLogin.title.register';
  if (action === 'link') return 'lightningLogin.title.link';
  return 'lightningLogin.title.signIn';
}

/** The request, read again with Breez; or the reason it cannot be shown. */
function useLoginRequest(paymentInput: string | undefined) {
  const { parseInput, isBreezInitialized, breezError } = useBreez();
  const [request, setRequest] = useState<LnurlAuthRequestDetails>();
  const [parseError, setParseError] = useState<ErrorKey | null>(null);

  useEffect(() => {
    if (!isBreezInitialized || !paymentInput) return;

    let cancelled = false;
    const fail = (key: ErrorKey) => {
      setRequest(undefined);
      setParseError(key);
    };
    const parseRequest = async () => {
      // A new parse (Breez restarted) starts clean
      setParseError(null);
      try {
        const parsed = await parseInput(paymentInput.trim());
        if (cancelled) return;
        if (parsed.tag === InputType_Tags.LnurlAuth) setRequest(parsed.inner[0]);
        else fail('paymentInput.errors.unsupported');
      } catch (error) {
        console.error('Error parsing the Lightning Login request:', (error as Error)?.message);
        if (!cancelled) fail(isNetworkError(error) ? 'paymentInput.errors.unreachable' : 'paymentInput.errors.unsupported');
      }
    };
    parseRequest();

    return () => {
      cancelled = true;
    };
  }, [isBreezInitialized, paymentInput, parseInput]);

  // Breez could not start: the request cannot be read, instead of a spinner that never ends
  const errorKey: ErrorKey | null = parseError ?? (!isBreezInitialized && breezError ? 'paymentInput.errors.lightningFailed' : null);
  return { request, errorKey };
}

/** Sign in, once per tap. While it runs the user cannot leave; if the screen is gone anyway, the result is dropped. */
function useSignIn(request: LnurlAuthRequestDetails | undefined) {
  const { t } = useTranslation();
  const router = useRouter();
  const { lnurlAuth } = useBreez();
  const [isSigningIn, setIsSigningIn] = useState(false);
  // A second tap can land before the button shows its loading state
  const isSigningInRef = useRef(false);
  const isMountedRef = useRef(true);
  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    [],
  );

  // Like Cancel, the hardware back button waits for the sign-in to finish
  useEffect(() => {
    if (!isSigningIn) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, [isSigningIn]);

  const signIn = async () => {
    if (!request || isSigningInRef.current) return;
    isSigningInRef.current = true;
    setIsSigningIn(true);
    const { domain } = request;
    try {
      const status = await lnurlAuth(request);
      if (!isMountedRef.current) return;
      if (status.tag === LnurlCallbackStatus_Tags.Ok) {
        showMessage({ message: t('lightningLogin.success', { domain }), type: 'success', duration: 2000 });
        router.dismissAll();
        router.replace('/');
      } else {
        const reason = readableReason(status.inner.errorDetails.reason);
        showErrorMessage(reason ? t('lightningLogin.errors.refused', { domain, reason }) : t('lightningLogin.errors.failed'));
      }
    } catch (error) {
      console.error('Error during the Lightning Login:', (error as Error)?.message);
      if (isMountedRef.current) showErrorMessage(t('lightningLogin.errors.failed'));
    } finally {
      isSigningInRef.current = false;
      if (isMountedRef.current) setIsSigningIn(false);
    }
  };

  return { signIn, isSigningIn };
}

type RequestViewProps = {
  request: LnurlAuthRequestDetails;
  onSignIn: () => void;
  onCancel: () => void;
  isSigningIn: boolean;
};

const RequestView = ({ request, onSignIn, onCancel, isSigningIn }: RequestViewProps) => {
  const { t } = useTranslation();
  return (
    <>
      <View className="flex-1 items-center justify-center px-6">
        <View className="mb-8 size-24 items-center justify-center rounded-full bg-primary-100">
          <Ionicons name="key-outline" size={48} color={colors.primary[600]} />
        </View>
        <Text testID="lightning-login-title" className={`mb-4 text-center text-2xl font-bold ${theme.textPrimary}`}>
          {t(titleKey(request.action), { domain: request.domain })}
        </Text>
        <Text className={`text-center text-base leading-6 ${theme.textSecondary}`}>{t('lightningLogin.note', { domain: request.domain })}</Text>
      </View>
      <View className="px-4 pb-4">
        <Button testID="lightning-login-confirm" label={t('lightningLogin.confirm')} onPress={onSignIn} loading={isSigningIn} fullWidth variant="secondary" size="lg" textClassName="text-base font-semibold text-white" />
        <Button testID="lightning-login-cancel" label={t('lightningLogin.cancel')} onPress={onCancel} disabled={isSigningIn} fullWidth variant="ghost" size="lg" />
      </View>
    </>
  );
};

const ErrorView = ({ message, onBack, backLabel }: { message: string; onBack: () => void; backLabel: string }) => (
  <>
    <View className="flex-1 items-center justify-center px-6">
      <Text testID="lightning-login-error" className={`text-center text-lg ${theme.textPrimary}`}>
        {message}
      </Text>
    </View>
    <View className="px-4 pb-4">
      <Button testID="lightning-login-back" label={backLabel} onPress={onBack} fullWidth variant="secondary" size="lg" textClassName="text-base font-semibold text-white" />
    </View>
  </>
);

/**
 * Lightning Login (LNURL-auth): signs in to a website with an identity derived from the Recovery Phrase for that domain
 * only. Nothing is sent before the user taps Sign in. Not a Sensitive Action (spec, Part 4).
 */
export default function LightningLoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { paymentInput } = useLocalSearchParams<SearchParams>();
  const { request, errorKey } = useLoginRequest(paymentInput);
  const { signIn, isSigningIn } = useSignIn(request);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <SafeAreaProvider>
      <SafeAreaView testID="lightning-login-screen" className={`flex-1 ${theme.screen}`}>
        <FocusAwareStatusBar />
        <Stack.Screen options={{ headerTitle: '', headerLeft: isSigningIn ? () => null : HeaderLeft, headerShadowVisible: false, gestureEnabled: !isSigningIn }} />
        {errorKey ? (
          <ErrorView message={t(errorKey)} onBack={goBack} backLabel={t('paymentDetails.goBack')} />
        ) : !request ? (
          <View testID="lightning-login-loading" className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary[600]} />
          </View>
        ) : (
          <RequestView request={request} onSignIn={signIn} onCancel={() => router.back()} isSigningIn={isSigningIn} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
