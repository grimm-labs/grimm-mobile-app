import Ionicons from '@expo/vector-icons/Ionicons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import * as z from 'zod';

import { ScreenSubtitle } from '@/components/screen-subtitle';
import { ScreenTitle } from '@/components/screen-title';
import { Button, colors, ControlledInput, View } from '@/ui';

const schema = z.object({
  bitcoinAddress: z.string({ required_error: 'Enter a valid Bitcoin address' }),
});

export type FormType = z.infer<typeof schema>;

export type EnterAddressFormProps = {
  onSubmit?: SubmitHandler<FormType>;
};

type SearchParams = {
  qrCode?: string;
};

export default function EnterBitcoinAddressScreen() {
  const { qrCode } = useLocalSearchParams<SearchParams>();
  const router = useRouter();
  const { control, setValue } = useForm<FormType>({ resolver: zodResolver(schema) });

  const handleScanQRCode = () => {
    router.push('scan-qr');
  };

  useEffect(() => {
    setValue('bitcoinAddress', qrCode || '', { shouldValidate: false });
  }, [qrCode, setValue]);

  const handleContinue = () => {
    router.push('send/enter-amount');
  };

  return (
    <SafeAreaView>
      <View className="flex h-full justify-between px-4">
        <Stack.Screen
          options={{
            title: 'Send Bitcoin',
            headerShown: true,
            headerShadowVisible: false,
            headerBackTitleVisible: false,
          }}
        />
        <ScreenTitle title="Enter bitcoin address" />
        <View className="mb-4" />
        <ScreenSubtitle subtitle="Provide a valid Bitcoin address or invoice to send funds" />
        <View className="mb-4" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <View className="mb-4">
            <ControlledInput
              testID="phoneNumber"
              control={control}
              name="bitcoinAddress"
              placeholder="Bitcoin address or invoice"
              placeholderClassName="text-base"
              textContentType="telephoneNumber"
              icon={<Ionicons name="qr-code" size={26} color={colors.primary[600]} />}
              onIconPress={() => handleScanQRCode()}
            />
          </View>
        </KeyboardAvoidingView>
        <View>
          <View className="flex-col justify-between">
            <Button testID="login-button" label="Continue" fullWidth={true} size="lg" variant="secondary" textClassName="text-base text-white" onPress={handleContinue} disabled={false} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
