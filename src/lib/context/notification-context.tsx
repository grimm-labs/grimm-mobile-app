import { Env } from '@env';
import * as Notifications from 'expo-notifications';
import type { PropsWithChildren } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { getStoredDeviceId } from '@/lib/notifications/device-storage';
import { registerDeviceWithNotificationService } from '@/lib/notifications/register-device';

import { syncDeviceOnForeground } from '../notifications/device-sync';
import { logSyncFailed } from '../notifications/logger';
import { useAppContext } from './app-context-provider';

export type NotificationContextType = {
  isRegistered: boolean;
  isRegistering: boolean;
  registrationError: string | null;
  permissionStatus: Notifications.PermissionStatus | null;
  deviceId: string | null;
  registerDevice: () => Promise<void>;
  refreshPermissionStatus: () => Promise<Notifications.PermissionStatus>;
};

export const NotificationContext = createContext<NotificationContextType | null>(null);

// eslint-disable-next-line max-lines-per-function
export const NotificationProvider = ({ children }: PropsWithChildren<{}>) => {
  const { hasSeedPhrase, isDataLoaded } = useAppContext();

  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  const refreshPermissionStatus = useCallback(async (): Promise<Notifications.PermissionStatus> => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
    return status;
  }, []);

  const registerDevice = useCallback(async (): Promise<void> => {
    setIsRegistering(true);
    setRegistrationError(null);
    try {
      const outcome = await registerDeviceWithNotificationService({ requestPermission: false });
      if (outcome.status === 'success') {
        setDeviceId(outcome.result.deviceId);
        setIsRegistered(true);
        if (__DEV__) {
          console.log('[notifications] Expo push token:', outcome.result.expoPushToken);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setRegistrationError(message);
    } finally {
      setIsRegistering(false);
    }
  }, []);

  useEffect(() => {
    if (!hasSeedPhrase || !isDataLoaded || !Env.NOTIFICATION_API_URL) {
      return;
    }

    let isMounted = true;

    const init = async () => {
      const status = await refreshPermissionStatus();
      const storedDeviceId = await getStoredDeviceId();

      if (isMounted && storedDeviceId) {
        setDeviceId(storedDeviceId);
        setIsRegistered(true);
      }

      if (status === Notifications.PermissionStatus.GRANTED) {
        await registerDevice();
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [hasSeedPhrase, isDataLoaded, refreshPermissionStatus, registerDevice]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') return;
      if (!hasSeedPhrase || !isDataLoaded || !Env.NOTIFICATION_API_URL) return;

      syncDeviceOnForeground()
        .then(async () => {
          const id = await getStoredDeviceId();
          setDeviceId(id);
          setIsRegistered(Boolean(id));
        })
        .catch((err) => {
          logSyncFailed(err.message);
        });
    });

    return () => subscription.remove();
  }, [hasSeedPhrase, isDataLoaded]);

  return (
    <NotificationContext.Provider
      value={{
        isRegistered,
        isRegistering,
        registrationError,
        permissionStatus,
        deviceId,
        registerDevice,
        refreshPermissionStatus,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
