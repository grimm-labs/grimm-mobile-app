import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import React from 'react';

import { useAppContext } from '@/lib/context/app-context-provider';
import { NotificationProvider, useNotifications } from '@/lib/context/notification-context';
import { getStoredDeviceId } from '@/lib/notifications/device-storage';
import type { RegisterDeviceOutcome } from '@/lib/notifications/register-device';
import { registerDeviceWithNotificationService } from '@/lib/notifications/register-device';

const mockUseAppContext = useAppContext as jest.MockedFunction<typeof useAppContext>;
const mockGetStoredDeviceId = getStoredDeviceId as jest.MockedFunction<typeof getStoredDeviceId>;
const mockRegisterDeviceService = registerDeviceWithNotificationService as jest.MockedFunction<typeof registerDeviceWithNotificationService>;

jest.mock('@env', () => ({
  Env: {
    NOTIFICATION_API_URL: 'https://api.example.com',
  },
}));

jest.mock('expo-notifications');
jest.mock('@/lib/notifications/device-storage');
jest.mock('@/lib/notifications/register-device');
jest.mock('@/lib/context/app-context-provider');
jest.mock('@/lib/notifications/device-sync', () => ({
  syncDeviceOnForeground: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/notifications/push-handlers', () => ({
  configureNotificationHandler: jest.fn(),
  configureNotificationChannels: jest.fn().mockResolvedValue(undefined),
  registerPushListeners: jest.fn().mockReturnValue(jest.fn()),
  handleNotificationTap: jest.fn(),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return <NotificationProvider>{children}</NotificationProvider>;
}

describe('NotificationProvider & useNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAppContext.mockReturnValue({
      hasSeedPhrase: true,
      isDataLoaded: true,
    } as ReturnType<typeof useAppContext>);

    mockGetStoredDeviceId.mockResolvedValue(null);
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Notifications.getLastNotificationResponseAsync as jest.Mock).mockResolvedValue(null);
    (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue({ remove: jest.fn() });
    (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValue({ remove: jest.fn() });
    (Notifications.setNotificationHandler as jest.Mock).mockImplementation(() => {});
    (Notifications.setNotificationChannelAsync as jest.Mock).mockResolvedValue(undefined);
    mockRegisterDeviceService.mockResolvedValue({
      status: 'success',
      result: {
        deviceId: 'device-123',
        isNewDevice: true,
        expoPushToken: 'ExponentPushToken[test]',
        action: 'created',
      },
    });
  });

  it('throws error when useNotifications is used outside NotificationProvider', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useNotifications())).toThrow('useNotifications must be used within a NotificationProvider');
    consoleErrorSpy.mockRestore();
  });

  it('skips auto-registration on mount when hasSeedPhrase is false', async () => {
    mockUseAppContext.mockReturnValue({
      hasSeedPhrase: false,
      isDataLoaded: true,
    } as ReturnType<typeof useAppContext>);

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
    });
    expect(mockRegisterDeviceService).not.toHaveBeenCalled();
    expect(result.current.isRegistered).toBe(false);
  });

  it('skips auto-registration on mount when NOTIFICATION_API_URL is unset', async () => {
    const { Env } = require('@env');
    const originalUrl = Env.NOTIFICATION_API_URL;
    Env.NOTIFICATION_API_URL = '';

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
    });
    expect(mockRegisterDeviceService).not.toHaveBeenCalled();
    expect(result.current.isRegistered).toBe(false);

    Env.NOTIFICATION_API_URL = originalUrl;
  });

  it('skips registration on mount when permission status is not granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
    });
    expect(mockRegisterDeviceService).not.toHaveBeenCalled();
    expect(result.current.permissionStatus).toBe('denied');
    expect(result.current.isRegistered).toBe(false);
  });

  it('auto-registers and sets deviceId on mount when permission is granted and hasSeedPhrase/isDataLoaded are true', async () => {
    mockGetStoredDeviceId.mockResolvedValue('cached-device-id');

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.isRegistered).toBe(true);
      expect(result.current.deviceId).toBe('device-123');
    });

    expect(mockRegisterDeviceService).toHaveBeenCalledWith({ requestPermission: false });
  });

  it('registerDevice() sets isRegistering then isRegistered on success', async () => {
    let resolveRegistration: (val: RegisterDeviceOutcome) => void = () => {};
    mockRegisterDeviceService.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRegistration = resolve;
        }),
    );

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
    });

    let regPromise: Promise<void> | undefined;
    act(() => {
      regPromise = result.current.registerDevice();
    });

    expect(result.current.isRegistering).toBe(true);

    await act(async () => {
      resolveRegistration({
        status: 'success',
        result: {
          deviceId: 'manual-device-id',
          isNewDevice: false,
          expoPushToken: 'ExponentPushToken[manual]',
          action: 'updated',
        },
      });
      await regPromise;
    });

    expect(result.current.isRegistering).toBe(false);
    expect(result.current.isRegistered).toBe(true);
    expect(result.current.deviceId).toBe('manual-device-id');
    expect(result.current.registrationError).toBeNull();
  });

  it('registerDevice() sets registrationError on failure', async () => {
    mockRegisterDeviceService.mockRejectedValue(new Error('Network error during registration'));

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.registerDevice();
    });

    expect(result.current.isRegistering).toBe(false);
    expect(result.current.registrationError).toBe('Network error during registration');
  });
});
