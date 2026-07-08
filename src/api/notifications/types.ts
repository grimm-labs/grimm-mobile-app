export type DevicePlatform = 'ios' | 'android';

export type RegisterDevicePayload = {
  expoPushToken: string;
  platform: DevicePlatform;
  language: string;
  timezone: string;
  appVersion: string;
};

export type UpdateDevicePayload = Partial<Omit<RegisterDevicePayload, 'expoPushToken'>> & {
  expoPushToken?: string;
};

export type DeviceResponse = {
  id: string;
  expoPushToken: string;
  platform: DevicePlatform;
  language: string;
  timezone: string;
  appVersion: string;
  disabled: boolean;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
};
