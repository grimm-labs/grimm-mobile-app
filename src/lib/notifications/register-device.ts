import axios from 'axios';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Localization from 'expo-localization';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { RegisterDevicePayload } from '@/api/notifications';
import { registerDevice, updateDevice } from '@/api/notifications';
import { isNotificationServiceConfigured } from '@/lib/notifications/config';
import { clearStoredDeviceId, getStoredDeviceId, getStoredPushToken, setStoredDeviceId, setStoredPushToken } from '@/lib/notifications/device-storage';
import {
  logPermissionRequest,
  logPermissionStatus,
  logPushTokenChanged,
  logPushTokenUnchangedSync,
  logRegisteringNewDevice,
  logRegistrationFailed,
  logRegistrationSkipped,
  logRegistrationStart,
  logRegistrationSuccess,
  logServiceConfiguration,
} from '@/lib/notifications/logger';

export type RegisterDeviceOptions = {
  requestPermission?: boolean;
};

export class FcmNotConfiguredError extends Error {
  constructor() {
    super('Firebase/FCM is not configured for Android push notifications.');
    this.name = 'FcmNotConfiguredError';
  }
}

export function isFcmNotConfiguredError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('FirebaseApp is not initialized') || message.includes('fcm-credentials') || error instanceof FcmNotConfiguredError;
}

export async function ensureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Grimm Wallet',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF6B00',
  });
}

export async function hasNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function ensureNotificationPermission(requestPermission: boolean): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  logPermissionStatus(status);

  if (status === 'granted') {
    return true;
  }

  if (!requestPermission) {
    return false;
  }

  const { status: requestedStatus } = await Notifications.requestPermissionsAsync();
  const granted = requestedStatus === 'granted';
  logPermissionRequest(granted);
  return granted;
}

export async function getExpoPushToken(): Promise<string> {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  if (!projectId) {
    throw new Error('[notifications] EAS projectId not found in app config');
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (error) {
    if (Platform.OS === 'android' && isFcmNotConfiguredError(error)) {
      throw new FcmNotConfiguredError();
    }

    throw error;
  }
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
  expoPushToken: string;
  action: 'created' | 'updated' | 'synced';
};

export type RegisterDeviceSkipReason = 'service_not_configured' | 'permission_denied';

export type RegisterDeviceOutcome = { status: 'success'; result: RegisterDeviceResult } | { status: 'skipped'; reason: RegisterDeviceSkipReason };

function isDeviceNotFoundError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

async function registerNewDevice(payload: RegisterDevicePayload): Promise<RegisterDeviceResult> {
  logRegisteringNewDevice();
  const device = await registerDevice(payload);
  await setStoredDeviceId(device.id);
  await setStoredPushToken(payload.expoPushToken);

  const result: RegisterDeviceResult = {
    deviceId: device.id,
    isNewDevice: true,
    expoPushToken: payload.expoPushToken,
    action: 'created',
  };
  logRegistrationSuccess({
    action: result.action,
    deviceId: result.deviceId,
    pushToken: result.expoPushToken,
    isNewDevice: result.isNewDevice,
  });
  return result;
}

async function syncExistingDevice(storedDeviceId: string, payload: RegisterDevicePayload): Promise<RegisterDeviceOutcome> {
  const { expoPushToken, ...metadata } = payload;

  logPushTokenUnchangedSync();
  try {
    await updateDevice(storedDeviceId, metadata);
  } catch (error) {
    if (!isDeviceNotFoundError(error)) {
      throw error;
    }

    await clearStoredDeviceId();
    const result = await registerNewDevice(payload);
    return { status: 'success', result };
  }

  const result: RegisterDeviceResult = {
    deviceId: storedDeviceId,
    isNewDevice: false,
    expoPushToken,
    action: 'synced',
  };
  logRegistrationSuccess({
    action: result.action,
    deviceId: result.deviceId,
    pushToken: result.expoPushToken,
    isNewDevice: result.isNewDevice,
  });
  return { status: 'success', result };
}

async function updateExistingDevice(storedDeviceId: string, payload: RegisterDevicePayload): Promise<RegisterDeviceOutcome> {
  const { expoPushToken } = payload;

  logPushTokenChanged();
  try {
    const device = await updateDevice(storedDeviceId, payload);
    await setStoredDeviceId(device.id);
    await setStoredPushToken(expoPushToken);

    const result: RegisterDeviceResult = {
      deviceId: device.id,
      isNewDevice: false,
      expoPushToken,
      action: 'updated',
    };
    logRegistrationSuccess({
      action: result.action,
      deviceId: result.deviceId,
      pushToken: result.expoPushToken,
      isNewDevice: result.isNewDevice,
    });
    return { status: 'success', result };
  } catch (error) {
    if (!isDeviceNotFoundError(error)) {
      throw error;
    }

    await clearStoredDeviceId();
    const result = await registerNewDevice(payload);
    return { status: 'success', result };
  }
}

export async function registerDeviceWithNotificationService(options: RegisterDeviceOptions = {}): Promise<RegisterDeviceOutcome> {
  const { requestPermission = false } = options;

  logRegistrationStart(requestPermission);

  const isConfigured = isNotificationServiceConfigured();
  logServiceConfiguration(isConfigured);

  if (!isConfigured) {
    logRegistrationSkipped('service_not_configured');
    return { status: 'skipped', reason: 'service_not_configured' };
  }

  const permissionGranted = await ensureNotificationPermission(requestPermission);
  if (!permissionGranted) {
    logRegistrationSkipped('permission_denied');
    return { status: 'skipped', reason: 'permission_denied' };
  }

  try {
    await ensureAndroidNotificationChannel();

    const expoPushToken = await getExpoPushToken();
    const metadata = collectDeviceMetadata();
    const payload: RegisterDevicePayload = { expoPushToken, ...metadata };

    const storedDeviceId = await getStoredDeviceId();
    const storedPushToken = await getStoredPushToken();

    if (storedDeviceId && storedPushToken === expoPushToken) {
      return syncExistingDevice(storedDeviceId, payload);
    }

    if (storedDeviceId) {
      return updateExistingDevice(storedDeviceId, payload);
    }

    const result = await registerNewDevice(payload);
    return { status: 'success', result };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logRegistrationFailed(message);
    throw error;
  }
}

export { getStoredDeviceId };
