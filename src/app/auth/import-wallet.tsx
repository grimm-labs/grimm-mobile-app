import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, View } from 'react-native';

import type { ImportSeedScreenFormProps } from '@/components/forms/import-wallet-form';
import { ImportSeedScreenForm } from '@/components/forms/import-wallet-form';
import { ScreenSubtitle } from '@/components/screen-subtitle';
import { ScreenTitle } from '@/components/screen-title';
import { isMnemonicValid } from '@/core';
import { useSoftKeyboardEffect } from '@/core/keyboard';
import { FocusAwareStatusBar, showErrorMessage } from '@/ui';

export default function ImportWallet() {
  const router = useRouter();
  useSoftKeyboardEffect();

  const onSubmit: ImportSeedScreenFormProps['onSubmit'] = async (data) => {
    const mnemonic = Object.values(data).join(' ');
    if (await isMnemonicValid(mnemonic)) {
      router.push({
        pathname: '/auth/seed-phrase-confirmation',
        params: { mnemonic },
      });
    } else {
      showErrorMessage('Invalid mnemonic phrase');
    }
  };

  return (
    <SafeAreaView>
      <View className="flex h-full px-4">
        <Stack.Screen
          options={{
            title: '',
            headerShown: true,
            headerShadowVisible: false,
          }}
        />
        <FocusAwareStatusBar />
        <ScreenTitle title="Import an existing wallet" />
        <View className="mb-4" />
        <ScreenSubtitle subtitle="Enter your 12 recovery words below to restore your wallet." />
        <View className="mb-4" />
        <ImportSeedScreenForm onSubmit={onSubmit} />
      </View>
    </SafeAreaView>
  );
}
