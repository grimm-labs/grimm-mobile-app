import { Stack, useRouter } from 'expo-router';
import React from 'react';

import type { SignInFormProps } from '@/components/sign-in-form';
import { SignInForm } from '@/components/sign-in-form';
import { useSoftKeyboardEffect } from '@/core/keyboard';
import { FocusAwareStatusBar } from '@/ui';

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
        }}
      />
      <FocusAwareStatusBar />
      <SignInForm onSubmit={onSubmit} />
    </>
  );
}
