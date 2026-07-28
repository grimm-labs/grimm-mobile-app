const LOG_PREFIX = '[notifications]';

type LogDetails = Record<string, string | boolean | number | null | undefined>;

function log(message: string, details?: LogDetails): void {
  if (details) {
    console.warn(`${LOG_PREFIX} ${message}`, details);
    return;
  }

  console.warn(`${LOG_PREFIX} ${message}`);
}

export function maskPushToken(token: string): string {
  if (token.length <= 20) return '***';
  return `${token.slice(0, 16)}...`;
}

export function maskDeviceId(deviceId: string): string {
  if (deviceId.length <= 12) return deviceId;
  return `${deviceId.slice(0, 8)}...${deviceId.slice(-4)}`;
}

export function logRegistrationStart(requestPermission: boolean): void {
  log('Starting device registration', { requestPermission });
}

export function logServiceConfiguration(isConfigured: boolean): void {
  log(isConfigured ? 'Notification service is configured' : 'Notification service is not configured');
}

export function logPermissionStatus(status: string): void {
  log('Notification permission status', { status });
}

export function logPermissionRequest(granted: boolean): void {
  log(granted ? 'Notification permission granted' : 'Notification permission denied');
}

export function logRegistrationSkipped(reason: 'service_not_configured' | 'permission_denied'): void {
  switch (reason) {
    case 'service_not_configured':
      log('Registration skipped: notification service URL is missing');
      break;
    case 'permission_denied':
      log('Registration skipped: notification permission not granted');
      break;
  }
}

export function logPushTokenUnchangedSync(): void {
  log('Push token unchanged, syncing device metadata with server');
}

export function logPushTokenChanged(): void {
  log('Push token changed, updating device on server');
}

export function logRegisteringNewDevice(): void {
  log('Registering new device with notification service');
}

export function logRegistrationSuccess(result: { action: 'created' | 'updated' | 'synced'; deviceId: string; pushToken: string; isNewDevice: boolean }): void {
  log(`Device ${result.action} on server`, {
    deviceId: maskDeviceId(result.deviceId),
    pushToken: maskPushToken(result.pushToken),
    isNewDevice: result.isNewDevice,
  });
}

export function logRegistrationFailed(message: string): void {
  log('Device registration failed', { error: message });
}
