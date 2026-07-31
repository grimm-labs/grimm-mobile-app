/* eslint-disable react/no-unstable-nested-components */
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Notifications from 'expo-notifications';
import { Stack, useFocusEffect } from 'expo-router';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Platform, Pressable } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { colors, SafeAreaView, ScrollView, Switch, Text, View } from '@/components/ui';
import { useNotifications } from '@/lib/context/notification-context';
import { useStackScreenOptions } from '@/lib/stack-screen-options';

function openDeviceNotificationSettings(): void {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else {
    Linking.openSettings();
  }
}

function showOpenSettingsAlert(t: (key: string) => string, titleKey: string, messageKey: string): void {
  Alert.alert(t(titleKey), t(messageKey), [
    { text: t('notificationSettings.cancel'), style: 'cancel' },
    { text: t('notificationSettings.openSettings'), onPress: openDeviceNotificationSettings },
  ]);
}
// eslint-disable-next-line max-lines-per-function
export default function NotificationSettingsScreen() {
  const { t } = useTranslation();
  const stackScreenOptions = useStackScreenOptions();
  const { isRegistered, isRegistering, registrationError, permissionStatus, registerDevice, refreshPermissionStatus } = useNotifications();

  const isPermissionGranted = permissionStatus === 'granted';
  const isFullyEnabled = isPermissionGranted && isRegistered;

  // Le switch reflète l'état « pleinement opérationnel »
  const switchValue = isFullyEnabled;

  // Sous-titre dynamique
  const statusLabel = isRegistering
    ? t('notificationSettings.registering')
    : isFullyEnabled
      ? t('notificationSettings.enabled')
      : isPermissionGranted && !isRegistered
        ? t('notificationSettings.notRegistered')
        : t('notificationSettings.disabled');

  const handleToggle = async (value: boolean) => {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      await refreshPermissionStatus();

      if (status === 'granted') {
        try {
          await registerDevice();
        } catch {
          // registrationError géré par le contexte
        }
      } else if (status === 'denied') {
        showOpenSettingsAlert(t, 'notificationSettings.permissionDeniedTitle', 'notificationSettings.permissionDeniedMessage');
      }
    } else {
      showOpenSettingsAlert(t, 'notificationSettings.disableTitle', 'notificationSettings.disableMessage');
    }
  };

  useFocusEffect(
    useCallback(() => {
      refreshPermissionStatus();
    }, [refreshPermissionStatus]),
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white dark:bg-charcoal-950">
        <Stack.Screen
          options={{
            headerTitleAlign: 'center',
            headerTitle: () => <HeaderTitle title={t('notificationSettings.header')} />,
            headerShown: true,
            headerShadowVisible: false,
            headerLeft: HeaderLeft,
            ...stackScreenOptions,
          }}
        />
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-4 pb-10 pt-4">
            <View className="rounded-2xl border border-gray-200 p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 flex-row items-center">
                  <View className="mr-3 rounded-full p-2">
                    <Ionicons name="notifications" size={24} color={colors.primary[600]} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900 dark:text-charcoal-100">{t('notificationSettings.pushNotifications')}</Text>
                    <Text className="mt-1 text-sm text-gray-500 dark:text-charcoal-400">{statusLabel}</Text>
                  </View>
                </View>
                <Switch.Root disabled={isRegistering} checked={switchValue} onChange={handleToggle} accessibilityLabel="switch" className="pb-2">
                  <Switch.Icon checked={switchValue} />
                </Switch.Root>
              </View>
              {registrationError && isPermissionGranted && (
                <View className="mt-3 rounded-xl bg-red-50 p-4 dark:bg-red-950">
                  <Text className="text-sm text-red-800 dark:text-red-200">{t('notificationSettings.registrationError')}</Text>
                  <Pressable onPress={() => registerDevice()} className="mt-2">
                    <Text className="text-sm font-semibold text-red-700">{t('notificationSettings.registrationRetry')}</Text>
                  </Pressable>
                </View>
              )}
            </View>

            <View className="mt-4 rounded-xl bg-blue-50 p-4 dark:bg-charcoal-900">
              <Text className="text-sm text-blue-800 dark:text-charcoal-200">{t('notificationSettings.info')}</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
