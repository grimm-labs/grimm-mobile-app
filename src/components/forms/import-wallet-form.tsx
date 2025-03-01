/* eslint-disable react-native/no-inline-styles */

import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from 'react-native';
import * as z from 'zod';

import { Button, ControlledInput, View } from '@/ui';

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

export const ImportSeedScreenForm = ({ onSubmit }: ImportSeedScreenFormProps) => {
  const { control, handleSubmit } = useForm<SeedFormType>({ resolver: zodResolver(seedSchema) });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90} style={{ flex: 1 }}>
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
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};
