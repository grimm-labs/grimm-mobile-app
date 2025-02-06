import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, View } from 'react-native';

import type { OtpFormProps } from '@/components/otp-confirmation-form';
import { OtpConfirmationForm } from '@/components/otp-confirmation-form';
import { ScreenSubtitle } from '@/components/screen-subtitle';
import { ScreenTitle } from '@/components/screen-title';
import { useSoftKeyboardEffect } from '@/core/keyboard';
import { FocusAwareStatusBar } from '@/ui';

export default function Login() {
  const router = useRouter();
  useSoftKeyboardEffect();

  const onSubmit: OtpFormProps['onSubmit'] = (_data) => {
    router.push('/auth/pin-code-creation');
  };

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
        <ScreenTitle title="OTP Confirmation" />
        <View className="mb-4" />
        <ScreenSubtitle subtitle="Please enter the code you received via SMS" />
        <View className="mb-4" />
        <OtpConfirmationForm onSubmit={onSubmit} />
      </View>
    </SafeAreaView>
  );
}
