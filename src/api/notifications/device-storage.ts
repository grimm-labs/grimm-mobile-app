import * as SecureStore from 'expo-secure-store';

export const NOTIFICATION_DEVICE_ID_KEY = 'notification_device_id';
export const NOTIFICATION_PUSH_TOKEN_KEY = 'notification_push_token';

async function getSecureItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`[NotificationStorage] Error getting ${key}:`, error);
    return null;
  }
}

async function setSecureItem(key: string, value: string): Promise<void> {
  try {
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
  return getSecureItem(NOTIFICATION_DEVICE_ID_KEY);
}

export async function setStoredDeviceId(deviceId: string): Promise<void> {
  await setSecureItem(NOTIFICATION_DEVICE_ID_KEY, deviceId);
}

export async function clearStoredDeviceId(): Promise<void> {
  await deleteSecureItem(NOTIFICATION_DEVICE_ID_KEY);
}

// --- Push Token ---

export async function getStoredPushToken(): Promise<string | null> {
  return getSecureItem(NOTIFICATION_PUSH_TOKEN_KEY);
}

export async function setStoredPushToken(token: string): Promise<void> {
  await setSecureItem(NOTIFICATION_PUSH_TOKEN_KEY, token);
}

export async function clearStoredPushToken(): Promise<void> {
  await deleteSecureItem(NOTIFICATION_PUSH_TOKEN_KEY);
}

// --- Bulk operations ---

export async function clearAllNotificationDeviceData(): Promise<void> {
  await Promise.all([clearStoredDeviceId().catch(() => {}), clearStoredPushToken().catch(() => {})]);
}

export async function hasStoredDevice(): Promise<boolean> {
  const deviceId = await getStoredDeviceId();
  return deviceId !== null && deviceId.length > 0;
}
