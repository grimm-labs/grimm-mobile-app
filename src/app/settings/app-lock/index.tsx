/* eslint-disable react/no-unstable-nested-components */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { Button, colors, FocusAwareStatusBar, Pressable, SafeAreaView, ScrollView, Switch, Text, View } from '@/components/ui';
import { useAppLock } from '@/lib/context/app-lock-context';
import { theme } from '@/lib/theme-classes';

export default function AppLockSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAppLockEnabled } = useAppLock();

  return (
    <SafeAreaProvider>
      <SafeAreaView testID="app-lock-screen" className={`flex-1 ${theme.screen}`}>
        <Stack.Screen
          options={{
            headerTitle: () => <HeaderTitle title={t('appLock.settings.headerTitle')} />,
            headerTitleAlign: 'center',
            headerLeft: HeaderLeft,
            headerShadowVisible: false,
          }}
        />
        <FocusAwareStatusBar />
        <ScrollView className="flex-1 px-4">
          <View className="my-6 items-center">
            <View className="mb-4 rounded-full bg-primary-100 p-4">
              <Ionicons name="lock-closed" size={40} color={colors.primary[600]} />
            </View>
            <Text className={`text-center text-base leading-6 ${theme.textSecondary}`}>{t('appLock.settings.description')}</Text>
            <Text testID="app-lock-status" className={`mt-3 text-center text-sm font-semibold ${theme.textPrimary}`}>
              {isAppLockEnabled ? t('appLock.settings.onDescription') : t('appLock.settings.offDescription')}
            </Text>
          </View>
          {isAppLockEnabled ? (
            <AppLockOnOptions />
          ) : (
            <Button testID="app-lock-turn-on" label={t('appLock.settings.turnOn')} size="lg" fullWidth onPress={() => router.push({ pathname: '/settings/app-lock/set-pin', params: { mode: 'create' } })} />
          )}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

/** Each option is a Sensitive Action: it asks for the PIN or Biometric Unlock first. */
const AppLockOnOptions = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { isBiometricUnlockEnabled, isBiometricUnlockAvailable, authorizeSensitiveAction, setBiometricUnlockEnabled, disableAppLock } = useAppLock();
  const iconColor = colorScheme === 'dark' ? colors.charcoal[300] : colors.neutral[500];

  const toggleBiometricUnlock = async () => {
    if (await authorizeSensitiveAction('biometricUnlock')) await setBiometricUnlockEnabled(!isBiometricUnlockEnabled);
  };

  const changePin = async () => {
    if (await authorizeSensitiveAction('changePin')) router.push({ pathname: '/settings/app-lock/set-pin', params: { mode: 'change' } });
  };

  const turnOff = async () => {
    if (await authorizeSensitiveAction('disableAppLock')) await disableAppLock();
  };

  return (
    <View>
      <View className={`overflow-hidden rounded-xl border p-2 ${theme.border} ${theme.surface}`}>
        {/* Hidden without strong biometrics, unless it was turned on before the biometrics were removed */}
        {(isBiometricUnlockAvailable || isBiometricUnlockEnabled) && (
          <View className="flex-row items-center py-2">
            <View className="mr-1 rounded-full p-2">
              <Ionicons name="finger-print" size={20} color={iconColor} />
            </View>
            <View className="ml-2 flex-1">
              <Text className={`text-base font-medium ${theme.textPrimary}`}>{t('appLock.settings.biometricUnlock')}</Text>
              <Text className={`text-xs ${theme.textMuted}`}>{isBiometricUnlockAvailable ? t('appLock.settings.biometricUnlockSubtitle') : t('appLock.settings.biometricUnavailable')}</Text>
            </View>
            <Switch.Root
              testID="app-lock-biometric-switch"
              checked={isBiometricUnlockEnabled && isBiometricUnlockAvailable}
              disabled={!isBiometricUnlockAvailable}
              onChange={toggleBiometricUnlock}
              accessibilityLabel={t('appLock.settings.biometricUnlock')}
              className="pb-2"
            >
              <Switch.Icon checked={isBiometricUnlockEnabled && isBiometricUnlockAvailable} />
            </Switch.Root>
          </View>
        )}
        <Pressable testID="app-lock-change-pin" onPress={changePin} className="flex-row items-center py-2">
          <View className="mr-1 rounded-full p-2">
            <Ionicons name="keypad" size={20} color={iconColor} />
          </View>
          <Text className={`ml-2 flex-1 text-base font-medium ${theme.textPrimary}`}>{t('appLock.settings.changePin')}</Text>
          <Ionicons name="chevron-forward" size={20} color={iconColor} />
        </Pressable>
      </View>
      <Button testID="app-lock-turn-off" label={t('appLock.settings.turnOff')} variant="outline" size="lg" fullWidth className="mt-6" textClassName="text-danger-600" onPress={turnOff} />
    </View>
  );
};
