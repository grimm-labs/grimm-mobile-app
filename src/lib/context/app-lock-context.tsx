/* eslint-disable max-lines-per-function */
import type { PropsWithChildren } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState } from 'react-native';

import type { LockoutState, StoredPin } from '@/lib/app-lock';
import {
  createPinSalt,
  deleteAppLockState,
  hashPin,
  hasScreenLock,
  isBiometricUnlockAvailable as checkBiometricUnlockAvailable,
  isLockedOut as isLockedOutAt,
  isRecoveryPhraseGrantValid,
  isValidPin,
  nextBackgroundedAt,
  normalizeLockoutUntil,
  promptBiometricUnlock,
  promptPhoneAuthentication,
  readAppLockState,
  registerFailedAttempt,
  saveBiometricUnlockEnabled,
  saveFailedAttempts,
  savePin,
  shouldLockOnResume,
  verifyPin,
} from '@/lib/app-lock';

export type SensitiveActionKind = 'recoveryPhrase' | 'changePin' | 'biometricUnlock' | 'disableAppLock';
export type PinAttemptResult = 'unlocked' | 'wrongPin' | 'lockedOut';

type AppLockContextType = {
  isAppLockLoaded: boolean;
  isAppLockEnabled: boolean;
  /** The Lock Screen covers the app. */
  isLocked: boolean;
  isBiometricUnlockEnabled: boolean;
  /** Strong biometrics are enrolled on the phone right now (re-checked when the app comes back to the foreground). */
  isBiometricUnlockAvailable: boolean;
  failedAttempts: number;
  lockoutUntil: number | null;
  /** A Lockout is running: every PIN is refused until lockoutUntil. */
  isLockedOut: boolean;
  /** The Sensitive Action waiting for the PIN or Biometric Unlock (the Lock Screen in prompt mode). */
  sensitiveActionPrompt: SensitiveActionKind | null;
  enableAppLock: (pin: string) => Promise<void>;
  changePin: (pin: string) => Promise<void>;
  disableAppLock: () => Promise<void>;
  /** Turning it on opens the biometric prompt once; resolves whether the setting changed. */
  setBiometricUnlockEnabled: (enabled: boolean) => Promise<boolean>;
  /** Unlocks the Lock Screen, or confirms the pending Sensitive Action. */
  unlockWithPin: (pin: string) => Promise<PinAttemptResult>;
  unlockWithBiometrics: () => Promise<boolean>;
  /** Resolves true once the user proved they are the owner, false if they cancelled. */
  authorizeSensitiveAction: (kind: SensitiveActionKind) => Promise<boolean>;
  cancelSensitiveAction: () => void;
  /** Part of the Wallet Reset: deletes every App Lock key. */
  resetAppLock: () => Promise<void>;
};

const AppLockContext = createContext<AppLockContextType | undefined>(undefined);

const NO_LOCKOUT: LockoutState = { failedAttempts: 0, lockoutUntil: null };

type PendingSensitiveAction = { kind: SensitiveActionKind; resolve: (authorized: boolean) => void };

export const AppLockProvider = ({ children }: PropsWithChildren) => {
  const { t } = useTranslation();
  const [isAppLockLoaded, setIsAppLockLoaded] = useState(false);
  const [isAppLockEnabled, setIsAppLockEnabled] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isBiometricUnlockEnabled, setIsBiometricUnlockEnabled] = useState(false);
  const [isBiometricUnlockAvailable, setIsBiometricUnlockAvailable] = useState(false);
  const [lockout, setLockout] = useState<LockoutState>(NO_LOCKOUT);
  const [sensitiveActionPrompt, setSensitiveActionPrompt] = useState<SensitiveActionKind | null>(null);
  const [, setLockoutEndTick] = useState(0);

  // Read by callbacks that must stay stable (screens put them in effect deps) and by the AppState listener
  const pinRef = useRef<StoredPin | null>(null);
  const lockoutRef = useRef<LockoutState>(NO_LOCKOUT);
  const isLockedRef = useRef(false);
  const biometricRef = useRef({ enabled: false, available: false });
  const pendingRef = useRef<PendingSensitiveAction | null>(null);
  const recoveryPhraseGrantedAtRef = useRef<number | null>(null);
  const backgroundedAtRef = useRef<number | null>(null);
  // A link can open a protected screen before the stored state is read: Sensitive Actions wait for it
  const loadedRef = useRef<{ promise: Promise<void>; resolve: () => void } | null>(null);
  if (loadedRef.current === null) {
    let resolve = () => {};
    const promise = new Promise<void>((done) => (resolve = done));
    loadedRef.current = { promise, resolve };
  }

  const updateLockout = useCallback((next: LockoutState) => {
    lockoutRef.current = next;
    setLockout(next);
  }, []);

  const updateLocked = useCallback((locked: boolean) => {
    isLockedRef.current = locked;
    setIsLocked(locked);
  }, []);

  const updateBiometric = useCallback((next: Partial<typeof biometricRef.current>) => {
    biometricRef.current = { ...biometricRef.current, ...next };
    setIsBiometricUnlockEnabled(biometricRef.current.enabled);
    setIsBiometricUnlockAvailable(biometricRef.current.available);
  }, []);

  const settleSensitiveAction = useCallback((authorized: boolean) => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    setSensitiveActionPrompt(null);
    pending?.resolve(authorized);
  }, []);

  /** Applies the clock-moved-back rule to the stored Lockout and saves the result if it changed. */
  const refreshLockout = useCallback(async () => {
    const lockoutUntil = normalizeLockoutUntil(lockoutRef.current, Date.now());
    if (lockoutUntil !== lockoutRef.current.lockoutUntil) {
      const next = { ...lockoutRef.current, lockoutUntil };
      updateLockout(next);
      await saveFailedAttempts(next);
    }
    return lockoutRef.current;
  }, [updateLockout]);

  const refreshBiometricAvailability = useCallback(async () => {
    updateBiometric({ available: await checkBiometricUnlockAvailable() });
  }, [updateBiometric]);

  useEffect(() => {
    let isCancelled = false;
    const load = async () => {
      try {
        const [stored, available] = await Promise.all([readAppLockState(), checkBiometricUnlockAvailable()]);
        pinRef.current = stored.pin;
        lockoutRef.current = { failedAttempts: stored.failedAttempts, lockoutUntil: stored.lockoutUntil };
        await refreshLockout();
        if (isCancelled) return;
        setLockout(lockoutRef.current);
        setIsAppLockEnabled(stored.pin !== null);
        updateLocked(stored.pin !== null);
        updateBiometric({ enabled: stored.isBiometricUnlockEnabled, available });
      } catch (error) {
        console.error('[AppLock] Error loading the App Lock state:', error instanceof Error ? error.message : 'unknown error');
      } finally {
        setIsAppLockLoaded(true);
        loadedRef.current?.resolve();
      }
    };
    load();
    return () => {
      isCancelled = true;
    };
  }, [refreshLockout, updateBiometric, updateLocked]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const now = Date.now();
      if (nextState === 'background') {
        recoveryPhraseGrantedAtRef.current = null;
      }
      if (nextState === 'active') {
        if (pinRef.current && shouldLockOnResume(backgroundedAtRef.current, now)) {
          settleSensitiveAction(false);
          updateLocked(true);
        }
        refreshBiometricAvailability();
        refreshLockout();
      }
      backgroundedAtRef.current = nextBackgroundedAt(backgroundedAtRef.current, nextState, now);
    });
    return () => subscription.remove();
  }, [refreshBiometricAvailability, refreshLockout, settleSensitiveAction, updateLocked]);

  // Re-render exactly when the Lockout ends, so the keypad comes back without waiting for another event
  useEffect(() => {
    if (lockout.lockoutUntil === null) return;
    const remaining = lockout.lockoutUntil - Date.now();
    if (remaining <= 0) return;
    const timer = setTimeout(() => setLockoutEndTick((tick) => tick + 1), remaining);
    return () => clearTimeout(timer);
  }, [lockout.lockoutUntil]);

  const resetFailedAttempts = useCallback(async () => {
    if (lockoutRef.current.failedAttempts === 0 && lockoutRef.current.lockoutUntil === null) return;
    updateLockout(NO_LOCKOUT);
    await saveFailedAttempts(NO_LOCKOUT);
  }, [updateLockout]);

  /** The owner proved who they are: unlock the Lock Screen, or confirm the pending Sensitive Action. */
  const onAuthenticated = useCallback(() => {
    if (isLockedRef.current) {
      updateLocked(false);
    } else {
      settleSensitiveAction(true);
    }
  }, [settleSensitiveAction, updateLocked]);

  const unlockWithPin = useCallback(
    async (pin: string): Promise<PinAttemptResult> => {
      const current = await refreshLockout();
      if (isLockedOutAt(current.lockoutUntil, Date.now())) return 'lockedOut';

      if (pinRef.current && (await verifyPin(pin, pinRef.current))) {
        await resetFailedAttempts();
        onAuthenticated();
        return 'unlocked';
      }

      const next = registerFailedAttempt(lockoutRef.current.failedAttempts, Date.now());
      updateLockout(next);
      await saveFailedAttempts(next);
      return next.lockoutUntil === null ? 'wrongPin' : 'lockedOut';
    },
    [onAuthenticated, refreshLockout, resetFailedAttempts, updateLockout],
  );

  const unlockWithBiometrics = useCallback(async () => {
    if (!biometricRef.current.enabled || !biometricRef.current.available) return false;
    const success = await promptBiometricUnlock({ promptMessage: t('appLock.biometricPrompt.unlock'), cancelLabel: t('appLock.biometricPrompt.cancel') });
    // Biometric failures do not count: the operating system limits them and the user falls back to the PIN
    if (!success) return false;
    await resetFailedAttempts();
    onAuthenticated();
    return true;
  }, [onAuthenticated, resetFailedAttempts, t]);

  const setPin = useCallback(
    async (pin: string) => {
      if (!isValidPin(pin)) throw new Error('The PIN must be 6 digits');
      const salt = createPinSalt();
      const stored = { hash: await hashPin(pin, salt), salt };
      await savePin(stored);
      pinRef.current = stored;
      await resetFailedAttempts();
      setIsAppLockEnabled(true);
    },
    [resetFailedAttempts],
  );

  const clearAppLock = useCallback(async () => {
    await deleteAppLockState();
    pinRef.current = null;
    recoveryPhraseGrantedAtRef.current = null;
    settleSensitiveAction(false);
    updateLockout(NO_LOCKOUT);
    updateBiometric({ enabled: false });
    setIsAppLockEnabled(false);
    updateLocked(false);
  }, [settleSensitiveAction, updateBiometric, updateLockout, updateLocked]);

  const setBiometricUnlockEnabled = useCallback(
    async (enabled: boolean) => {
      if (enabled) {
        const available = await checkBiometricUnlockAvailable();
        updateBiometric({ available });
        if (!available) return false;
        const success = await promptBiometricUnlock({ promptMessage: t('appLock.biometricPrompt.enable'), cancelLabel: t('appLock.biometricPrompt.cancel') });
        if (!success) return false;
      }
      await saveBiometricUnlockEnabled(enabled);
      updateBiometric({ enabled });
      return true;
    },
    [t, updateBiometric],
  );

  const openSensitiveActionPrompt = useCallback(
    (kind: SensitiveActionKind) =>
      new Promise<boolean>((resolve) => {
        pendingRef.current?.resolve(false);
        pendingRef.current = { kind, resolve };
        setSensitiveActionPrompt(kind);
      }),
    [],
  );

  const authorizeSensitiveAction = useCallback(
    async (kind: SensitiveActionKind) => {
      await loadedRef.current?.promise;
      const isRecoveryPhrase = kind === 'recoveryPhrase';
      if (isRecoveryPhrase && isRecoveryPhraseGrantValid(recoveryPhraseGrantedAtRef.current, Date.now())) return true;

      let authorized: boolean;
      if (pinRef.current) {
        authorized = await openSensitiveActionPrompt(kind);
      } else if (!isRecoveryPhrase) {
        authorized = true;
      } else if (!(await hasScreenLock())) {
        // Nothing to ask on a phone without a screen lock: the words are shown as before App Lock
        return true;
      } else {
        authorized = await promptPhoneAuthentication({ promptMessage: t('appLock.biometricPrompt.recoveryPhrase'), cancelLabel: t('appLock.biometricPrompt.cancel') });
      }

      if (authorized && isRecoveryPhrase) recoveryPhraseGrantedAtRef.current = Date.now();
      return authorized;
    },
    [openSensitiveActionPrompt, t],
  );

  const cancelSensitiveAction = useCallback(() => settleSensitiveAction(false), [settleSensitiveAction]);

  // Depends on the clock: recomputed on every render, and the Lockout-end timer forces one
  const isLockedOut = isLockedOutAt(lockout.lockoutUntil, Date.now());

  const value = useMemo(
    () => ({
      isAppLockLoaded,
      isAppLockEnabled,
      isLocked,
      isBiometricUnlockEnabled,
      isBiometricUnlockAvailable,
      failedAttempts: lockout.failedAttempts,
      lockoutUntil: lockout.lockoutUntil,
      isLockedOut,
      sensitiveActionPrompt,
      enableAppLock: setPin,
      changePin: setPin,
      disableAppLock: clearAppLock,
      setBiometricUnlockEnabled,
      unlockWithPin,
      unlockWithBiometrics,
      authorizeSensitiveAction,
      cancelSensitiveAction,
      resetAppLock: clearAppLock,
    }),
    [
      isAppLockLoaded,
      isAppLockEnabled,
      isLocked,
      isBiometricUnlockEnabled,
      isBiometricUnlockAvailable,
      lockout,
      isLockedOut,
      sensitiveActionPrompt,
      setPin,
      clearAppLock,
      setBiometricUnlockEnabled,
      unlockWithPin,
      unlockWithBiometrics,
      authorizeSensitiveAction,
      cancelSensitiveAction,
    ],
  );

  return <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>;
};

export const useAppLock = () => {
  const context = useContext(AppLockContext);
  if (context === undefined) {
    throw new Error('useAppLock must be used within an AppLockProvider');
  }
  return context;
};
