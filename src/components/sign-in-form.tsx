import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import * as z from 'zod';

import { Button, ControlledInput, Text, View } from '@/ui';
import { CountrySelect } from '@/ui/country-select';

const schema = z.object({
  phoneNumber: z
    .string({ required_error: 'Numero de telephone est requis' })
    .min(9, 'Veuillez entrer un telephone valide'),
});

export type FormType = z.infer<typeof schema>;

export type SignInFormProps = {
  onSubmit?: SubmitHandler<FormType>;
};

export const SignInForm = ({
  onSubmit = () => {
    console.log('submit');
  },
}: SignInFormProps) => {
  const { handleSubmit, control, watch } = useForm<FormType>({
    resolver: zodResolver(schema),
  });

  const formValues = watch(['phoneNumber']);
  const isButtonEnabled = formValues[0]?.length >= 9;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1 justify-between">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          className="m-4 flex-1"
          keyboardVerticalOffset={90}
        >
          <View className="flex-1">
            <Text testID="form-title" className="pb-2 text-2xl">
              What's your number?
            </Text>
            <Text testID="form-title" className="pb-6 text-base text-gray-600">
              Enter your phone number to get started, We'll send you a
              verification code so make sure it's your number
            </Text>
            <View className="mb-4 flex-row">
              <View>
                <CountrySelect
                  countryCode="CM"
                  countryPhoneCode="+237"
                  onPress={() => console.log('Hi')}
                />
              </View>
              <View className="ml-4 flex-1">
                <ControlledInput
                  testID="phoneNumber"
                  control={control}
                  name="phoneNumber"
                  placeholder="6XX XX XX XX"
                  placeholderClassName="text-xs"
                  textContentType="telephoneNumber"
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>

          <Button
            testID="login-button"
            label="Continue"
            fullWidth={true}
            size="lg"
            variant="secondary"
            textClassName="text-base text-white"
            className="mb-4"
            onPress={handleSubmit(onSubmit)}
            disabled={!isButtonEnabled}
          />
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};
