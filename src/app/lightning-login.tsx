/* eslint-disable max-lines-per-function */
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { Button, colors, FocusAwareStatusBar, SafeAreaView, showErrorMessage, Text, View } from '@/components/ui';
import type { LnurlAuthRequestDetails } from '@/lib/context/breez-context';
import { InputType_Tags, LnurlCallbackStatus_Tags, useBreez } from '@/lib/context/breez-context';
import { theme } from '@/lib/theme-classes';

type SearchParams = {
  paymentInput: string;
};

// The website says why it asks; any action the spec does not name reads as a sign-in
function titleKey(action: string | undefined) {
  if (action === 'register') return 'lightningLogin.title.register';
  if (action === 'link') return 'lightningLogin.title.link';
  return 'lightningLogin.title.signIn';
}

/**
 * Lightning Login (LNURL-auth): signs in to a website with an identity derived from the Recovery Phrase for that domain
 * only. Nothing is sent before the user taps Sign in. Not a Sensitive Action (spec, Part 4).
 */
export default function LightningLoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { paymentInput } = useLocalSearchParams<SearchParams>();
  const { parseInput, isBreezInitialized, lnurlAuth } = useBreez();

  const [request, setRequest] = useState<LnurlAuthRequestDetails>();
  const [parseFailed, setParseFailed] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  // A second tap can land before the button shows its loading state
  const isSigningInRef = useRef(false);

  useEffect(() => {
    if (!isBreezInitialized || !paymentInput) return;

    let cancelled = false;
    const parseRequest = async () => {
      try {
        const parsed = await parseInput(paymentInput.trim());
        if (cancelled) return;
        if (parsed.tag === InputType_Tags.LnurlAuth) setRequest(parsed.inner[0]);
        else setParseFailed(true);
      } catch (error) {
        console.error('Error parsing the Lightning Login request:', (error as Error)?.message);
        if (!cancelled) setParseFailed(true);
      }
    };
    parseRequest();

    return () => {
      cancelled = true;
    };
  }, [isBreezInitialized, paymentInput, parseInput]);

  const handleSignIn = async () => {
    if (!request || isSigningInRef.current) return;
    isSigningInRef.current = true;
    setIsSigningIn(true);
    const { domain } = request;
    try {
      const status = await lnurlAuth(request);
      if (status.tag === LnurlCallbackStatus_Tags.Ok) {
        showMessage({ message: t('lightningLogin.success', { domain }), type: 'success', duration: 2000 });
        router.dismissAll();
        router.replace('/');
      } else {
        showErrorMessage(t('lightningLogin.errors.refused', { domain, reason: status.inner.errorDetails.reason }));
      }
    } catch (error) {
      console.error('Error during the Lightning Login:', (error as Error)?.message);
      showErrorMessage(t('lightningLogin.errors.failed'));
    } finally {
      isSigningInRef.current = false;
      setIsSigningIn(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView testID="lightning-login-screen" className={`flex-1 ${theme.screen}`}>
        <FocusAwareStatusBar />
        <Stack.Screen options={{ headerTitle: '', headerLeft: HeaderLeft, headerShadowVisible: false }} />
        {parseFailed ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text testID="lightning-login-error" className={`text-center text-lg ${theme.textPrimary}`}>
              {t('paymentInput.errors.unsupported')}
            </Text>
          </View>
        ) : !request ? (
          <View testID="lightning-login-loading" className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary[600]} />
          </View>
        ) : (
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
              <Button
                testID="lightning-login-confirm"
                label={t('lightningLogin.confirm')}
                onPress={handleSignIn}
                loading={isSigningIn}
                fullWidth
                variant="secondary"
                size="lg"
                textClassName="text-base font-semibold text-white"
              />
              <Button testID="lightning-login-cancel" label={t('lightningLogin.cancel')} onPress={() => router.back()} disabled={isSigningIn} fullWidth variant="ghost" size="lg" />
            </View>
          </>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
