import Ionicons from '@expo/vector-icons/Ionicons';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from 'react-native';

import { PinPad } from '@/components/pin-pad';
import { Button, colors, Image, Pressable, SafeAreaView, Text, View } from '@/components/ui';
import { ATTEMPTS_BEFORE_LOCKOUT, attemptsLeftBeforeLockout } from '@/lib/app-lock';
import { useAppLock } from '@/lib/context/app-lock-context';
import { formatRemainingTime, useCountdown } from '@/lib/hooks/use-countdown';
import { useWalletReset } from '@/lib/hooks/use-wallet-reset';
import { getSplashAppearance } from '@/lib/splash-appearance';
import { theme } from '@/lib/theme-classes';

type Mode = 'lock' | 'prompt';

/**
 * Covers every route, bottom sheet and modal while the app is locked (lock mode), or while a Sensitive Action waits
 * for the PIN (prompt mode). It never navigates: once unlocked, the user is back where they were.
 */
export const LockScreen = () => {
  const { isLocked, sensitiveActionPrompt, cancelSensitiveAction } = useAppLock();
  const mode: Mode | null = isLocked ? 'lock' : sensitiveActionPrompt ? 'prompt' : null;

  return (
    // Android back: cancels a prompt, and does nothing on the Lock Screen
    <Modal visible={mode !== null} animationType="none" statusBarTranslucent onRequestClose={mode === 'prompt' ? cancelSensitiveAction : () => undefined}>
      {mode && <LockScreenContent key={mode} mode={mode} />}
    </Modal>
  );
};

const LockScreenContent = ({ mode }: { mode: Mode }) => {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const { isLockedOut, isBiometricUnlockEnabled, isBiometricUnlockAvailable, unlockWithPin, unlockWithBiometrics, cancelSensitiveAction } = useAppLock();
  const [isResetConfirmationVisible, setIsResetConfirmationVisible] = useState(false);
  const canUseBiometrics = isBiometricUnlockEnabled && isBiometricUnlockAvailable;

  // The biometric prompt opens by itself when the Lock Screen appears
  useEffect(() => {
    if (canUseBiometrics) unlockWithBiometrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per appearance
  }, []);

  return (
    <SafeAreaView testID="lock-screen" className={`flex-1 ${theme.screen}`}>
      <View className="flex-1 justify-between px-8 pb-6 pt-4">
        <View className="h-10 items-end">
          {mode === 'prompt' && (
            <Pressable testID="lock-screen-cancel" onPress={cancelSensitiveAction} className="p-2">
              <Text className="text-base font-semibold text-primary-600">{t('appLock.lockScreen.cancel')}</Text>
            </Pressable>
          )}
        </View>
        <View className="items-center">
          <Image testID="lock-screen-logo" source={getSplashAppearance(colorScheme).image} className="mb-4 size-20" contentFit="contain" />
          <Text className={`text-xl font-bold ${theme.textPrimary}`}>{t('appLock.lockScreen.title')}</Text>
          {mode === 'prompt' && <Text className={`mt-2 text-center text-sm ${theme.textSecondary}`}>{t('appLock.lockScreen.promptSubtitle')}</Text>}
          <LockScreenMessage />
        </View>
        {isResetConfirmationVisible ? (
          <ResetConfirmation onCancel={() => setIsResetConfirmationVisible(false)} />
        ) : (
          <View>
            <PinPad
              testID="lock-screen-pin-pad"
              disabled={isLockedOut}
              onComplete={async (pin) => {
                await unlockWithPin(pin);
              }}
              bottomLeftKey={
                canUseBiometrics && (
                  <Pressable testID="lock-screen-biometric" onPress={unlockWithBiometrics} accessibilityLabel={t('appLock.lockScreen.biometric')} className="size-16 items-center justify-center">
                    <Ionicons name="finger-print" size={32} color={colors.primary[600]} />
                  </Pressable>
                )
              }
            />
            <Pressable testID="lock-screen-forgot-pin" onPress={() => setIsResetConfirmationVisible(true)} className="mt-6 items-center py-2">
              <Text className="text-sm font-semibold text-primary-600">{t('appLock.lockScreen.forgotPin')}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

/** The countdown during a Lockout, otherwise what the last wrong PIN means. */
const LockScreenMessage = () => {
  const { t } = useTranslation();
  const { failedAttempts, lockoutUntil, isLockedOut } = useAppLock();
  const { remainingSecs } = useCountdown(isLockedOut ? lockoutUntil : null);

  if (isLockedOut && lockoutUntil !== null) {
    const time = formatRemainingTime(remainingSecs ?? Math.ceil((lockoutUntil - Date.now()) / 1000));
    return (
      <Text testID="lock-screen-lockout" className="mt-4 min-h-10 text-center text-sm font-semibold text-danger-600">
        {t('appLock.lockScreen.lockout', { time })}
      </Text>
    );
  }
  if (failedAttempts === 0) return <View className="mt-4 min-h-10" />;
  return (
    <Text testID="lock-screen-error" className="mt-4 min-h-10 text-center text-sm font-semibold text-danger-600">
      {failedAttempts < ATTEMPTS_BEFORE_LOCKOUT ? t('appLock.lockScreen.wrongPin', { count: attemptsLeftBeforeLockout(failedAttempts) }) : t('appLock.lockScreen.nextWrongPinLocksOut')}
    </Text>
  );
};

/** Forgot PIN: the only way forward is a Wallet Reset. */
const ResetConfirmation = ({ onCancel }: { onCancel: () => void }) => {
  const { t } = useTranslation();
  const resetWallet = useWalletReset();
  const [isResetting, setIsResetting] = useState(false);

  const confirm = async () => {
    setIsResetting(true);
    try {
      await resetWallet();
    } catch (error) {
      console.error('[AppLock] Wallet Reset failed:', error instanceof Error ? error.message : 'unknown error');
      setIsResetting(false);
    }
  };

  return (
    <View>
      <Text className={`mb-2 text-center text-lg font-bold ${theme.textPrimary}`}>{t('appLock.lockScreen.resetTitle')}</Text>
      <Text className={`mb-6 text-center text-sm leading-5 ${theme.textSecondary}`}>{t('appLock.lockScreen.resetDescription')}</Text>
      <Button testID="lock-screen-reset-confirm" label={t('appLock.lockScreen.resetConfirm')} variant="destructive" size="lg" fullWidth loading={isResetting} onPress={confirm} />
      <Button testID="lock-screen-reset-cancel" label={t('appLock.lockScreen.resetCancel')} variant="outline" size="lg" fullWidth disabled={isResetting} onPress={onCancel} />
    </View>
  );
};
