/* eslint-disable max-lines-per-function */
import React, { useRef, useState } from 'react';
import { Animated, TouchableOpacity, Vibration, View } from 'react-native';

import { Button, NumericVirtualKeyboard, showErrorMessage, Text } from '@/ui';

export type PinSetupFormProps = {
  onSubmit?: () => void;
};

export const PinSetupFormWithVirtualKeyboard = ({
  onSubmit = () => {},
}: PinSetupFormProps) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const handleKeyPress = (value: number) => {
    if (value === -1) {
      handleDelete();
      return;
    }
    if (step === 'create') {
      if (pin.length < 6) {
        setPin((prev) => `${prev}${value}`);
      }
    } else {
      if (confirmPin.length < 6) {
        setConfirmPin((prev) => `${prev}${value}`);
      }
    }
  };

  const handleDelete = () => {
    if (step === 'create') {
      setPin((prev) => prev.slice(0, -1));
    } else {
      setConfirmPin((prev) => prev.slice(0, -1));
    }
  };

  const handleSubmit = () => {
    if (step === 'create' && pin.length === 6) {
      setStep('confirm');
    } else if (step === 'confirm' && confirmPin.length === 6) {
      if (pin === confirmPin) {
        onSubmit();
      } else {
        shake();
        showErrorMessage('The PIN codes do not match. Please try again!');
        setConfirmPin('');
      }
    }
  };

  const handleResetPin = () => {
    setPin('');
    setConfirmPin('');
    setStep('create');
  };

  const shake = () => {
    Vibration.vibrate(100); // Vibrate for 100 milliseconds
    // Create the shaking animation
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10, // Move 10 pixels to the right
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10, // Move 10 pixels to the left
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10, // Move 10 pixels to the right
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0, // Return to original position
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const displayPin = step === 'create' ? pin : confirmPin;

  return (
    <View className="flex-1 justify-between">
      <View className="flex h-2/5 items-center justify-center">
        <View className="px-8">
          <Text className="pb-2 text-center text-3xl">
            {step === 'create' ? 'Create a PIN code' : 'Confirm the PIN code'}
          </Text>
          <Text className="mx-10 pb-6 text-center text-sm text-gray-600">
            {step === 'create'
              ? 'Please create a 6-digit PIN code'
              : 'Confirm your PIN code'}
          </Text>
          <Animated.View style={[{ transform: [{ translateX: shakeAnim }] }]}>
            <View className="my-10 flex-row justify-center space-x-2">
              {Array(6)
                .fill('')
                .map((_, index) => (
                  <View
                    key={index}
                    className={`mx-2 flex h-10 w-10 items-center justify-center rounded-full border ${
                      displayPin.length > index
                        ? 'border-primary-600 bg-primary-600'
                        : 'border-gray-300'
                    }`}
                  />
                ))}
            </View>
          </Animated.View>
          <View>
            <TouchableOpacity className="mb-6" onPress={handleResetPin}>
              <Text className="text-center text-base font-medium text-primary-600">
                Retry the PIN code
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View className="flex-1">
        <View className="flex-1 py-8">
          <NumericVirtualKeyboard
            onPress={handleKeyPress}
            allowDotKey={false}
          />
        </View>
        <Button
          testID="pin-submit-button"
          label={step === 'create' ? 'Continue' : 'Confirm'}
          size="lg"
          variant="secondary"
          textClassName="text-base text-white"
          onPress={handleSubmit}
          disabled={
            (step === 'create' && pin.length < 6) ||
            (step === 'confirm' && confirmPin.length < 6)
          }
          fullWidth
        />
      </View>
    </View>
  );
};
