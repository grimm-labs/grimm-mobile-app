import type { DeviceResponse } from '@/api';
import { notificationClient } from '@/api/notifications/client';

export type UpdateDevicePayload = {
  expoPushToken?: string;
  language?: string;
  timezone?: string;
  appVersion?: string;
};

export async function updateDevice(deviceId: string, payload: UpdateDevicePayload): Promise<DeviceResponse> {
  const { data } = await notificationClient.patch<DeviceResponse>(`/devices/${deviceId}`, payload);
  return data;
}
