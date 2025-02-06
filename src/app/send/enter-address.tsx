import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import * as z from 'zod';

import { ScreenSubtitle } from '@/components/screen-subtitle';
import { ScreenTitle } from '@/components/screen-title';
import { Button, ControlledInput, View } from '@/ui';

const schema = z.object({
  bitcoinAddress: z.string({ required_error: 'Enter a valid Bitcoin address' }),
});

export type FormType = z.infer<typeof schema>;

export type EnterAddressFormProps = {
  onSubmit?: SubmitHandler<FormType>;
};

export default function EnterBitcoinAddressScreen() {
  const { control } = useForm<FormType>({
    resolver: zodResolver(schema),
  });

  const router = useRouter();
  const [address, setAddress] = useState('');

  // const formValues = watch(['phoneNumber']);

  const handleScanQRCode = () => {
    console.log('Scan QR Code pressed');
    // Logic to open QR scanner
  };

  const handlePasteAddress = () => {
    console.log('Paste address pressed');
    // Logic to paste address (mock example)
    setAddress('bc1qexamplepasteaddress123456');
  };

  const handleContinue = () => {
    console.log('Continue pressed with address:', address);
    router.push('send/enter-amount');
    // Logic to proceed with the entered address
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

        {/* Input Section */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <View className="mb-4">
            <ControlledInput testID="phoneNumber" control={control} name="bitcoinAddress" placeholder="Bitcoin address or invoice" placeholderClassName="text-base" textContentType="telephoneNumber" />
          </View>
        </KeyboardAvoidingView>

        {/* Continue Button */}
        <View>
          <View className="flex-col justify-between">
            <Button testID="login-button" label="Paste Address" fullWidth={true} size="lg" variant="link" className="mb-4" textClassName="text-base" icon="clipboard-outline" onPress={handleScanQRCode} />
            <Button testID="login-button" label="Scan QR Code" fullWidth={true} size="lg" variant="outline" className="mb-4" textClassName="text-base" icon="qr-code-outline" onPress={handlePasteAddress} />
            <Button testID="login-button" label="Continue" fullWidth={true} size="lg" variant="secondary" textClassName="text-base text-white" onPress={handleContinue} disabled={false} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
