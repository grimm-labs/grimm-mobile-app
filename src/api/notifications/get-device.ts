import { assertNotificationServiceConfigured, notificationClient } from './client';
import type { DeviceResponse } from './types';

export async function getDevice(deviceId: string): Promise<DeviceResponse> {
  assertNotificationServiceConfigured();
  const { data } = await notificationClient.get<DeviceResponse>(`/devices/${deviceId}`);
  return data;
}
