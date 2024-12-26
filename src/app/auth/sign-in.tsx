import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Keyboard } from 'react-native';

import type { SignInFormProps } from '@/components/sign-in-form';
import { SignInForm } from '@/components/sign-in-form';
import { useSoftKeyboardEffect } from '@/core/keyboard';
import { FocusAwareStatusBar, Pressable, Text } from '@/ui';

export default function Login() {
  const router = useRouter();
  useSoftKeyboardEffect();

  const onSubmit: SignInFormProps['onSubmit'] = (_data) => {
    router.push('/auth/otp-confirmation');
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
                Keyboard.dismiss();
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
      <SignInForm onSubmit={onSubmit} />
    </>
  );
}
