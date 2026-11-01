/* eslint-disable react/no-unstable-nested-components */
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { PinPad } from '@/components/pin-pad';
import { Button, FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { useAppLock } from '@/lib/context/app-lock-context';
import { theme } from '@/lib/theme-classes';

type SearchParams = { mode?: 'create' | 'change' };

type Step = 'enter' | 'confirm' | 'biometricOffer';

/** Enter a PIN, then enter it again. `create` turns App Lock on; `change` comes after a Sensitive Action prompt. */
export default function SetPinScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { mode } = useLocalSearchParams<SearchParams>();
  const isChange = mode === 'change';
  const { enableAppLock, changePin, isBiometricUnlockAvailable } = useAppLock();
  const [step, setStep] = useState<Step>('enter');
  const [hasMismatch, setHasMismatch] = useState(false);
  const firstEntryRef = useRef<string | null>(null);

  const submit = async (pin: string) => {
    if (step === 'enter') {
      firstEntryRef.current = pin;
      setHasMismatch(false);
      setStep('confirm');
      return;
    }
    const isConfirmed = pin === firstEntryRef.current;
    firstEntryRef.current = null;
    if (!isConfirmed) {
      setHasMismatch(true);
      setStep('enter');
      return;
    }
    if (isChange) {
      await changePin(pin);
      router.back();
      return;
    }
    await enableAppLock(pin);
    if (isBiometricUnlockAvailable) {
      setStep('biometricOffer');
    } else {
      router.back();
    }
  };

  const title = step === 'confirm' ? t('appLock.setPin.confirmTitle') : isChange ? t('appLock.setPin.changeTitle') : t('appLock.setPin.createTitle');

  return (
    <SafeAreaProvider>
      <SafeAreaView testID="app-lock-set-pin-screen" className={`flex-1 ${theme.screen}`}>
        <Stack.Screen
          options={{
            headerTitle: () => <HeaderTitle title={isChange ? t('appLock.setPin.changeHeaderTitle') : t('appLock.setPin.createHeaderTitle')} />,
            headerTitleAlign: 'center',
            headerLeft: HeaderLeft,
            headerShadowVisible: false,
          }}
        />
        <FocusAwareStatusBar />
        {step === 'biometricOffer' ? <BiometricOffer onDone={() => router.back()} /> : <PinEntry title={title} hasMismatch={hasMismatch} onComplete={submit} />}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const PinEntry = ({ title, hasMismatch, onComplete }: { title: string; hasMismatch: boolean; onComplete: (pin: string) => Promise<void> }) => {
  const { t } = useTranslation();
  return (
    <View className="flex-1 justify-between px-8 pb-8 pt-10">
      <View className="items-center">
        <Text testID="app-lock-set-pin-title" className={`text-center text-xl font-bold ${theme.textPrimary}`}>
          {title}
        </Text>
        <View className="mt-4 min-h-10">
          {hasMismatch && (
            <Text testID="app-lock-set-pin-error" className="text-center text-sm font-semibold text-danger-600">
              {t('appLock.setPin.mismatch')}
            </Text>
          )}
        </View>
      </View>
      <PinPad testID="app-lock-set-pin-pad" onComplete={onComplete} />
    </View>
  );
};

/** Right after creating the PIN, when the phone has strong biometrics. */
const BiometricOffer = ({ onDone }: { onDone: () => void }) => {
  const { t } = useTranslation();
  const { setBiometricUnlockEnabled } = useAppLock();
  const [isEnabling, setIsEnabling] = useState(false);

  const accept = async () => {
    setIsEnabling(true);
    try {
      await setBiometricUnlockEnabled(true);
    } finally {
      onDone();
    }
  };

  return (
    <View className="flex-1 justify-center px-8">
      <Text className={`mb-2 text-center text-xl font-bold ${theme.textPrimary}`}>{t('appLock.setPin.biometricOfferTitle')}</Text>
      <Text className={`mb-8 text-center text-base leading-6 ${theme.textSecondary}`}>{t('appLock.setPin.biometricOfferDescription')}</Text>
      <Button testID="app-lock-biometric-offer-accept" label={t('appLock.setPin.biometricOfferAccept')} size="lg" fullWidth loading={isEnabling} onPress={accept} />
      <Button testID="app-lock-biometric-offer-decline" label={t('appLock.setPin.biometricOfferDecline')} variant="outline" size="lg" fullWidth disabled={isEnabling} onPress={onDone} />
    </View>
  );
};
