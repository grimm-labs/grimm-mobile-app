import { Stack, useRouter } from 'expo-router';
import React from 'react';

import type { OtpFormProps } from '@/components/otp-confirmation-form';
import { OtpConfirmationForm } from '@/components/otp-confirmation-form';
import { useSoftKeyboardEffect } from '@/core/keyboard';
import { FocusAwareStatusBar, Pressable, Text } from '@/ui';

export default function Login() {
  const router = useRouter();
  useSoftKeyboardEffect();

  const onSubmit: OtpFormProps['onSubmit'] = (_data) => {
    router.push('/auth/pin-code-creation');
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerShown: true,
          headerShadowVisible: false,
          headerRight: () => (
            <Pressable
              testID="need-help-button"
              onPress={() => {
                router.push('need-help');
              }}
            >
              <Text className="text-base font-medium text-primary-600">
                Need help?
              </Text>
            </Pressable>
          ),
        }}
      />
      <FocusAwareStatusBar />
      <OtpConfirmationForm onSubmit={onSubmit} />
    </>
  );
}
