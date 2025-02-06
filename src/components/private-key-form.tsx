import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform } from 'react-native';
import * as z from 'zod';

import { Button, ControlledInput, Text, View } from '@/ui';

const privateKeySchema = z.object({
  value: z.string({ required_error: 'Seed phrase is required' }),
});

export type PrivateKeyFormType = z.infer<typeof privateKeySchema>;

export type PrivateKeyFormProps = {
  onSubmit?: SubmitHandler<PrivateKeyFormType>;
};

export const PrivateImportForm = ({
  onSubmit = () => {
    console.log('submit');
  },
}: PrivateKeyFormProps) => {
  const { handleSubmit, control, watch } = useForm<PrivateKeyFormType>({
    resolver: zodResolver(privateKeySchema),
  });

  const formValues = watch(['value']);
  const isButtonEnabled = formValues[0]?.split(' ').filter((word) => word.trim() !== '').length === 12;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View className="flex-1 justify-between px-4 pb-4">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={90}>
          <View className="flex-1">
            <Text className="mb-4 text-2xl font-bold text-gray-600">Enter your seed phrase</Text>
            <Text className="pb-4 text-sm text-gray-600">Please enter the 12 words of your private key with each word separated by a space to restore your wallet.</Text>
            <View className="flex">
              <ControlledInput testID={`private-key-word`} control={control} name="value" placeholder="Enter your seed phrase here" multiline={true} />
            </View>
          </View>
          <View>
            <Button testID="private-key-submit-button" label="Confirm" fullWidth={true} size="lg" variant="secondary" textClassName="text-base text-white" onPress={handleSubmit(onSubmit)} disabled={!isButtonEnabled} />
          </View>
        </KeyboardAvoidingView>
      </View>
    </KeyboardAvoidingView>
  );
};
