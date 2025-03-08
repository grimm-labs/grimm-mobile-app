/* eslint-disable react-native/no-inline-styles */
/* eslint-disable max-lines-per-function */
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { Keyboard, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, TouchableWithoutFeedback, View } from 'react-native';
import { z } from 'zod';

import { ScreenSubtitle } from '@/components/screen-subtitle';
import { ScreenTitle } from '@/components/screen-title';
import { Button, ControlledInput, FocusAwareStatusBar, showErrorMessage } from '@/components/ui';
import { isMnemonicValid } from '@/lib/utils';

const seedSchema = z.object({
  word1: z.string({ required_error: 'Word is required' }),
  word2: z.string({ required_error: 'Word is required' }),
  word3: z.string({ required_error: 'Word is required' }),
  word4: z.string({ required_error: 'Word is required' }),
  word5: z.string({ required_error: 'Word is required' }),
  word6: z.string({ required_error: 'Word is required' }),
  word7: z.string({ required_error: 'Word is required' }),
  word8: z.string({ required_error: 'Word is required' }),
  word9: z.string({ required_error: 'Word is required' }),
  word10: z.string({ required_error: 'Word is required' }),
  word11: z.string({ required_error: 'Word is required' }),
  word12: z.string({ required_error: 'Word is required' }),
});

type SeedFormType = z.infer<typeof seedSchema>;

export type ImportSeedScreenFormProps = { onSubmit: SubmitHandler<SeedFormType> };

export default function ImportWallet() {
  const router = useRouter();
  const { control, handleSubmit } = useForm<SeedFormType>({ resolver: zodResolver(seedSchema) });

  const onSubmit: ImportSeedScreenFormProps['onSubmit'] = async (data) => {
    const mnemonic = Object.values(data).join(' ');
    if (await isMnemonicValid(mnemonic)) {
      router.push({
        pathname: '/auth/wallet-preparation',
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
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <ScreenTitle title="Import an existing wallet" />
            <View className="mb-4" />
            <ScreenSubtitle subtitle="Enter your 12 recovery words below to restore your wallet." />
            <View className="mb-4" />
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <View className="flex-1">
                <View className="flex-1">
                  <View className="flex flex-row">
                    <View className="flex-1 pr-3">
                      <View className="mb-4">
                        <ControlledInput control={control} name="word1" placeholder="1" placeholderClassName="text-xs" />
                      </View>
                      <View className="mb-4">
                        <ControlledInput control={control} name="word2" placeholder="2" placeholderClassName="text-xs" />
                      </View>
                      <View className="mb-4">
                        <ControlledInput control={control} name="word3" placeholder="3" placeholderClassName="text-xs" />
                      </View>
                      <View className="mb-4">
                        <ControlledInput control={control} name="word4" placeholder="4" placeholderClassName="text-xs" />
                      </View>
                      <View className="mb-4">
                        <ControlledInput control={control} name="word5" placeholder="5" placeholderClassName="text-xs" />
                      </View>
                      <View className="mb-4">
                        <ControlledInput control={control} name="word6" placeholder="6" placeholderClassName="text-xs" />
                      </View>
                    </View>
                    <View className="flex-1 pl-3">
                      <View className="mb-4">
                        <ControlledInput control={control} name="word7" placeholder="7" placeholderClassName="text-xs" />
                      </View>
                      <View className="mb-4">
                        <ControlledInput control={control} name="word8" placeholder="8" placeholderClassName="text-xs" />
                      </View>
                      <View className="mb-4">
                        <ControlledInput control={control} name="word9" placeholder="9" placeholderClassName="text-xs" />
                      </View>
                      <View className="mb-4">
                        <ControlledInput control={control} name="word10" placeholder="10" placeholderClassName="text-xs" />
                      </View>
                      <View className="mb-4">
                        <ControlledInput control={control} name="word11" placeholder="11" placeholderClassName="text-xs" />
                      </View>
                      <View className="mb-4">
                        <ControlledInput control={control} name="word12" placeholder="12" placeholderClassName="text-xs" />
                      </View>
                    </View>
                  </View>
                </View>
                <Button label="Import" textClassName="text-white" fullWidth={true} size="lg" variant="secondary" onPress={handleSubmit(onSubmit)} disabled={!z.isValid} />
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}
