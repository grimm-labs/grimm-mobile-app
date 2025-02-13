/* eslint-disable react-native/no-inline-styles */
/* eslint-disable max-lines-per-function */
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Vibration } from 'react-native';
import * as z from 'zod';

import { Button, ControlledInput, Pressable, Text, View } from '@/ui';

const OTP_EXPIRATION_TIME = 60;

const otpSchema = z.object({
  code: z.string().length(6, 'Required'),
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

  const otpValues = watch(['code']);
  const isButtonEnabled = otpValues[0]?.length === 6;

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
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1 justify-between">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={90}>
          <View className="flex-1">
            <View>
              <ControlledInput control={control} name="code" maxLength={6} keyboardType="number-pad" placeholder="Enter 6 digit number" />
            </View>
            <View className="mt-4">
              {!canRetry && (
                <Pressable
                  onPress={() => {
                    Vibration.vibrate(100);
                  }}
                >
                  <Text className="text-center">Resend the verification code in {formatTime(secondsLeft)}</Text>
                </Pressable>
              )}
              {canRetry && (
                <Pressable
                  onPress={() => {
                    setSecondsLeft(OTP_EXPIRATION_TIME * (retryCount + 1));
                    setRetryCount((prev) => prev + 1);
                    setCanRetry(false);
                  }}
                >
                  <Text className="text-center">
                    Didn't get a code? <Text className="text-lg font-bold text-success-600 underline">Resend Code</Text>
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
          <View>
            <Button testID="otp-submit-button" label="Verify code" fullWidth={true} size="lg" variant="secondary" textClassName="text-base text-white" onPress={handleSubmit(onSubmit)} disabled={!isButtonEnabled} />
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};
