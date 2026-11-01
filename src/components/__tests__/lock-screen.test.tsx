jest.mock('expo-secure-store', () => require('@/lib/app-lock/__tests__/helpers/fake-secure-store'));
jest.mock('expo-local-authentication', () => require('@/lib/app-lock/__tests__/helpers/fake-local-authentication'));
jest.mock('expo-crypto', () => require('@/lib/app-lock/__tests__/helpers/fake-expo-crypto'));

import '@/lib/i18n';

import React, { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';

import { emitAppState, installAppStateEmitter } from '@/lib/app-lock/__tests__/helpers/app-state';
import { spyOnConsole } from '@/lib/app-lock/__tests__/helpers/console-spy';
import { fakeLocalAuthentication } from '@/lib/app-lock/__tests__/helpers/fake-local-authentication';
import { fakeSecureStore } from '@/lib/app-lock/__tests__/helpers/fake-secure-store';
import { seedAppLock, startAppWithAppLock } from '@/lib/app-lock/__tests__/helpers/render-with-app-lock';
import { useAppLock } from '@/lib/context/app-lock-context';
import { act, cleanup, fireEvent, screen, waitFor } from '@/lib/test-utils';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), navigate: jest.fn(), dismissAll: jest.fn() };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

const mockDisconnectBreez = jest.fn(async () => {});
jest.mock('@/lib/context/breez-context', () => ({
  useBreez: () => ({ disconnectBreez: mockDisconnectBreez }),
}));

const mockDisconnectBdk = jest.fn(async () => {});
jest.mock('@/lib/context/bdk-context', () => ({
  useBdk: () => ({ disconnectBdk: mockDisconnectBdk }),
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

const PIN = '482915';
const WRONG_PIN = '000000';
const NOW = Date.UTC(2026, 10, 1, 12);
const SECOND = 1000;
const MINUTE = 60 * SECOND;

/** Lets the PIN check (hash, secure store) settle: the fakes only use promises, no timers. */
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

/** The action's promise only settles once the prompt is answered: do not await it. */
async function startSensitiveAction() {
  act(() => {
    fireEvent.press(screen.getByTestId('start-sensitive-action'));
  });
  await flushPromises();
}

function isLockScreenShown() {
  return screen.queryByTestId('lock-screen') !== null;
}

/** A screen with local state, to check the Lock Screen keeps what is below it. */
function StatefulScreen() {
  const [text, setText] = useState('');
  return <TextInput testID="screen-below-input" value={text} onChangeText={setText} />;
}

/** A screen that starts a Sensitive Action and shows its outcome. */
function SensitiveScreen() {
  const { authorizeSensitiveAction } = useAppLock();
  const [outcome, setOutcome] = useState('none');
  return (
    <View>
      <Pressable testID="start-sensitive-action" onPress={async () => setOutcome(String(await authorizeSensitiveAction('changePin')))} />
      <Text testID="sensitive-action-outcome">{outcome}</Text>
    </View>
  );
}

async function startLocked(options: Parameters<typeof seedAppLock>[0] = { pin: PIN }, ui: React.ReactElement = <StatefulScreen />) {
  await seedAppLock(options);
  return startAppWithAppLock(ui);
}

describe('LockScreen', () => {
  let appStateSpy: jest.SpyInstance;
  let consoleSpy: ReturnType<typeof spyOnConsole>;

  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
    jest.clearAllMocks();
    fakeSecureStore.reset();
    fakeLocalAuthentication.reset();
    appStateSpy = installAppStateEmitter();
    consoleSpy = spyOnConsole();
  });

  afterEach(() => {
    cleanup();
    consoleSpy.expectNoSecretLogged([PIN, WRONG_PIN]);
    consoleSpy.restore();
    appStateSpy.mockRestore();
    jest.useRealTimers();
  });

  describe('Content', () => {
    it('shows the logo, "Enter your PIN", 6 dots, the keypad with delete and Forgot PIN', async () => {
      await startLocked();

      expect(screen.getByTestId('lock-screen-logo')).toBeOnTheScreen();
      expect(screen.getByText('Enter your PIN')).toBeOnTheScreen();
      [0, 1, 2, 3, 4, 5].forEach((index) => expect(screen.getByTestId(`lock-screen-pin-pad-dot-${index}`)).toBeOnTheScreen());
      ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'delete'].forEach((key) => expect(screen.getByTestId(`lock-screen-pin-pad-key-${key}`)).toBeOnTheScreen());
      expect(screen.getByTestId('lock-screen-forgot-pin')).toHaveTextContent('Forgot PIN?');
      expect(screen.queryByTestId('lock-screen-cancel')).not.toBeOnTheScreen();
    });

    it('is rendered in a React Native Modal', async () => {
      await startLocked();

      const modal = screen.UNSAFE_getByType(Modal);
      expect(modal.props.visible).toBe(true);
      expect(screen.getByTestId('lock-screen')).toBeOnTheScreen();
    });

    it('never shows on a cold start without a PIN', async () => {
      await startAppWithAppLock(<StatefulScreen />);

      expect(isLockScreenShown()).toBe(false);
      expect(screen.UNSAFE_getByType(Modal).props.visible).toBe(false);
    });

    it('shows the biometric button only when Biometric Unlock is on and available', async () => {
      fakeLocalAuthentication.enrollStrongBiometrics();
      await startLocked({ pin: PIN, biometricUnlock: false });
      expect(screen.queryByTestId('lock-screen-biometric')).not.toBeOnTheScreen();
      cleanup();

      fakeSecureStore.reset();
      fakeLocalAuthentication.removeBiometrics();
      await startLocked({ pin: PIN, biometricUnlock: true });
      expect(screen.queryByTestId('lock-screen-biometric')).not.toBeOnTheScreen();
      expect(fakeLocalAuthentication.promptOptions()).toEqual([]);
      cleanup();

      fakeSecureStore.reset();
      fakeLocalAuthentication.enrollStrongBiometrics();
      await startLocked({ pin: PIN, biometricUnlock: true });
      expect(screen.getByTestId('lock-screen-biometric')).toBeOnTheScreen();
    });
  });

  describe('Unlocking', () => {
    it('unlocking keeps the state of the screen below (typed input)', async () => {
      await startLocked();
      await enterPin(PIN);
      expect(isLockScreenShown()).toBe(false);
      fireEvent.changeText(screen.getByTestId('screen-below-input'), 'half-typed note');

      emitAppState('background');
      jest.setSystemTime(Date.now() + 30_001);
      emitAppState('active');
      expect(isLockScreenShown()).toBe(true);
      await enterPin(PIN);

      expect(isLockScreenShown()).toBe(false);
      expect(screen.getByTestId('screen-below-input')).toHaveDisplayValue('half-typed note');
    });

    it('never navigates when locking or unlocking', async () => {
      await startLocked();
      await enterPin(WRONG_PIN);
      await enterPin(PIN);
      emitAppState('background');
      jest.setSystemTime(Date.now() + 60_000);
      emitAppState('active');
      await enterPin(PIN);

      Object.values(mockRouter).forEach((navigate) => expect(navigate).not.toHaveBeenCalled());
    });

    it('a screen opened behind the Lock Screen (link, notification) is shown after unlocking', async () => {
      const { rerenderScreen } = await startLocked();

      rerenderScreen(<Text testID="deep-linked-screen">Payment details</Text>);
      expect(isLockScreenShown()).toBe(true);
      await enterPin(PIN);

      expect(isLockScreenShown()).toBe(false);
      expect(screen.getByTestId('deep-linked-screen')).toBeOnTheScreen();
    });
  });

  describe('Biometric Unlock', () => {
    it('opens the biometric prompt automatically when it appears, without the Device Passcode', async () => {
      fakeLocalAuthentication.enrollStrongBiometrics();
      fakeLocalAuthentication.willSucceed();

      await startLocked({ pin: PIN, biometricUnlock: true });
      await flushPromises();

      expect(fakeLocalAuthentication.promptOptions()).toEqual([expect.objectContaining({ disableDeviceFallback: true, biometricsSecurityLevel: 'strong' })]);
      expect(isLockScreenShown()).toBe(false);
    });

    it('a cancelled or failed biometric prompt leaves the keypad usable; the button opens it again', async () => {
      fakeLocalAuthentication.enrollStrongBiometrics();
      fakeLocalAuthentication.willCancel();
      await startLocked({ pin: PIN, biometricUnlock: true });
      await flushPromises();
      expect(fakeLocalAuthentication.promptOptions()).toHaveLength(1);
      expect(screen.getByTestId('lock-screen-pin-pad-key-1')).toBeEnabled();
      expect(screen.queryByTestId('lock-screen-error')).not.toBeOnTheScreen();

      fakeLocalAuthentication.willFail();
      fireEvent.press(screen.getByTestId('lock-screen-biometric'));
      await flushPromises();
      expect(fakeLocalAuthentication.promptOptions()).toHaveLength(2);
      expect(isLockScreenShown()).toBe(true);

      fakeLocalAuthentication.willSucceed();
      fireEvent.press(screen.getByTestId('lock-screen-biometric'));
      await flushPromises();
      expect(isLockScreenShown()).toBe(false);
    });

    it('Biometric Unlock works during a Lockout', async () => {
      fakeLocalAuthentication.enrollStrongBiometrics();
      fakeLocalAuthentication.willCancel();
      await startLocked({ pin: PIN, biometricUnlock: true, failedAttempts: 5, lockoutUntil: NOW + 30 * SECOND });
      await flushPromises();
      expect(screen.getByTestId('lock-screen-lockout')).toBeOnTheScreen();

      fakeLocalAuthentication.willSucceed();
      fireEvent.press(screen.getByTestId('lock-screen-biometric'));
      await flushPromises();

      expect(isLockScreenShown()).toBe(false);
      expect(fakeSecureStore.get('appLockFailedAttempts')).toBeNull();
    });
  });

  describe('Wrong PIN and Lockout', () => {
    it('4 wrong PINs show "1 attempt left"', async () => {
      await startLocked();

      await enterPin(WRONG_PIN);
      expect(screen.getByTestId('lock-screen-error')).toHaveTextContent('Wrong PIN. 4 attempts left before a 30-second wait.');
      await enterPin(WRONG_PIN);
      await enterPin(WRONG_PIN);
      await enterPin(WRONG_PIN);

      expect(screen.getByTestId('lock-screen-error')).toHaveTextContent('Wrong PIN. 1 attempt left before a 30-second wait.');
      expect(screen.getByTestId('lock-screen-pin-pad-key-1')).toBeEnabled();
    });

    it('5th wrong PIN: keypad disabled with a countdown; still disabled at 29 999 ms, enabled at 30 000 ms', async () => {
      await startLocked({ pin: PIN, failedAttempts: 4 });

      await enterPin(WRONG_PIN);

      expect(screen.getByTestId('lock-screen-lockout')).toHaveTextContent('Too many wrong PINs. Try again in 0:30.');
      expect(screen.queryByTestId('lock-screen-error')).not.toBeOnTheScreen();
      expect(screen.getByTestId('lock-screen-pin-pad-key-1')).toBeDisabled();

      act(() => jest.advanceTimersByTime(10 * SECOND));
      expect(screen.getByTestId('lock-screen-lockout')).toHaveTextContent(/Try again in 0:20\.$/);

      act(() => jest.advanceTimersByTime(19_999));
      expect(screen.getByTestId('lock-screen-pin-pad-key-1')).toBeDisabled();

      act(() => jest.advanceTimersByTime(1));
      expect(screen.getByTestId('lock-screen-pin-pad-key-1')).toBeEnabled();
      expect(screen.queryByTestId('lock-screen-lockout')).not.toBeOnTheScreen();
      expect(screen.getByTestId('lock-screen-error')).toHaveTextContent('Wrong PIN. Another wrong PIN starts a longer wait.');
    });

    it('the 6th to 10th wrong PINs give 1 min, 5 min, 15 min, 1 h and 1 h', async () => {
      await startLocked({ pin: PIN, failedAttempts: 5 });

      for (const countdown of ['1:00', '5:00', '15:00', '1:00:00', '1:00:00']) {
        await enterPin(WRONG_PIN);
        expect(screen.getByTestId('lock-screen-lockout')).toHaveTextContent(`Too many wrong PINs. Try again in ${countdown}.`);
        act(() => jest.advanceTimersByTime(60 * MINUTE));
      }
    });

    it('a wrong PIN in prompt mode counts with the Lock Screen', async () => {
      await startLocked({ pin: PIN }, <SensitiveScreen />);
      await enterPin(WRONG_PIN);
      await enterPin(WRONG_PIN);
      await enterPin(PIN);

      await startSensitiveAction();
      await enterPin(WRONG_PIN);
      await enterPin(WRONG_PIN);
      await enterPin(WRONG_PIN);
      await enterPin(WRONG_PIN);

      expect(screen.getByTestId('lock-screen-error')).toHaveTextContent(/1 attempt left/);
      await enterPin(WRONG_PIN);
      expect(screen.getByTestId('lock-screen-lockout')).toBeOnTheScreen();
      expect(fakeSecureStore.get('appLockFailedAttempts')).toBe('5');
    });
  });

  describe('Prompt mode (Sensitive Actions)', () => {
    it('shows Cancel; Cancel resolves false', async () => {
      await startLocked({ pin: PIN }, <SensitiveScreen />);
      await enterPin(PIN);

      await startSensitiveAction();
      expect(isLockScreenShown()).toBe(true);
      expect(screen.getByText("Confirm it's you to continue.")).toBeOnTheScreen();
      expect(screen.getByTestId('lock-screen-forgot-pin')).toBeOnTheScreen();

      await act(async () => fireEvent.press(screen.getByTestId('lock-screen-cancel')));

      expect(isLockScreenShown()).toBe(false);
      expect(screen.getByTestId('sensitive-action-outcome')).toHaveTextContent('false');
    });

    it('the right PIN resolves true', async () => {
      await startLocked({ pin: PIN }, <SensitiveScreen />);
      await enterPin(PIN);

      await startSensitiveAction();
      await enterPin(PIN);

      expect(isLockScreenShown()).toBe(false);
      expect(screen.getByTestId('sensitive-action-outcome')).toHaveTextContent('true');
    });

    it('the Android back button cancels the prompt, and does nothing on the Lock Screen', async () => {
      await startLocked({ pin: PIN }, <SensitiveScreen />);

      act(() => screen.UNSAFE_getByType(Modal).props.onRequestClose());
      expect(isLockScreenShown()).toBe(true);
      await enterPin(PIN);

      await startSensitiveAction();
      await act(async () => screen.UNSAFE_getByType(Modal).props.onRequestClose());

      expect(isLockScreenShown()).toBe(false);
      expect(screen.getByTestId('sensitive-action-outcome')).toHaveTextContent('false');
    });
  });

  describe('Forgot PIN', () => {
    it('opens the confirmation; cancelling changes nothing', async () => {
      const { appContext } = await startLocked({ pin: PIN, failedAttempts: 2 });

      fireEvent.press(screen.getByTestId('lock-screen-forgot-pin'));

      expect(screen.getByText('Reset your wallet?')).toBeOnTheScreen();
      expect(screen.getByText(/The only way forward is to delete your wallet from this phone.*Without your recovery phrase, your funds are lost\./)).toBeOnTheScreen();
      expect(screen.getByTestId('lock-screen-reset-confirm')).toHaveTextContent('Reset wallet');
      expect(screen.queryByTestId('lock-screen-pin-pad-key-1')).not.toBeOnTheScreen();
      const before = fakeSecureStore.snapshot();

      fireEvent.press(screen.getByTestId('lock-screen-reset-cancel'));

      expect(screen.getByTestId('lock-screen-pin-pad-key-1')).toBeOnTheScreen();
      expect(isLockScreenShown()).toBe(true);
      expect(fakeSecureStore.snapshot()).toEqual(before);
      expect(appContext.resetAppData).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it.each([
      ['an Error', new Error('database locked')],
      ['anything else', 'database locked'],
    ])('a failed Wallet Reset (%s) keeps the Lock Screen and lets the user try again', async (_label, failure) => {
      await seedAppLock({ pin: PIN });
      const { appContext } = await startAppWithAppLock(<StatefulScreen />, { appContext: { resetAppData: jest.fn().mockRejectedValue(failure) } });

      fireEvent.press(screen.getByTestId('lock-screen-forgot-pin'));
      fireEvent.press(screen.getByTestId('lock-screen-reset-confirm'));
      await flushPromises();

      expect(appContext.resetAppData).toHaveBeenCalledTimes(1);
      expect(isLockScreenShown()).toBe(true);
      expect(screen.getByTestId('lock-screen-reset-confirm')).toBeEnabled();
      expect(fakeSecureStore.get('appLockPinHash')).not.toBeNull();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('Reset wallet runs the Wallet Reset and shows onboarding', async () => {
      const { appContext } = await startLocked({ pin: PIN, biometricUnlock: true, failedAttempts: 7, lockoutUntil: NOW + 5 * MINUTE });

      fireEvent.press(screen.getByTestId('lock-screen-forgot-pin'));
      fireEvent.press(screen.getByTestId('lock-screen-reset-confirm'));
      await flushPromises();

      expect(appContext.resetAppData).toHaveBeenCalledTimes(1);
      expect(mockDisconnectBreez).toHaveBeenCalledTimes(1);
      expect(mockDisconnectBdk).toHaveBeenCalledTimes(1);
      expect(fakeSecureStore.keys()).toEqual([]);
      expect(mockRouter.push).toHaveBeenCalledWith('/');
      await waitFor(() => expect(isLockScreenShown()).toBe(false));
    });
  });
});
