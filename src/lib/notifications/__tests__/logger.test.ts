import {
  logPermissionRequest,
  logPermissionStatus,
  logRegistrationFailed,
  logRegistrationSkipped,
  logRegistrationStart,
  logRegistrationSuccess,
  logServiceConfiguration,
  maskDeviceId,
  maskPushToken,
} from '@/lib/notifications/logger';

describe('notification logger', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('masks push tokens and device ids', () => {
    expect(maskPushToken('ExponentPushToken[abcdefghijklmnop]')).toBe('ExponentPushToke...');
    expect(maskDeviceId('550e8400-e29b-41d4-a716-446655440000')).toBe('550e8400...0000');
  });

  it('logs registration lifecycle without sensitive values', () => {
    logRegistrationStart(true);
    logServiceConfiguration(true);
    logPermissionStatus('denied');
    logPermissionRequest(false);
    logRegistrationSkipped('permission_denied');
    logRegistrationSuccess({
      action: 'synced',
      deviceId: '550e8400-e29b-41d4-a716-446655440000',
      pushToken: 'ExponentPushToken[test-token-value]',
      isNewDevice: false,
    });
    logRegistrationFailed('Firebase/FCM is not configured');

    expect(console.warn).toHaveBeenCalledWith('[notifications] Starting device registration', { requestPermission: true });
    expect(console.warn).toHaveBeenCalledWith('[notifications] Notification service is configured');
    expect(console.warn).toHaveBeenCalledWith('[notifications] Notification permission status', { status: 'denied' });
    expect(console.warn).toHaveBeenCalledWith('[notifications] Notification permission denied');
    expect(console.warn).toHaveBeenCalledWith('[notifications] Registration skipped: notification permission not granted');
    expect(console.warn).toHaveBeenCalledWith('[notifications] Device synced on server', {
      deviceId: '550e8400...0000',
      pushToken: 'ExponentPushToke...',
      isNewDevice: false,
    });
    expect(console.warn).toHaveBeenCalledWith('[notifications] Device registration failed', {
      error: 'Firebase/FCM is not configured',
    });
  });
});
