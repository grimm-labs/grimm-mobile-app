import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Localization from 'expo-localization';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { RegisterDevicePayload } from '@/api/notifications';
import { registerDevice, updateDevice } from '@/api/notifications';
import { isNotificationServiceConfigured } from '@/lib/notifications/config';
import { getStoredDeviceId, getStoredPushToken, setStoredDeviceId, setStoredPushToken } from '@/lib/notifications/device-storage';

export async function ensureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Grimm Wallet',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF6B00',
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getExpoPushToken(): Promise<string> {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  if (!projectId) {
    throw new Error('[notifications] EAS projectId not found in app config');
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenData.data;
}

export function collectDeviceMetadata(): Omit<RegisterDevicePayload, 'expoPushToken'> {
  return {
    platform: Platform.OS as 'ios' | 'android',
    language: Localization.getLocales()[0]?.languageCode ?? 'en',
    timezone: Localization.getCalendars()[0]?.timeZone ?? 'UTC',
    appVersion: Application.nativeApplicationVersion ?? 'unknown',
  };
}

export type RegisterDeviceResult = {
  deviceId: string;
  isNewDevice: boolean;
};

export async function registerDeviceWithNotificationService(): Promise<RegisterDeviceResult | null> {
  if (!isNotificationServiceConfigured()) {
    return null;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return null;

  await ensureAndroidNotificationChannel();

  const expoPushToken = await getExpoPushToken();
  const metadata = collectDeviceMetadata();
  const payload: RegisterDevicePayload = { expoPushToken, ...metadata };

  const storedDeviceId = await getStoredDeviceId();
  const storedPushToken = await getStoredPushToken();

  // Skip API call if nothing changed
  if (storedDeviceId && storedPushToken === expoPushToken) {
    return { deviceId: storedDeviceId, isNewDevice: false };
  }

  let deviceId: string;
  let isNewDevice = false;

  if (storedDeviceId) {
    const device = await updateDevice(storedDeviceId, payload);
    deviceId = device.id;
  } else {
    const device = await registerDevice(payload);
    deviceId = device.id;
    isNewDevice = true;
  }

  await setStoredDeviceId(deviceId);
  await setStoredPushToken(expoPushToken);

  return { deviceId, isNewDevice };
}
