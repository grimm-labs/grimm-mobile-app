jest.mock('expo-secure-store', () => require('@/lib/app-lock/__tests__/helpers/fake-secure-store'));
jest.mock('expo-local-authentication', () => require('@/lib/app-lock/__tests__/helpers/fake-local-authentication'));
jest.mock('expo-crypto', () => require('@/lib/app-lock/__tests__/helpers/fake-expo-crypto'));

import '@/lib/i18n';

import React from 'react';
import { Platform } from 'react-native';

import { spyOnConsole } from '@/lib/app-lock/__tests__/helpers/console-spy';
import { AuthenticationType, fakeLocalAuthentication } from '@/lib/app-lock/__tests__/helpers/fake-local-authentication';
import { fakeSecureStore } from '@/lib/app-lock/__tests__/helpers/fake-secure-store';
import { seedAppLock, startAppWithAppLock } from '@/lib/app-lock/__tests__/helpers/render-with-app-lock';
import { act, cleanup, fireEvent, screen } from '@/lib/test-utils';

import AppLockSettingsScreen from '../index';

const mockPush = jest.fn();
jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => ({ push: mockPush, back: jest.fn() }),
    Stack: { Screen: ({ children }: { children?: React.ReactNode }) => <>{children}</> },
  };
});

jest.mock('@/lib/context/breez-context', () => ({
  useBreez: () => ({ disconnectBreez: jest.fn() }),
}));

jest.mock('@/lib/context/bdk-context', () => ({
  useBdk: () => ({ disconnectBdk: jest.fn() }),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props: Record<string, unknown>) => <View {...props} />;
});

jest.mock('@/components/ui/focus-aware-status-bar', () => ({
  FocusAwareStatusBar: () => null,
}));

jest.mock('@/components/back-button', () => ({
  HeaderLeft: () => null,
}));

const PIN = '482915';
const APP_LOCK_KEYS = ['appLockBiometricEnabled', 'appLockFailedAttempts', 'appLockLockoutUntil', 'appLockPinHash', 'appLockPinSalt'];

async function flushPromises() {
  await act(async () => {
    for (let i = 0; i < 50; i++) await Promise.resolve();
  });
}

async function enterPin(pin: string) {
  for (const digit of pin) {
    fireEvent.press(screen.getByTestId(`lock-screen-pin-pad-key-${digit}`));
  }
  await flushPromises();
}

async function press(testID: string) {
  fireEvent.press(screen.getByTestId(testID));
  await flushPromises();
}

/** App Lock was turned on in an earlier session: cold start, then unlock. */
async function openWithAppLockOn({ biometricUnlock = false } = {}) {
  await seedAppLock({ pin: PIN, biometricUnlock });
  await startAppWithAppLock(<AppLockSettingsScreen />);
  fakeLocalAuthentication.willCancel();
  await flushPromises();
  await enterPin(PIN);
  fakeLocalAuthentication.clearPromptHistory();
}

function isPromptShown() {
  return screen.queryByTestId('lock-screen') !== null;
}

describe('App Lock settings screen (settings/app-lock)', () => {
  const originalPlatform = Platform.OS;
  let consoleSpy: ReturnType<typeof spyOnConsole>;

  beforeEach(() => {
    jest.clearAllMocks();
    fakeSecureStore.reset();
    fakeLocalAuthentication.reset();
    consoleSpy = spyOnConsole();
  });

  afterEach(() => {
    cleanup();
    consoleSpy.expectNoSecretLogged([PIN]);
    consoleSpy.restore();
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
  });

  it('App Lock off: offers Turn on App Lock only', async () => {
    fakeLocalAuthentication.enrollStrongBiometrics();
    await startAppWithAppLock(<AppLockSettingsScreen />);

    expect(screen.getByTestId('app-lock-turn-on')).toBeOnTheScreen();
    ['app-lock-biometric-switch', 'app-lock-change-pin', 'app-lock-turn-off'].forEach((testID) => expect(screen.queryByTestId(testID)).not.toBeOnTheScreen());

    fireEvent.press(screen.getByTestId('app-lock-turn-on'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/settings/app-lock/set-pin', params: { mode: 'create' } });
  });

  it('App Lock on: offers Biometric Unlock, Change PIN and Turn off App Lock', async () => {
    fakeLocalAuthentication.enrollStrongBiometrics();
    await openWithAppLockOn();

    expect(screen.getByTestId('app-lock-biometric-switch')).toBeOnTheScreen();
    expect(screen.getByTestId('app-lock-change-pin')).toBeOnTheScreen();
    expect(screen.getByTestId('app-lock-turn-off')).toBeOnTheScreen();
    expect(screen.queryByTestId('app-lock-turn-on')).not.toBeOnTheScreen();
  });

  it('shows Biometric Unlock with BIOMETRIC_STRONG (Android) and Face ID (iOS)', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    fakeLocalAuthentication.enrollStrongBiometrics(AuthenticationType.FINGERPRINT);
    await openWithAppLockOn();
    expect(screen.getByTestId('app-lock-biometric-switch')).toBeEnabled();
    cleanup();

    fakeSecureStore.reset();
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    fakeLocalAuthentication.enrollStrongBiometrics(AuthenticationType.FACIAL_RECOGNITION);
    await openWithAppLockOn();
    expect(screen.getByTestId('app-lock-biometric-switch')).toBeEnabled();
  });

  it('hides Biometric Unlock with only weak biometrics', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    fakeLocalAuthentication.enrollWeakBiometrics();
    await openWithAppLockOn();

    expect(screen.queryByTestId('app-lock-biometric-switch')).not.toBeOnTheScreen();
    expect(screen.getByTestId('app-lock-change-pin')).toBeOnTheScreen();
  });

  it('shows Biometric Unlock as unavailable when it is on but the biometrics were removed', async () => {
    fakeLocalAuthentication.removeBiometrics();
    await openWithAppLockOn({ biometricUnlock: true });

    expect(screen.getByTestId('app-lock-biometric-switch')).toBeDisabled();
    expect(screen.getByText('Not available: this phone has no strong biometrics enrolled')).toBeOnTheScreen();
  });

  it('Change PIN asks for authentication first; cancelling stays on the screen', async () => {
    await openWithAppLockOn();

    await press('app-lock-change-pin');
    expect(isPromptShown()).toBe(true);
    await press('lock-screen-cancel');
    expect(mockPush).not.toHaveBeenCalled();

    await press('app-lock-change-pin');
    await enterPin(PIN);
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/settings/app-lock/set-pin', params: { mode: 'change' } });
  });

  it('toggling Biometric Unlock asks for authentication; cancelling leaves it unchanged', async () => {
    fakeLocalAuthentication.enrollStrongBiometrics();
    await openWithAppLockOn();
    expect(screen.getByTestId('app-lock-biometric-switch')).not.toBeChecked();

    await press('app-lock-biometric-switch');
    expect(isPromptShown()).toBe(true);
    await press('lock-screen-cancel');
    expect(screen.getByTestId('app-lock-biometric-switch')).not.toBeChecked();
    expect(fakeLocalAuthentication.promptOptions()).toEqual([]);

    // On: the PIN (Sensitive Action), then the biometric prompt once
    fakeLocalAuthentication.willSucceed();
    await press('app-lock-biometric-switch');
    await enterPin(PIN);
    expect(screen.getByTestId('app-lock-biometric-switch')).toBeChecked();
    expect(fakeSecureStore.get('appLockBiometricEnabled')).toBe('true');
    expect(fakeLocalAuthentication.promptOptions()).toEqual([expect.objectContaining({ disableDeviceFallback: true })]);

    // Off: cancelling the prompt (biometrics offered first) leaves it on
    fakeLocalAuthentication.willCancel();
    await press('app-lock-biometric-switch');
    await press('lock-screen-cancel');
    expect(screen.getByTestId('app-lock-biometric-switch')).toBeChecked();
    await press('app-lock-biometric-switch');
    await enterPin(PIN);
    expect(screen.getByTestId('app-lock-biometric-switch')).not.toBeChecked();
    expect(fakeSecureStore.get('appLockBiometricEnabled')).toBeNull();
  });

  it('Turn off asks for authentication; cancelling leaves App Lock on, authorising deletes the five keys', async () => {
    fakeLocalAuthentication.enrollStrongBiometrics();
    await openWithAppLockOn({ biometricUnlock: true });

    await press('app-lock-turn-off');
    await press('lock-screen-cancel');
    expect(screen.getByTestId('app-lock-turn-off')).toBeOnTheScreen();
    expect(fakeSecureStore.keys()).toEqual(APP_LOCK_KEYS.filter((key) => !key.startsWith('appLockFailed') && key !== 'appLockLockoutUntil'));

    await press('app-lock-turn-off');
    await enterPin(PIN);

    expect(fakeSecureStore.keys()).toEqual([]);
    expect(screen.getByTestId('app-lock-turn-on')).toBeOnTheScreen();
  });
});
