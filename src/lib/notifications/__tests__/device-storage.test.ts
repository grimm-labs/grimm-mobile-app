import { getStoredDeviceId } from "@/api/notifications/device-storage"; 
import * as SecureStore from 'expo-secure-store';
import { clearAllNotificationDeviceData, hasStoredDevice, setStoredDeviceId } from '@/api/notifications/device-storage';

jest.mock('expo-secure-store');

describe('device-storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getStoredDeviceId returns null when not set', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    expect(await getStoredDeviceId()).toBeNull();
  });

  it('setStoredDeviceId stores value with correct key', async () => {
    await setStoredDeviceId('550e8400-e29b-41d4-a716-446655440000');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'notification_device_id',
      '550e8400-e29b-41d4-a716-446655440000',
    );
  });

  it('clearAllNotificationDeviceData deletes both keys', async () => {
    await clearAllNotificationDeviceData();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('notification_device_id');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('notification_push_token');
  });

  it('hasStoredDevice returns false when deviceId is null', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    expect(await hasStoredDevice()).toBe(false);
  });

  it('hasStoredDevice returns true when deviceId exists', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('uuid-here');
    expect(await hasStoredDevice()).toBe(true);
  });
});