// src/api/notifications/register-device.ts
import { assertNotificationServiceConfigured, notificationClient } from './client';
import type { DeviceResponse, RegisterDevicePayload } from './types';

export async function registerDevice(payload: RegisterDevicePayload): Promise<DeviceResponse> {
  assertNotificationServiceConfigured();
  const { data } = await notificationClient.post<DeviceResponse>('/devices', payload);
  return data;
}
