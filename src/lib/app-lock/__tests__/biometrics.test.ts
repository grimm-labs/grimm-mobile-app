jest.mock('expo-local-authentication', () => require('@/lib/app-lock/__tests__/helpers/fake-local-authentication'));

import { Platform } from 'react-native';

import { AuthenticationType, fakeLocalAuthentication } from '@/lib/app-lock/__tests__/helpers/fake-local-authentication';
import { hasScreenLock, isBiometricUnlockAvailable, promptBiometricUnlock, promptPhoneAuthentication } from '@/lib/app-lock/biometrics';

const MESSAGES = { promptMessage: 'Unlock Grimm App', cancelLabel: 'Cancel' };

describe('Biometrics', () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    fakeLocalAuthentication.reset();
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
  });

  it('Android: available only with BIOMETRIC_STRONG enrolled', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });

    fakeLocalAuthentication.enrollStrongBiometrics(AuthenticationType.FINGERPRINT);
    expect(await isBiometricUnlockAvailable()).toBe(true);

    fakeLocalAuthentication.enrollWeakBiometrics();
    expect(await isBiometricUnlockAvailable()).toBe(false);
  });

  it('iOS: available with Face ID or Touch ID enrolled', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });

    fakeLocalAuthentication.enrollStrongBiometrics(AuthenticationType.FACIAL_RECOGNITION);
    expect(await isBiometricUnlockAvailable()).toBe(true);

    fakeLocalAuthentication.enrollStrongBiometrics(AuthenticationType.FINGERPRINT);
    expect(await isBiometricUnlockAvailable()).toBe(true);
  });

  it('unavailable with BIOMETRIC_WEAK, SECRET, NONE or without hardware', async () => {
    fakeLocalAuthentication.enrollWeakBiometrics();
    expect(await isBiometricUnlockAvailable()).toBe(false);

    fakeLocalAuthentication.removeBiometrics();
    expect(await isBiometricUnlockAvailable()).toBe(false);

    fakeLocalAuthentication.removeScreenLock();
    expect(await isBiometricUnlockAvailable()).toBe(false);
  });

  it('unavailable when the native module throws', async () => {
    const { getEnrolledLevelAsync } = require('@/lib/app-lock/__tests__/helpers/fake-local-authentication');
    getEnrolledLevelAsync.mockRejectedValueOnce(new Error('native failure'));

    expect(await isBiometricUnlockAvailable()).toBe(false);
  });

  it('the Biometric Unlock prompt has disableDeviceFallback: true and strong', async () => {
    fakeLocalAuthentication.willSucceed();

    expect(await promptBiometricUnlock(MESSAGES)).toBe(true);
    expect(fakeLocalAuthentication.promptOptions()).toEqual([{ ...MESSAGES, disableDeviceFallback: true, biometricsSecurityLevel: 'strong' }]);
  });

  it('a cancelled, failed or broken prompt resolves false', async () => {
    fakeLocalAuthentication.willCancel();
    expect(await promptBiometricUnlock(MESSAGES)).toBe(false);

    fakeLocalAuthentication.willFail();
    expect(await promptBiometricUnlock(MESSAGES)).toBe(false);
    expect(await promptPhoneAuthentication(MESSAGES)).toBe(false);

    const { authenticateAsync } = require('@/lib/app-lock/__tests__/helpers/fake-local-authentication');
    authenticateAsync.mockRejectedValueOnce(new Error('native failure'));
    expect(await promptBiometricUnlock(MESSAGES)).toBe(false);
  });

  it('phone authentication allows the Device Passcode and asks for strong biometrics', async () => {
    fakeLocalAuthentication.willSucceed();

    expect(await promptPhoneAuthentication(MESSAGES)).toBe(true);
    expect(fakeLocalAuthentication.promptOptions()).toEqual([{ ...MESSAGES, disableDeviceFallback: false, biometricsSecurityLevel: 'strong' }]);
  });

  it('detects a phone without screen lock', async () => {
    expect(await hasScreenLock()).toBe(true);

    fakeLocalAuthentication.enrollWeakBiometrics();
    expect(await hasScreenLock()).toBe(true);

    fakeLocalAuthentication.removeScreenLock();
    expect(await hasScreenLock()).toBe(false);
  });
});
