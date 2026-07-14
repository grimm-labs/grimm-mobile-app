import { assertNotificationServiceConfigured, notificationClient } from './client';
import type { DeviceResponse, UpdateDevicePayload } from './types';

export async function updateDevice(deviceId: string, payload: UpdateDevicePayload): Promise<DeviceResponse> {
  assertNotificationServiceConfigured();
  const { data } = await notificationClient.patch<DeviceResponse>(`/devices/${deviceId}`, payload);
  return data;
}
