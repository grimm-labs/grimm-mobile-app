jest.mock('expo-secure-store', () => require('@/lib/app-lock/__tests__/helpers/fake-secure-store'));
jest.mock('expo-local-authentication', () => require('@/lib/app-lock/__tests__/helpers/fake-local-authentication'));
jest.mock('expo-crypto', () => require('@/lib/app-lock/__tests__/helpers/fake-expo-crypto'));

import { act, renderHook, waitFor } from '@testing-library/react-native';

import { emitAppState, installAppStateEmitter } from '@/lib/app-lock/__tests__/helpers/app-state';
import { spyOnConsole } from '@/lib/app-lock/__tests__/helpers/console-spy';
import { fakeLocalAuthentication } from '@/lib/app-lock/__tests__/helpers/fake-local-authentication';
import { fakeSecureStore, getItemAsync } from '@/lib/app-lock/__tests__/helpers/fake-secure-store';
import { AppLockProvider, useAppLock } from '@/lib/context/app-lock-context';

const mockT = (key: string) => key;
jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: jest.fn() },
  useTranslation: () => ({ t: mockT }),
}));

const PIN = '482915';
const WRONG_PIN = '000000';
const RECOVERY_PHRASE = 'abandon ability able about above absent absorb abstract absurd abuse access accident';
const APP_LOCK_KEYS = ['appLockBiometricEnabled', 'appLockFailedAttempts', 'appLockLockoutUntil', 'appLockPinHash', 'appLockPinSalt'];
const NOW = Date.UTC(2026, 10, 1, 12);
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

type AppLock = ReturnType<typeof useAppLock>;

/** Mounts the provider (a cold start) and waits for the stored state. */
async function startApp() {
  const hook = renderHook(() => useAppLock(), { wrapper: AppLockProvider });
  await waitFor(() => expect(hook.result.current.isAppLockLoaded).toBe(true));
  return hook;
}

/** Turns App Lock on with PIN, then restarts the app. */
async function startAppWithPin({ biometricUnlock = false } = {}) {
  const first = await startApp();
  await act(() => first.result.current.enableAppLock(PIN));
  if (biometricUnlock) {
    fakeLocalAuthentication.enrollStrongBiometrics();
    fakeLocalAuthentication.willSucceed();
    await act(async () => {
      await first.result.current.setBiometricUnlockEnabled(true);
    });
    fakeLocalAuthentication.willCancel();
    fakeLocalAuthentication.clearPromptHistory();
  }
  first.unmount();
  return startApp();
}

async function enterWrongPins(appLock: { current: AppLock }, count: number) {
  for (let i = 0; i < count; i++) {
    await act(async () => {
      await appLock.current.unlockWithPin(WRONG_PIN);
    });
  }
}

function sendToBackgroundFor(duration: number, intermediateState?: 'inactive') {
  if (intermediateState) emitAppState(intermediateState);
  emitAppState('background');
  jest.setSystemTime(Date.now() + duration);
  emitAppState('active');
}

describe('AppLockProvider', () => {
  let appStateSpy: jest.SpyInstance;
  let consoleSpy: ReturnType<typeof spyOnConsole>;

  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
    fakeSecureStore.reset();
    fakeSecureStore.set('seedPhrase', RECOVERY_PHRASE);
    fakeLocalAuthentication.reset();
    appStateSpy = installAppStateEmitter();
    consoleSpy = spyOnConsole();
  });

  afterEach(() => {
    consoleSpy.expectNoSecretLogged([PIN, WRONG_PIN, RECOVERY_PHRASE]);
    consoleSpy.restore();
    appStateSpy.mockRestore();
    jest.useRealTimers();
  });

  describe('Turning App Lock on and off', () => {
    it('is off and unlocked by default with an empty secure store', async () => {
      const { result } = await startApp();

      expect(result.current).toMatchObject({ isAppLockEnabled: false, isLocked: false, isBiometricUnlockEnabled: false, failedAttempts: 0, lockoutUntil: null });
    });

    it('enabling stores a salted hash that is not the PIN; enabling twice uses two salts', async () => {
      const { result } = await startApp();

      await act(() => result.current.enableAppLock(PIN));
      const first = fakeSecureStore.snapshot();
      await act(() => result.current.enableAppLock(PIN));
      const second = fakeSecureStore.snapshot();

      expect(result.current.isAppLockEnabled).toBe(true);
      expect(result.current.isLocked).toBe(false);
      expect(first.appLockPinHash).toMatch(/^[0-9a-f]{64}$/);
      expect(first.appLockPinSalt).toMatch(/^[0-9a-f]{32}$/);
      expect(JSON.stringify(first)).not.toContain(PIN);
      expect(second.appLockPinSalt).not.toBe(first.appLockPinSalt);
      expect(second.appLockPinHash).not.toBe(first.appLockPinHash);
    });

    it('refuses a PIN that is not 6 digits', async () => {
      const { result } = await startApp();

      await expect(act(() => result.current.enableAppLock('1234'))).rejects.toThrow('The PIN must be 6 digits');

      expect(result.current.isAppLockEnabled).toBe(false);
      expect(fakeSecureStore.keys()).toEqual(['seedPhrase']);
    });

    it('changePin: the new PIN unlocks and the old one is refused', async () => {
      const first = await startApp();
      await act(() => first.result.current.enableAppLock(PIN));
      await act(() => first.result.current.changePin('135790'));
      first.unmount();
      const { result } = await startApp();

      expect(await act(() => result.current.unlockWithPin(PIN))).toBe('wrongPin');
      expect(await act(() => result.current.unlockWithPin('135790'))).toBe('unlocked');
      expect(result.current.isLocked).toBe(false);
    });

    it('disableAppLock deletes the five keys', async () => {
      const { result } = await startAppWithPin({ biometricUnlock: true });
      await enterWrongPins(result, 5);
      expect(fakeSecureStore.keys()).toEqual([...APP_LOCK_KEYS, 'seedPhrase']);

      await act(() => result.current.disableAppLock());

      expect(fakeSecureStore.keys()).toEqual(['seedPhrase']);
      expect(result.current).toMatchObject({ isAppLockEnabled: false, isLocked: false, isBiometricUnlockEnabled: false, failedAttempts: 0, lockoutUntil: null });
    });

    it('resetAppLock deletes the five keys and unlocks', async () => {
      const { result } = await startAppWithPin({ biometricUnlock: true });
      await enterWrongPins(result, 5);
      expect(result.current.isLocked).toBe(true);

      await act(() => result.current.resetAppLock());

      expect(fakeSecureStore.keys()).toEqual(['seedPhrase']);
      expect(result.current).toMatchObject({ isAppLockEnabled: false, isLocked: false, isBiometricUnlockEnabled: false, failedAttempts: 0, lockoutUntil: null });
    });

    it('turning Biometric Unlock on opens the biometric prompt and turns it on only if it succeeds', async () => {
      fakeLocalAuthentication.enrollStrongBiometrics();
      const first = await startApp();
      await act(() => first.result.current.enableAppLock(PIN));

      fakeLocalAuthentication.willCancel();
      expect(await act(() => first.result.current.setBiometricUnlockEnabled(true))).toBe(false);
      expect(first.result.current.isBiometricUnlockEnabled).toBe(false);
      expect(fakeSecureStore.get('appLockBiometricEnabled')).toBeNull();

      fakeLocalAuthentication.willSucceed();
      expect(await act(() => first.result.current.setBiometricUnlockEnabled(true))).toBe(true);
      expect(first.result.current.isBiometricUnlockEnabled).toBe(true);
      expect(fakeLocalAuthentication.promptOptions()).toEqual([expect.objectContaining({ disableDeviceFallback: true }), expect.objectContaining({ disableDeviceFallback: true })]);

      expect(await act(() => first.result.current.setBiometricUnlockEnabled(false))).toBe(true);
      expect(fakeSecureStore.get('appLockBiometricEnabled')).toBeNull();
    });

    it('cannot turn Biometric Unlock on without strong biometrics', async () => {
      fakeLocalAuthentication.enrollWeakBiometrics();
      fakeLocalAuthentication.willSucceed();
      const { result } = await startApp();
      await act(() => result.current.enableAppLock(PIN));

      expect(await act(() => result.current.setBiometricUnlockEnabled(true))).toBe(false);
      expect(result.current.isBiometricUnlockAvailable).toBe(false);
      expect(fakeLocalAuthentication.promptOptions()).toEqual([]);
    });
  });

  describe('Cold start', () => {
    it('starts locked on a cold start with a PIN', async () => {
      const { result } = await startAppWithPin();

      expect(result.current.isAppLockEnabled).toBe(true);
      expect(result.current.isLocked).toBe(true);
    });

    it('never locks on a cold start without a PIN', async () => {
      const lockedStates: boolean[] = [];
      const hook = renderHook(
        () => {
          const appLock = useAppLock();
          lockedStates.push(appLock.isLocked);
          return appLock;
        },
        { wrapper: AppLockProvider },
      );
      await waitFor(() => expect(hook.result.current.isAppLockLoaded).toBe(true));

      expect(lockedStates).not.toContain(true);
    });

    it.each([
      ['an Error', new Error('keychain unavailable')],
      ['anything else', 'keychain unavailable'],
    ])('a secure store failure at load (%s) leaves App Lock off and still ends the load', async (_label, failure) => {
      getItemAsync.mockRejectedValue(failure);

      const { result } = await startApp();

      expect(result.current).toMatchObject({ isAppLockEnabled: false, isLocked: false });
      expect(console.error).toHaveBeenCalledWith('[AppLock] Error loading the App Lock state:', failure instanceof Error ? 'keychain unavailable' : 'unknown error');
    });

    it('unmounting during the load changes nothing', async () => {
      let answer: () => void = () => {};
      getItemAsync.mockImplementationOnce((key: string) => new Promise((resolve) => (answer = () => resolve(fakeSecureStore.get(key)))));
      const { unmount } = renderHook(() => useAppLock(), { wrapper: AppLockProvider });

      unmount();
      await act(async () => answer());

      expect(fakeSecureStore.keys()).toEqual(['seedPhrase']);
    });

    it('a Lockout that ended while the app was closed is over at the next start', async () => {
      const first = await startAppWithPin();
      await enterWrongPins(first.result, 5);
      first.unmount();
      jest.setSystemTime(Date.now() + 10 * MINUTE);

      const { result } = await startApp();

      expect(result.current).toMatchObject({ failedAttempts: 5, isLockedOut: false });
      expect(await act(() => result.current.unlockWithPin(PIN))).toBe('unlocked');
    });

    it('is not loaded before the secure store answers', async () => {
      let answer: () => void = () => {};
      getItemAsync.mockImplementationOnce(() => new Promise((resolve) => (answer = () => resolve(null))));

      const { result } = renderHook(() => useAppLock(), { wrapper: AppLockProvider });

      expect(result.current.isAppLockLoaded).toBe(false);
      await act(async () => answer());
      await waitFor(() => expect(result.current.isAppLockLoaded).toBe(true));
    });
  });

  describe('Wrong PIN and Lockout', () => {
    it('unlocks with the right PIN and resets the count', async () => {
      const { result } = await startAppWithPin();
      await enterWrongPins(result, 3);
      expect(result.current.failedAttempts).toBe(3);

      expect(await act(() => result.current.unlockWithPin(PIN))).toBe('unlocked');

      expect(result.current.isLocked).toBe(false);
      expect(result.current.failedAttempts).toBe(0);
      expect(fakeSecureStore.get('appLockFailedAttempts')).toBeNull();
    });

    it('counts wrong PINs and starts a 30 s Lockout at the 5th', async () => {
      const { result } = await startAppWithPin();

      await enterWrongPins(result, 4);
      expect(result.current).toMatchObject({ failedAttempts: 4, lockoutUntil: null, isLockedOut: false });

      const fifthAttemptAt = Date.now();
      expect(await act(() => result.current.unlockWithPin(WRONG_PIN))).toBe('lockedOut');
      expect(result.current).toMatchObject({ failedAttempts: 5, lockoutUntil: fifthAttemptAt + 30 * SECOND, isLockedOut: true });

      act(() => jest.advanceTimersByTime(29_999));
      expect(result.current.isLockedOut).toBe(true);
      act(() => jest.advanceTimersByTime(1));
      expect(result.current.isLockedOut).toBe(false);
    });

    it('refuses even the right PIN during a Lockout', async () => {
      const { result } = await startAppWithPin();
      await enterWrongPins(result, 5);

      expect(await act(() => result.current.unlockWithPin(PIN))).toBe('lockedOut');
      expect(result.current.isLocked).toBe(true);
      expect(result.current.failedAttempts).toBe(5);

      act(() => jest.advanceTimersByTime(30 * SECOND));
      expect(await act(() => result.current.unlockWithPin(PIN))).toBe('unlocked');
    });

    it('the 6th to 10th wrong PINs give 1 min, 5 min, 15 min, 1 h and 1 h', async () => {
      const { result } = await startAppWithPin();
      await enterWrongPins(result, 5);

      for (const duration of [MINUTE, 5 * MINUTE, 15 * MINUTE, HOUR, HOUR]) {
        act(() => jest.advanceTimersByTime(result.current.lockoutUntil! - Date.now()));
        await enterWrongPins(result, 1);
        expect(result.current.lockoutUntil).toBe(Date.now() + duration);
      }
      expect(result.current.failedAttempts).toBe(10);
    });

    it('keeps the count and the Lockout across a remount', async () => {
      const first = await startAppWithPin();
      await enterWrongPins(first.result, 5);
      const { lockoutUntil } = first.result.current;
      first.unmount();

      const { result } = await startApp();

      expect(lockoutUntil).not.toBeNull();
      expect(result.current).toMatchObject({ isLocked: true, failedAttempts: 5, lockoutUntil, isLockedOut: true });
    });

    it('moving the clock back restarts the current step', async () => {
      const first = await startAppWithPin();
      await enterWrongPins(first.result, 5);
      act(() => jest.advanceTimersByTime(30 * SECOND));
      await enterWrongPins(first.result, 1);
      const sixthAttemptAt = Date.now();
      expect(first.result.current.lockoutUntil).toBe(sixthAttemptAt + MINUTE);

      // Back by a day: 24 h + 1 min remaining would exceed the 1 min step
      jest.setSystemTime(sixthAttemptAt - 24 * HOUR);
      expect(await act(() => first.result.current.unlockWithPin(PIN))).toBe('lockedOut');
      expect(first.result.current.lockoutUntil).toBe(sixthAttemptAt - 24 * HOUR + MINUTE);

      first.unmount();
      jest.setSystemTime(sixthAttemptAt - 48 * HOUR);
      const { result } = await startApp();
      // Restarted at load time: about 1 min left, not 48 h
      expect(result.current.lockoutUntil! - Date.now()).toBeLessThanOrEqual(MINUTE);
      expect(result.current.lockoutUntil! - Date.now()).toBeGreaterThan(MINUTE - SECOND);
      expect(fakeSecureStore.get('appLockLockoutUntil')).toBe(String(result.current.lockoutUntil));
    });

    it('never deletes anything after many wrong PINs', async () => {
      const { result } = await startAppWithPin();

      for (let i = 0; i < 12; i++) {
        act(() => jest.advanceTimersByTime(Math.max(0, (result.current.lockoutUntil ?? 0) - Date.now())));
        await enterWrongPins(result, 1);
      }

      expect(result.current.failedAttempts).toBe(12);
      expect(fakeSecureStore.get('seedPhrase')).toBe(RECOVERY_PHRASE);
      expect(fakeSecureStore.get('appLockPinHash')).not.toBeNull();
    });
  });

  describe('Biometric Unlock', () => {
    it('a successful Biometric Unlock unlocks and resets the count, even during a Lockout', async () => {
      const { result } = await startAppWithPin({ biometricUnlock: true });
      await enterWrongPins(result, 5);
      expect(result.current.isLockedOut).toBe(true);

      fakeLocalAuthentication.willSucceed();
      expect(await act(() => result.current.unlockWithBiometrics())).toBe(true);

      expect(result.current).toMatchObject({ isLocked: false, failedAttempts: 0, lockoutUntil: null, isLockedOut: false });
      expect(fakeSecureStore.get('appLockLockoutUntil')).toBeNull();
      expect(fakeLocalAuthentication.promptOptions()).toEqual([expect.objectContaining({ disableDeviceFallback: true, biometricsSecurityLevel: 'strong' })]);
    });

    it('a failed or cancelled biometric prompt does not change the count', async () => {
      const { result } = await startAppWithPin({ biometricUnlock: true });
      await enterWrongPins(result, 2);

      fakeLocalAuthentication.willCancel();
      expect(await act(() => result.current.unlockWithBiometrics())).toBe(false);
      fakeLocalAuthentication.willFail();
      expect(await act(() => result.current.unlockWithBiometrics())).toBe(false);

      expect(result.current).toMatchObject({ isLocked: true, failedAttempts: 2 });
      expect(fakeSecureStore.get('appLockFailedAttempts')).toBe('2');
    });

    it('Biometric Unlock becomes unavailable when the biometrics are removed (re-checked on resume)', async () => {
      const { result } = await startAppWithPin({ biometricUnlock: true });
      expect(result.current).toMatchObject({ isBiometricUnlockEnabled: true, isBiometricUnlockAvailable: true });

      fakeLocalAuthentication.removeBiometrics();
      emitAppState('background');
      emitAppState('active');

      await waitFor(() => expect(result.current.isBiometricUnlockAvailable).toBe(false));
      expect(result.current.isBiometricUnlockEnabled).toBe(true);
      fakeLocalAuthentication.willSucceed();
      expect(await act(() => result.current.unlockWithBiometrics())).toBe(false);
      expect(fakeLocalAuthentication.promptOptions()).toEqual([]);
    });
  });

  describe('Auto-lock', () => {
    it('29 999 ms in background stays unlocked, 30 001 ms locks', async () => {
      const { result } = await startAppWithPin();
      await act(() => result.current.unlockWithPin(PIN));

      sendToBackgroundFor(29_999);
      expect(result.current.isLocked).toBe(false);

      sendToBackgroundFor(30_001);
      expect(result.current.isLocked).toBe(true);
    });

    it('10 minutes in inactive does not lock', async () => {
      const { result } = await startAppWithPin();
      await act(() => result.current.unlockWithPin(PIN));

      emitAppState('inactive');
      jest.setSystemTime(Date.now() + 10 * MINUTE);
      emitAppState('active');

      expect(result.current.isLocked).toBe(false);
    });

    it('the iOS sequence inactive → background → active is measured from background', async () => {
      const { result } = await startAppWithPin();
      await act(() => result.current.unlockWithPin(PIN));

      emitAppState('inactive');
      jest.setSystemTime(Date.now() + 5 * SECOND);
      emitAppState('background');
      jest.setSystemTime(Date.now() + 29_999);
      emitAppState('active');
      expect(result.current.isLocked).toBe(false);

      sendToBackgroundFor(30_001, 'inactive');
      expect(result.current.isLocked).toBe(true);
    });

    it('never locks without App Lock', async () => {
      const { result } = await startApp();

      sendToBackgroundFor(HOUR);

      expect(result.current.isLocked).toBe(false);
    });
  });

  describe('Sensitive Actions', () => {
    it('authorizeSensitiveAction with App Lock on: the right PIN resolves true, cancel resolves false', async () => {
      const { result } = await startAppWithPin();
      await act(() => result.current.unlockWithPin(PIN));

      let decision!: Promise<boolean>;
      await act(async () => {
        decision = result.current.authorizeSensitiveAction('changePin');
      });
      expect(result.current.sensitiveActionPrompt).toBe('changePin');
      await act(() => result.current.unlockWithPin(PIN));
      await expect(decision).resolves.toBe(true);
      expect(result.current.sensitiveActionPrompt).toBeNull();

      await act(async () => {
        decision = result.current.authorizeSensitiveAction('disableAppLock');
      });
      act(() => result.current.cancelSensitiveAction());
      await expect(decision).resolves.toBe(false);
      expect(result.current.sensitiveActionPrompt).toBeNull();
      expect(result.current.isAppLockEnabled).toBe(true);
    });

    it('a wrong PIN in the Sensitive Action prompt increments the same count', async () => {
      const { result } = await startAppWithPin();
      await enterWrongPins(result, 2);
      await act(() => result.current.unlockWithPin(PIN));

      await act(async () => {
        result.current.authorizeSensitiveAction('recoveryPhrase');
      });
      await enterWrongPins(result, 3);

      expect(result.current.failedAttempts).toBe(3);
      expect(fakeSecureStore.get('appLockFailedAttempts')).toBe('3');
      await enterWrongPins(result, 2);
      expect(result.current.isLockedOut).toBe(true);
      expect(result.current.isLocked).toBe(false);
    });

    it('Biometric Unlock confirms a Sensitive Action', async () => {
      const { result } = await startAppWithPin({ biometricUnlock: true });
      await act(() => result.current.unlockWithPin(PIN));

      let decision!: Promise<boolean>;
      await act(async () => {
        decision = result.current.authorizeSensitiveAction('biometricUnlock');
      });
      fakeLocalAuthentication.willSucceed();
      await act(() => result.current.unlockWithBiometrics());

      await expect(decision).resolves.toBe(true);
    });

    it('the Recovery Phrase grant holds at 4 min 59 s, has expired at 5 min, and is cleared by background', async () => {
      const { result } = await startAppWithPin();
      await act(() => result.current.unlockWithPin(PIN));

      let decision!: Promise<boolean>;
      await act(async () => {
        decision = result.current.authorizeSensitiveAction('recoveryPhrase');
      });
      await act(() => result.current.unlockWithPin(PIN));
      await expect(decision).resolves.toBe(true);

      jest.setSystemTime(Date.now() + 4 * MINUTE + 59 * SECOND);
      expect(await act(() => result.current.authorizeSensitiveAction('recoveryPhrase'))).toBe(true);
      expect(result.current.sensitiveActionPrompt).toBeNull();

      jest.setSystemTime(Date.now() + 1 * SECOND);
      await act(async () => {
        decision = result.current.authorizeSensitiveAction('recoveryPhrase');
      });
      expect(result.current.sensitiveActionPrompt).toBe('recoveryPhrase');
      await act(() => result.current.unlockWithPin(PIN));
      await expect(decision).resolves.toBe(true);

      emitAppState('background');
      emitAppState('active');
      await act(async () => {
        decision = result.current.authorizeSensitiveAction('recoveryPhrase');
      });
      expect(result.current.sensitiveActionPrompt).toBe('recoveryPhrase');
      act(() => result.current.cancelSensitiveAction());
      await expect(decision).resolves.toBe(false);
    });

    it('a Sensitive Action asked before the App Lock state is loaded waits for it (link opened at a cold start)', async () => {
      const first = await startApp();
      await act(() => first.result.current.enableAppLock(PIN));
      first.unmount();
      fakeLocalAuthentication.willSucceed();
      let answer: () => void = () => {};
      getItemAsync.mockImplementationOnce((key: string) => new Promise((resolve) => (answer = () => resolve(fakeSecureStore.get(key)))));

      const { result } = renderHook(() => useAppLock(), { wrapper: AppLockProvider });
      let decision!: Promise<boolean>;
      await act(async () => {
        decision = result.current.authorizeSensitiveAction('recoveryPhrase');
      });
      await act(async () => answer());
      await waitFor(() => expect(result.current.isAppLockLoaded).toBe(true));
      await act(async () => {});

      // App Lock is on: the Lock Screen's prompt, never the phone's authentication
      expect(fakeLocalAuthentication.promptOptions()).toEqual([]);
      expect(result.current.sensitiveActionPrompt).toBe('recoveryPhrase');
      expect(result.current.isLocked).toBe(true);
      await act(() => result.current.unlockWithPin(PIN));
      await act(() => result.current.unlockWithPin(PIN));
      await expect(decision).resolves.toBe(true);
    });

    it('unlocking the Lock Screen does not grant the Recovery Phrase', async () => {
      const { result } = await startAppWithPin();
      await act(() => result.current.unlockWithPin(PIN));

      await act(async () => {
        result.current.authorizeSensitiveAction('recoveryPhrase');
      });

      expect(result.current.sensitiveActionPrompt).toBe('recoveryPhrase');
    });

    it('locking while a prompt is open resolves the Sensitive Action false', async () => {
      const { result } = await startAppWithPin();
      await act(() => result.current.unlockWithPin(PIN));

      let decision!: Promise<boolean>;
      await act(async () => {
        decision = result.current.authorizeSensitiveAction('recoveryPhrase');
      });
      sendToBackgroundFor(30_001);

      await expect(decision).resolves.toBe(false);
      expect(result.current.sensitiveActionPrompt).toBeNull();
      expect(result.current.isLocked).toBe(true);
    });

    it('App Lock off: the Recovery Phrase asks for phone authentication with the Device Passcode fallback and strong', async () => {
      const { result } = await startApp();

      fakeLocalAuthentication.willCancel();
      expect(await act(() => result.current.authorizeSensitiveAction('recoveryPhrase'))).toBe(false);
      fakeLocalAuthentication.willSucceed();
      expect(await act(() => result.current.authorizeSensitiveAction('recoveryPhrase'))).toBe(true);
      // The grant now covers the second backup screen
      expect(await act(() => result.current.authorizeSensitiveAction('recoveryPhrase'))).toBe(true);

      expect(fakeLocalAuthentication.promptOptions()).toEqual([
        expect.objectContaining({ disableDeviceFallback: false, biometricsSecurityLevel: 'strong' }),
        expect.objectContaining({ disableDeviceFallback: false, biometricsSecurityLevel: 'strong' }),
      ]);
      expect(result.current.sensitiveActionPrompt).toBeNull();
    });

    it('App Lock off: the other Sensitive Actions have nothing to ask', async () => {
      const { result } = await startApp();

      for (const kind of ['changePin', 'biometricUnlock', 'disableAppLock'] as const) {
        expect(await act(() => result.current.authorizeSensitiveAction(kind))).toBe(true);
      }
      expect(fakeLocalAuthentication.promptOptions()).toEqual([]);
      expect(result.current.sensitiveActionPrompt).toBeNull();
    });

    it('App Lock off, no screen lock: resolves true without a prompt', async () => {
      fakeLocalAuthentication.removeScreenLock();
      const { result } = await startApp();

      expect(await act(() => result.current.authorizeSensitiveAction('recoveryPhrase'))).toBe(true);
      expect(fakeLocalAuthentication.promptOptions()).toEqual([]);
    });
  });

  it('useAppLock throws outside the provider', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAppLock())).toThrow('useAppLock must be used within an AppLockProvider');
  });
});
