/* eslint-disable react-native/no-inline-styles */
/* eslint-disable max-lines-per-function */
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
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

export const ImportSeedScreenForm = () => {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm<SeedFormType>({
    resolver: zodResolver(seedSchema),
    mode: 'onChange',
    defaultValues: {
      word1: '',
      word2: '',
      word3: '',
      word4: '',
      word5: '',
      word6: '',
      word7: '',
      word8: '',
      word9: '',
      word10: '',
      word11: '',
      word12: '',
    },
  });

  // Fonction appelée quand l’utilisateur appuie sur "Importer"
  const onSubmit: SubmitHandler<SeedFormType> = useCallback(
    (data) => {
      // data contient les 12 mots saisis
      // Exemple :
      // {
      //   word1: 'mot1',
      //   word2: 'mot2',
      //   ...
      //   word12: 'mot12'
      // }

      // TODO: insérer ici la logique pour importer le wallet
      //       via ta librairie Bitcoin ou Lightning.
      console.log('Seed words:', data);

      // Après la validation ou l’import, tu peux rediriger l’utilisateur
      // vers un écran de confirmation ou un dashboard, par exemple :
      router.push('/home');
    },
    [router]
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90} style={{ flex: 1 }}>
          <View className="flex-1">
            <View className="flex flex-row">
              <View className="flex-1 pr-3">
                <View className="mb-4">
                  <ControlledInput control={control} name="word1" placeholder="Word 1" placeholderClassName="text-xs" />
                </View>
                <View className="mb-4">
                  <ControlledInput control={control} name="word2" placeholder="Word 2" placeholderClassName="text-xs" />
                </View>
                <View className="mb-4">
                  <ControlledInput control={control} name="word3" placeholder="Word 3" placeholderClassName="text-xs" />
                </View>
                <View className="mb-4">
                  <ControlledInput control={control} name="word4" placeholder="Word 4" placeholderClassName="text-xs" />
                </View>
                <View className="mb-4">
                  <ControlledInput control={control} name="word5" placeholder="Word 5" placeholderClassName="text-xs" />
                </View>
                <View className="mb-4">
                  <ControlledInput control={control} name="word6" placeholder="Word 6" placeholderClassName="text-xs" />
                </View>
              </View>
              <View className="flex-1 pl-3">
                <View className="mb-4">
                  <ControlledInput control={control} name="word7" placeholder="Word 7" placeholderClassName="text-xs" />
                </View>
                <View className="mb-4">
                  <ControlledInput control={control} name="word8" placeholder="Word 8" placeholderClassName="text-xs" />
                </View>
                <View className="mb-4">
                  <ControlledInput control={control} name="word9" placeholder="Word 9" placeholderClassName="text-xs" />
                </View>
                <View className="mb-4">
                  <ControlledInput control={control} name="word10" placeholder="Word 10" placeholderClassName="text-xs" />
                </View>
                <View className="mb-4">
                  <ControlledInput control={control} name="word11" placeholder="Word 11" placeholderClassName="text-xs" />
                </View>
                <View className="mb-4">
                  <ControlledInput control={control} name="word12" placeholder="Word 12" placeholderClassName="text-xs" />
                </View>
              </View>
            </View>
          </View>
          <Button label="Import" textClassName="text-white" fullWidth={true} size="lg" variant="secondary" onPress={handleSubmit(onSubmit)} disabled={!isValid} />
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};
