/* eslint-disable max-lines-per-function */

/* eslint-disable react/no-unstable-nested-components */
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { colors, SafeAreaView, Switch, Text, View } from '@/components/ui';

export default function NotificationSettingsScreen() {
  const { t } = useTranslation();
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setIsEnabled(status === 'granted');
    } catch (error) {
      console.error('Error checking notification permission:', error);
    }
  };

  const handleToggle = async (value: boolean) => {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();

      if (status === 'granted') {
        setIsEnabled(true);
      } else if (status === 'denied') {
        Alert.alert(t('notificationSettings.permissionDeniedTitle'), t('notificationSettings.permissionDeniedMessage'), [
          {
            text: t('notificationSettings.cancel'),
            style: 'cancel',
          },
          {
            text: t('notificationSettings.openSettings'),
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            },
          },
        ]);
        setIsEnabled(false);
      }
    } else {
      Alert.alert(t('notificationSettings.disableTitle'), t('notificationSettings.disableMessage'), [
        {
          text: t('notificationSettings.cancel'),
          style: 'cancel',
        },
        {
          text: t('notificationSettings.openSettings'),
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          },
        },
      ]);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white">
        <Stack.Screen
          options={{
            headerTitleAlign: 'center',
            headerTitle: () => <HeaderTitle title={t('notificationSettings.header')} />,
            headerShown: true,
            headerShadowVisible: false,
            headerLeft: HeaderLeft,
            headerStyle: { backgroundColor: '#ffffff' },
          }}
        />
        <View className="flex-1 px-4">
          <View className="mt-4">
            <View className="rounded-2xl border border-gray-200 p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 flex-row items-center">
                  <View className="mr-3 rounded-full p-2">
                    <Ionicons name="notifications" size={24} color={colors.primary[600]} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900">{t('notificationSettings.pushNotifications')}</Text>
                    <Text className="mt-1 text-sm text-gray-500">{isEnabled ? t('notificationSettings.enabled') : t('notificationSettings.disabled')}</Text>
                  </View>
                </View>
                <View>
                  <Switch.Root checked={isEnabled} onChange={handleToggle} accessibilityLabel="switch" className="pb-2">
                    <Switch.Icon checked={isEnabled} />
                  </Switch.Root>
                </View>
              </View>
            </View>
            <View className="mt-4 rounded-xl bg-blue-50 p-4">
              <View className="flex-row">
                <Text className="ml-2 flex-1 text-sm text-blue-800">{t('notificationSettings.info')}</Text>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
