/* eslint-disable max-lines-per-function */
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Vibration,
} from 'react-native';
import * as z from 'zod';

import { Button, ControlledInput, Pressable, Text, View } from '@/ui';

const OTP_EXPIRATION_TIME = 90;

const otpSchema = z.object({
  otpInputOne: z.string().length(1, 'Required'),
  otpInputTwo: z.string().length(1, 'Required'),
  otpInputThree: z.string().length(1, 'Required'),
  otpInputFour: z.string().length(1, 'Required'),
  otpInputFive: z.string().length(1, 'Required'),
  otpInputSix: z.string().length(1, 'Required'),
});

export type OtpFormType = z.infer<typeof otpSchema>;

export type OtpFormProps = {
  onSubmit?: SubmitHandler<OtpFormType>;
};

export const OtpConfirmationForm = ({
  onSubmit = () => {
    console.log('submit');
  },
}: OtpFormProps) => {
  const { handleSubmit, control, watch } = useForm<OtpFormType>({
    resolver: zodResolver(otpSchema),
  });

  const otpValues = watch([
    'otpInputOne',
    'otpInputTwo',
    'otpInputThree',
    'otpInputFour',
    'otpInputFive',
    'otpInputSix',
  ]);
  const isButtonEnabled = otpValues.every((value) => value?.length === 1);

  const [secondsLeft, setSecondsLeft] = useState(OTP_EXPIRATION_TIME);
  const [canRetry, setCanRetry] = useState(false);
  const [retryCount, setRetryCount] = useState(1);

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
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1 justify-between px-4 pb-6">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={90}
        >
          <View className="flex-1">
            <Text testID="otp-title" className="pb-2 text-center text-2xl">
              Temporary code
            </Text>
            <Text testID="otp-description" className="pb-6 text-center text-sm">
              Please enter the code you received via SMS
            </Text>

            <View className="flex-row flex-wrap justify-around">
              {[
                'otpInputOne',
                'otpInputTwo',
                'otpInputThree',
                'otpInputFour',
                'otpInputFive',
                'otpInputSix',
              ].map((field, index) => (
                <View key={index} className="mb-4 w-[10%]">
                  <ControlledInput
                    control={control}
                    name={field as keyof OtpFormType}
                    maxLength={1}
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    style={{ textAlign: 'center' }}
                  />
                </View>
              ))}
            </View>

            {!canRetry && (
              <Pressable
                onPress={() => {
                  Vibration.vibrate(100);
                }}
              >
                <Text className="mt-4 text-center text-sm text-gray-500">
                  Resend the verification code in {formatTime(secondsLeft)}
                </Text>
              </Pressable>
            )}
            {canRetry && (
              <Pressable
                onPress={() => {
                  setSecondsLeft(OTP_EXPIRATION_TIME * (retryCount + 1));
                  setRetryCount((prev) => prev + 1);
                  setCanRetry(false);
                }}
                className="mt-4"
              >
                <Text className="text-center text-sm text-gray-500">
                  Resend the verification code
                </Text>
              </Pressable>
            )}
          </View>
          <View>
            <Button
              testID="otp-submit-button"
              label="Verify"
              fullWidth={true}
              size="lg"
              variant="secondary"
              textClassName="text-base text-white"
              onPress={handleSubmit(onSubmit)}
              disabled={!isButtonEnabled}
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};
