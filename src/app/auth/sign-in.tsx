import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native';

import { ScreenSubtitle } from '@/components/screen-subtitle';
import { ScreenTitle } from '@/components/screen-title';
import type { SignInFormProps } from '@/components/sign-in-form';
import { SignInForm } from '@/components/sign-in-form';
import { useSoftKeyboardEffect } from '@/core/keyboard';
import { FocusAwareStatusBar, View } from '@/ui';

export default function Login() {
  useSoftKeyboardEffect();
  const router = useRouter();

  const onSubmit: SignInFormProps['onSubmit'] = () => {
    router.push('/auth/otp-confirmation');
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
        <ScreenTitle title="What's your phone number?" />
        <View className="mb-4" />
        <ScreenSubtitle subtitle="We'll send you a verification code so make sure it's your number" />
        <View className="mb-4" />
        <SignInForm onSubmit={onSubmit} />
      </View>
    </SafeAreaView>
  );
}
