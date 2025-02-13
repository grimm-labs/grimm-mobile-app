import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, View } from 'react-native';

import type { OtpFormProps } from '@/components/otp-confirmation-form';
import { OtpConfirmationForm } from '@/components/otp-confirmation-form';
import { ScreenSubtitle } from '@/components/screen-subtitle';
import { ScreenTitle } from '@/components/screen-title';
import { useSoftKeyboardEffect } from '@/core/keyboard';
import { FocusAwareStatusBar, Text } from '@/ui';

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
        <ScreenTitle title="Verify phone number" />
        <View className="mb-4" />
        <ScreenSubtitle subtitle="We sent a 6 digit code to +237 690 27 07 20" />
        <View className="mb-4" />
        <Text className="text-lg font-bold underline">Change number</Text>
        <View className="mb-4" />
        <OtpConfirmationForm onSubmit={onSubmit} />
      </View>
    </SafeAreaView>
  );
}
