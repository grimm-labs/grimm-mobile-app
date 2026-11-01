import Ionicons from '@expo/vector-icons/Ionicons';
import { useColorScheme } from 'nativewind';
import type { ReactNode } from 'react';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { colors, Pressable, Text, View } from '@/components/ui';
import { PIN_LENGTH } from '@/lib/app-lock';

type Props = {
  /** Prefix of the testIDs: `<testID>-key-<digit>`, `<testID>-key-delete`, `<testID>-dot-<index>`. */
  testID: string;
  /** Called with the PIN at the 6th digit; the dots are cleared and the keys wait until it settles. */
  onComplete: (pin: string) => void | Promise<void>;
  disabled?: boolean;
  /** Shown left of the 0 (the Lock Screen puts its biometric button there). */
  bottomLeftKey?: ReactNode;
};

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
];

const KEY_CLASS = 'h-16 w-[30%] items-center justify-center rounded-full';

export const PinPad = ({ testID, onComplete, disabled = false, bottomLeftKey }: Props) => {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const [digits, setDigits] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Fast taps can land before a re-render: the ref always holds the digits typed so far
  const digitsRef = useRef('');
  const isSubmittingRef = useRef(false);
  const isInactive = disabled || isSubmitting;

  const updateDigits = (next: string) => {
    digitsRef.current = next;
    setDigits(next);
  };

  const pressDigit = async (digit: string) => {
    if (disabled || isSubmittingRef.current) return;
    const next = digitsRef.current + digit;
    if (next.length < PIN_LENGTH) {
      updateDigits(next);
      return;
    }
    updateDigits('');
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      await onComplete(next);
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const pressDelete = () => {
    if (!isInactive) updateDigits(digitsRef.current.slice(0, -1));
  };

  const renderDigit = (digit: string) => <DigitKey key={digit} testID={`${testID}-key-${digit}`} digit={digit} disabled={isInactive} onPress={() => pressDigit(digit)} />;

  return (
    <View>
      <PinDots testID={testID} count={digits.length} />
      {ROWS.map((row) => (
        <View key={row[0]} className="mb-4 flex-row justify-between">
          {row.map(renderDigit)}
        </View>
      ))}
      <View className="flex-row justify-between">
        <View className={KEY_CLASS}>{bottomLeftKey}</View>
        {renderDigit('0')}
        <Pressable testID={`${testID}-key-delete`} onPress={pressDelete} disabled={isInactive} accessibilityLabel={t('appLock.pinPad.delete')} className={KEY_CLASS}>
          <Ionicons name="backspace-outline" size={28} color={colorScheme === 'dark' ? colors.white : colors.black} />
        </Pressable>
      </View>
    </View>
  );
};

const PinDots = ({ testID, count }: { testID: string; count: number }) => (
  <View className="mb-10 flex-row justify-center">
    {Array.from({ length: PIN_LENGTH }, (_, index) => {
      const isFilled = index < count;
      return (
        <View
          key={index}
          testID={`${testID}-dot-${index}`}
          accessibilityValue={{ text: isFilled ? 'filled' : 'empty' }}
          className={`mx-2 size-4 rounded-full border-2 border-primary-600 ${isFilled ? 'bg-primary-600' : 'bg-transparent'}`}
        />
      );
    })}
  </View>
);

const DigitKey = ({ testID, digit, disabled, onPress }: { testID: string; digit: string; disabled: boolean; onPress: () => void }) => (
  <Pressable testID={testID} onPress={onPress} disabled={disabled} className={`${KEY_CLASS} bg-gray-100 dark:bg-charcoal-800 ${disabled ? 'opacity-40' : ''}`}>
    <Text className="text-3xl font-medium text-gray-800 dark:text-charcoal-100">{digit}</Text>
  </Pressable>
);
