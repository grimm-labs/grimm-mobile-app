/* eslint-disable max-lines-per-function */
import type { AxiosError } from 'axios';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { OtpInput } from 'react-native-otp-entry';

import type { SignInResponse } from '@/api';
import { useSignIn } from '@/api';
import { HeaderLeft } from '@/components/back-button';
import { ScreenSubtitle } from '@/components/screen-subtitle';
import { ScreenTitle } from '@/components/screen-title';
import { Button, colors, FocusAwareStatusBar, showErrorMessage, View } from '@/components/ui';
import { AppContext } from '@/lib/context';
import { beautifyPhoneNumber } from '@/lib/utils';

type SearchParams = {
  phoneNumber: string;
};

interface ApiErrorResponse {
  message?: string;
}

const OTP_LENGTH = 6;

const OtpInputTheme = {
  placeholderTextStyle: {
    color: colors.neutral[400],
    fontSize: 20,
  },
  pinCodeTextStyle: {
    color: colors.neutral[600],
    fontSize: 20,
    fontWeight: 'bold' as const,
  },
  pinCodeContainerStyle: {
    borderWidth: 1,
    borderRadius: 6,
  },
} as const;

export default function VerifyOTP() {
  const router = useRouter();
  const { phoneNumber } = useLocalSearchParams<SearchParams>();
  const [otpCode, setOtpCode] = useState<string>('');
  const { mutate: processSignIn, isPending } = useSignIn();
  const { setUserToken, setUser } = useContext(AppContext);

  const formattedPhoneNumber = useMemo(() => beautifyPhoneNumber(phoneNumber, 'international'), [phoneNumber]);
  const isOtpValid = useMemo(() => otpCode.length === OTP_LENGTH, [otpCode]);
  const canSubmit = useMemo(() => isOtpValid && !isPending, [isOtpValid, isPending]);

  const extractErrorMessage = useCallback((error: AxiosError): string => {
    const responseData = error.response?.data as ApiErrorResponse | undefined;
    return responseData?.message || 'Failed to verify OTP. Please try again.';
  }, []);

  const handleSignInError = useCallback(
    (error: AxiosError) => {
      console.error('OTP verification failed:', error);
      const errorMessage = extractErrorMessage(error);
      showErrorMessage(errorMessage);
    },
    [extractErrorMessage],
  );

  const handleSignInSuccess = useCallback(
    (response: SignInResponse) => {
      setUserToken({ access: response.accessToken, refresh: response.refreshToken });
      setUser(response.user);
      router.push('/auth/create-or-import-seed');
    },
    [router, setUser, setUserToken],
  );

  const handleOtpChange = useCallback((text: string) => {
    setOtpCode(text);
  }, []);

  const submitOtpVerification = useCallback(() => {
    if (!isOtpValid) {
      showErrorMessage(`Please enter a valid ${OTP_LENGTH}-digit OTP code.`);
      return;
    }

    processSignIn(
      { phoneNumber, code: otpCode },
      {
        onSuccess: handleSignInSuccess,
        onError: handleSignInError,
      },
    );
  }, [isOtpValid, phoneNumber, otpCode, processSignIn, handleSignInSuccess, handleSignInError]);

  return (
    <SafeAreaView className="flex-1">
      <View className="flex h-full px-4">
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: '',
            headerLeft: HeaderLeft,
            headerRight: () => null,
            headerShadowVisible: false,
          }}
        />

        <FocusAwareStatusBar style="dark" />

        {/* Header Section */}
        <View className="flex justify-center">
          <ScreenTitle title="We just sent you an SMS" />
          <View className="mb-6" />

          <ScreenSubtitle subtitle={`To confirm phone number, Please enter the 6 digit pin we sent to ${formattedPhoneNumber}`} />
          <View className="mb-8" />

          {/* OTP Input */}
          <OtpInput
            numberOfDigits={OTP_LENGTH}
            focusColor={colors.primary[600]}
            autoFocus={true}
            hideStick={true}
            placeholder="●●●●●●"
            blurOnFilled
            disabled={isPending}
            type="numeric"
            secureTextEntry={false}
            focusStickBlinkingDuration={500}
            onTextChange={handleOtpChange}
            textInputProps={{
              accessibilityLabel: 'One-Time Password input',
              accessibilityHint: `Enter ${OTP_LENGTH} digit verification code`,
            }}
            textProps={{
              accessibilityRole: 'text',
              accessibilityLabel: 'OTP digit',
              allowFontScaling: false,
            }}
            theme={OtpInputTheme}
          />
          <View className="mb-8" />

          {/* Submit Button */}
          <Button
            disabled={!canSubmit}
            testID="verify-otp-button"
            label="Verify"
            fullWidth
            size="lg"
            variant="secondary"
            textClassName="text-base text-white"
            onPress={submitOtpVerification}
            loading={isPending}
            accessibilityLabel="Verify OTP code"
            accessibilityHint="Tap to verify the entered OTP code"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
