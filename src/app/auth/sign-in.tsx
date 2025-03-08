/* eslint-disable react-native/no-inline-styles */
/* eslint-disable max-lines-per-function */
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useRouter } from 'expo-router';
import examples from 'libphonenumber-js/examples.mobile.json';
import parsePhoneNumberFromString, { getExampleNumber } from 'libphonenumber-js/mobile';
import type { CountryCode } from 'libphonenumber-js/types';
import React, { useContext } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView } from 'react-native';
import * as z from 'zod';

import { useGetOtp } from '@/api';
import { ScreenSubtitle } from '@/components/screen-subtitle';
import { ScreenTitle } from '@/components/screen-title';
import { Button, ControlledInput, FocusAwareStatusBar, Image, showErrorMessage, Text, View } from '@/components/ui';
import { AppContext } from '@/lib/context';
import { getCountryManager } from '@/lib/utils';

export default function Login() {
  const { mutate: getOTP, isPending } = useGetOtp();
  const { selectedCountryCode } = useContext(AppContext);
  const countryManager = getCountryManager();
  const parseSelectedCountry = countryManager.getCountryByCode(selectedCountryCode);
  const router = useRouter();

  type FormType = z.infer<typeof schema>;

  type SignInFormProps = { onSubmit: SubmitHandler<FormType> };

  const schema = z.object({
    phoneNumber: z.string({ required_error: 'Phone number is required' }).refine(
      (value) => {
        const parsedNumber = parsePhoneNumberFromString(value, selectedCountryCode as CountryCode);
        return parsedNumber ? parsedNumber.isValid() : false;
      },
      {
        message: 'Phone number is invalid',
      },
    ),
  });

  const { handleSubmit, control } = useForm<FormType>({ resolver: zodResolver(schema) });

  const formatPhoneNumber = (number: string, countryCode: CountryCode) => {
    const parsedNumber = parsePhoneNumberFromString(number, countryCode);
    return parsedNumber ? parsedNumber.format('E.164') : `+${parseSelectedCountry?.callingCode}${number}`;
  };

  const handleFormSubmit: SubmitHandler<FormType> = (data) => {
    const formattedPhoneNumber = formatPhoneNumber(data.phoneNumber, selectedCountryCode as CountryCode);
    router.push({
      pathname: '/auth/otp-confirmation',
      params: {
        phoneNumber: formattedPhoneNumber,
      },
    });
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
          showErrorMessage(error?.message);
        },
      },
    );
  };

  const gerPrefix = () => {
    console.log(parseSelectedCountry);
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
          headerBackTitle: undefined,
        }}
      />
      <FocusAwareStatusBar />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} className="flex-1" keyboardVerticalOffset={90}>
        <View className="flex-1">
          <View className="flex">
            <ScreenTitle title="What's your phone number ?" />
            <View className="mb-4" />
            <ScreenSubtitle subtitle="We'll send you a verification code so make sure it's your number and valid" />
            <View className="mb-4" />
            <ControlledInput
              testID="phoneNumberInput"
              control={control}
              name="phoneNumber"
              placeholder={getPlaceholderPhoneNumber(selectedCountryCode as CountryCode)}
              placeholderClassName="text-base"
              textContentType="telephoneNumber"
              keyboardType="number-pad"
              prefix={gerPrefix()}
            />
            <View className="mb-4" />
            <Button testID="login-button" label="Continue" fullWidth={true} size="lg" variant="secondary" textClassName="text-base text-white" onPress={handleSubmit(handleFormSubmit)} loading={isPending} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
