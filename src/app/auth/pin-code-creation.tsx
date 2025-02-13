import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native';

import type { PinSetupFormProps } from '@/components/pin-code-creation-form';
import { PinSetupFormWithVirtualKeyboard } from '@/components/pin-code-creation-form';
import { useSoftKeyboardEffect } from '@/core/keyboard';
import { FocusAwareStatusBar, View } from '@/ui';

export default function PinCodeCreation() {
  const router = useRouter();
  useSoftKeyboardEffect();

  const onSubmit: PinSetupFormProps['onSubmit'] = () => {
    router.push('/auth/create-or-import-wallet');
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
        <PinSetupFormWithVirtualKeyboard onSubmit={onSubmit} />
      </View>
    </SafeAreaView>
  );
}
