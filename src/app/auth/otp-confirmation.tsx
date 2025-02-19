/* eslint-disable max-lines-per-function */
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, View } from 'react-native';
import * as z from 'zod';

import { useGetOtp, useSignIn } from '@/api';
import type { OtpFormProps, OtpFormType } from '@/components/otp-confirmation-form';
import { ScreenSubtitle } from '@/components/screen-subtitle';
import { ScreenTitle } from '@/components/screen-title';
import { useAuth } from '@/core';
import { useSoftKeyboardEffect } from '@/core/keyboard';
import { Button, ControlledInput, FocusAwareStatusBar, showErrorMessage, showSuccessMessage, Text } from '@/ui';

const OTP_EXPIRATION_TIME = 60;

type SearchParams = {
  phoneNumber: string;
};

const otpSchema = z.object({
  code: z.string().length(6, 'Required'),
});

export default function Login() {
  useSoftKeyboardEffect();
  const { phoneNumber } = useLocalSearchParams<SearchParams>();
  const router = useRouter();
  const signIn = useAuth.use.signIn();

  const [secondsLeft, setSecondsLeft] = useState(OTP_EXPIRATION_TIME);
  const [canRetry, setCanRetry] = useState(false);
  const [retryCount, setRetryCount] = useState(1);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState<boolean>(false);

  const { mutate: signInMutation, isPending: isSignInPending } = useSignIn();
  const { mutate: getOTP, isPending: isGetOtpPending } = useGetOtp();

  const onSubmitOtpVerification: OtpFormProps['onSubmit'] = ({ code }) => {
    console.log('onSubmitOtpVerification');
    if (phoneNumber) {
      signInMutation(
        {
          phoneNumber,
          code,
        },
        {
          onSuccess: (response) => {
            console.log(response);
            signIn({ access: response.accessToken, refresh: response.refreshToken });
            router.push('/auth/pin-code-creation');
          },
          onError: (error) => {
            console.log(error);
            console.log('Failed to sign in');
            showErrorMessage("Couldn't verify the code. Please try again.");
          },
        }
      );
    }
  };

  const onSubmitGetOtp = () => {
    console.log('onSubmitOtpVerification 2');
    if (phoneNumber) {
      getOTP(
        {
          phoneNumber,
        },
        {
          onSuccess: () => {
            setSecondsLeft(OTP_EXPIRATION_TIME * (retryCount + 1));
            setRetryCount((prev) => prev + 1);
            setCanRetry(false);
            showSuccessMessage('Code sent successfully');
          },
          onError: () => {
            showErrorMessage('Failed to send code');
          },
        }
      );
    }
  };

  const { handleSubmit, control, watch } = useForm<OtpFormType>({
    resolver: zodResolver(otpSchema),
  });

  const otpValues = watch(['code']);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanRetry(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [retryCount]);

  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardOpen(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      console.log('Keyboard Hidden');
    });

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  return (
    <SafeAreaView>
      <View className="flex h-full justify-between px-4">
        <Stack.Screen
          options={{
            title: '',
            headerShown: true,
            headerShadowVisible: false,
          }}
        />
        <FocusAwareStatusBar />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} className="flex-1" keyboardVerticalOffset={90}>
          <View className="flex-1">
            <View className="flex">
              <ScreenTitle title="Verify phone number" />
              <View className="mb-4" />
              <ScreenSubtitle subtitle={`We sent a 6 digit code to ${phoneNumber}`} />
              <View className="mb-4" />
              <Pressable onPress={() => router.back()}>
                <Text className="text-lg font-bold underline">Change number</Text>
              </Pressable>
              <View className="mb-4" />
              <View className="flex">
                <View>
                  <ControlledInput control={control} name="code" maxLength={6} keyboardType="number-pad" placeholder="Enter 6 digit number" />
                </View>
                <View className="mt-6">
                  {!canRetry && <Text className="text-center">Resend the verification code in {formatTime(secondsLeft)}</Text>}
                  {canRetry && (
                    <Pressable onPress={onSubmitGetOtp}>
                      <Text className="text-center">
                        Didn't get a code? <Text className="text-lg font-bold text-success-600 underline">Resend Code</Text>
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
            <View className="flex-1 justify-end">
              <Button
                testID="otp-submit-button"
                label="Verify code"
                fullWidth={true}
                size="lg"
                variant="secondary"
                textClassName="text-base text-white"
                onPress={handleSubmit(onSubmitOtpVerification)}
                disabled={isGetOtpPending || isSignInPending || otpValues[0]?.length !== 6}
                className={isKeyboardOpen ? 'mb-4' : 'mb-0'}
                loading={isGetOtpPending || isSignInPending}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}
