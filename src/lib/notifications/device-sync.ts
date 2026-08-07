import axios from 'axios';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Localization from 'expo-localization';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';

import { updateDevice } from '@/api/notifications';

import { logSyncDebounced, logSyncDevice404, logSyncMetadataOnly, logSyncTokenChanged } from './logger';
import { getStoredDeviceId, registerDeviceWithNotificationService } from './register-device';

const TOKEN_KEY = 'notification_push_token';
const LAST_SYNC_KEY = 'notification_last_sync';
const DEVICE_ID_KEY = 'notification_device_id';
export const SYNC_DEBOUNCE_MS = 60_000;

function buildMetadataPayload(): { language: string; timezone: string; appVersion: string; expoPushToken?: string } {
  return {
    language: Localization.getLocales()[0]?.languageCode ?? 'en',
    timezone: Localization.getCalendars()[0]?.timeZone ?? 'UTC',
    appVersion: Application.nativeApplicationVersion ?? 'unknown',
  };
}

export async function syncDeviceOnForeground(): Promise<void> {
  const lastSync = await SecureStore.getItemAsync(LAST_SYNC_KEY);
  if (lastSync && Date.now() - parseInt(lastSync, 10) < SYNC_DEBOUNCE_MS) {
    logSyncDebounced();
    return;
  }

  const deviceId = await getStoredDeviceId();
  if (!deviceId) {
    await registerDeviceWithNotificationService();
    return;
  }

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    return;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  const currentToken = tokenData.data;
  const cachedToken = await SecureStore.getItemAsync(TOKEN_KEY);

  const payload = buildMetadataPayload();
  if (currentToken !== cachedToken) {
    logSyncTokenChanged();
    payload.expoPushToken = currentToken;
  }

  try {
    await updateDevice(deviceId, payload);
    await SecureStore.setItemAsync(TOKEN_KEY, currentToken);
    await SecureStore.setItemAsync(LAST_SYNC_KEY, Date.now().toString());
    logSyncMetadataOnly();
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      logSyncDevice404();
      await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(LAST_SYNC_KEY);
      await registerDeviceWithNotificationService();
      return;
    }
    throw err;
  }
}
