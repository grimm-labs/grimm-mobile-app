/* eslint-disable react/no-unstable-nested-components */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { Button, colors, FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';

export default function MnemonicWarning() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleCancel = () => router.replace('/');
  const handleProceed = () => router.push('/settings/backup-seed-phrase/recovery-seed-phrase');

  const warnings = [t('mnemonicWarning.warning1'), t('mnemonicWarning.warning2'), t('mnemonicWarning.warning3')];

  return (
    <SafeAreaProvider>
      <SafeAreaView>
        <View className="flex h-full justify-between px-4">
          <Stack.Screen
            options={{
              headerTitleAlign: 'center',
              headerTitle: () => <HeaderTitle title={t('mnemonicWarning.header')} />,
              headerShown: true,
              headerShadowVisible: false,
              headerLeft: HeaderLeft,
            }}
          />
          <FocusAwareStatusBar style="dark" />
          <View>
            <View className="mt-6 items-center">
              <Ionicons name="warning-outline" size={64} color={colors.danger[500]} />
              <Text className="mt-6 text-center text-xl font-medium text-red-500">{t('mnemonicWarning.attention')}</Text>
              <Text className="mt-4 text-center text-sm text-gray-600">{t('mnemonicWarning.intro')}</Text>
            </View>
            <View className="mt-8 border-t-[0.5px] border-gray-300" />
            <View className="mt-6 space-y-6">
              {warnings.map((text, index) => (
                <View key={index} className="flex flex-row items-center space-x-4">
                  <View className="m-3">
                    <Ionicons name={index === 0 ? 'alert-circle-outline' : index === 1 ? 'help-circle-outline' : 'lock-closed-outline'} size={32} color="gray" />
                  </View>
                  <Text className="flex-1 text-sm text-gray-700">{text}</Text>
                </View>
              ))}
            </View>
          </View>
          <View className="flex-col justify-between">
            <Button testID="cancel-button" label={t('mnemonicWarning.cancel')} fullWidth size="lg" variant="outline" className="mb-4" textClassName="text-base" onPress={handleCancel} />
            <Button testID="proceed-button" label={t('mnemonicWarning.proceed')} fullWidth size="lg" variant="secondary" textClassName="text-base text-white" onPress={handleProceed} />
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
