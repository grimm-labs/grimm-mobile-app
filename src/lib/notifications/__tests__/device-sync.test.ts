import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';

import { syncDeviceOnForeground, SYNC_DEBOUNCE_MS } from '../device-sync';
import { updateDevice } from '@/api/notifications';
import { registerDeviceWithNotificationService, getStoredDeviceId } from '../register-device';

jest.mock('expo-notifications');
jest.mock('expo-secure-store');
jest.mock('expo-constants', () => ({
  default: { expoConfig: { extra: { eas: { projectId: 'test-project-id' } } } },
}));
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en' }],
  getCalendars: () => [{ timeZone: 'UTC' }],
}));
jest.mock('expo-application', () => ({
  nativeApplicationVersion: '1.0.0',
}));
jest.mock('@/api/notifications', () => ({
  updateDevice: jest.fn(),
}));
jest.mock('../register-device', () => ({
  registerDeviceWithNotificationService: jest.fn(),
  getStoredDeviceId: jest.fn(),
}));
jest.mock('../device-storage', () => ({
  NOTIFICATION_DEVICE_ID_KEY: 'notification_device_id',
  NOTIFICATION_PUSH_TOKEN_KEY: 'notification_push_token',
}));

const mockUpdateDevice = updateDevice as jest.Mock;
const mockRegisterDevice = registerDeviceWithNotificationService as jest.Mock;
const mockGetStoredDeviceId = getStoredDeviceId as jest.Mock;

describe('syncDeviceOnForeground', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
      data: 'ExponentPushToken[current-token]',
    });
    mockGetStoredDeviceId.mockResolvedValue('device-uuid-123');
    mockUpdateDevice.mockResolvedValue({ id: 'device-uuid-123' });
  });

  it('skips sync when within debounce window', async () => {
    const recentTimestamp = (Date.now() - 1000).toString();
    (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
      if (key === 'notification_last_sync') return Promise.resolve(recentTimestamp);
      return Promise.resolve(null);
    });

    await syncDeviceOnForeground();

    expect(mockUpdateDevice).not.toHaveBeenCalled();
  });

  it('performs PATCH when outside debounce window', async () => {
    const oldTimestamp = (Date.now() - SYNC_DEBOUNCE_MS - 1000).toString();
    (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
      if (key === 'notification_last_sync') return Promise.resolve(oldTimestamp);
      if (key === 'notification_push_token') return Promise.resolve('ExponentPushToken[current-token]');
      return Promise.resolve(null);
    });

    await syncDeviceOnForeground();

    expect(mockUpdateDevice).toHaveBeenCalledWith('device-uuid-123', expect.objectContaining({
      language: 'en',
      timezone: 'UTC',
      appVersion: '1.0.0',
    }));
  });

  it('includes expoPushToken in payload when token has changed', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
      if (key === 'notification_push_token') return Promise.resolve('ExponentPushToken[old-token]');
      return Promise.resolve(null);
    });

    await syncDeviceOnForeground();

    expect(mockUpdateDevice).toHaveBeenCalledWith('device-uuid-123', expect.objectContaining({
      expoPushToken: 'ExponentPushToken[current-token]',
    }));
  });

  it('does not include expoPushToken when token is unchanged', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
      if (key === 'notification_push_token') return Promise.resolve('ExponentPushToken[current-token]');
      return Promise.resolve(null);
    });

    await syncDeviceOnForeground();

    const callArgs = mockUpdateDevice.mock.calls[0][1];
    expect(callArgs.expoPushToken).toBeUndefined();
  });

  it('calls registerDeviceWithNotificationService when no deviceId stored', async () => {
    mockGetStoredDeviceId.mockResolvedValue(null);

    await syncDeviceOnForeground();

    expect(mockRegisterDevice).toHaveBeenCalled();
    expect(mockUpdateDevice).not.toHaveBeenCalled();
  });

  it('skips PATCH when permission is not granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

    await syncDeviceOnForeground();

    expect(mockUpdateDevice).not.toHaveBeenCalled();
  });
});
