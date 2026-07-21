import * as SecureStore from 'expo-secure-store';

export const NOTIFICATION_DEVICE_ID_KEY = 'notification_device_id';
export const NOTIFICATION_PUSH_TOKEN_KEY = 'notification_push_token';

async function getSecureItem(key: string): Promise<string | null> {
  try {
    console.log(`[NotificationStorage] Getting ${key}`);
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`[NotificationStorage] Error getting ${key}:`, error);
    return null;
  }
}

async function setSecureItem(key: string, value: string): Promise<void> {
  try {
    console.log(`[NotificationStorage] Setting ${key} to ${value}`);
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error(`[NotificationStorage] Error setting ${key}:`, error);
    throw error;
  }
}

async function deleteSecureItem(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error(`[NotificationStorage] Error deleting ${key}:`, error);
    throw error;
  }
}

// --- Device ID ---

export async function getStoredDeviceId(): Promise<string | null> {
  console.log('[NotificationStorage] getStoredDeviceId called');
  return getSecureItem(NOTIFICATION_DEVICE_ID_KEY);
}

export async function setStoredDeviceId(deviceId: string): Promise<void> {
  console.log('[NotificationStorage] setStoredDeviceId called');
  await setSecureItem(NOTIFICATION_DEVICE_ID_KEY, deviceId);
}

export async function clearStoredDeviceId(): Promise<void> {
  console.log('[NotificationStorage] clearStoredDeviceId called');
  await deleteSecureItem(NOTIFICATION_DEVICE_ID_KEY);
}

// --- Push Token ---

export async function getStoredPushToken(): Promise<string | null> {
  console.log('[NotificationStorage] getStoredPushToken called');
  return getSecureItem(NOTIFICATION_PUSH_TOKEN_KEY);
}

export async function setStoredPushToken(token: string): Promise<void> {
  console.log('[NotificationStorage] setStoredPushToken called');
  await setSecureItem(NOTIFICATION_PUSH_TOKEN_KEY, token);
}

export async function clearStoredPushToken(): Promise<void> {
  console.log('[NotificationStorage] clearStoredPushToken called');
  await deleteSecureItem(NOTIFICATION_PUSH_TOKEN_KEY);
}

// --- Bulk operations ---

export async function clearAllNotificationDeviceData(): Promise<void> {
  await Promise.all([clearStoredDeviceId().catch(() => {}), clearStoredPushToken().catch(() => {})]);
}

export async function hasStoredDevice(): Promise<boolean> {
  const deviceId = await getStoredDeviceId();
  console.log(`[NotificationStorage] hasStoredDevice: ${deviceId !== null && deviceId.length > 0}`);
  return deviceId !== null && deviceId.length > 0;
}
