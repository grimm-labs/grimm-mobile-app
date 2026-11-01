jest.mock('expo-secure-store', () => require('@/lib/app-lock/__tests__/helpers/fake-secure-store'));
jest.mock('expo-local-authentication', () => require('@/lib/app-lock/__tests__/helpers/fake-local-authentication'));
jest.mock('expo-crypto', () => require('@/lib/app-lock/__tests__/helpers/fake-expo-crypto'));

import '@/lib/i18n';

import React from 'react';

import { spyOnConsole } from '@/lib/app-lock/__tests__/helpers/console-spy';
import { fakeLocalAuthentication } from '@/lib/app-lock/__tests__/helpers/fake-local-authentication';
import { fakeSecureStore } from '@/lib/app-lock/__tests__/helpers/fake-secure-store';
import { seedAppLock, startAppWithAppLock } from '@/lib/app-lock/__tests__/helpers/render-with-app-lock';
import { act, cleanup, fireEvent, screen } from '@/lib/test-utils';

import SetPinScreen from '../set-pin';

const mockBack = jest.fn();
let mockMode = 'create';
jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => ({ back: mockBack, push: jest.fn() }),
    useLocalSearchParams: () => ({ mode: mockMode }),
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
const OTHER_PIN = '135790';

async function flushPromises() {
  await act(async () => {
    for (let i = 0; i < 50; i++) await Promise.resolve();
  });
}

async function typePin(pin: string, prefix = 'app-lock-set-pin-pad') {
  for (const digit of pin) {
    fireEvent.press(screen.getByTestId(`${prefix}-key-${digit}`));
  }
  await flushPromises();
}

const title = () => screen.getByTestId('app-lock-set-pin-title');

describe('Set PIN screen (settings/app-lock/set-pin)', () => {
  let consoleSpy: ReturnType<typeof spyOnConsole>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMode = 'create';
    fakeSecureStore.reset();
    fakeLocalAuthentication.reset();
    consoleSpy = spyOnConsole();
  });

  afterEach(() => {
    cleanup();
    consoleSpy.expectNoSecretLogged([PIN, OTHER_PIN]);
    consoleSpy.restore();
  });

  it('create: two matching entries turn App Lock on', async () => {
    await startAppWithAppLock(<SetPinScreen />);
    expect(title()).toHaveTextContent('Choose a 6-digit PIN');

    await typePin('48291');
    fireEvent.press(screen.getByTestId('app-lock-set-pin-pad-key-delete'));
    await typePin('1');
    expect(title()).toHaveTextContent('Choose a 6-digit PIN');
    await typePin('5');
    expect(title()).toHaveTextContent('Enter your PIN again');
    expect(fakeSecureStore.get('appLockPinHash')).toBeNull();

    await typePin(PIN);

    expect(fakeSecureStore.get('appLockPinHash')).toMatch(/^[0-9a-f]{64}$/);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('two different entries show the error and start over at the first entry', async () => {
    await startAppWithAppLock(<SetPinScreen />);

    await typePin(PIN);
    await typePin(OTHER_PIN);

    expect(screen.getByTestId('app-lock-set-pin-error')).toHaveTextContent('The PINs do not match. Try again.');
    expect(title()).toHaveTextContent('Choose a 6-digit PIN');
    expect(fakeSecureStore.get('appLockPinHash')).toBeNull();

    await typePin(OTHER_PIN);
    expect(screen.queryByTestId('app-lock-set-pin-error')).not.toBeOnTheScreen();
    await typePin(OTHER_PIN);
    expect(fakeSecureStore.get('appLockPinHash')).not.toBeNull();
  });

  it('create: offers Biometric Unlock when available, Turn on enables it', async () => {
    fakeLocalAuthentication.enrollStrongBiometrics();
    fakeLocalAuthentication.willSucceed();
    await startAppWithAppLock(<SetPinScreen />);

    await typePin(PIN);
    await typePin(PIN);
    expect(screen.getByText('Turn on biometric unlock?')).toBeOnTheScreen();
    expect(mockBack).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('app-lock-biometric-offer-accept'));
    await flushPromises();

    expect(fakeLocalAuthentication.promptOptions()).toEqual([expect.objectContaining({ disableDeviceFallback: true, biometricsSecurityLevel: 'strong' })]);
    expect(fakeSecureStore.get('appLockBiometricEnabled')).toBe('true');
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('create: offers Biometric Unlock when available, Not now leaves it off', async () => {
    fakeLocalAuthentication.enrollStrongBiometrics();
    await startAppWithAppLock(<SetPinScreen />);

    await typePin(PIN);
    await typePin(PIN);
    fireEvent.press(screen.getByTestId('app-lock-biometric-offer-decline'));
    await flushPromises();

    expect(fakeLocalAuthentication.promptOptions()).toEqual([]);
    expect(fakeSecureStore.get('appLockBiometricEnabled')).toBeNull();
    expect(fakeSecureStore.get('appLockPinHash')).not.toBeNull();
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('create: a failed biometric prompt in the offer leaves Biometric Unlock off', async () => {
    fakeLocalAuthentication.enrollStrongBiometrics();
    fakeLocalAuthentication.willFail();
    await startAppWithAppLock(<SetPinScreen />);

    await typePin(PIN);
    await typePin(PIN);
    fireEvent.press(screen.getByTestId('app-lock-biometric-offer-accept'));
    await flushPromises();

    expect(fakeSecureStore.get('appLockBiometricEnabled')).toBeNull();
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('create: no offer when Biometric Unlock is unavailable', async () => {
    fakeLocalAuthentication.enrollWeakBiometrics();
    await startAppWithAppLock(<SetPinScreen />);

    await typePin(PIN);
    await typePin(PIN);

    expect(screen.queryByTestId('app-lock-biometric-offer-accept')).not.toBeOnTheScreen();
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('change: asks for the new PIN twice, then the new PIN unlocks and the old one is refused', async () => {
    mockMode = 'change';
    fakeLocalAuthentication.enrollStrongBiometrics();
    await seedAppLock({ pin: PIN });
    await startAppWithAppLock(<SetPinScreen />);
    await typePin(PIN, 'lock-screen-pin-pad');
    expect(title()).toHaveTextContent('Choose your new 6-digit PIN');

    await typePin(OTHER_PIN);
    expect(title()).toHaveTextContent('Enter your PIN again');
    await typePin(OTHER_PIN);

    expect(screen.queryByTestId('app-lock-biometric-offer-accept')).not.toBeOnTheScreen();
    expect(mockBack).toHaveBeenCalledTimes(1);

    // Restart: the old PIN is refused, the new one unlocks
    cleanup();
    await startAppWithAppLock(<SetPinScreen />);
    await typePin(PIN, 'lock-screen-pin-pad');
    expect(screen.getByTestId('lock-screen-error')).toBeOnTheScreen();
    await typePin(OTHER_PIN, 'lock-screen-pin-pad');
    expect(screen.queryByTestId('lock-screen')).not.toBeOnTheScreen();
  });
});
