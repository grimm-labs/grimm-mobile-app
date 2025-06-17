/* eslint-disable max-lines-per-function */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { Button, colors, FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';

interface WarningTypes {
  text: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

export default function MnemonicWarning() {
  const router = useRouter();

  const handleCancel = () => {
    router.replace('/');
  };

  const handleProceed = () => {
    router.push('/settings/backup-seed-phrase/recovery-seed-phrase');
  };

  const warnings: WarningTypes[] = [
    {
      text: 'Anyone with the recovery phrase has full, irrevocable access to all associated wallet funds.',
      icon: 'alert-circle-outline',
    },
    {
      text: 'Grimm App Support team will never ask you for recovery phrase or private key.',
      icon: 'help-circle-outline',
    },
    {
      text: 'Never enter your recovery phrase or private key into a form or application. Apps don’t need them to function.',
      icon: 'lock-closed-outline',
    },
  ];

  return (
    <SafeAreaProvider>
      <SafeAreaView>
        <View className="flex h-full justify-between px-4">
          <Stack.Screen
            options={{
              headerTitleAlign: 'center',
              title: 'Recovery Phrase Warning',
              headerShown: true,
              headerShadowVisible: false,
              headerLeft: HeaderLeft,
            }}
          />
          <FocusAwareStatusBar style="dark" />
          <View>
            {/* Warning Header */}
            <View className="mt-6 items-center">
              <Ionicons name="warning-outline" size={64} color={colors.danger[500]} />
              <Text className="mt-6 text-center text-xl font-medium text-red-500">Attention</Text>
              <Text className="mt-4 text-center text-sm text-gray-600">Please read the following carefully before viewing your recovery phrase.</Text>
            </View>

            {/* Horizontal Divider */}
            <View className="mt-8 border-t-[0.5px] border-gray-300" />

            {/* Warning List */}
            <View className="mt-6 space-y-6">
              {warnings.map(({ text, icon }, index) => (
                <View key={index} className="flex flex-row items-center space-x-4">
                  <View className="m-3">
                    <Ionicons name={icon} size={32} color="gray" />
                  </View>
                  <Text className="flex-1 text-sm text-gray-700">{text}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-col justify-between">
            <Button testID="login-button" label="Cancel" fullWidth={true} size="lg" variant="outline" className="mb-4" textClassName="text-base" onPress={handleCancel} />
            <Button testID="login-button" label="Proceed" fullWidth={true} size="lg" variant="secondary" textClassName="text-base text-white" onPress={handleProceed} />
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
