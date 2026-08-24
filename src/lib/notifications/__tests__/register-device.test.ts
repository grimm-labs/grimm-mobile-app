import Constants from 'expo-constants';
import * as Localization from 'expo-localization';
import * as Notifications from 'expo-notifications';
import axios from 'axios';

import { registerDevice, updateDevice } from '@/api/notifications';
import { isNotificationServiceConfigured } from '@/lib/notifications/config';
import { clearStoredDeviceId, getStoredDeviceId, getStoredPushToken, setStoredDeviceId, setStoredPushToken } from '@/lib/notifications/device-storage';
import { registerDeviceWithNotificationService, requestNotificationPermissions } from '@/lib/notifications/register-device';

jest.mock('@/api/notifications');
jest.mock('@/lib/notifications/config');
jest.mock('@/lib/notifications/device-storage');
jest.mock('expo-notifications');
jest.mock('expo-application', () => ({
  nativeApplicationVersion: '1.3.1',
}));
jest.mock('expo-localization');
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: { extra: { eas: { projectId: 'test-project-id' } } },
    easConfig: undefined,
  },
}));

const mockRegisterDevice = registerDevice as jest.MockedFunction<typeof registerDevice>;
const mockUpdateDevice = updateDevice as jest.MockedFunction<typeof updateDevice>;
const mockIsConfigured = isNotificationServiceConfigured as jest.MockedFunction<typeof isNotificationServiceConfigured>;
const mockGetStoredDeviceId = getStoredDeviceId as jest.MockedFunction<typeof getStoredDeviceId>;
const mockGetStoredPushToken = getStoredPushToken as jest.MockedFunction<typeof getStoredPushToken>;
const mockSetStoredDeviceId = setStoredDeviceId as jest.MockedFunction<typeof setStoredDeviceId>;
const mockSetStoredPushToken = setStoredPushToken as jest.MockedFunction<typeof setStoredPushToken>;
const mockClearStoredDeviceId = clearStoredDeviceId as jest.MockedFunction<typeof clearStoredDeviceId>;

const metadata = {
  platform: 'ios' as const,
  language: 'en',
  timezone: 'UTC',
  appVersion: '1.3.1',
};

describe('registerDeviceWithNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockIsConfigured.mockReturnValue(true);
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted', canAskAgain: true });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted', canAskAgain: true });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: 'ExponentPushToken[test]' });
    (Notifications.setNotificationChannelAsync as jest.Mock).mockResolvedValue(undefined);
    (Localization.getLocales as jest.Mock).mockReturnValue([{ languageCode: 'en' }]);
    (Localization.getCalendars as jest.Mock).mockReturnValue([{ timeZone: 'UTC' }]);
    Object.defineProperty(Constants, 'expoConfig', {
      configurable: true,
      value: { extra: { eas: { projectId: 'test-project-id' } } },
    });
  });

  it('skips when notification service is not configured', async () => {
    mockIsConfigured.mockReturnValue(false);

    await expect(registerDeviceWithNotificationService()).resolves.toEqual({
      status: 'skipped',
      reason: 'service_not_configured',
    });
    expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
  });

  it('skips when permission is not granted without requesting it', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied', canAskAgain: false });

    await expect(registerDeviceWithNotificationService()).resolves.toEqual({
      status: 'skipped',
      reason: 'permission_denied',
    });
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('registers a new device when none is stored', async () => {
    mockGetStoredDeviceId.mockResolvedValue(null);
    mockGetStoredPushToken.mockResolvedValue(null);
    mockRegisterDevice.mockResolvedValue({
      id: 'new-device-id',
      expoPushToken: 'ExponentPushToken[test]',
      ...metadata,
      disabled: false,
      lastSeenAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    await expect(registerDeviceWithNotificationService()).resolves.toEqual({
      status: 'success',
      result: {
        deviceId: 'new-device-id',
        isNewDevice: true,
        expoPushToken: 'ExponentPushToken[test]',
        action: 'created',
      },
    });

    expect(mockRegisterDevice).toHaveBeenCalledWith({
      expoPushToken: 'ExponentPushToken[test]',
      ...metadata,
    });
    expect(mockSetStoredDeviceId).toHaveBeenCalledWith('new-device-id');
    expect(mockSetStoredPushToken).toHaveBeenCalledWith('ExponentPushToken[test]');
  });

  it('updates metadata when token is unchanged', async () => {
    mockGetStoredDeviceId.mockResolvedValue('existing-device-id');
    mockGetStoredPushToken.mockResolvedValue('ExponentPushToken[test]');

    await expect(registerDeviceWithNotificationService()).resolves.toEqual({
      status: 'success',
      result: {
        deviceId: 'existing-device-id',
        isNewDevice: false,
        expoPushToken: 'ExponentPushToken[test]',
        action: 'synced',
      },
    });

    expect(mockUpdateDevice).toHaveBeenCalledWith('existing-device-id', metadata);
    expect(mockRegisterDevice).not.toHaveBeenCalled();
  });

  it('updates device when push token changed', async () => {
    mockGetStoredDeviceId.mockResolvedValue('existing-device-id');
    mockGetStoredPushToken.mockResolvedValue('ExponentPushToken[old]');
    mockUpdateDevice.mockResolvedValue({
      id: 'existing-device-id',
      expoPushToken: 'ExponentPushToken[test]',
      ...metadata,
      disabled: false,
      lastSeenAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    await expect(registerDeviceWithNotificationService()).resolves.toEqual({
      status: 'success',
      result: {
        deviceId: 'existing-device-id',
        isNewDevice: false,
        expoPushToken: 'ExponentPushToken[test]',
        action: 'updated',
      },
    });

    expect(mockUpdateDevice).toHaveBeenCalledWith('existing-device-id', {
      expoPushToken: 'ExponentPushToken[test]',
      ...metadata,
    });
  });

  it('falls back to register when update returns 404', async () => {
    mockGetStoredDeviceId.mockResolvedValue('stale-device-id');
    mockGetStoredPushToken.mockResolvedValue('ExponentPushToken[old]');
    mockUpdateDevice.mockRejectedValue(
      new axios.AxiosError('Not Found', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 404,
        statusText: 'Not Found',
        headers: {},
        config: {} as never,
        data: {},
      }),
    );
    mockRegisterDevice.mockResolvedValue({
      id: 'fresh-device-id',
      expoPushToken: 'ExponentPushToken[test]',
      ...metadata,
      disabled: false,
      lastSeenAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    await expect(registerDeviceWithNotificationService()).resolves.toEqual({
      status: 'success',
      result: {
        deviceId: 'fresh-device-id',
        isNewDevice: true,
        expoPushToken: 'ExponentPushToken[test]',
        action: 'created',
      },
    });

    expect(mockClearStoredDeviceId).toHaveBeenCalled();
    expect(mockRegisterDevice).toHaveBeenCalled();
  });

  it('requests permission when requestPermission option is true and OS can ask again', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined', canAskAgain: true });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    mockGetStoredDeviceId.mockResolvedValue(null);
    mockGetStoredPushToken.mockResolvedValue(null);
    mockRegisterDevice.mockResolvedValue({
      id: 'new-device-id',
      expoPushToken: 'ExponentPushToken[test]',
      ...metadata,
      disabled: false,
      lastSeenAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    await expect(registerDeviceWithNotificationService({ requestPermission: true })).resolves.toEqual({
      status: 'success',
      result: expect.objectContaining({ deviceId: 'new-device-id' }),
    });

    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledWith({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
  });

  it('does not re-prompt when permission was already denied and cannot ask again', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied', canAskAgain: false });

    await expect(registerDeviceWithNotificationService({ requestPermission: true })).resolves.toEqual({
      status: 'skipped',
      reason: 'permission_denied',
    });

    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });
});

describe('requestNotificationPermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Notifications.setNotificationChannelAsync as jest.Mock).mockResolvedValue(undefined);
  });

  it('returns true without prompting when already granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted', canAskAgain: true });

    await expect(requestNotificationPermissions()).resolves.toBe(true);
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('returns false without prompting when already denied', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied', canAskAgain: false });

    await expect(requestNotificationPermissions()).resolves.toBe(false);
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('prompts when permission is undetermined', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined', canAskAgain: true });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted', canAskAgain: true });

    await expect(requestNotificationPermissions()).resolves.toBe(true);
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledWith({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
  });
});
