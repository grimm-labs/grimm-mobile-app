/* eslint-disable react/no-unstable-nested-components */
import { Stack, useRouter } from 'expo-router';
import React from 'react';

import type { PinSetupFormProps } from '@/components/pin-code-creation-form';
import { PinSetupFormWithVirtualKeyboard } from '@/components/pin-code-creation-form';
import { useSoftKeyboardEffect } from '@/core/keyboard';
import { FocusAwareStatusBar, Pressable, Text } from '@/ui';

export default function PinCodeCreation() {
  const router = useRouter();
  useSoftKeyboardEffect();

  const onSubmit: PinSetupFormProps['onSubmit'] = () => {
    router.push('/auth/wallet-import-or-creation');
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
      <PinSetupFormWithVirtualKeyboard onSubmit={onSubmit} />
    </>
  );
}
