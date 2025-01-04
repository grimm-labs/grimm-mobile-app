import { Stack, useRouter } from 'expo-router';
import React from 'react';

import type { PinSetupFormProps } from '@/components/pin-code-creation-form';
import { PinSetupFormWithVirtualKeyboard } from '@/components/pin-code-creation-form';
import { useSoftKeyboardEffect } from '@/core/keyboard';
import { FocusAwareStatusBar, View } from '@/ui';

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
        }}
      />
      <FocusAwareStatusBar />
      <View className="mx-4 mb-6 flex-1">
        <PinSetupFormWithVirtualKeyboard onSubmit={onSubmit} />
      </View>
    </>
  );
}
