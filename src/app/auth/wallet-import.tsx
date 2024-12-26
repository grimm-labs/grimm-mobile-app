import { Stack, useRouter } from 'expo-router';
import React from 'react';

import type { PrivateKeyFormProps } from '@/components/private-key-form';
import { PrivateImportForm } from '@/components/private-key-form';
import { useSeedPhrase } from '@/core/hooks/use-seed-phrase';
import { useSoftKeyboardEffect } from '@/core/keyboard';
import { FocusAwareStatusBar, Pressable, showErrorMessage, Text } from '@/ui';

export default function WalletImport() {
  const router = useRouter();
  useSoftKeyboardEffect();
  const [_seedPhrase, setSeedPhrase] = useSeedPhrase();

  const onSubmit: PrivateKeyFormProps['onSubmit'] = ({ value }) => {
    if (value) {
      showErrorMessage(
        'The 12 words entered are invalid. Please check and try again.'
      );
      return;
    }
    setSeedPhrase(value);
    router.push('/auth/wallet-preparation');
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
      <PrivateImportForm onSubmit={onSubmit} />
    </>
  );
}
