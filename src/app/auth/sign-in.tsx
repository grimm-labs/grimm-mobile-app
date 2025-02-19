/* eslint-disable react-native/no-inline-styles */
/* eslint-disable max-lines-per-function */
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useRouter } from 'expo-router';
import examples from 'libphonenumber-js/examples.mobile.json';
import parsePhoneNumberFromString, { getExampleNumber } from 'libphonenumber-js/mobile';
import type { CountryCode } from 'libphonenumber-js/types';
import React, { useEffect, useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, SafeAreaView } from 'react-native';
import * as z from 'zod';

import { useGetOtp } from '@/api';
import { ScreenSubtitle } from '@/components/screen-subtitle';
import { ScreenTitle } from '@/components/screen-title';
import type { FormType, SignInFormProps } from '@/components/sign-in-form';
import { getCountryManager, useSelectedCountryCode } from '@/core';
import { useSoftKeyboardEffect } from '@/core/keyboard';
import { Button, ControlledInput, FocusAwareStatusBar, Image, Text, View } from '@/ui';

const schema = z.object({
  phoneNumber: z.string({ required_error: 'Phone number is required' }),
});

export default function Login() {
  useSoftKeyboardEffect();
  const { handleSubmit, control, watch } = useForm<FormType>({
    resolver: zodResolver(schema),
  });
  const router = useRouter();

  const { mutate: getOTP, isPending } = useGetOtp();
  const countryManager = getCountryManager();

  const [selectedCountryCode, _setSelectedCountryCode] = useSelectedCountryCode();
  const [isPhoneNumberValid, setIsPhoneNumberValid] = useState<boolean>(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState<boolean>(false);

  const parseSelectedCountry = countryManager.getCountryByCode(selectedCountryCode);

  const phoneNumberValue = watch('phoneNumber');

  const validatePhoneNumber = (number: string, countryCode: CountryCode) => {
    const parsedNumber = parsePhoneNumberFromString(number, countryCode);
    setIsPhoneNumberValid(parsedNumber ? parsedNumber.isValid() : false);
  };

  const formatPhoneNumber = (number: string, countryCode: CountryCode) => {
    const parsedNumber = parsePhoneNumberFromString(number, countryCode);
    return parsedNumber ? parsedNumber.format('E.164') : `+${parseSelectedCountry?.callingCode}${number}`;
  };

  const handleFormSubmit: SubmitHandler<FormType> = (data) => {
    const formattedPhoneNumber = formatPhoneNumber(data.phoneNumber, selectedCountryCode as CountryCode);
    onSubmit({ phoneNumber: formattedPhoneNumber });
  };

  const getPlaceholderPhoneNumber = (countryCode: CountryCode) => getExampleNumber(countryCode, examples)?.formatNational();

  const onSubmit: SignInFormProps['onSubmit'] = ({ phoneNumber }) => {
    getOTP(
      {
        phoneNumber,
      },
      {
        onSuccess: () => {
          router.push({
            pathname: '/auth/otp-confirmation',
            params: {
              phoneNumber,
            },
          });
        },
        onError: (error) => {
          console.log('error', JSON.stringify(error));
        },
      }
    );
  };

  useEffect(() => {
    if (phoneNumberValue) {
      validatePhoneNumber(phoneNumberValue, selectedCountryCode as CountryCode);
    } else {
      setIsPhoneNumberValid(false);
    }
  }, [phoneNumberValue, selectedCountryCode]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardOpen(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      console.log('Keyboard Hidden');
    });

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const gerPrefix = () => {
    return (
      <Pressable onPress={() => router.push('/auth/select-country')}>
        <View className="flex flex-row items-center justify-center rounded p-1">
          <Image
            style={{ width: 36, height: 36 }}
            className="mr-2 rounded-full"
            contentFit="fill"
            source={{
              uri: parseSelectedCountry?.flag,
            }}
          />
          <Text className="text-base font-semibold text-gray-600">+{parseSelectedCountry?.callingCode}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="mx-2 flex-1">
      <Stack.Screen
        options={{
          title: '',
          headerShown: true,
          headerShadowVisible: false,
        }}
      />
      <FocusAwareStatusBar />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} className="flex-1" keyboardVerticalOffset={90}>
        <View className="flex-1">
          <View className="flex">
            <ScreenTitle title="What's your phone number ?" />
            <View className="mb-4" />
            <ScreenSubtitle subtitle="We'll send you a verification code so make sure it's your number" />
            <View className="mb-4" />
            <View className="flex">
              <View className="mb-4 flex-row">
                <View className="flex-1">
                  <ControlledInput
                    testID="phoneNumberInput"
                    control={control}
                    name="phoneNumber"
                    placeholder={getPlaceholderPhoneNumber(selectedCountryCode as CountryCode)}
                    placeholderClassName="text-base"
                    textContentType="telephoneNumber"
                    keyboardType="number-pad"
                    prefix={gerPrefix()}
                    // autoFocus={true}
                  />
                </View>
              </View>
            </View>
          </View>
          <View className="flex-1 justify-end">
            <Button
              testID="login-button"
              label="Continue"
              fullWidth={true}
              size="lg"
              variant="secondary"
              textClassName="text-base text-white"
              onPress={handleSubmit(handleFormSubmit)}
              disabled={!isPhoneNumberValid}
              loading={isPending}
              className={isKeyboardOpen ? 'mb-4' : 'mb-0'}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
