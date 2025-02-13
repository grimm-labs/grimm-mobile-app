/* eslint-disable react-native/no-inline-styles */

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import examples from 'libphonenumber-js/examples.mobile.json';
import type { CountryCode } from 'libphonenumber-js/mobile';
import parsePhoneNumberFromString, { getExampleNumber } from 'libphonenumber-js/mobile';
import React, { useEffect, useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, TouchableWithoutFeedback } from 'react-native';
import * as z from 'zod';

import { getCountryManager, useSelectedCountryCode } from '@/core';
import { Button, ControlledInput, Image, View } from '@/ui';

const schema = z.object({
  phoneNumber: z.string({ required_error: 'Phone number is required' }),
});
export type FormType = z.infer<typeof schema>;
export type SignInFormProps = { onSubmit: SubmitHandler<FormType> };

export const SignInForm = ({ onSubmit }: SignInFormProps) => {
  const router = useRouter();
  const countryManager = getCountryManager();

  const [selectedCountryCode, _setSelectedCountryCode] = useSelectedCountryCode();
  const parseSelectedCountry = countryManager.getCountryByCode(selectedCountryCode);
  const [isPhoneNumberValid, setIsPhoneNumberValid] = useState<boolean>(false);

  const { handleSubmit, control, watch } = useForm<FormType>({
    resolver: zodResolver(schema),
  });
  const phoneNumberValue = watch('phoneNumber');

  const validatePhoneNumber = (number: string, countryCode: CountryCode) => {
    const parsedNumber = parsePhoneNumberFromString(number, countryCode);
    console.log(parsedNumber?.isValid());
    setIsPhoneNumberValid(parsedNumber ? parsedNumber.isValid() : false);
  };

  const getPlaceholderPhoneNumber = (countryCode: CountryCode) => getExampleNumber(countryCode, examples)?.formatNational();

  useEffect(() => {
    if (phoneNumberValue) {
      validatePhoneNumber(phoneNumberValue, selectedCountryCode as CountryCode);
    } else {
      setIsPhoneNumberValid(false);
    }
  }, [phoneNumberValue, selectedCountryCode]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="h-full flex-1">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} className="flex-1" keyboardVerticalOffset={90}>
          <View className="flex-1">
            <View className="mb-4 flex-row">
              <View>
                <Pressable onPress={() => router.push('/auth/select-country')}>
                  <View className="flex flex-row items-center justify-center rounded border-b-2 border-gray-600 p-2">
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
              <View className="ml-2 flex-1">
                <ControlledInput
                  testID="phoneNumber"
                  control={control}
                  name="phoneNumber"
                  placeholder={getPlaceholderPhoneNumber(selectedCountryCode as CountryCode)}
                  placeholderClassName="text-xs"
                  textContentType="telephoneNumber"
                  keyboardType="number-pad"
                  disabled={true}
                />
              </View>
            </View>
          </View>
          <Button testID="login-button" label="Continue" fullWidth={true} size="lg" variant="secondary" textClassName="text-base text-white" onPress={handleSubmit(onSubmit)} disabled={!isPhoneNumberValid} />
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};
