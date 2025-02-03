/* eslint-disable max-lines-per-function */
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import examples from 'libphonenumber-js/examples.mobile.json';
import type { CountryCode } from 'libphonenumber-js/mobile';
import parsePhoneNumberFromString, {
  getExampleNumber,
} from 'libphonenumber-js/mobile';
import React, { useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TouchableWithoutFeedback,
} from 'react-native';
import * as z from 'zod';

import countriesList from '@/assets/data/countries.json';
import { CountryManager } from '@/core';
import { useSelectedCountry } from '@/core/hooks/use-selected-country';
import { Button, ControlledInput, Image, Text, View } from '@/ui';

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
  const countryManager = new CountryManager(countriesList);

  const getPlaceholderPhoneNumber = (countryCode: CountryCode) =>
    getExampleNumber(countryCode, examples)?.formatNational();

  const formValues = watch(['phoneNumber']);

  const _isButtonEnabled = formValues[0]?.length >= 9;

  const [selectedCountry, _setSelectedCountry] = useSelectedCountry();
  const parseSelectedCountry = countryManager.getCountryByCode(
    selectedCountry || ''
  );
  const [isPhoneNumberValid, setIsPhoneNumberValid] = useState<boolean>(false);

  const router = useRouter();

  const _validatePhoneNumber = (number: string, countryCode: CountryCode) => {
    const parsedNumber = parsePhoneNumberFromString(number, countryCode);
    setIsPhoneNumberValid(parsedNumber ? parsedNumber.isValid() : false);
  };

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
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/auth/select-country',
                      params: {
                        selectedCountryName: `${parseSelectedCountry?.name.common}`,
                      },
                    })
                  }
                >
                  <View className="flex flex-row items-center justify-center rounded-xl border border-primary-600 p-2">
                    <Image
                      style={{ width: 32, height: 32 }}
                      className="rounded-full"
                      contentFit="fill"
                      source={{
                        uri: parseSelectedCountry?.flag,
                      }}
                    />
                  </View>
                </Pressable>
              </View>
              <View className="ml-4 flex-1">
                <ControlledInput
                  testID="phoneNumber"
                  control={control}
                  name="phoneNumber"
                  placeholder={getPlaceholderPhoneNumber(
                    selectedCountry as CountryCode
                  )}
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
            disabled={!isPhoneNumberValid}
          />
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};
