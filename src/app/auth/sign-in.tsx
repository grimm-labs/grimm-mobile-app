/* eslint-disable max-lines-per-function */
/* eslint-disable react-native/no-inline-styles */
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useRouter } from 'expo-router';
import type { CountryCode } from 'libphonenumber-js';
import parsePhoneNumberFromString from 'libphonenumber-js/mobile';
import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as z from 'zod';

import { useGetOtp } from '@/api';
import { HeaderLeft } from '@/components/back-button';
import { ScreenSubtitle } from '@/components/screen-subtitle';
import { ScreenTitle } from '@/components/screen-title';
import { Button, colors, ControlledInput, FocusAwareStatusBar, SafeAreaView, showErrorMessage, Text, View } from '@/components/ui';
import { AppContext } from '@/lib/context';
import { formatPhoneNumber, getPlaceholderPhoneNumber } from '@/lib/utils';

interface FormData {
  phoneNumber: string;
}

interface CountryPrefixProps {
  countryCode: string;
  onPress: () => void;
}

interface ClearButtonProps {
  onPress: () => void;
  visible: boolean;
}

const createPhoneSchema = (countryCode: CountryCode, t: (key: string) => string) =>
  z.object({
    phoneNumber: z
      .string({ required_error: t('signIn.errors.required') })
      .min(1, t('signIn.errors.required'))
      .refine(
        (value) => {
          const parsedNumber = parsePhoneNumberFromString(value, countryCode);
          return parsedNumber?.isValid() ?? false;
        },
        { message: t('signIn.errors.invalid') },
      ),
  });

const CountryPrefix: React.FC<CountryPrefixProps> = React.memo(({ countryCode, onPress }) => (
  <Pressable onPress={onPress} hitSlop={8}>
    <View className="flex flex-row items-center justify-center rounded p-1">
      <Text className="mx-2 text-base font-bold text-neutral-500">+{countryCode}</Text>
      <Ionicons name="chevron-down-outline" size={24} color={colors.neutral[500]} />
    </View>
  </Pressable>
));

const ClearButton: React.FC<ClearButtonProps> = React.memo(({ onPress, visible }) => {
  if (!visible) return null;

  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <View className="flex flex-row items-center justify-center rounded p-1">
        <Ionicons name="close-circle-sharp" size={24} color={colors.neutral[500]} />
      </View>
    </Pressable>
  );
});

export default function SignIn() {
  const { t } = useTranslation();
  const { selectedCountry } = useContext(AppContext);
  const { mutate: getOTP, isPending } = useGetOtp();
  const router = useRouter();

  const schema = useMemo(() => createPhoneSchema(selectedCountry.isoCode as CountryCode, t), [selectedCountry.isoCode, t]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { phoneNumber: '' },
  });

  const { handleSubmit, control, setValue, watch, reset } = form;
  const phoneNumberValue = watch('phoneNumber');
  const placeholder = useMemo(() => getPlaceholderPhoneNumber(selectedCountry.isoCode as CountryCode), [selectedCountry.isoCode]);

  useEffect(() => {
    reset({ phoneNumber: '' });
  }, [selectedCountry.isoCode, reset]);

  const handleCountrySelect = useCallback(() => {
    router.push('/auth/select-country');
  }, [router]);

  const handleClearInput = useCallback(() => {
    setValue('phoneNumber', '');
  }, [setValue]);

  const handleOtpSuccess = useCallback(
    (phoneNumber: string) => {
      router.push({
        pathname: '/auth/verify-otp',
        params: { phoneNumber },
      });
    },
    [router],
  );

  const handleOtpError = useCallback(
    (error: unknown) => {
      console.error('Error sending OTP:', error);
      showErrorMessage(t('signIn.errors.sendOtpFailed'));
    },
    [t],
  );

  const onSubmit: SubmitHandler<FormData> = useCallback(
    (data) => {
      const formattedPhoneNumber = formatPhoneNumber(data.phoneNumber, selectedCountry.isoCode as CountryCode);

      getOTP(
        { phoneNumber: formattedPhoneNumber },
        {
          onSuccess: () => handleOtpSuccess(formattedPhoneNumber),
          onError: handleOtpError,
        },
      );
    },
    [selectedCountry.isoCode, getOTP, handleOtpSuccess, handleOtpError],
  );

  const screenOptions = useMemo(
    () => ({
      headerShown: true,
      headerTitle: '',
      headerLeft: HeaderLeft,
      headerRight: () => null,
      headerShadowVisible: false,
    }),
    [],
  );

  const keyboardVerticalOffset = Platform.OS === 'ios' ? 90 : 0;
  const keyboardBehavior = Platform.OS === 'ios' ? 'padding' : 'height';

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1">
        <View className="flex h-full px-4">
          <Stack.Screen options={screenOptions} />
          <FocusAwareStatusBar style="dark" />

          <KeyboardAvoidingView behavior={keyboardBehavior} style={{ flex: 1 }} className="flex-1" keyboardVerticalOffset={keyboardVerticalOffset}>
            <View className="flex-1">
              <View className="flex">
                <ScreenTitle title={t('signIn.title')} />
                <View className="mb-4" />

                <ScreenSubtitle subtitle={t('signIn.subtitle')} />
                <View className="mb-4" />

                <ControlledInput
                  testID="phoneNumberInput"
                  control={control}
                  name="phoneNumber"
                  placeholder={placeholder}
                  placeholderClassName="text-base text-neutral-500"
                  textContentType="telephoneNumber"
                  keyboardType="number-pad"
                  prefix={<CountryPrefix countryCode={selectedCountry.callingCode} onPress={handleCountrySelect} />}
                  suffix={<ClearButton onPress={handleClearInput} visible={(phoneNumberValue?.length ?? 0) >= 1} />}
                  disabled={isPending}
                />

                <View className="mb-4" />

                <Button
                  disabled={isPending}
                  testID="login-button"
                  label={t('signIn.button')}
                  fullWidth
                  size="lg"
                  variant="secondary"
                  textClassName="text-base text-white"
                  onPress={handleSubmit(onSubmit)}
                  loading={isPending}
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
